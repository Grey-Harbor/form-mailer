export interface CloudflareReactEnv {
  TURNSTILE_SITE_KEY?: string | undefined;
}

interface RuntimeEnvResponse {
  TURNSTILE_SITE_KEY?: unknown;
}

export async function loadClientEnv(): Promise<CloudflareReactEnv> {
  const response = await fetch('/api/runtime-env', {
    cache: 'no-store',
    headers: {
      accept: 'application/json',
    },
  });

  if (!response.ok) {
    return {};
  }

  const payload = (await response.json()) as RuntimeEnvResponse;

  return {
    TURNSTILE_SITE_KEY: typeof payload.TURNSTILE_SITE_KEY === 'string' ? payload.TURNSTILE_SITE_KEY : '',
  };
}
