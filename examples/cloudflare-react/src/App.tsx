import { useState, type FormEvent } from 'react';
import { resolveClientEnv } from './env.js';

const env = resolveClientEnv();

export function App() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus('sending');

    const formData = new FormData(event.currentTarget);
    const response = await fetch('/api/contact', {
      method: 'POST',
      body: formData,
    });
    const result = (await response.json()) as { ok?: boolean; error?: unknown };

    if (response.ok && result.ok !== false) {
      setStatus('sent');
      setMessage('Thanks. The message was accepted by the mock HTTP endpoint.');
      event.currentTarget.reset();
      return;
    }

    setStatus('error');
    setMessage(typeof result.error === 'string' ? result.error : 'Message failed');
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
          Turnstile support is wired through the Pages function. The client keeps the site key visible so the example
          shows where the protection step belongs without hiding the flow.
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
          <input type="hidden" name="turnstileToken" value="mock-turnstile-token" />
          <button type="submit" disabled={status === 'sending'}>
            {status === 'sending' ? 'Sending...' : 'Send message'}
          </button>
        </form>
        <p className="muted">
          Turnstile site key: <code>{env.TURNSTILE_SITE_KEY || 'not set'}</code>
        </p>
        {message ? <p className={status === 'error' ? 'error' : 'success'}>{message}</p> : null}
      </section>
    </main>
  );
}
