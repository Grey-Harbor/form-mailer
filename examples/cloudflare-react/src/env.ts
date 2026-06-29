export interface CloudflareReactEnv {
  TURNSTILE_SITE_KEY?: string | undefined;
}

export function resolveClientEnv(overrides: Partial<CloudflareReactEnv> = {}): CloudflareReactEnv {
  return {
    TURNSTILE_SITE_KEY: overrides.TURNSTILE_SITE_KEY ?? import.meta.env.VITE_TURNSTILE_SITE_KEY ?? '',
  };
}
