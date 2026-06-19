import { createDemoMailer } from '../../shared/create-demo-mailer.js';
import type { FormMailSubmission } from '../../../src/types.js';

export interface LambdaProxyEvent {
  body?: string | undefined;
  isBase64Encoded?: boolean | undefined;
  httpMethod?: string | undefined;
}

export interface LambdaProxyResult {
  statusCode: number;
  headers: Record<string, string>;
  body: string;
}

export interface LambdaDemoEnv {
  MAILER_FROM?: string | undefined;
  MAILER_TO?: string | undefined;
  MAILER_WEBHOOK_URL?: string | undefined;
  MAILER_WEBHOOK_TOKEN?: string | undefined;
}

function decodeBody(event: LambdaProxyEvent): string {
  if (!event.body) {
    return '';
  }

  if (!event.isBase64Encoded) {
    return event.body;
  }

  const binary = atob(event.body);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function buildResult(statusCode: number, payload: unknown): LambdaProxyResult {
  return {
    statusCode,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  };
}

export async function handler(
  event: LambdaProxyEvent,
  env: LambdaDemoEnv = process.env,
): Promise<LambdaProxyResult> {
  if ((event.httpMethod ?? 'POST') !== 'POST') {
    return buildResult(405, { ok: false, error: 'Method not allowed' });
  }

  const rawBody = decodeBody(event);
  if (!rawBody.trim()) {
    return buildResult(400, { ok: false, error: 'Missing request body' });
  }

  const from = env.MAILER_FROM ?? '';
  const to = env.MAILER_TO ?? '';
  const endpoint = env.MAILER_WEBHOOK_URL ?? '';
  const mailer = createDemoMailer({
    from,
    to,
    endpoint,
    token: env.MAILER_WEBHOOK_TOKEN,
  });

  let submission: FormMailSubmission;
  try {
    submission = JSON.parse(rawBody) as FormMailSubmission;
  } catch {
    return buildResult(400, { ok: false, error: 'Invalid JSON body' });
  }

  const result = await mailer.send(submission);

  return buildResult(result.ok ? 202 : 400, result);
}
