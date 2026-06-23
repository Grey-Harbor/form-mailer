import { readFile } from 'node:fs/promises';
import { createFormMailerError } from './errors.js';
import { createSmtpTransport } from './smtp.js';
import type { FormMailerConfig } from './types.js';
import { normalizeAddressList, resolveFromAddress } from './validation.js';

function parseLegacyRecipientMap(value: string | undefined): Record<string, string | string[]> | undefined {
  if (!value) {
    return undefined;
  }

  const map: Record<string, string[]> = {};
  for (const entry of value.split(',')) {
    const trimmed = entry.trim();
    if (!trimmed) {
      continue;
    }
    const [key, email] = trimmed.split(':').map((part) => part.trim());
    if (!key || !email) {
      continue;
    }
    map[key] = [email];
  }
  return map;
}

function normalizeRecipientMapValue(value: unknown): string[] {
  if (typeof value === 'string') {
    return normalizeAddressList(value);
  }

  if (Array.isArray(value)) {
    return value.flatMap((entry) => normalizeAddressList(String(entry)));
  }

  throw createFormMailerError('config_error', 'Recipient map values must be strings or string arrays.');
}

function parseRecipientMapObject(value: unknown): Record<string, string | string[]> | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }

  if (typeof value !== 'object' || Array.isArray(value)) {
    throw createFormMailerError('config_error', 'Recipient map must be a JSON object.');
  }

  const map: Record<string, string[]> = {};
  for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
    const trimmedKey = key.trim();
    if (!trimmedKey) {
      continue;
    }

    const recipients = normalizeRecipientMapValue(entry);
    if (recipients.length > 0) {
      map[trimmedKey] = recipients;
    }
  }

  return Object.keys(map).length > 0 ? map : undefined;
}

function parseRecipientMapEnv(env: NodeJS.ProcessEnv): Record<string, string | string[]> | undefined {
  const jsonMap = env.FORM_MAILER_RECIPIENT_MAP?.trim();
  if (jsonMap) {
    try {
      return parseRecipientMapObject(JSON.parse(jsonMap));
    } catch (error) {
      if (error instanceof SyntaxError) {
        throw createFormMailerError('config_error', 'FORM_MAILER_RECIPIENT_MAP must be valid JSON.');
      }
      throw error;
    }
  }

  return parseLegacyRecipientMap(env.FORM_MAILER_RECIPIENTS);
}

function splitCommaList(value: string | undefined): string[] | undefined {
  if (!value) {
    return undefined;
  }
  const entries = value
    .split(',')
    .map((entry) => entry.trim())
    .filter(Boolean);
  return entries.length > 0 ? entries : undefined;
}

function parseQuotedDotenvValue(value: string, quote: '"' | "'"): string {
  if (!value.endsWith(quote)) {
    throw createFormMailerError('config_error', 'Malformed dotenv value.');
  }

  const content = value.slice(1, -1);
  if (quote === "'") {
    return content;
  }

  return content
    .replace(/\\n/g, '\n')
    .replace(/\\r/g, '\r')
    .replace(/\\t/g, '\t')
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, '\\');
}

function parseDotenvLine(line: string, lineNumber: number): [string, string] | undefined {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) {
    return undefined;
  }

  const withoutExport = trimmed.startsWith('export ') ? trimmed.slice(7).trimStart() : trimmed;
  const equalsIndex = withoutExport.indexOf('=');
  if (equalsIndex <= 0) {
    throw createFormMailerError('config_error', `Malformed dotenv line ${lineNumber}.`);
  }

  const key = withoutExport.slice(0, equalsIndex).trim();
  if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) {
    throw createFormMailerError('config_error', `Invalid dotenv key on line ${lineNumber}.`);
  }

  let value = withoutExport.slice(equalsIndex + 1).trimStart();
  if (!value) {
    return [key, ''];
  }

  if (value.startsWith('"') || value.startsWith("'")) {
    const quote = value[0] as '"' | "'";
    let cursor = 1;
    let escaped = false;
    while (cursor < value.length) {
      const char = value[cursor];
      if (quote === '"' && char === '\\' && !escaped) {
        escaped = true;
        cursor += 1;
        continue;
      }
      if (char === quote && !escaped) {
        const remainder = value.slice(cursor + 1).trim();
        if (remainder && !remainder.startsWith('#')) {
          throw createFormMailerError('config_error', `Malformed dotenv line ${lineNumber}.`);
        }
        return [key, parseQuotedDotenvValue(value.slice(0, cursor + 1), quote)];
      }
      escaped = false;
      cursor += 1;
    }

    throw createFormMailerError('config_error', `Malformed dotenv line ${lineNumber}.`);
  }

  const commentIndex = value.search(/\s+#/);
  if (commentIndex !== -1) {
    value = value.slice(0, commentIndex).trimEnd();
  }

  return [key, value];
}

