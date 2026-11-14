export type AuthContext = {
  token: string;
  userId: string;
};

export type AuthVerificationStatus = 401 | 503;

export class AuthVerificationError extends Error {
  readonly status: AuthVerificationStatus;

  constructor(message: string, status: AuthVerificationStatus) {
    super(message);
    this.name = "AuthVerificationError";
    this.status = status;
  }
}

export type AuthVerificationOptions = {
  supabaseUrl: string;
  anonKey: string;
  fetcher?: typeof fetch;
};

/**
 * Validate both the JWT and that it represents a real signed-in user.
 * Supabase's verify_jwt gateway also accepts the project's public anon JWT,
 * so signature verification alone is not an authenticated-user check.
 */
export async function requireAuthenticatedUser(
  request: Request,
  options: AuthVerificationOptions,
): Promise<AuthContext> {
  const header = request.headers.get("authorization") ?? "";
  const match = header.match(/^Bearer\\s+(.+)$/i);
  const token = match?.[1]?.trim();

  if (!token) {
    throw new AuthVerificationError("Missing bearer token.", 401);
  }

  const supabaseUrl = options.supabaseUrl.trim().replace(/\\/+$/, "");
  const anonKey = options.anonKey.trim();
  if (!supabaseUrl || !anonKey) {
    throw new AuthVerificationError("Authentication service is not configured.", 503);
  }

  let response: Response;
  try {
    response = await (options.fetcher ?? fetch)(`${supabaseUrl}/auth/v1/user`, {
      method: "GET",
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(5_000),
    });
  } catch {
    throw new AuthVerificationError("Authentication service is temporarily unavailable.", 503);
  }

  if (response.status === 401 || response.status === 403) {
    throw new AuthVerificationError("Invalid bearer token.", 401);
  }
  if (!response.ok) {
    throw new AuthVerificationError("Authentication service is temporarily unavailable.", 503);
  }

  let user: unknown;
  try {
    user = await response.json();
  } catch {
    throw new AuthVerificationError("Authentication service returned an invalid response.", 503);
  }

  if (
    !user ||
    typeof user !== "object" ||
    Array.isArray(user) ||
    typeof (user as { id?: unknown }).id !== "string" ||
    !(user as { id: string }).id.trim()
  ) {
    throw new AuthVerificationError("Invalid bearer token.", 401);
  }

  return { token, userId: (user as { id: string }).id };
}
