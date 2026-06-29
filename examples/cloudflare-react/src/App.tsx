import { useState, type FormEvent } from 'react';
import { resolveClientEnv } from './env.js';
import { TurnstileWidget } from './TurnstileWidget.js';

const env = resolveClientEnv();

export function App() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileKey, setTurnstileKey] = useState(0);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;

    if (!turnstileToken) {
      setStatus('error');
      setMessage('Complete the Turnstile widget before sending the form.');
      return;
    }

    setStatus('sending');
    try {
      const formData = new FormData(form);
      formData.set('turnstileToken', turnstileToken);

      const response = await fetch('/api/contact', {
        method: 'POST',
        body: formData,
      });

      const rawBody = await response.text();
      const result = rawBody
        ? (JSON.parse(rawBody) as {
            ok?: boolean;
            error?: unknown;
          })
        : { ok: false, error: 'Empty response from the contact endpoint.' };

      if (response.ok && result.ok !== false) {
        setStatus('sent');
        setMessage('Thanks. The message was accepted after Turnstile verification.');
        setTurnstileToken('');
        setTurnstileKey((value) => value + 1);
        form.reset();
        return;
      }

      setStatus('error');
      setMessage(typeof result.error === 'string' ? result.error : 'Message failed');
    } catch (error) {
      setStatus('error');
      setMessage(error instanceof Error ? error.message : 'Message failed');
    }
  }

  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">ACME Inc.</p>
        <h1>A React brochure site with a direct contact path.</h1>
        <p>
          This example keeps the structure explicit: the site tells the ACME story, then hands the contact request to
          <code>form-mailer</code> through a Cloudflare Pages function.
        </p>
      </section>

      <section className="card">
        <h2>What ACME Inc. does</h2>
        <p>
          ACME Inc. is a boilerplate company overview for the example workspace. It gives the layout a realistic voice
          without turning the example into product marketing.
        </p>
      </section>

      <section className="card">
        <h2>Contact ACME Inc.</h2>
        <p className="muted">
          The widget below is the real Turnstile integration path. For a test site key and secret, use Cloudflare's
          testing guidance in the docs.
        </p>
        <form onSubmit={onSubmit} className="form">
          <label>
            Name
            <input name="name" autoComplete="name" />
          </label>
          <label>
            Email
            <input name="email" type="email" autoComplete="email" required />
          </label>
          <input type="hidden" name="website" value="" />
          <label>
            Message
            <textarea name="message" required />
          </label>
          <input type="hidden" name="turnstileToken" value={turnstileToken} />
          <TurnstileWidget key={turnstileKey} siteKey={env.TURNSTILE_SITE_KEY ?? ''} onToken={setTurnstileToken} />
          <button type="submit" disabled={status === 'sending' || !turnstileToken}>
            {status === 'sending' ? 'Sending...' : 'Send message'}
          </button>
        </form>
        {message ? <p className={status === 'error' ? 'error' : 'success'}>{message}</p> : null}
      </section>
    </main>
  );
}
