# Explanation: Adapters

`form-mailer` uses adapters so delivery logic stays separate from the core submission workflow.

For the exact transport contract, see [Reference: Adapters](../reference/adapters.md).

## Why adapters exist

Adapters let the package keep one stable public API while supporting different delivery paths.

That means the core can stay focused on:

- validation described in [Explanation: Validation](./validation.md)
- message formatting
- result handling
- security checks

Each adapter can focus on:

- provider setup
- provider auth
- sending the message
- reporting delivery results

## What this buys us

- the package stays small and understandable
- transport logic does not leak into the mailer API
- new runtimes or providers can be added without redesigning the core
- demos and training material can show different deployment environments with the same API

## How this fits the project

This project treats SMTP as one adapter, not the entire product.

That makes room for:

- Node.js deployments
- Cloudflare demonstrations
- AWS Lambda demonstrations
- future provider-specific transports

The core package stays stable while the adapter layer grows around it.

If you want to build one yourself, continue with [How-To: Implement an Adapter](../how-to/adapters.md).
