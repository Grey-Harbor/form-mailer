# Node Brochure

`node-brochure` is the brochure-style proof of concept for `ACME Inc.`.

It is intentionally simple and content-led:

- a Hero section to frame the site
- a content section to describe the company
- a contact form that sends mail through `form-mailer`

## Quick Start

Use the tutorial page for the implementation flow:

- [Tutorial: Node Brochure](../../docs/tutorial/node-brochure.md)

Local run:

```bash
npm install
npm run dev
```

For the package contract that the example builds on, see:

- [Documentation home](../../docs/README.md)
- [Tutorial: Getting Started](../../docs/tutorial/getting-started.md)

## Why this example exists

This example is for learning the flow, not for showcasing a framework trick.

It shows how a small Node site can:

- load example-specific settings from `.env.var`
- send contact submissions through the current distributed `@greyharbor/form-mailer` package
- target the mock mail server’s SMTP endpoint during local development

## Local settings

The example reads example-specific settings from `.env.var` and lets process environment values override them.

Suggested variables:

- `NODE_BROCHURE_FROM`
- `NODE_BROCHURE_TO`
- `NODE_BROCHURE_SMTP_HOST`
- `NODE_BROCHURE_SMTP_PORT`
- `NODE_BROCHURE_SMTP_USERNAME`
- `NODE_BROCHURE_SMTP_PASSWORD`

The local development defaults point to the mock SMTP server.

The contact form also uses `form-mailer`'s honeypot behavior, so the hidden `website` field should stay in the markup and in the submission path.

## Site copy

The site uses `ACME Inc.` boilerplate content so the structure stays focused on flow, layout, and message handling.

## Source

The scaffold lives in [`src/index.ts`](./src/index.ts).
