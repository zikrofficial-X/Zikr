export type AuthContext = {
  token: string;
};

export function requireBearerToken(request: Request): AuthContext {
  const header = request.headers.get('authorization') ?? '';
  const match = header.match(/^Bearer\s+(.+)$/i);
  if (!match?.[1]) {
    throw new Error('Missing bearer token. Sign in before using protected Islamic AI functions.');
  }
  return { token: match[1] };
}
