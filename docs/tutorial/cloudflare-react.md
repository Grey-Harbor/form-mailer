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

The Pages function should use `form-mailer` and send through the SMTP2GO relay contract used in `.dev.vars.example`.

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

- `npm run build` no longer needs the Turnstile public key at build time because the client loads it from the Pages runtime endpoint after the page ships
- `npm run pages:dev` can read `FORM_MAILER_*`, `TURNSTILE_SITE_KEY`, and `TURNSTILE_SECRET_KEY` from system env, and the example keeps `.dev.vars` as the local convenience path for Wrangler

If you want to preview only the front end without the Pages function, `npm run dev:ui` runs the raw Next.js app. That mode is useful for layout work, but it is not the end-to-end contact flow.

When both a file value and a system env value exist, the live environment should be treated as the source of truth.

The split keeps delivery secrets on the Pages side and keeps the browser bundle free of the public Turnstile site key at build time.

If you need Cloudflare's dummy Turnstile values for local testing, the public site key goes in `TURNSTILE_SITE_KEY` and the matching secret goes in `TURNSTILE_SECRET_KEY`, whether you provide them through system env or `.dev.vars`.

The example relays the API key from `FORM_MAILER_HTTP_TOKEN` as the `X-Smtp2go-Api-Key` header so the Pages function can talk to SMTP2GO without exposing the token to the browser bundle.

## Deployment commands

The example is meant to wire:

- `npm run build` for a production export into `out/`
- `npm run pages:dev` for a local Cloudflare Pages preview backed by the exported site and Pages Functions
- `npm run dev:ui` for an optional UI-only Next.js preview
- `npm run pages:deploy` for deployment to Cloudflare Pages

## Run it locally

From `examples/cloudflare-react`:

```bash
npm install
npm run pages:dev
```

## Related docs

- [Examples Workspace](./examples-workspace.md)
- [Mock Mail Server](./mock-mail-server.md)
- [Configuration](../how-to/configuration.md)
