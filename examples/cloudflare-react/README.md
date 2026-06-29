# Cloudflare React

`cloudflare-react` is the fully deployable Cloudflare Pages proof of concept.

It is built to teach the flow clearly:

- stacked hero, content, and contact sections
- a React front end in TypeScript
- a Pages function that sends mail through the current distributed `@greyharbor/form-mailer` package
- mock-server HTTP delivery during local development
- Turnstile protection on the contact path

## Quick Start

Use the tutorial page for the implementation flow:

- [Tutorial: Cloudflare React](../../docs/tutorial/cloudflare-react.md)

Local run:

```bash
npm install
npm run dev
```

For the package contract that the example builds on, see:

- [Documentation home](../../docs/README.md)
- [Tutorial: Getting Started](../../docs/tutorial/getting-started.md)

The browser bundle only collects the form data and posts it to the Pages function.
The mailer itself stays on the server side so the delivery secret never enters the client bundle.

## Environment handling

The Pages function reads `form-mailer`'s `FORM_MAILER_*` settings from the runtime environment, while the React client reads `TURNSTILE_SITE_KEY` through Vite's `TURNSTILE_` env prefix.

For local development, copy `.env.var.example` to `.env.var` and make sure the same `FORM_MAILER_*` names are available to the Pages runtime.

Suggested variables:

- `FORM_MAILER_FROM`
- `FORM_MAILER_TO`
- `FORM_MAILER_HTTP_URL`
- `FORM_MAILER_HTTP_TOKEN`
- `TURNSTILE_SITE_KEY`
- `TURNSTILE_SECRET_KEY`

The contact form keeps a hidden honeypot field so the Pages function can validate the submission with `form-mailer` before any delivery work begins.

## Commands

- `npm run pages:dev` for local development through Wrangler
- `npm run pages:deploy` for preview and production deployment through Wrangler

## Source

- React app: [`src/App.tsx`](./src/App.tsx)
- Pages function: [`functions/api/contact.ts`](./functions/api/contact.ts)
