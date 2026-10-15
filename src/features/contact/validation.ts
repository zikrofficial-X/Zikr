const EMAIL_PATTERN =
  /^(?!.*\.\.)[^.\s@](?:[^\s@]*[^.\s@])?@(?:[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?\.)+[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?$/i;

/** Validates a normalized contact email address without accepting whitespace or malformed domains. */
export function isValidContactEmail(email: string): boolean {
  return email.length <= 254 && email === email.trim() && EMAIL_PATTERN.test(email);
}
