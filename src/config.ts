import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { createFormMailerError } from './errors.js';
import { createSmtpTransport } from './smtp.js';
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

export function parseSimpleYaml(source: string): ParsedYaml {
  const root: ParsedYaml = {};
  const stack: Array<{ indent: number; value: ParsedYaml | unknown[] }> = [
    { indent: -1, value: root },
  ];

  const lines = source.replace(/\r\n/g, '\n').split('\n');
  for (let index = 0; index < lines.length; index += 1) {
    const rawLine = lines[index] ?? '';
    const line = rawLine.replace(/\s+#.*$/, '');
    if (!line.trim()) {
      continue;
    }

    const indent = rawLine.match(/^ */)?.[0].length ?? 0;
    while (stack.length > 1 && indent <= stack[stack.length - 1]!.indent) {
      stack.pop();
    }

    const parent = stack[stack.length - 1]?.value;
    if (!parent) {
      throw createFormMailerError('config_error', 'Invalid YAML structure.');
    }

    if (line.trimStart().startsWith('- ')) {
      if (!Array.isArray(parent)) {
        throw createFormMailerError('config_error', 'YAML list item found outside an array.');
      }
      parent.push(parseScalar(line.trimStart().slice(2)));
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
      const nextLine = lines[index + 1];
      const nextIsArray = nextLine?.trimStart().startsWith('- ');
      parentObject[key] = nextIsArray ? [] : {};
      stack.push({ indent, value: parentObject[key] as ParsedYaml | unknown[] });
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
  return normalizeAddressList(String(value));
}

function parseRecipientAddresses(value: unknown): string[] | undefined {
  if (!value) {
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

function resolveConfigPath(env: NodeJS.ProcessEnv): string | undefined {
  const explicitPath = env.FORM_MAILER_CONFIG_PATH ?? env.FORM_MAILER_CONFIG_FILE;
  if (explicitPath) {
    return explicitPath;
  }

  const cwd = process.cwd();
  const deploymentRootConfig = join(cwd, 'configs.yaml');
  if (existsSync(deploymentRootConfig)) {
    return deploymentRootConfig;
  }

  const legacyConfig = join(cwd, 'config.yaml');
  if (existsSync(legacyConfig)) {
    return legacyConfig;
  }

  return undefined;
}

function parseSmtpConfig(value: unknown): SmtpConnectionConfig {
  const smtp = (value ?? {}) as Record<string, unknown>;
  const url = typeof smtp.url === 'string' ? smtp.url : undefined;
  const parsedUrl = url ? new URL(url) : undefined;

  return {
    host: (smtp.host as string | undefined) ?? parsedUrl?.hostname,
    port: Number((smtp.port as number | string | undefined) ?? parsedUrl?.port ?? undefined) || undefined,
    secure: Boolean(smtp.secure ?? parsedUrl?.protocol === 'smtps:'),
    starttls: Boolean(smtp.starttls),
    username: (smtp.username as string | undefined) ?? (smtp.uname as string | undefined),
    password: (smtp.password as string | undefined) ?? (smtp.token as string | undefined),
    tls: {
      ...(typeof smtp.rejectUnauthorized === 'boolean'
        ? { rejectUnauthorized: smtp.rejectUnauthorized }
        : {}),
      ...(smtp.servername || parsedUrl?.hostname ? { servername: (smtp.servername as string | undefined) ?? parsedUrl?.hostname } : {}),
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

function recipientMapToAddresses(value: unknown): string[] | undefined {
  if (!value) {
    return undefined;
  }

  if (Array.isArray(value)) {
    return value
      .map((entry) => String(entry).split(',')[1]?.trim())
      .filter((entry): entry is string => Boolean(entry));
  }

  if (typeof value === 'object') {
    return Object.values(value as Record<string, string | string[]>).flatMap((entry) =>
      Array.isArray(entry) ? entry.flatMap((item) => normalizeAddressList(item)) : normalizeAddressList(entry),
    );
  }

  return undefined;
}

export async function loadConfigFromFile(path: string): Promise<FormMailerConfig> {
  const raw = await readFile(path, 'utf8');
  const parsed = parseSimpleYaml(raw);
  return normalizeConfig(parsed);
}

export function normalizeConfig(source: Record<string, unknown>): FormMailerConfig {
  const smtp = parseSmtpConfig(source.smtp);
  const fromSource = (source.from as string | MailAddress | undefined) ?? {
    email: String(source.senderEmail ?? ''),
    ...(source.senderName ? { name: String(source.senderName) } : {}),
  };
  const from = resolveFromAddress(fromSource);
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

export async function loadConfigFromEnv(env: NodeJS.ProcessEnv = process.env): Promise<FormMailerConfig> {
  const filePath = resolveConfigPath(env);
  if (filePath) {
    const fileConfig = await loadConfigFromFile(filePath);
    const fileFrom = resolveFromAddress(fileConfig.from);
    return {
      ...fileConfig,
      from:
        env.FORM_MAILER_FROM || env.FORM_MAILER_SENDER_EMAIL
          ? resolveFromAddress({
              email: env.FORM_MAILER_FROM ?? env.FORM_MAILER_SENDER_EMAIL ?? fileFrom.email,
              ...(env.FORM_MAILER_SENDER_NAME || fileFrom.name
                ? { name: env.FORM_MAILER_SENDER_NAME ?? fileFrom.name }
                : {}),
            })
          : fileFrom,
      to: env.FORM_MAILER_TO ? normalizeAddressList(env.FORM_MAILER_TO) : fileConfig.to,
      subject: env.FORM_MAILER_SUBJECT ?? fileConfig.subject,
      replyTo: env.FORM_MAILER_REPLY_TO ?? fileConfig.replyTo,
      honeypotFieldName: env.FORM_MAILER_HONEYPOT_FIELD ?? fileConfig.honeypotFieldName,
      maxPayloadBytes: env.FORM_MAILER_MAX_PAYLOAD_BYTES
        ? Number(env.FORM_MAILER_MAX_PAYLOAD_BYTES)
        : fileConfig.maxPayloadBytes,
      originAllowlist: env.FORM_MAILER_ORIGIN_ALLOWLIST
        ? env.FORM_MAILER_ORIGIN_ALLOWLIST.split(',').map((entry) => entry.trim()).filter(Boolean)
        : fileConfig.originAllowlist,
    };
  }

  return normalizeConfig({
    from:
      env.FORM_MAILER_FROM || env.FORM_MAILER_SENDER_EMAIL
        ? {
            email: env.FORM_MAILER_FROM ?? env.FORM_MAILER_SENDER_EMAIL ?? '',
            ...(env.FORM_MAILER_SENDER_NAME ? { name: env.FORM_MAILER_SENDER_NAME } : {}),
          }
        : undefined,
    to: env.FORM_MAILER_TO,
    smtp: {
      host: env.FORM_MAILER_SMTP_HOST,
      port: env.FORM_MAILER_SMTP_PORT ? Number(env.FORM_MAILER_SMTP_PORT) : undefined,
      secure: env.FORM_MAILER_SMTP_SECURE === 'true',
      starttls: env.FORM_MAILER_SMTP_STARTTLS === 'true',
      username: env.FORM_MAILER_SMTP_USERNAME ?? env.SMTP_UNAME,
      password: env.FORM_MAILER_SMTP_PASSWORD ?? env.SMTP_TOKEN,
      tls: {
        servername: env.FORM_MAILER_SMTP_SERVERNAME,
      },
    },
    recipientMap: env.FORM_MAILER_RECIPIENTS ? parseRecipientMap(env.FORM_MAILER_RECIPIENTS) : undefined,
    subject: env.FORM_MAILER_SUBJECT,
    replyTo: env.FORM_MAILER_REPLY_TO,
    originAllowlist: env.FORM_MAILER_ORIGIN_ALLOWLIST
      ? env.FORM_MAILER_ORIGIN_ALLOWLIST.split(',').map((entry) => entry.trim()).filter(Boolean)
      : undefined,
    honeypotFieldName: env.FORM_MAILER_HONEYPOT_FIELD,
    requiredFields: env.FORM_MAILER_REQUIRED_FIELDS
      ? env.FORM_MAILER_REQUIRED_FIELDS.split(',').map((entry) => entry.trim()).filter(Boolean)
      : undefined,
    maxPayloadBytes: env.FORM_MAILER_MAX_PAYLOAD_BYTES
      ? Number(env.FORM_MAILER_MAX_PAYLOAD_BYTES)
      : undefined,
  });
}

export function createTransportFromConfig(config: FormMailerConfig) {
  if (config.transport) {
    return config.transport;
  }

  if (!config.smtp) {
    throw createFormMailerError('config_error', 'SMTP configuration is required when no transport is provided.');
  }

  return createSmtpTransport(config.smtp);
}
