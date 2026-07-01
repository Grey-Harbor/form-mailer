interface Env {
  TURNSTILE_SITE_KEY?: string | undefined;
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
    TURNSTILE_SITE_KEY: env.TURNSTILE_SITE_KEY ?? '',
  });
}
