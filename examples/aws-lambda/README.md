# AWS Lambda Demo

This demo shows how to run `form-mailer` inside an AWS Lambda handler using the same runtime-neutral core as the Cloudflare example.

## What it demonstrates

- a Lambda-friendly request handler
- the shared demo mailer factory
- a fetch-based webhook transport adapter
- configuration through Lambda environment variables

## Environment variables

- `MAILER_FROM`
- `MAILER_TO`
- `MAILER_WEBHOOK_URL`
- `MAILER_WEBHOOK_TOKEN` if your webhook expects a bearer token

These demo variables are intentionally separate from the package's built-in `FORM_MAILER_*` env loader.
The example constructs its mailer in code so the runtime wrapper stays portable.

## Request shape

Send a JSON body that matches `FormMailSubmission`.

## Notes

- the demo keeps the transport generic so you can point it at any HTTP email provider
- you can replace the webhook transport with a provider-specific adapter when needed
