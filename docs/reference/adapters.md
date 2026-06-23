# Reference: Adapters

This page describes the transport adapter contract used by `form-mailer`.

If you want implementation steps instead of contract detail, use [How-To: Implement an Adapter](../how-to/adapters.md).

## Core idea

An adapter is a transport implementation that receives a fully assembled email message and delivers it.

The core package is responsible for:

- validation documented in [Explanation: Validation](../explanation/validation.md)
- header sanitization described in [Explanation: Validation](../explanation/validation.md)
- message assembly
- typed results

The adapter is responsible for:

- provider-specific delivery
- provider authentication
- provider-specific retries or handshakes when needed

## Transport interface

The transport interface is intentionally small:

TypeScript shape:

```ts
interface MailTransport {
  send(message: OutgoingMail): Promise<TransportSendResult>;
}
```

JavaScript shape:

```js
const transport = {
  async send(message) {
    return {};
  },
};
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

The submission-facing validation and config rules that produce those values are described in [Reference: API](./api.md).

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

## Included adapters

`createHttpTransport()` is the built-in adapter for HTTP API delivery.

Use it when a provider expects a JSON `POST` request instead of an SMTP session.

`createSmtpTransport()` is the built-in adapter for SMTP delivery.

For a first working SMTP setup, see [Tutorial: Getting Started](../tutorial/getting-started.md).

It is exposed as a public entrypoint so callers can use the same transport interface with custom or built-in adapters.

## Integration points

To use an adapter, pass it to `createFormMailer()` as `transport`.

If `transport` is present, the core mailer uses it directly.

If `transport` is omitted, the mailer falls back to the built-in HTTP or SMTP config path.

The `transport`, `http`, and `smtp` configuration fields are defined in [Reference: API](./api.md).
