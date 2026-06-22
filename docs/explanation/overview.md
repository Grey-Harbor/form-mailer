# Explanation: Overview

`form-mailer` is designed to stay small, predictable, and easy to embed.

It is TypeScript-first, but it is also meant to be easy to consume from ordinary Node.js projects that are written in JavaScript.

## Why this shape

- form handling is usually one step inside a larger app
- most projects do not need a queue or a hosted mail service
- a narrow API is easier to secure and easier to document
- the default package shape should feel natural in a regular Node.js backend, not only in typed or serverless codebases

## Why Diátaxis

Diátaxis helps keep each documentation page focused:

- tutorials help people get started
- how-to guides help people accomplish tasks
- reference pages describe the API precisely
- explanation pages capture reasoning and tradeoffs

For adapter-specific guidance, see [How-to: Adapters](../how-to/adapters.md) and [Explanation: Adapters](./adapters.md).
For the validation pipeline and why it runs before transport work, see [Explanation: Validation](./validation.md).

## Design priorities

- simplicity over abstraction
- secure defaults over flexible-but-dangerous behavior
- Node.js compatibility first
- minimal dependencies
- plain error and result shapes
