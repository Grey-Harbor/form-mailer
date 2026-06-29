/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CLOUDFLARE_REACT_FROM?: string;
  readonly VITE_CLOUDFLARE_REACT_TO?: string;
  readonly VITE_CLOUDFLARE_REACT_HTTP_URL?: string;
  readonly VITE_CLOUDFLARE_REACT_HTTP_TOKEN?: string;
  readonly VITE_CLOUDFLARE_REACT_TURNSTILE_SITE_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
