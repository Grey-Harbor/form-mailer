# Form Mailer Architecture

## Purpose

`form-mailer` is a lightweight, embeddable package for turning validated form submissions into email messages.

It is designed to stay:

- framework-agnostic
- TypeScript-first
- security-conscious by default
- dependency-light
- easy to embed in API routes, backend services, and serverless handlers

The core mailer flow is runtime-neutral, while the Node-specific SMTP and environment-loading helpers remain available for the default package path.

It is not intended to become:

- a hosted mail service
- an SMTP relay
- a full mail server
- a newsletter platform
- a SaaS product

## Product Intent

The package should make form-to-email delivery feel boring in the best possible way:

1. the caller supplies a submission and configuration
2. the library validates and sanitizes the submission
3. the library assembles a message
4. the configured transport delivers the email
5. the caller receives a typed success or failure result

The design favors:

- simplicity over abstraction
- predictable behavior over flexible-but-implicit behavior
- secure defaults over maximum configurability
- small surface area over broad feature coverage

## Architecture Overview

```mermaid
flowchart LR
  A["Caller"] --> B["createFormMailer(config)"]
  B --> C["resolve config"]
  C --> D["validate submission"]
  D --> E["build message"]
  E --> F["transport.send(message)"]
  F --> G["typed result"]
```

The implementation is organized into small modules:

- `src/index.ts` exposes the public API
- `src/mailer.ts` hosts the runtime-neutral mailer core
- `src/config.ts` loads environment-based configuration and selects transport
- `src/validation.ts` validates submissions and resolves message data
- `src/mail.ts` assembles the outbound message
- `src/smtp.ts` sends the message over SMTP
- `src/errors.ts` creates the package error type
- `src/types.ts` defines the public TypeScript contracts
- `examples/shared/*` contains the demo transport and mailer helpers
- `examples/cloudflare-worker/*` and `examples/aws-lambda/*` show the runtime-specific entrypoints

## Public Surface

The package root exports the supported entrypoints only:

- `createFormMailer`
- `createHttpTransport`
- `createSmtpTransport`
- `loadConfigFromEnv`
- `createFormMailerError`
- `isFormMailerError`

It also exports the public TypeScript types used by those entrypoints.

The main runtime object returned by `createFormMailer(config)` exposes:

- `validate(submission)`
- `send(submission)`

## Runtime Flow

### 1. Create the mailer

`createFormMailer(config)` resolves the supplied configuration, selects a transport, and returns a mailer instance.

If the caller supplied a custom transport, that transport is used directly.

If the caller supplied HTTP config, the package creates an HTTP transport.

If the caller supplied SMTP config, the package creates an SMTP transport.

If the caller supplies both built-in transport configs without an explicit custom transport, the package fails with a `config_error` instead of guessing.

If neither transport nor built-in HTTP/SMTP config is available, the package fails with a `config_error`.

### 2. Validate the submission

`validate(submission)` checks the submission before any network work begins.

Current validation rules include:

- email address format checking
- required field checks
- honeypot field detection
- origin allowlist enforcement
- payload size limits

Validation returns a structured result rather than throwing for expected user-input problems.

### 3. Build the message

`buildMailMessage()` creates the outbound email content from the validated submission and resolved config.

The message builder:

- formats sender and recipient addresses
- resolves subject and reply-to values
- emits plain text content
- emits multipart HTML content when useful

Header values are sanitized to reduce the risk of header injection.

### 4. Send through transport

The transport interface is intentionally small:

- `send(message): Promise<TransportSendResult>`

This keeps the package open to custom transports without turning the core API into a transport framework.

### 5. Reuse the core in demos

The same core mailer flow can run inside demo runtimes that supply their own transport adapter.

That pattern keeps the project useful in environments such as:

- Cloudflare Workers
- AWS Lambda
- other serverless handlers with a compatible transport adapter

## Configuration Architecture

Configuration can come from two places:

1. inline code
2. environment variables

### Env loading

The loader resolves configuration in this order:

1. read the active process environment directly
2. if `FORM_MAILER_ENV_PATH` is present, load that dotenv-style file first
3. let process env override any file-provided defaults

This means deployments can use either:

- normal environment variables only
- a shared dotenv file plus runtime overrides

### Dotenv parsing

The dotenv support is intentionally small.

It is meant for predictable deployment defaults, not for supporting every dotenv edge case.

The parser is limited to the simple `KEY=VALUE` shapes needed by the package configuration model.

### Recipient routing

`recipientMap` acts as a routing table for `FormMailSubmission.recipientKey`.

- `to` is the default recipient list
- a matching `recipientKey` routes to the mapped recipients
- if the key is missing, the package falls back to `to`
- if the key is present but unmapped, the package fails with `config_error`

That keeps the default path simple while still allowing named destinations when a form needs them.

## Validation and Security

Security checks happen before transport work begins.

The package protects against:

- malformed email addresses
- oversized submissions
- honeypot-triggered bot traffic
- invalid or disallowed origins
- header injection via newline characters in header-bearing fields

Additional design constraints:

- errors should not leak transport internals unnecessarily
- user-facing validation failures should be typed and structured
- defaults should be safe enough for small apps and serverless handlers

The default honeypot field name is `website` when one is not supplied.

## SMTP Transport

The SMTP transport is implemented directly with Node socket primitives.

This keeps the package dependency-light and gives the core package control over the SMTP handshake.

Supported transport behavior includes:

- plain TCP connections
- implicit TLS
- STARTTLS upgrade flow
- password-based SMTP authentication, including token-style secrets
- dot-stuffing for message bodies

Transport failures are surfaced as `smtp_error` or `transport_error` depending on where the failure occurs.

The SMTP layer is meant to work with common providers without introducing provider-specific abstractions.

## Packaging Boundaries

The npm package is intentionally lean.

The publish surface currently includes:

- runtime output
- the packaged `README.md`, generated from `package-readme.md` during pack/publish

It excludes:

- planning docs
- contributor instructions
- source-only development files

The root package export surface is curated rather than re-exporting every internal helper.

## Documentation Model

Documentation is split by purpose:

- root `README.md` as a short landing page
- `./docs` for Diátaxis-oriented user documentation
- `PLAN.md` for living discovery and implementation notes
- `ARCHITECTURE.md` for the committed design reference

The documentation hierarchy should make it easy to find:

- first-time setup
- task-oriented guidance
- API reference
- design rationale

## Architectural Invariants

- Node.js is the default runtime target for SMTP and config helpers.
- The core mailer flow stays runtime-neutral so demo runtimes can reuse it.
- The package handles email delivery only.
- The package does not embed a queueing layer or hosted mail service behavior.
- Public APIs stay small and explicit.
- Validation and sanitization happen before transport work begins.
- The publish surface stays lean.
- End-user documentation lives in `./docs`.
