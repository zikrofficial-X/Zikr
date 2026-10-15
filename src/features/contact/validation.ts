const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Validates a normalized contact email address without accepting whitespace or malformed domains. */
export function isValidContactEmail(email: string): boolean {
  return email.length <= 254 && EMAIL_PATTERN.test(email);
}
