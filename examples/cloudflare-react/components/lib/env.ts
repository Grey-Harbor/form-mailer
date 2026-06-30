export interface CloudflareReactEnv {
  TURNSTILE_SITE_KEY?: string | undefined;
}

export function resolveClientEnv(overrides: Partial<CloudflareReactEnv> = {}): CloudflareReactEnv {
  return {
    TURNSTILE_SITE_KEY: overrides.TURNSTILE_SITE_KEY ?? process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? '',
  };
}
