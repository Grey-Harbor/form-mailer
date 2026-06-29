export interface CloudflareReactEnv {
  CLOUDFLARE_REACT_TURNSTILE_SITE_KEY?: string | undefined;
}

export function resolveClientEnv(overrides: Partial<CloudflareReactEnv> = {}): CloudflareReactEnv {
  return {
    CLOUDFLARE_REACT_TURNSTILE_SITE_KEY:
      overrides.CLOUDFLARE_REACT_TURNSTILE_SITE_KEY ?? import.meta.env.VITE_CLOUDFLARE_REACT_TURNSTILE_SITE_KEY ?? '',
  };
}
