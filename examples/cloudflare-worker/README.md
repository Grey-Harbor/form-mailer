# Cloudflare Worker Demo

This demo shows how to run `form-mailer` in a Cloudflare Worker using a fetch-based transport adapter.

## What it demonstrates

- the runtime-neutral mailer core
- a Cloudflare `fetch` entrypoint
- a fetch-based webhook transport adapter
- environment-driven configuration without Node-specific helpers

## Environment variables

- `MAILER_FROM`
- `MAILER_TO`
- `MAILER_WEBHOOK_URL`
- `MAILER_WEBHOOK_TOKEN` if your webhook expects a bearer token

## Request shape

Send a JSON form submission body that matches `FormMailSubmission`.

## Notes

- swap the webhook transport for your provider-specific API if you already have one
- keep the webhook URL secret because it can act as an authenticated delivery endpoint
