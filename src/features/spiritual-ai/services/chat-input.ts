export type SpiritualChatRole = 'user' | 'assistant';

export type SanitizedSpiritualChatMessage = {
  role: SpiritualChatRole;
  content: string;
};

export const MAX_SPIRITUAL_CHAT_HISTORY_MESSAGES = 6;
export const MAX_SPIRITUAL_CHAT_HISTORY_MESSAGE_LENGTH = 1200;

/**
 * Server-side bound for client-supplied conversation history. The browser
 * history is untrusted input and must never be allowed to inflate Gemini prompts.
 */
export function sanitizeChatHistory(value: unknown): SanitizedSpiritualChatMessage[] {
  if (!Array.isArray(value)) return [];

  return value
    .slice(-MAX_SPIRITUAL_CHAT_HISTORY_MESSAGES)
    .flatMap((entry): SanitizedSpiritualChatMessage[] => {
      if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return [];

      const candidate = entry as { role?: unknown; content?: unknown };
      if (candidate.role !== 'user' && candidate.role !== 'assistant') return [];
      if (typeof candidate.content !== 'string') return [];

      const content = candidate.content.slice(0, MAX_SPIRITUAL_CHAT_HISTORY_MESSAGE_LENGTH).trim();
      if (!content) return [];

      return [{ role: candidate.role, content }];
    });
}
