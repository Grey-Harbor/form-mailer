# Reference: Adapters

This page describes the transport adapter contract used by `form-mailer`.

## Core idea

An adapter is a transport implementation that receives a fully assembled email message and delivers it.

The core package is responsible for:

- validation
- header sanitization
- message assembly
- typed results

The adapter is responsible for:

- provider-specific delivery
- provider authentication
- provider-specific retries or handshakes when needed

## Transport interface

The transport interface is intentionally small:

```ts
interface MailTransport {
  send(message: OutgoingMail): Promise<TransportSendResult>;
}
```

## `OutgoingMail`

`OutgoingMail` contains the message data prepared by the core package:

- `from`
- `to`
- `replyTo`
- `subject`
- `text`
- `html`

The adapter should treat these values as ready for delivery.

## `TransportSendResult`

`TransportSendResult` currently supports:

- `messageId` as an optional provider-generated identifier

If the provider does not supply an id, the adapter can return an empty result object.

## Error behavior

Adapters should reject with a useful error when delivery fails.

Recommended behavior:

- use a typed transport error when the provider exposes one
- preserve provider response details when they are safe to surface
- keep secrets out of error messages

## Included adapter

`createSmtpTransport()` is the built-in adapter for SMTP delivery.

It is exposed as a public entrypoint so callers can use the same transport interface with custom or built-in adapters.

## Integration points

To use an adapter, pass it to `createFormMailer()` as `transport`.

If `transport` is present, the core mailer uses it directly.

If `transport` is omitted, the mailer falls back to the SMTP config path.
