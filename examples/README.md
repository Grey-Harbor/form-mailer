# Examples Workspace

This directory is the project’s instructional proof-of-concept workspace.

The old shared demo shape is retired. Each subproject now owns its own flow, docs, and runtime assumptions.

## Subprojects

- [`mock-mail-server`](./mock-mail-server/README.md) - local SMTP and HTTP testing server
- [`node-brochure`](./node-brochure/README.md) - ACME Inc. brochure site with a contact form
- [`cloudflare-react`](./cloudflare-react/README.md) - Next.js React example with Turnstile
- [`lambda-relay`](./lambda-relay/README.md) - AWS Lambda relay scaffold, documented as TBD

## Quick Start

Use the tutorial pages for the implementation flow and the package docs for the core contract:

- [Examples Workspace Tutorial](../docs/tutorial/examples-workspace.md)
- [Mock Mail Server Tutorial](../docs/tutorial/mock-mail-server.md)
- [Node Brochure Tutorial](../docs/tutorial/node-brochure.md)
- [Cloudflare React Tutorial on Next.js](../docs/tutorial/cloudflare-react.md)
- [Lambda Relay Tutorial](../docs/tutorial/lambda-relay.md)

For the package contract itself, start at the [Documentation home](../docs/README.md).

Each example directory now has its own `package.json` and local scripts, so you can install and run them from inside the subproject you want to inspect.

The POC apps that send mail consume the current distributed `@greyharbor/form-mailer` package as a normal package dependency, which keeps the examples aligned with the published contract instead of importing repo internals directly.
