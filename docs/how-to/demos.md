# How-To: Demo Runtimes

This guide points you to the demo implementations that show `form-mailer` running in different environments.

The example apps use their own `MAILER_*` environment variables so they stay separate from the package's `FORM_MAILER_*` configuration model.

For the package's own environment variable contract, use [How-To: Configuration](./configuration.md) and [Reference: API](../reference/api.md).

## Why demos exist

The demos are meant to be practical reference points:

- show the runtime-neutral mailer core in a real deployment shape
- demonstrate how to keep transport logic separate from request handling, as described in [Explanation: Adapters](../explanation/adapters.md)
- give the project a concrete example for Cloudflare and AWS Lambda

## Cloudflare Worker demo

The Cloudflare demo lives in [`examples/cloudflare-worker/src/worker.ts`](../../examples/cloudflare-worker/src/worker.ts).

It demonstrates:

- a `fetch`-based Worker entrypoint
- request parsing from JSON form submissions
- a fetch-based webhook transport adapter similar to the pattern in [How-To: Implement an Adapter](./adapters.md)

See [`examples/cloudflare-worker/README.md`](../../examples/cloudflare-worker/README.md) for the environment variables and request shape.

Those names are example-specific and feed the shared demo factory rather than the package's own environment loader.

## AWS Lambda demo

The AWS Lambda demo lives in [`examples/aws-lambda/src/handler.ts`](../../examples/aws-lambda/src/handler.ts).

It demonstrates:

- a Lambda handler that works with API Gateway-style events
- the same shared demo mailer factory used by the Worker example
- the same webhook transport adapter pattern described in [How-To: Implement an Adapter](./adapters.md)

See [`examples/aws-lambda/README.md`](../../examples/aws-lambda/README.md) for the environment variables and request shape.

Those names are example-specific and feed the shared demo factory rather than the package's own environment loader.

## Shared pieces

Both demos reuse:

- the runtime-neutral mailer core in `src/mailer.ts`
- the shared webhook transport in `examples/shared/webhook-transport.ts`
- the same submission contract defined by `FormMailSubmission` in [Reference: API](../reference/api.md)

## When to use these demos

Use the demos when you want to:

- bootstrap a new deployment example quickly
- compare how the same mailer flow looks in different runtimes
- copy a small, understandable integration pattern into your own app
