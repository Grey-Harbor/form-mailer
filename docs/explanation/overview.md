# Explanation: Overview

`form-mailer` is designed to stay small, predictable, and easy to embed.

## Why this shape

- form handling is usually one step inside a larger app
- most projects do not need a queue or a hosted mail service
- a narrow API is easier to secure and easier to document

## Why Diátaxis

Diátaxis helps keep each documentation page focused:

- tutorials help people get started
- how-to guides help people accomplish tasks
- reference pages describe the API precisely
- explanation pages capture reasoning and tradeoffs

## Design priorities

- simplicity over abstraction
- secure defaults over flexible-but-dangerous behavior
- Node.js compatibility first
- minimal dependencies
- plain error and result shapes

