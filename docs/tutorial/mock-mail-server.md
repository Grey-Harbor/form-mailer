# Tutorial: Mock Mail Server

`mock-mail-server` is the local endpoint that keeps the other examples easy to test.

It gives the workspace two things:

- an SMTP endpoint on port `2525`
- an HTTP endpoint on port `2500`

Both endpoints accept the same simple credential styles:

- username/password: `admin` / `admin`
- token: `mocktoken`

## Why it exists

The mock server exists so the example apps can be exercised without a real provider account.

That keeps the learning path calm:

1. the app sends a normal request
2. the local server accepts it with a simple auth check
3. the message is printed to stdout in a readable block

## How to think about the HTTP endpoint

The HTTP side is intentionally provider-shaped rather than provider-specific.

It accepts JSON mail payloads and tolerates SMTP2Go-style field names so the other examples can stay close to a real delivery API without hard-coding one vendor’s entire contract.

## How to think about the SMTP endpoint

The SMTP side is the lower-level local contract.

It is there for the Node brochure example and for readers who want to understand a classic mail transport path without introducing a hosted relay.

## Run it locally

From `examples/mock-mail-server`:

```bash
npm install
npm run dev
```

That starts the local scaffold with its own package manifest and scripts.

## Related docs

- [Examples Workspace](./examples-workspace.md)
- [Reference: API](../reference/api.md)
