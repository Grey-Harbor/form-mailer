# How-To: Demo Runtimes

This guide points to the demo implementations that show `form-mailer` running in different environments.

## Why demos exist

The demos are meant to be practical reference points:

- show the runtime-neutral mailer core in a real deployment shape
- demonstrate how to keep transport logic separate from request handling
- give the project a concrete example for Cloudflare and AWS Lambda

## Cloudflare Worker demo

The Cloudflare demo lives in [`examples/cloudflare-worker/src/worker.ts`](../../examples/cloudflare-worker/src/worker.ts).

It demonstrates:

- a `fetch`-based Worker entrypoint
- request parsing from JSON form submissions
- a fetch-based webhook transport adapter

See [`examples/cloudflare-worker/README.md`](../../examples/cloudflare-worker/README.md) for the environment variables and request shape.

## AWS Lambda demo

The AWS Lambda demo lives in [`examples/aws-lambda/src/handler.ts`](../../examples/aws-lambda/src/handler.ts).

It demonstrates:

- a Lambda handler that works with API Gateway-style events
- the same shared demo mailer factory used by the Worker example
- the same webhook transport adapter pattern

See [`examples/aws-lambda/README.md`](../../examples/aws-lambda/README.md) for the environment variables and request shape.

## Shared pieces

Both demos reuse:

- the runtime-neutral mailer core in `src/mailer.ts`
- the shared webhook transport in `examples/shared/webhook-transport.ts`
- the same submission contract defined by `FormMailSubmission`

## When to use these demos

Use the demos when you want to:

- bootstrap a new deployment example quickly
- compare how the same mailer flow looks in different runtimes
- copy a small, understandable integration pattern into your own app
