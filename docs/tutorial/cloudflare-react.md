# Tutorial: Cloudflare React

`cloudflare-react` is the deployable Cloudflare Pages example.

It uses the same stacked-section shape as the Node brochure example:

- Hero
- content section
- contact form

## Why this example exists

This example shows how the same mail flow can live in a browser-backed app without leaking delivery secrets to the client bundle.

The React UI gathers the form data, then the Pages function performs the `form-mailer` send.

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

- `npm run pages:dev` reads `FORM_MAILER_*` and `TURNSTILE_SECRET_KEY` from `.dev.vars` through Wrangler
- `npm run dev` reads `TURNSTILE_SITE_KEY` from `.dev.vars` first, then from the shell through Vite's `TURNSTILE_` env prefix

The split keeps delivery secrets on the Pages side and keeps the browser bundle limited to the public Turnstile site key.

If you need Cloudflare's dummy Turnstile values for local testing, the public site key goes in `TURNSTILE_SITE_KEY` and the matching secret goes in `.dev.vars` for `npm run pages:dev`.

## Deployment commands

The example is meant to wire:

- `npm run pages:dev` for local development through the npm wrapper around Wrangler
- `npm run pages:deploy` for preview and production deployment

## Run it locally

From `examples/cloudflare-react`:

```bash
npm install
npm run dev
```

For the Pages-style flow, use `npm run pages:dev` after the example dependencies are installed. In this workspace, that is the supported local command because Wrangler is invoked through the npm script instead of relying on a shell `PATH` entry.

## Related docs

- [Examples Workspace](./examples-workspace.md)
- [Mock Mail Server](./mock-mail-server.md)
- [Configuration](../how-to/configuration.md)
