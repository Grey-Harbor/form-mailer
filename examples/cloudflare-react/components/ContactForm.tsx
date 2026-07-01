'use client';

import { useEffect, useState, type FormEvent } from 'react';
import { loadClientEnv, type CloudflareReactEnv } from './lib/env';
import { TurnstileWidget } from './TurnstileWidget';

export function ContactForm() {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileKey, setTurnstileKey] = useState(0);
  const [env, setEnv] = useState<CloudflareReactEnv | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadClientEnv()
      .then((loadedEnv) => {
        if (!cancelled) {
          setEnv(loadedEnv);
        }
      })
      .catch(() => {
        if (!cancelled) {
          setEnv({});
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

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
    <>
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
        <TurnstileWidget
          key={turnstileKey}
          siteKey={env === null ? null : env.TURNSTILE_SITE_KEY ?? ''}
          onToken={setTurnstileToken}
        />
        <button type="submit" disabled={status === 'sending' || !turnstileToken}>
          {status === 'sending' ? 'Sending...' : 'Send message'}
        </button>
      </form>
      {message ? <p className={status === 'error' ? 'error' : 'success'}>{message}</p> : null}
    </>
  );
}
