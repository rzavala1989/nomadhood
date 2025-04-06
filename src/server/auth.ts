import type { IncomingMessage } from 'http';

export function getAuthFromHeaders(req: IncomingMessage) {
  // fake hardcoded user (replace with real logic later)
  return {
    id: 'user-123',
    email: 'ricardo@nomadhood.io',
    name: 'Ricardo Z.',
  };
}
