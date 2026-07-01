interface Env {
  TURNSTILE_SITE_KEY?: string | undefined;
}

function resolveTurnstileSiteKey(env: Env): string {
  if (env.TURNSTILE_SITE_KEY) {
    return env.TURNSTILE_SITE_KEY;
  }

  const systemEnv = (globalThis as typeof globalThis & {
    process?: {
      env?: Record<string, string | undefined>;
    };
  }).process?.env;

  return systemEnv?.TURNSTILE_SITE_KEY ?? '';
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: {
      'cache-control': 'no-store',
      'content-type': 'application/json; charset=utf-8',
    },
  });
}

export function onRequestGet({ env }: { env: Env }) {
  return json(200, {
    TURNSTILE_SITE_KEY: resolveTurnstileSiteKey(env),
  });
}
