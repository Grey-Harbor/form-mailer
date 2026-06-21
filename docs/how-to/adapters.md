# How-To: Implement an Adapter

This guide walks through the shape of a transport adapter for `form-mailer`.

## What an adapter does

An adapter is a small transport implementation that knows how to deliver an already-built email message.

In practice, the core package handles:

- input validation
- header safety
- message assembly
- typed success and failure results

An adapter handles delivery only.

## The transport contract

A transport adapter implements a single method:

```ts
send(message): Promise<TransportSendResult>
```

The message already contains:

- formatted sender and recipient addresses
- the reply-to header if needed
- the subject line
- the plain text body
- the HTML body when available

## Typical adapter flow

1. accept a transport-specific configuration object
2. connect to the delivery provider
3. send the formatted message
4. return a `messageId` when the provider supplies one
5. throw or reject with a transport-specific error if delivery fails

## Example shape

```ts
import type { MailTransport, OutgoingMail, TransportSendResult } from '@greyharbor/form-mailer';

export function createExampleTransport(apiKey: string): MailTransport {
  return {
    async send(message: OutgoingMail): Promise<TransportSendResult> {
      // Deliver `message` using your provider here.
      // Return a message id if the provider gives you one.
      void apiKey;
      void message;
      return { messageId: 'provider-message-id' };
    },
  };
}
```

## Using the adapter

Pass the adapter into `createFormMailer()` as `transport`:

```ts
import { createFormMailer } from '@greyharbor/form-mailer';
import { createExampleTransport } from './example-transport.js';

const mailer = createFormMailer({
  from: 'no-reply@example.com',
  to: ['support@example.com'],
  transport: createExampleTransport(process.env.EXAMPLE_API_KEY ?? ''),
});
```

## Implementation tips

- keep the adapter small and provider-focused
- do not re-implement validation in the adapter
- trust only the message shape already produced by `form-mailer`
- prefer typed errors for transport failures when possible
- keep provider-specific config out of the core package

## Testing

At minimum, test that the adapter:

- sends a valid message
- surfaces provider failures clearly
- returns a message id when available
- handles missing required provider config cleanly
