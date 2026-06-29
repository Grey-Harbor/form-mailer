import { createFormMailer } from '@greyharbor/form-mailer/worker';
import type { FormMailSubmission, SendMailOutcome } from '@greyharbor/form-mailer/worker';

interface Env {
  FORM_MAILER_FROM: string;
  FORM_MAILER_TO: string;
  FORM_MAILER_HTTP_URL: string;
  FORM_MAILER_HTTP_TOKEN?: string | undefined;
  TURNSTILE_SECRET_KEY?: string | undefined;
}

interface TurnstileVerificationResult {
  success: boolean;
  'error-codes'?: string[];
}

const TURNSTILE_TIMEOUT_MS = 10_000;
const MAIL_SEND_TIMEOUT_MS = 10_000;

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

async function verifyTurnstile(token: string, secret: string): Promise<{ ok: true } | { ok: false; error: string }> {
  const body = new URLSearchParams({
    secret,
    response: token,
  });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), TURNSTILE_TIMEOUT_MS);

  try {
    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body,
      signal: controller.signal,
    });

    if (!response.ok) {
      return { ok: false, error: 'Turnstile verification request failed.' };
    }

    const result = (await response.json()) as TurnstileVerificationResult;
    if (!result.success) {
      return {
        ok: false,
        error: result['error-codes']?.join(', ') || 'Turnstile verification failed.',
      };
    }

    return { ok: true };
  } catch {
    return { ok: false, error: 'Turnstile verification timed out.' };
  } finally {
    clearTimeout(timeout);
  }
}

async function sendWithTimeout(promise: Promise<SendMailOutcome>, timeoutMs: number): Promise<SendMailOutcome> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timeoutId = setTimeout(() => reject(new Error('Mail delivery timed out.')), timeoutMs);
      }),
    ]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  if (!env.TURNSTILE_SECRET_KEY) {
    return json(500, {
      ok: false,
      error: 'TURNSTILE_SECRET_KEY is required.',
    });
  }

  const form = await request.formData();
  const turnstileToken = String(form.get('turnstileToken') ?? '').trim();

  if (!turnstileToken) {
    return json(400, { ok: false, error: 'Turnstile token is missing.' });
  }

  const turnstileResult = await verifyTurnstile(turnstileToken, env.TURNSTILE_SECRET_KEY);
  if (!turnstileResult.ok) {
    return json(400, { ok: false, error: turnstileResult.error });
  }

  const submission: FormMailSubmission = {
    name: String(form.get('name') ?? ''),
    email: String(form.get('email') ?? ''),
    message: String(form.get('message') ?? ''),
    honeypot: String(form.get('website') ?? ''),
  };

  if (!env.FORM_MAILER_FROM || !env.FORM_MAILER_TO || !env.FORM_MAILER_HTTP_URL) {
    return json(500, {
      ok: false,
      error: 'FORM_MAILER_FROM, FORM_MAILER_TO, and FORM_MAILER_HTTP_URL are required.',
    });
  }

  const mailer = createFormMailer({
    from: env.FORM_MAILER_FROM,
    to: [env.FORM_MAILER_TO],
    subject: 'ACME Inc. brochure inquiry',
    http: {
      url: env.FORM_MAILER_HTTP_URL,
      ...(env.FORM_MAILER_HTTP_TOKEN ? { token: env.FORM_MAILER_HTTP_TOKEN } : {}),
    },
  });
  try {
    const sendResult = await sendWithTimeout(mailer.send(submission), MAIL_SEND_TIMEOUT_MS);

    if (!sendResult.ok) {
      return json(500, {
        ok: false,
        error: sendResult.error.message,
      });
    }
  } catch (error) {
    return json(504, {
      ok: false,
      error: error instanceof Error ? error.message : 'Mail delivery failed.',
    });
  }

  return json(202, { ok: true });
}
