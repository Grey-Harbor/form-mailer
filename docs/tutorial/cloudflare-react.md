# Tutorial: Cloudflare React on Next.js

`cloudflare-react` is the deployable Next.js example for Cloudflare Pages.

It uses the same stacked-section shape as the Node brochure example:

- hero
- content section
- contact form

## Why this example exists

This example shows how the same mail flow can live in a browser-backed app without leaking delivery secrets to the client bundle.

The React UI gathers the form data, then the Cloudflare Pages function performs the `form-mailer` send.

## Form-mailer usage

The Pages function should use `form-mailer` and send through the mock server’s HTTP endpoint.

The browser bundle should stay focused on presentation and form collection, while the server side owns the mail delivery decision.

## Honeypot and Turnstile

This example uses both a honeypot and Turnstile:

- the honeypot keeps the submission aligned with `form-mailer`'s validation flow
- Turnstile adds a browser-side protection step that the Pages function can verify

If you need a dummy site key or secret for local testing, Cloudflare documents the testing values here:
[Turnstile testing](https://developers.cloudflare.com/turnstile/troubleshooting/testing/).

## Environment model

The mailer configuration should stay on `form-mailer`'s own `FORM_MAILER_*` contract.

That means:

- `npm run dev` and `npm run build` read `NEXT_PUBLIC_TURNSTILE_SITE_KEY` from `.env.local` or the shell so Next.js can render the static site
- `npm run pages:dev` reads `FORM_MAILER_*` and `TURNSTILE_SECRET_KEY` from `.dev.vars` through Wrangler so the Pages function can run server-side

The split keeps delivery secrets on the Pages side and keeps the browser bundle limited to the public Turnstile site key.

If you need Cloudflare's dummy Turnstile values for local testing, the public site key goes in `.env.local` as `NEXT_PUBLIC_TURNSTILE_SITE_KEY` and the matching secret goes in `.dev.vars`.

## Deployment commands

The example is meant to wire:

- `npm run dev` for local development
- `npm run build` for a production export into `out/`
- `npm run pages:dev` for a local Cloudflare Pages preview backed by the exported site and Pages Functions
- `npm run pages:deploy` for deployment to Cloudflare Pages

## Run it locally

From `examples/cloudflare-react`:

```bash
npm install
npm run dev
```

## Related docs

- [Examples Workspace](./examples-workspace.md)
- [Mock Mail Server](./mock-mail-server.md)
- [Configuration](../how-to/configuration.md)
