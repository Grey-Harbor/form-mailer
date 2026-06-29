# Mock Mail Server

`mock-mail-server` is the local test endpoint for the example workspace.

It exists to make the other examples boring to wire up:

- SMTP on port `2525`
- HTTP on port `2500`
- stdout logging for every accepted message
- simple auth so local wiring behaves like a real provider

## Quick Start

The implementation is currently scaffolded, so use the tutorial page as the flow guide:

- [Tutorial: Mock Mail Server](../../docs/tutorial/mock-mail-server.md)

For the package-level contract that the examples sit beside, see:

- [Documentation home](../../docs/README.md)
- [Reference: API](../../docs/reference/api.md)

## Auth

Both endpoints accept either credential style:

- username/password: `admin` / `admin`
- token: `mocktoken`

For SMTP, the token path is accepted as a password-style secret during AUTH.
For HTTP, the token path is accepted as a bearer token or `x-api-token` header.

## HTTP shape

The HTTP endpoint accepts a JSON payload that matches the package mail shape and tolerates SMTP2Go-style field aliases.

The goal is to keep the example practical, not provider-perfect:

- `from`
- `to`
- `subject`
- `text` or `text_body`
- `html` or `html_body`

## Output format

Accepted mail is written to stdout as a normalized block so it is easy to scan during local development.

## Implementation notes

- SMTP listens on `2525`
- HTTP listens on `2500`
- the server accepts only authenticated delivery requests
- the server is intended for local development, not public exposure

The source scaffold lives in [`src/index.ts`](./src/index.ts).
