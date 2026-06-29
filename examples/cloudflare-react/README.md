# Cloudflare React

`cloudflare-react` is the fully deployable Cloudflare Pages example.

It is built to teach the flow clearly:

- stacked hero, content, and contact sections
- a React front end in TypeScript
- a Pages function that sends mail through `form-mailer`
- mock-server HTTP delivery during local development
- Turnstile protection on the contact path

## Quick Start

Use the tutorial page for the implementation flow:

- [Tutorial: Cloudflare React](../../docs/tutorial/cloudflare-react.md)

For the package contract that the example builds on, see:

- [Documentation home](../../docs/README.md)
- [Tutorial: Getting Started](../../docs/tutorial/getting-started.md)

The browser bundle only collects the form data and posts it to the Pages function.
The mailer itself stays on the server side so the delivery secret never enters the client bundle.

## Environment handling

The example supports both `.env.var` and system environment variables.

Suggested variables:

- `CLOUDFLARE_REACT_FROM`
- `CLOUDFLARE_REACT_TO`
- `CLOUDFLARE_REACT_HTTP_URL`
- `CLOUDFLARE_REACT_HTTP_TOKEN`
- `CLOUDFLARE_REACT_TURNSTILE_SITE_KEY`
- `CLOUDFLARE_REACT_TURNSTILE_SECRET_KEY`

The contact form keeps a hidden honeypot field so the Pages function can validate the submission with `form-mailer` before any delivery work begins.

## Commands

- `npm run pages:dev` for local development through Wrangler
- `npm run pages:deploy` for preview and production deployment through Wrangler

## Source

- React app: [`src/App.tsx`](./src/App.tsx)
- Pages function: [`functions/api/contact.ts`](./functions/api/contact.ts)
