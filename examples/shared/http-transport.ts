import { createHttpTransport } from '../../src/http.js';

export function createDemoHttpTransport(endpoint: string, token?: string) {
  return createHttpTransport({
    url: endpoint,
    ...(token ? { token } : {}),
  });
}
