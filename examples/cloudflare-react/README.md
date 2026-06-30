# Cloudflare React

`cloudflare-react` is a Next.js proof of concept that stays deployable on Cloudflare Pages.

It is built to teach the flow clearly:

- stacked hero, content, and contact sections
- a React front end in TypeScript and the Next.js app router
- a Cloudflare Pages function that sends mail through the current distributed `@greyharbor/form-mailer` package
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

There are two local env paths:

- `.env.local` gives Next.js the public `NEXT_PUBLIC_TURNSTILE_SITE_KEY` during `npm run dev` and `npm run build`
- `.dev.vars` gives Wrangler the server-side `FORM_MAILER_*` values and `TURNSTILE_SECRET_KEY` during `npm run pages:dev`

That split keeps delivery secrets on the Pages side and keeps the client bundle limited to the public Turnstile site key.

If you need the dummy Turnstile values, use the Cloudflare testing guidance above. The public test site key belongs in `NEXT_PUBLIC_TURNSTILE_SITE_KEY`; the matching secret belongs in `.dev.vars` for local Pages previews and in your Pages project secrets for deployment.

The contact form keeps a hidden honeypot field so the Pages function can validate the submission with `form-mailer` before any delivery work begins.

## Commands

- `npm run dev` for local development
- `npm run build` to export the static Next.js app into `out/`
- `npm run pages:dev` to preview the static app plus Pages Functions through Wrangler
- `npm run pages:deploy` to deploy the exported app to Cloudflare Pages

## Source

- React app: [`app/page.tsx`](./app/page.tsx)
- Contact form: [`components/ContactForm.tsx`](./components/ContactForm.tsx)
- Pages function: [`functions/api/contact.ts`](./functions/api/contact.ts)
