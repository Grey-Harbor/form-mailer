import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { createFormMailerError } from './errors.js';
import { createSmtpTransport } from './smtp.js';
import type { FormMailerConfig } from './types.js';
import { parseConfigRecord, parseSimpleYaml } from './config-parser.js';
import { normalizeAddressList, resolveFromAddress } from './validation.js';

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

function parseEnvRecipientMap(value: string | undefined): Record<string, string | string[]> | undefined {
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

export async function loadConfigFromFile(path: string): Promise<FormMailerConfig> {
  const raw = await readFile(path, 'utf8');
  return parseConfigRecord(parseSimpleYaml(raw));
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
          ? resolveFromAddress(
              {
                email: env.FORM_MAILER_FROM ?? env.FORM_MAILER_SENDER_EMAIL ?? fileFrom.email,
                ...(env.FORM_MAILER_SENDER_NAME || fileFrom.name
                  ? { name: env.FORM_MAILER_SENDER_NAME ?? fileFrom.name }
                  : {}),
              },
            )
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

  return parseConfigRecord({
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
    recipientMap: parseEnvRecipientMap(env.FORM_MAILER_RECIPIENTS),
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
