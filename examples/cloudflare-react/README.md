# Cloudflare React

`cloudflare-react` is a Next.js proof of concept that stays deployable on Cloudflare Pages.

It is built to teach the flow clearly:

- stacked hero, content, and contact sections
- a React front end in TypeScript and the Next.js app router
- a Cloudflare Pages function that sends mail through the current distributed `@greyharbor/form-mailer` package
- SMTP2GO relay delivery during local development
- Turnstile protection on the contact path

## Quick Start

Use the tutorial page for the implementation flow:

- [Tutorial: Cloudflare React](../../docs/tutorial/cloudflare-react.md)

End-to-end local run:

```bash
npm install
npm run pages:dev
```

For the package contract that the example builds on, see:

- [Documentation home](../../docs/README.md)
- [Tutorial: Getting Started](../../docs/tutorial/getting-started.md)

The browser bundle only collects the form data and posts it to the Pages function.
The mailer itself stays on the server side so the delivery secret never enters the client bundle.
The Turnstile widget uses the official Cloudflare testing flow when you need a dummy site key or secret:
[Turnstile testing](https://developers.cloudflare.com/turnstile/troubleshooting/testing/).

## Environment handling

All required values can come from system environment variables.

The example files are optional local helpers:

- system env can supply `NEXT_PUBLIC_TURNSTILE_SITE_KEY` for `npm run build`, `npm run pages:dev`, and the optional UI-only `npm run dev:ui`
- system env can also supply `FORM_MAILER_*` and `TURNSTILE_SECRET_KEY` for `npm run pages:dev`
- `.env.local` is an optional convenience file for the public Next.js variable
- `.dev.vars` is an optional Wrangler convenience file for local Pages previews

When both a file value and a system env value exist, the live environment should be treated as the source of truth.

That split keeps delivery secrets on the Pages side and keeps the client bundle limited to the public Turnstile site key.

If you need the dummy Turnstile values, use the Cloudflare testing guidance above. The public test site key belongs in `NEXT_PUBLIC_TURNSTILE_SITE_KEY`; the matching secret belongs in `TURNSTILE_SECRET_KEY`. You can provide them either through system env or the optional local files.

The contact form keeps a hidden honeypot field so the Pages function can validate the submission with `form-mailer` before any delivery work begins.

The Pages function maps `FORM_MAILER_HTTP_TOKEN` to SMTP2GO's `X-Smtp2go-Api-Key` header and translates the outgoing mail into SMTP2GO's REST payload shape before sending.

## Commands

- `npm run dev` as an alias for the end-to-end `npm run pages:dev` flow
- `npm run dev:ui` for a UI-only Next.js preview without the Pages function
- `npm run build` to export the static Next.js app into `out/`
- `npm run pages:dev` to preview the static app plus Pages Functions through Wrangler
- `npm run pages:deploy` to deploy the exported app to Cloudflare Pages

## Source

- React app: [`app/page.tsx`](./app/page.tsx)
- Contact form: [`components/ContactForm.tsx`](./components/ContactForm.tsx)
- Pages function: [`functions/api/contact.ts`](./functions/api/contact.ts)
