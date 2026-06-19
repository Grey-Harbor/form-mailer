# form-mailer 0.1.0

Release tag: `v0.1.0`

This first package release establishes the core mailer API, the default SMTP transport, and the documentation path for future adapters and deployment examples.

## GitHub Release Blurb

`form-mailer` 0.1.0 is the first public release of the package.

It includes env-first configuration, typed validation and delivery results, `recipientKey` routing, and the default SMTP transport. The package is ready for embeddable app and serverless use, with docs and examples laid out for future runtime-specific adapters.

## Highlights

- env-first configuration with optional `FORM_MAILER_ENV_PATH` loading
- process environment overrides dotenv-style defaults
- warning when `FORM_MAILER_SMTP_PASSWORD` is loaded from the env file
- `recipientMap` routing keyed by `recipientKey`
- validation and sanitization before transport work begins
- typed success and failure results for mail delivery
- runtime-neutral core mailer flow for embeddable and serverless usage
- starter examples for Cloudflare Workers and AWS Lambda

## Packaging

- published package name: `form-mailer`
- npm version: `0.1.0`
- public package surface is limited to the built runtime output plus `README.md`

## Release Notes

- GitHub Actions publishes on tag pushes that match `v*`
- npm publish uses the `NPM_TOKEN` repository secret as `NODE_AUTH_TOKEN`
- the release guide lives in [`docs/how-to/releasing.md`](./docs/how-to/releasing.md)

## Compatibility

- Node.js 20 or newer is the current supported runtime for the package publish target
- the core mailer API is structured so additional runtimes can be added through separate adapters and examples
