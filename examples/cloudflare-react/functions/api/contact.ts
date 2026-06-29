import { createFormMailer, loadConfigFromEnv } from '@greyharbor/form-mailer';
import type { FormMailSubmission } from '@greyharbor/form-mailer';

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

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body,
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

  const mailer = createFormMailer(
    await loadConfigFromEnv({
      ...env,
      FORM_MAILER_SUBJECT: 'ACME Inc. brochure inquiry',
    }),
  );
  const result = await mailer.send(submission);
  return json(result.ok ? 202 : 400, result);
}
