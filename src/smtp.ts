import * as net from 'node:net';
import * as tls from 'node:tls';
import { randomUUID } from 'node:crypto';
import { createFormMailerError } from './errors.js';
import type { MailTransport, OutgoingMail, SmtpConnectionConfig, TransportSendResult } from './types.js';
import { buildRawMessage } from './mail.js';

interface SmtpLineReader {
  nextLine(): Promise<string>;
}

export interface SmtpTransportHooks {
  connect?: (config: SmtpConnectionConfig) => Promise<net.Socket | tls.TLSSocket>;
  upgradeToTls?: (socket: net.Socket, config: SmtpConnectionConfig) => Promise<tls.TLSSocket>;
  messageIdFactory?: () => string;
}

function createLineReader(socket: net.Socket | tls.TLSSocket): SmtpLineReader {
  let buffer = '';
  const waiters: Array<(line: string) => void> = [];
  const lines: string[] = [];
  let closedError: Error | null = null;

  socket.setEncoding('utf8');

  socket.on('data', (chunk: string) => {
    buffer += chunk;
    let index = buffer.indexOf('\n');
    while (index !== -1) {
      const line = buffer.slice(0, index).replace(/\r$/, '');
      buffer = buffer.slice(index + 1);
      const waiter = waiters.shift();
      if (waiter) {
        waiter(line);
      } else {
        lines.push(line);
      }
      index = buffer.indexOf('\n');
    }
  });

  socket.on('error', (error: Error) => {
    closedError = error;
    const waiter = waiters.shift();
    if (waiter) {
      waiter('');
    }
  });

  socket.on('close', () => {
    closedError ??= new Error('SMTP connection closed.');
    const waiter = waiters.shift();
    if (waiter) {
      waiter('');
    }
  });

  return {
    nextLine() {
      if (lines.length > 0) {
        return Promise.resolve(lines.shift() ?? '');
      }

      if (closedError) {
        return Promise.reject(closedError);
      }

      return new Promise<string>((resolve, reject) => {
        waiters.push((line) => {
          if (closedError) {
            reject(closedError);
            return;
          }
          resolve(line);
        });
      });
    },
  };
}

async function readResponse(reader: SmtpLineReader): Promise<{ code: number; lines: string[] }> {
  const lines: string[] = [];
  let code = 0;

  while (true) {
    const line = await reader.nextLine();
    if (!line) {
      throw createFormMailerError('smtp_error', 'Unexpected empty SMTP response.');
    }

    lines.push(line);
    const match = line.match(/^(\d{3})([ -])(.*)$/);
    if (!match) {
      continue;
    }

    code = Number(match[1]);
    if (match[2] === ' ') {
      return { code, lines };
    }
  }
}

async function writeCommand(socket: net.Socket | tls.TLSSocket, command: string): Promise<void> {
  socket.write(`${command}\r\n`);
}

async function expectCode(
  reader: SmtpLineReader,
  socket: net.Socket | tls.TLSSocket,
  command: string,
  expected: number | number[],
): Promise<{ code: number; lines: string[] }> {
  await writeCommand(socket, command);
  const response = await readResponse(reader);
  const expectedCodes = Array.isArray(expected) ? expected : [expected];
  if (!expectedCodes.includes(response.code)) {
    throw createFormMailerError('smtp_error', `SMTP command failed: ${command.split(' ')[0]}`, {
      command,
      response,
    });
  }
  return response;
}

function connectSocket(config: SmtpConnectionConfig): Promise<net.Socket | tls.TLSSocket> {
  const port = config.port ?? (config.secure ? 465 : 587);
  const host = config.host;
  if (!host) {
    throw createFormMailerError('config_error', 'SMTP host is required.');
  }

  if (config.secure) {
    return new Promise((resolve, reject) => {
      const connection = tls.connect(
        {
          host,
          port,
          servername: config.tls?.servername ?? host,
          rejectUnauthorized: config.tls?.rejectUnauthorized ?? true,
        },
        () => resolve(connection),
      );
      connection.on('error', reject);
    });
  }

  return new Promise((resolve, reject) => {
    const connection = net.connect({ host, port }, () => resolve(connection));
    connection.on('error', reject);
  });
}

