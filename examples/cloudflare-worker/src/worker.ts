import { createDemoMailer } from '../../shared/create-demo-mailer.js';
import type { FormMailSubmission } from '../../../src/types.js';

export interface CloudflareWorkerEnv {
  MAILER_FROM: string;
  MAILER_TO: string;
  MAILER_WEBHOOK_URL: string;
  MAILER_WEBHOOK_TOKEN?: string | undefined;
}

export default {
  async fetch(request: Request, env: CloudflareWorkerEnv): Promise<Response> {
    if (request.method === 'GET') {
      return new Response('form-mailer Cloudflare demo is running.', {
        headers: { 'content-type': 'text/plain; charset=utf-8' },
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    const bodyText = await request.text();
    if (!bodyText.trim()) {
      return new Response(JSON.stringify({ ok: false, error: 'Missing request body' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      });
    }

    const mailer = createDemoMailer({
      from: env.MAILER_FROM,
      to: env.MAILER_TO,
      endpoint: env.MAILER_WEBHOOK_URL,
      token: env.MAILER_WEBHOOK_TOKEN,
    });

    let submission: FormMailSubmission;
    try {
      submission = JSON.parse(bodyText) as FormMailSubmission;
    } catch {
      return new Response(JSON.stringify({ ok: false, error: 'Invalid JSON body' }), {
        status: 400,
        headers: { 'content-type': 'application/json' },
      });
    }

    const result = await mailer.send(submission);

    return new Response(JSON.stringify(result), {
      status: result.ok ? 202 : 400,
      headers: { 'content-type': 'application/json' },
    });
  },
};
