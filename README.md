# form-mailer

Lightweight, embeddable form-to-email delivery for Node.js apps and serverless handlers.

## Status

This repository is in early scaffolding. The project intent and phased roadmap live in [`PLAN.md`](./PLAN.md).

## Direction

- TypeScript-first
- ESM-first
- minimal dependencies
- security-conscious defaults
- framework-agnostic API surface
- default config discovery from `configs.yaml` in the deployment root, with `FORM_MAILER_CONFIG_PATH` override support
- `FORM_MAILER_CONFIG_FILE` remains accepted for compatibility

## Configuration

`form-mailer` looks for `configs.yaml` in the deployment root by default. If you mount config elsewhere, set `FORM_MAILER_CONFIG_PATH` to the full path. `FORM_MAILER_CONFIG_FILE` is still accepted as a compatibility alias.
The loader also accepts a legacy `config.yaml` in the deployment root if `configs.yaml` is not present.

## Quick Start

```ts
import { createFormMailer } from 'form-mailer';

const mailer = createFormMailer({
  from: 'no-reply@example.com',
  to: ['support@example.com'],
  smtp: {
    host: process.env.SMTP_HOST,
    username: process.env.SMTP_USERNAME,
    password: process.env.SMTP_PASSWORD,
    starttls: true,
  },
});

const result = await mailer.send({
  name: 'Ada Lovelace',
  email: 'ada@example.com',
  message: 'I would like to get in touch.',
  fields: {
    topic: 'product question',
  },
});

if (!result.ok) {
  console.error(result.error.code, result.error.message);
}
```