function upgradeToTls(
  socket: net.Socket,
  config: SmtpConnectionConfig,
): Promise<tls.TLSSocket> {
  return new Promise((resolve, reject) => {
    const tlsSocket = tls.connect(
      {
        socket,
        servername: config.tls?.servername ?? config.host,
        rejectUnauthorized: config.tls?.rejectUnauthorized ?? true,
      },
      () => resolve(tlsSocket),
    );
    tlsSocket.on('error', reject);
  });
}

function escapeDotStuffing(message: string): string {
  return message.replace(/(^|\r\n)\./g, '$1..');
}

export function createSmtpTransport(
  config: SmtpConnectionConfig,
  hooks: SmtpTransportHooks = {},
): MailTransport {
  return {
    async send(message: OutgoingMail): Promise<TransportSendResult> {
      const socket = await (hooks.connect ?? connectSocket)(config);
      let activeSocket: net.Socket | tls.TLSSocket = socket;
      let reader = createLineReader(activeSocket);
      let greeted = false;

      try {
        await readResponse(reader);
        greeted = true;
        await expectCode(reader, activeSocket, `EHLO ${config.tls?.servername ?? config.host ?? 'localhost'}`, [250]);

        if (config.starttls && !config.secure) {
          await expectCode(reader, activeSocket, 'STARTTLS', 220);
          activeSocket = await (hooks.upgradeToTls ?? upgradeToTls)(socket as net.Socket, config);
          reader = createLineReader(activeSocket);
          await expectCode(reader, activeSocket, `EHLO ${config.tls?.servername ?? config.host ?? 'localhost'}`, [250]);
        }

        if (config.username && config.password) {
          await expectCode(reader, activeSocket, 'AUTH LOGIN', 334);
          await expectCode(reader, activeSocket, Buffer.from(config.username).toString('base64'), 334);
          await expectCode(reader, activeSocket, Buffer.from(config.password).toString('base64'), 235);
        }

        const envelopeFrom = message.from.match(/<([^>]+)>/)?.[1] ?? message.from;
        await expectCode(reader, activeSocket, `MAIL FROM:<${envelopeFrom}>`, 250);
        for (const recipient of message.to) {
          const envelopeTo = recipient.match(/<([^>]+)>/)?.[1] ?? recipient;
          await expectCode(reader, activeSocket, `RCPT TO:<${envelopeTo}>`, [250, 251]);
        }

        await expectCode(reader, activeSocket, 'DATA', 354);
        const rawMessage = escapeDotStuffing(buildRawMessage(message));
        activeSocket.write(`${rawMessage}\r\n.\r\n`);
        const dataResponse = await readResponse(reader);
        if (![250, 251].includes(dataResponse.code)) {
          throw createFormMailerError('smtp_error', 'SMTP server rejected the message body.', {
            response: dataResponse,
          });
        }

        await expectCode(reader, activeSocket, 'QUIT', 221).catch(() => undefined);
        activeSocket.end();

        return {
          messageId: hooks.messageIdFactory?.() ?? `<${randomUUID()}@form-mailer.local>`,
        };
      } catch (error) {
        if (greeted) {
          try {
            await expectCode(reader, activeSocket, 'RSET', 250).catch(() => undefined);
          } catch {
            // Ignore cleanup failures.
          }
        }
        activeSocket.destroy();
        if (error instanceof Error && 'code' in error) {
          throw error;
        }
        throw createFormMailerError('smtp_error', 'SMTP send failed.', {
          cause: error instanceof Error ? error.message : String(error),
        });
      }
    },
  };
}
