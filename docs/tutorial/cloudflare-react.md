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

## Environment model

The example should support both `.env.var` and system environment variables.

That keeps the local path approachable and still matches how Cloudflare deployments tend to receive runtime config.

## Deployment commands

The example is meant to wire:

- `npm run pages:dev` for local development
- `npm run pages:deploy` for preview and production deployment

## Related docs

- [Examples Workspace](./examples-workspace.md)
- [Mock Mail Server](./mock-mail-server.md)
- [Configuration](../how-to/configuration.md)
