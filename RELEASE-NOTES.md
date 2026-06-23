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
