![form-mailer](https://form-mailer.greyharborsoftware.com/brand/social-card.png)

[![CI](https://github.com/Grey-Harbor/form-mailer/actions/workflows/ci.yml/badge.svg)](https://github.com/Grey-Harbor/form-mailer/actions/workflows/ci.yml)
[![npm version](https://badge.fury.io/js/@greyharbor%2Fform-mailer.svg)](https://badge.fury.io/js/@greyharbor%2Fform-mailer)

# form-mailer

`form-mailer` is a compact way to turn form submissions into email without dragging a full mail platform into your app.

It gives your product a calm, reliable email layer that stays easy to understand, easy to embed, and easy to teach from in standard Node.js applications as well as serverless handlers.

If you'd like to explore the project site, [Click Here](https://form-mailer.greyharborsoftware.com) for the latest overview and supporting pages.

## Start Here

- [Documentation home](./docs/README.md)
- [Tutorials](./docs/tutorial/README.md)
- [How-to Guides](./docs/how-to/README.md)
- [Reference](./docs/reference/README.md)
- [Explanation](./docs/explanation/README.md)

## Why it exists

Most apps do not need a mail system.

They need a small, dependable path from submission to delivery:

- accept the form payload
- validate and shape the message
- send through a transport adapter
- return a typed outcome the app can trust

That is the space `form-mailer` is built for.

## What it helps you do

Use `form-mailer` when you want to:

- add contact, support, lead, or workflow email handling to an existing app
- use the same package from JavaScript or TypeScript in a Node.js codebase
- keep delivery logic small enough to reason about quickly
- swap transports without redesigning the application
- demonstrate simple deployment patterns across multiple environments
- build a learning-friendly example that still feels production-minded

## What you gain

Using `form-mailer` gives you a few practical advantages:

- a narrow API instead of a sprawling mail subsystem
- typed success and failure results instead of vague side effects
- security-conscious defaults for validation and message handling
- separate adapters for different runtimes and delivery paths
- documentation that can double as teaching material

## Product goals

The project is guided by a simple set of goals:

- stay framework-agnostic
- stay TypeScript-first
- stay easy to consume from plain JavaScript projects
- keep the dependency footprint small
- keep the default path safe and predictable
- support multiple runtime environments through separate adapters
- remain easy to explain in tutorials, demos, and deployment guides

## Best fit

This package is a good fit when you want:

- a compact email delivery layer for an existing Node.js application
- a reusable foundation for demo deployments in places like Cloudflare or AWS Lambda
- a codebase that is simple enough to teach from, not just use

It is not intended to become:

- a hosted mail service
- a newsletter platform
- a full mail server
- an SMTP relay product

## Project notes

- Planning lives in [`PLAN.md`](./PLAN.md)
- The committed design lives in [`ARCHITECTURE.md`](./ARCHITECTURE.md)
- End-user documentation lives in [`./docs`](./docs)

v0.2.0
