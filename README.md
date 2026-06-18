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
- default config discovery from `configs.yaml` in the deployment root, with env override support

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
