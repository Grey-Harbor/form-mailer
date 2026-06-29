import { createFormMailer, loadConfigFromEnv } from '@greyharbor/form-mailer';
import type { FormMailSubmission } from '@greyharbor/form-mailer';

interface Env {
  FORM_MAILER_FROM: string;
  FORM_MAILER_TO: string;
  FORM_MAILER_HTTP_URL: string;
  FORM_MAILER_HTTP_TOKEN?: string | undefined;
  CLOUDFLARE_REACT_TURNSTILE_SECRET_KEY?: string | undefined;
}

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body, null, 2), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

async function verifyTurnstile(token: string, secret: string | undefined): Promise<boolean> {
  if (!secret) return true;
  if (!token) return false;
  return token === 'mock-turnstile-token';
}

export async function onRequestPost({ request, env }: { request: Request; env: Env }) {
  const form = await request.formData();
  const turnstileToken = String(form.get('turnstileToken') ?? '');

  if (!(await verifyTurnstile(turnstileToken, env.CLOUDFLARE_REACT_TURNSTILE_SECRET_KEY))) {
    return json(400, { ok: false, error: 'Turnstile verification failed' });
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
