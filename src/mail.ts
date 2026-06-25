import type { FormMailSubmission, OutgoingMail, ResolvedFormMailerConfig } from './types.js';
import { stringifyForTransport } from './serialize.js';
import { formatAddress, resolveRecipients, resolveReplyTo, resolveSubject, sanitizeHeaderValue } from './validation.js';

function createRandomIdentifier(): string {
  const crypto = globalThis.crypto;
  if (crypto && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return [
    Date.now().toString(16),
    Math.random().toString(16).slice(2),
    Math.random().toString(16).slice(2),
  ].join('');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatValue(value: unknown): string {
  if (Array.isArray(value)) {
    return value.map((entry) => formatValue(entry)).join(', ');
  }

  if (value === null || value === undefined) {
    return '';
  }

  if (typeof value === 'object') {
    return stringifyForTransport(value, 2);
  }

  return String(value);
}

export function buildMailMessage(
  submission: FormMailSubmission,
  config: ResolvedFormMailerConfig,
): OutgoingMail {
  const recipients = resolveRecipients(submission, config);
  const replyTo = resolveReplyTo(submission, config.replyTo);
  const subject = resolveSubject(submission, config.subject);
  const from = formatAddress(config.from);
  const lines: string[] = [];

  if (submission.name) {
    lines.push(`Name: ${formatValue(submission.name)}`);
  }
  if (submission.email) {
    lines.push(`Email: ${formatValue(submission.email)}`);
  }
  if (submission.message) {
    lines.push('');
    lines.push(formatValue(submission.message));
  }

  const fields = submission.fields ?? {};
  const fieldEntries = Object.entries(fields);
  if (fieldEntries.length > 0) {
    lines.push('');
    lines.push('Fields:');
    for (const [key, value] of fieldEntries) {
      lines.push(`- ${sanitizeHeaderValue(key)}: ${formatValue(value)}`);
    }
  }

  const text = lines.join('\n').trimEnd() || 'Form submission received.';
  const html = [
    '<html><body>',
    `<h1>${escapeHtml(subject)}</h1>`,
    submission.name ? `<p><strong>Name:</strong> ${escapeHtml(formatValue(submission.name))}</p>` : '',
    submission.email ? `<p><strong>Email:</strong> ${escapeHtml(formatValue(submission.email))}</p>` : '',
    submission.message
      ? `<div><strong>Message:</strong><pre>${escapeHtml(formatValue(submission.message))}</pre></div>`
      : '',
    fieldEntries.length > 0
      ? `<ul>${fieldEntries
          .map(([key, value]) => `<li><strong>${escapeHtml(key)}:</strong> ${escapeHtml(formatValue(value))}</li>`)
          .join('')}</ul>`
      : '',
    '</body></html>',
  ]
    .filter(Boolean)
    .join('');

  return {
    from,
    to: recipients,
    ...(replyTo ? { replyTo } : {}),
    subject,
    text,
    ...(html ? { html } : {}),
  };
}

export function renderMessageHeaders(message: OutgoingMail): string {
  const messageId = `<${createRandomIdentifier()}@form-mailer.local>`;
  const headers = [
    `From: ${message.from}`,
    `To: ${message.to.join(', ')}`,
    `Subject: ${sanitizeHeaderValue(message.subject)}`,
    `Date: ${new Date().toUTCString()}`,
    `Message-ID: ${messageId}`,
    'MIME-Version: 1.0',
  ];

  if (message.replyTo) {
    headers.push(`Reply-To: ${sanitizeHeaderValue(message.replyTo)}`);
  }

  return headers.join('\r\n');
}

export function buildRawMessage(message: OutgoingMail): string {
  const headers = renderMessageHeaders(message);

  if (!message.html) {
    return [
      headers,
      'Content-Type: text/plain; charset=utf-8',
      'Content-Transfer-Encoding: 8bit',
      '',
      message.text,
    ].join('\r\n');
  }

  const boundary = `form-mailer-${createRandomIdentifier()}`;
  return [
    headers,
    `Content-Type: multipart/alternative; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset=utf-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    message.text,
    `--${boundary}`,
    'Content-Type: text/html; charset=utf-8',
    'Content-Transfer-Encoding: 8bit',
    '',
    message.html,
    `--${boundary}--`,
    '',
  ].join('\r\n');
}
