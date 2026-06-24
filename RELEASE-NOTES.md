# @greyharbor/form-mailer 0.2.0

Release tag: `v0.2.0`

This release adds built-in HTTP transport mapping hooks so provider-specific REST APIs can shape request and response payloads without replacing the package transport layer. The generic HTTP transport still works out of the box, but callers can now map `OutgoingMail` into a custom JSON contract and parse provider success responses in code.

## GitHub Release Blurb

`@greyharbor/form-mailer` 0.2.0 adds first-class HTTP transport customization for REST-based mail providers.

It keeps the existing SMTP and generic HTTP paths intact while adding request mapping and response parsing hooks for built-in HTTP delivery. The release also updates the configuration docs, HTTP examples, and test coverage so consumers can integrate provider-specific APIs without writing a custom transport from scratch.

## Highlights

- built-in HTTP transport mapping hooks for provider-specific REST contracts
- code-level request shaping with `mapRequest`
- code-level response parsing with `parseResponse`
- preserved generic JSON `POST` behavior when no hooks are supplied
- updated HTTP, configuration, adapter, and tutorial docs
- new example coverage for mapped HTTP delivery
- expanded test coverage for mapped requests, custom success parsing, and failure handling

## Packaging

- published package name: `@greyharbor/form-mailer`
- npm version: `0.2.0`
- public package surface is limited to the built runtime output plus `README.md`

## Release Notes

- GitHub Actions publishes on tag pushes that match `v*`
- npm publish uses the `NPM_TOKEN` repository secret as `NODE_AUTH_TOKEN`
- the release guide lives in [`docs/how-to/releasing.md`](./docs/how-to/releasing.md)

## Compatibility

- Node.js 20 or newer remains the supported runtime for the package publish target
- existing SMTP and generic HTTP consumers remain supported without code changes

# @greyharbor/form-mailer 0.1.6

Release tag: `v0.1.6`

This release keeps the package scoped to the `greyharbor` organization and folds in the SMTP cleanup fix so Workers-style runtimes preserve the original relay failure instead of surfacing a secondary reader lock error during teardown.

## GitHub Release Blurb

`@greyharbor/form-mailer` 0.1.6 is the current scoped release of the package.

It includes env-first configuration, typed validation and delivery results, `recipientKey` routing, the default SMTP transport, and the SMTP teardown fix for Workers-style runtimes. The package is ready for embeddable app and serverless use, with docs and examples laid out for future runtime-specific adapters.

## Highlights

- env-first configuration with optional `FORM_MAILER_ENV_PATH` loading
- process environment overrides dotenv-style defaults
- warning when `FORM_MAILER_SMTP_PASSWORD` or `FORM_MAILER_SMTP_TOKEN` is loaded from the env file
- `recipientMap` routing keyed by `recipientKey`
- validation and sanitization before transport work begins
- typed success and failure results for mail delivery
- runtime-neutral core mailer flow for embeddable and serverless usage
- starter examples for Cloudflare Workers and AWS Lambda
- preserved SMTP relay errors during socket cleanup in Workers-style runtimes

## Packaging

- published package name: `@greyharbor/form-mailer`
- npm version: `0.1.6`
- public package surface is limited to the built runtime output plus `README.md`

## Release Notes

- GitHub Actions publishes on tag pushes that match `v*`
- npm publish uses the `NPM_TOKEN` repository secret as `NODE_AUTH_TOKEN`
- the release guide lives in [`docs/how-to/releasing.md`](./docs/how-to/releasing.md)

## Compatibility

- Node.js 20 or newer is the current supported runtime for the package publish target
- the core mailer API is structured so additional runtimes can be added through separate adapters and examples
