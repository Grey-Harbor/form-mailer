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
The Turnstile widget uses the official Cloudflare testing flow when you need a dummy site key or secret:
[Turnstile testing](https://developers.cloudflare.com/turnstile/troubleshooting/testing/).

## Environment handling

There are two separate local env paths:

- `npm run pages:dev` reads `FORM_MAILER_*` and `TURNSTILE_SECRET_KEY` from `.dev.vars` through Wrangler
- `npm run dev` reads `TURNSTILE_SITE_KEY` from `.dev.vars` first, then from the shell through Vite's `TURNSTILE_` prefix

That split keeps delivery secrets on the Pages side and keeps the client bundle limited to the public Turnstile site key.

If you need the dummy Turnstile values, use the Cloudflare testing guidance above. The public test site key belongs in `TURNSTILE_SITE_KEY`; the matching secret belongs in `.dev.vars` for `npm run pages:dev`.

The contact form keeps a hidden honeypot field so the Pages function can validate the submission with `form-mailer` before any delivery work begins.

## Commands

- `npm run pages:dev` for local development through the npm wrapper around Wrangler
- `npm run pages:deploy` for preview and production deployment through Wrangler

## Source

- React app: [`src/App.tsx`](./src/App.tsx)
- Pages function: [`functions/api/contact.ts`](./functions/api/contact.ts)