function parseDotenvFile(source: string): Record<string, string> {
  const env: Record<string, string> = {};
  const lines = source.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').split('\n');

  for (let index = 0; index < lines.length; index += 1) {
    const entry = parseDotenvLine(lines[index] ?? '', index + 1);
    if (!entry) {
      continue;
    }
    const [key, value] = entry;
    env[key] = value;
  }

  return env;
}

function warnIfSecretIsInEnvFile(fileEnv: Record<string, string>): void {
  for (const secretName of ['FORM_MAILER_SMTP_PASSWORD', 'FORM_MAILER_SMTP_TOKEN'] as const) {
    if (fileEnv[secretName]) {
      console.warn(
        `form-mailer: ${secretName} was loaded from FORM_MAILER_ENV_PATH. ` +
          'This is a security risk; prefer supplying secrets through the live environment instead.',
      );
    }
  }
}

function mergeEnvironments(fileEnv: Record<string, string>, runtimeEnv: NodeJS.ProcessEnv): NodeJS.ProcessEnv {
  const merged: NodeJS.ProcessEnv = { ...fileEnv };
  for (const [key, value] of Object.entries(runtimeEnv)) {
    if (value !== undefined) {
      merged[key] = value;
    }
  }
  return merged;
}

function parseNumber(value: string | undefined): number | undefined {
  if (value === undefined || value === '') {
    return undefined;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function buildConfigFromEnv(env: NodeJS.ProcessEnv): FormMailerConfig {
  const recipientMap = parseRecipientMapEnv(env);
  const explicitTo = normalizeAddressList(env.FORM_MAILER_TO);
  const rawFrom = env.FORM_MAILER_FROM ?? env.FORM_MAILER_SENDER_EMAIL;

  return {
    from: resolveFromAddress({
      email: rawFrom ?? '',
      ...(env.FORM_MAILER_SENDER_NAME ? { name: env.FORM_MAILER_SENDER_NAME } : {}),
    }),
    to: explicitTo,
    smtp: {
      host: env.FORM_MAILER_SMTP_HOST,
      port: parseNumber(env.FORM_MAILER_SMTP_PORT),
      secure: env.FORM_MAILER_SMTP_SECURE === 'true',
      starttls: env.FORM_MAILER_SMTP_STARTTLS === 'true',
      username: env.FORM_MAILER_SMTP_USERNAME,
      password: env.FORM_MAILER_SMTP_TOKEN ?? env.FORM_MAILER_SMTP_PASSWORD,
      tls: {
        servername: env.FORM_MAILER_SMTP_SERVERNAME,
      },
    },
    recipientMap,
    subject: env.FORM_MAILER_SUBJECT,
    replyTo: env.FORM_MAILER_REPLY_TO,
    originAllowlist: splitCommaList(env.FORM_MAILER_ORIGIN_ALLOWLIST),
    honeypotFieldName: env.FORM_MAILER_HONEYPOT_FIELD,
    requiredFields: splitCommaList(env.FORM_MAILER_REQUIRED_FIELDS),
    maxPayloadBytes: parseNumber(env.FORM_MAILER_MAX_PAYLOAD_BYTES),
  };
}

async function loadEnvFile(path: string): Promise<Record<string, string>> {
  try {
    const raw = await readFile(path, 'utf8');
    const parsed = parseDotenvFile(raw);
    warnIfSecretIsInEnvFile(parsed);
    return parsed;
  } catch (error) {
    if (error instanceof Error && 'code' in error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw createFormMailerError('config_error', `Environment file not found: ${path}`);
    }

    throw createFormMailerError('config_error', `Unable to read environment file: ${path}`, {
      cause: error instanceof Error ? error.message : String(error),
    });
  }
}

export async function loadConfigFromEnv(env: NodeJS.ProcessEnv = process.env): Promise<FormMailerConfig> {
  const envPath = env.FORM_MAILER_ENV_PATH?.trim();
  const effectiveEnv = envPath ? mergeEnvironments(await loadEnvFile(envPath), env) : env;
  return buildConfigFromEnv(effectiveEnv);
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
