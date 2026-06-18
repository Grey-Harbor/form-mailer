import { createFormMailerError } from './errors.js';
import type { FormMailerConfig, MailAddress, SmtpConnectionConfig } from './types.js';
import { normalizeAddressList, resolveFromAddress } from './validation.js';

interface ParsedYaml {
  [key: string]: unknown;
}

function parseScalar(value: string): unknown {
  const trimmed = value.trim();
  if (!trimmed) {
    return '';
  }
  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    return trimmed.slice(1, -1);
  }
  if (trimmed === 'true') {
    return true;
  }
  if (trimmed === 'false') {
    return false;
  }
  if (/^-?\d+(\.\d+)?$/.test(trimmed)) {
    return Number(trimmed);
  }
  return trimmed;
}

function stripInlineComment(line: string): string {
  return line.replace(/\s+#.*$/, '');
}

function lineIndent(line: string): number {
  return line.match(/^ */)?.[0].length ?? 0;
}

function isListItem(line: string): boolean {
  return line.trimStart().startsWith('- ');
}

function createContainer(nextLine: string | undefined): ParsedYaml | unknown[] {
  return nextLine && isListItem(nextLine) ? [] : {};
}

function parseListItem(line: string): string {
  return line.trimStart().slice(2);
}

export function parseSimpleYaml(source: string): ParsedYaml {
  const root: ParsedYaml = {};
  const stack: Array<{ indent: number; value: ParsedYaml | unknown[] }> = [
    { indent: -1, value: root },
  ];

  const lines = source.replace(/\r\n/g, '\n').split('\n');
  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index] ?? '';
    const line = stripInlineComment(rawLine);
    if (!line.trim()) {
      continue;
    }

    const indent = lineIndent(rawLine);
    while (stack.length > 1 && indent <= stack[stack.length - 1]!.indent) {
      stack.pop();
    }

    const parent = stack[stack.length - 1]?.value;
    if (!parent) {
      throw createFormMailerError('config_error', 'Invalid YAML structure.');
    }

    if (isListItem(line)) {
      if (!Array.isArray(parent)) {
        throw createFormMailerError('config_error', 'YAML list item found outside an array.');
      }
      parent.push(parseScalar(parseListItem(line)));
      continue;
    }

    const separatorIndex = line.indexOf(':');
    if (separatorIndex === -1) {
      throw createFormMailerError('config_error', `Invalid YAML line: ${line}`);
    }

    const key = line.slice(0, separatorIndex).trim();
    const value = line.slice(separatorIndex + 1);
    const parentObject = parent as ParsedYaml;

    if (!value.trim()) {
      const child = createContainer(lines[index + 1]);
      parentObject[key] = child;
      stack.push({ indent, value: child });
      continue;
    }

    parentObject[key] = parseScalar(value);
  }

  return root;
}

function parseMaybeList(value: unknown): string[] | undefined {
  if (value === undefined) {
    return undefined;
  }
  if (Array.isArray(value)) {
    return value.map(String);
  }
  if (typeof value === 'string') {
    return normalizeAddressList(value);
  }
  return [String(value)];
}

function parseRecipientAddresses(value: unknown): string[] | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value
      .map((entry) => String(entry).split(',')[1]?.trim())
      .filter((entry): entry is string => Boolean(entry));
  }

  if (typeof value === 'string') {
    return value
      .split(',')
      .map((entry) => entry.trim())
      .filter(Boolean);
  }

  return undefined;
}

function parseSmtpConfig(value: unknown): SmtpConnectionConfig {
  const smtp = (value ?? {}) as Record<string, unknown>;
  const url = typeof smtp.url === 'string' ? smtp.url : undefined;
  const parsedUrl = url ? new URL(url) : undefined;
  const servername = (smtp.servername as string | undefined) ?? parsedUrl?.hostname;
  const rejectUnauthorized =
    typeof smtp.rejectUnauthorized === 'boolean' ? smtp.rejectUnauthorized : undefined;

  return {
    host: (smtp.host as string | undefined) ?? parsedUrl?.hostname,
    port: Number((smtp.port as number | string | undefined) ?? parsedUrl?.port ?? undefined) || undefined,
    secure: Boolean(smtp.secure ?? parsedUrl?.protocol === 'smtps:'),
    starttls: Boolean(smtp.starttls),
    username: (smtp.username as string | undefined) ?? (smtp.uname as string | undefined),
    password: (smtp.password as string | undefined) ?? (smtp.token as string | undefined),
    tls: {
      ...(rejectUnauthorized !== undefined ? { rejectUnauthorized } : {}),
      ...(servername ? { servername } : {}),
    },
  };
}

function parseRecipientMap(value: unknown): Record<string, string | string[]> | undefined {
  if (!value) {
    return undefined;
  }

  if (Array.isArray(value)) {
    const map: Record<string, string[]> = {};
    for (const entry of value) {
      const [key, email] = String(entry).split(',');
      if (!key || !email) {
        continue;
      }
      map[key.trim()] = [email.trim()];
    }
    return map;
  }

  if (typeof value === 'object') {
    return value as Record<string, string | string[]>;
  }

  return undefined;
}

function recipientMapToAddresses(value: Record<string, string | string[]> | undefined): string[] | undefined {
  if (!value) {
    return undefined;
  }

  return Object.values(value).flatMap((entry) =>
    Array.isArray(entry) ? entry.flatMap((item) => normalizeAddressList(item)) : normalizeAddressList(entry),
  );
}

function resolveFromSource(source: Record<string, unknown>): string | MailAddress | { email: string; name?: string } {
  if (source.from) {
    return source.from as string | MailAddress;
  }

  const from = {
    email: String(source.senderEmail ?? ''),
    ...(source.senderName ? { name: String(source.senderName) } : {}),
  };

  return from;
}

export function parseConfigRecord(source: Record<string, unknown>): FormMailerConfig {
  const smtp = parseSmtpConfig(source.smtp);
  const from = resolveFromAddress(resolveFromSource(source));
  const recipientMap = parseRecipientMap(source.recipientMap ?? source.recipientsMap ?? source.recipients);
  const to =
    parseMaybeList(source.to) ??
    parseRecipientAddresses(source.recipients) ??
    recipientMapToAddresses(recipientMap) ??
    [];

  if (!from.email) {
    throw createFormMailerError('config_error', 'A from address is required.');
  }

  return {
    from,
    to,
    smtp,
    recipientMap,
    subject: source.subject ? String(source.subject) : undefined,
    replyTo: source.replyTo ? String(source.replyTo) : undefined,
    originAllowlist: parseMaybeList(source.originAllowlist),
    honeypotFieldName: source.honeypotFieldName ? String(source.honeypotFieldName) : undefined,
    requiredFields: parseMaybeList(source.requiredFields),
    maxPayloadBytes:
      typeof source.maxPayloadBytes === 'number' ? source.maxPayloadBytes : undefined,
  };
}
