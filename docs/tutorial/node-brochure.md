# Tutorial: Node Brochure

`node-brochure` is a brochure-style Node site for `ACME Inc.`.

It is intentionally content-led:

- Hero section
- company overview section
- contact form section

## Why this example exists

The goal is to show a familiar small-business site pattern without turning the example into a generic form demo.

That means the page should teach three things clearly:

1. what the site looks like
2. how the contact form is wired
3. how the message reaches `form-mailer`

## Form-mailer usage

The brochure form should use the package mailer and send through the mock server’s SMTP endpoint.

The example should also use `form-mailer`'s honeypot behavior. In practice, that means the contact form keeps a hidden `website` field and the submission is validated before transport work begins.

## Environment model

The example leaves the mail configuration to `form-mailer` itself.

In practice, that means `FORM_MAILER_*` values come from the active process environment and, by default, from `.env.var` in `examples/node-brochure` through `FORM_MAILER_ENV_PATH`.

That keeps the workflow predictable during local development while still leaving room for normal shell-based overrides.

## What to look for in the implementation

- one clear contact form
- boilerplate ACME Inc. copy
- SMTP delivery settings that point to the mock server
- a concise quick-start path that shows how to run the site locally

## Run it locally

From `examples/node-brochure`:

```bash
npm install
npm run dev
```

The example reads `.env.var` from its own directory through `FORM_MAILER_ENV_PATH`, so the local settings stay self-contained.

## Related docs

- [Examples Workspace](./examples-workspace.md)
- [Mock Mail Server](./mock-mail-server.md)
- [Configuration](../how-to/configuration.md)
