import { ServiceError } from '@/lib/types/common';

const REQUEST_TIMEOUT = 10000; // 10 seconds
const MAX_RETRIES = 2;

interface FetchOptions extends RequestInit {
  timeout?: number;
  retries?: number;
}

export async function safeApiFetch<T = unknown>(
  url: string,
  options: FetchOptions = {},
): Promise<{ data?: T; error?: Error }> {
  const { timeout = REQUEST_TIMEOUT, retries = MAX_RETRIES, ...fetchOptions } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      try {
        const response = await fetch(url, {
          ...fetchOptions,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorBody = await response.text().catch(() => '');
          throw new ServiceError(
            `HTTP ${response.status}: ${errorBody || response.statusText}`,
            `HTTP_${response.status}`,
            response.status,
          );
        }

        const data = await response.json();
        return { data };
      } finally {
        clearTimeout(timeoutId);
      }
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (error instanceof ServiceError && error.statusCode && error.statusCode >= 400 && error.statusCode < 500) {
        // Don't retry 4xx errors
        break;
      }

      if (attempt < retries) {
        // Exponential backoff
        await new Promise((resolve) => setTimeout(resolve, Math.pow(2, attempt) * 1000));
      }
    }
  }

  return { error: lastError || new Error('Unknown error') };
}