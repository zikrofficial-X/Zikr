import { createHash } from 'node:crypto';

const HIBP_RANGE_URL = 'https://api.pwnedpasswords.com/range/';
const HIBP_USER_AGENT = 'ZIKR Password Security Check';

/**
 * Checks a candidate password against Have I Been Pwned's free Pwned Passwords
 * range API without sending the password or full hash to the service.
 * Only the first five SHA-1 characters leave this application.
 */
export async function isPwnedPassword(password: string): Promise<boolean> {
  const hash = createHash('sha1').update(password, 'utf8').digest('hex').toUpperCase();
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);

  const response = await fetch(`${HIBP_RANGE_URL}${prefix}`, {
    headers: {
      'user-agent': HIBP_USER_AGENT,
      'add-padding': 'true',
    },
    cache: 'no-store',
    signal: AbortSignal.timeout(5000),
  });

  if (!response.ok) {
    throw new Error(`HIBP password range request failed: ${response.status}`);
  }

  const body = await response.text();
  for (const line of body.split('\r\n')) {
    const [returnedSuffix, count] = line.split(':');
    if (returnedSuffix?.toUpperCase() === suffix) {
      return Number.parseInt(count ?? '0', 10) > 0;
    }
  }

  return false;
}
