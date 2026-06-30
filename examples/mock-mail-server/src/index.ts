import http from 'node:http';
import net from 'node:net';

type Protocol = 'smtp' | 'http';

interface StoredMessage {
  protocol: Protocol;
  authenticatedAs: string;
  from: string;
  to: string[];
  subject: string;
  text: string;
  html?: string | undefined;
  headers: Record<string, string>;
}

interface StartOptions {
  smtpPort?: number | undefined;
  httpPort?: number | undefined;
}

const DEFAULT_SMTP_PORT = 2525;
const DEFAULT_HTTP_PORT = 2500;
const USERNAME = 'admin';
const PASSWORD = 'admin';
const TOKEN = 'mocktoken';

function indent(value: string, prefix = '  '): string {
  return value
    .split('\n')
    .map((line) => `${prefix}${line}`)
    .join('\n');
}

function decodeHtmlEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

function normalizeWhitespace(value: string): string {
  return value
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .split('\n')
    .map((line) => line.trimEnd())
    .join('\n')
    .trim();
}

function formatHtmlForStdout(html: string): string {
  const withBreaks = html
    .replace(/<\s*br\s*\/?>/gi, '\n')
    .replace(/<\s*\/\s*(p|div|section|article|header|footer|li|ul|ol|h[1-6])\s*>/gi, '\n')
    .replace(/<\s*(p|div|section|article|header|footer|li|ul|ol|h[1-6])\b[^>]*>/gi, '\n')
    .replace(/<\s*\/\s*td\s*>/gi, ' ')
    .replace(/<\s*\/\s*tr\s*>/gi, '\n')
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, '');

  const decoded = decodeHtmlEntities(withBreaks);
  return normalizeWhitespace(decoded) || '(empty)';
}

function normalizeHeaders(rawHeaders: string): Record<string, string> {
  const headers: Record<string, string> = {};
  for (const line of rawHeaders.split('\n')) {
    const index = line.indexOf(':');
    if (index <= 0) continue;
    const name = line.slice(0, index).trim().toLowerCase();
    const value = line.slice(index + 1).trim();
    if (name) headers[name] = value;
  }
  return headers;
}

function normalizeStoredMessage(message: StoredMessage): string {
  const headerLines = Object.entries(message.headers).map(([name, value]) => `${name}: ${value}`);
  const bodyLines = [
    '=== mock-mail-server message ===',
    `protocol: ${message.protocol}`,
    `authenticated-as: ${message.authenticatedAs}`,
    `from: ${message.from}`,
    `to: ${message.to.join(', ')}`,
    `subject: ${message.subject}`,
    'headers:',
    ...(headerLines.length ? headerLines.map((line) => `  ${line}`) : ['  (none)']),
    'text:',
    indent(message.text || '(empty)'),
  ];

  if (message.html) {
    bodyLines.push('html:', indent(formatHtmlForStdout(message.html)));
  }

  bodyLines.push('===============================');
  return bodyLines.join('\n');
}

function parseBasicAuth(value: string | undefined): { username: string; password: string } | undefined {
  if (!value?.startsWith('Basic ')) return undefined;
  const decoded = Buffer.from(value.slice('Basic '.length), 'base64').toString('utf8');
  const separator = decoded.indexOf(':');
  if (separator < 0) return undefined;
  return {
    username: decoded.slice(0, separator),
    password: decoded.slice(separator + 1),
  };
}

function authorizeHttp(request: http.IncomingMessage): string | undefined {
  const authHeader = request.headers.authorization;
  const basic = parseBasicAuth(typeof authHeader === 'string' ? authHeader : undefined);
  if (basic && basic.username === USERNAME && basic.password === PASSWORD) return USERNAME;
  if (typeof authHeader === 'string' && authHeader === `Bearer ${TOKEN}`) return `token:${TOKEN}`;
  const apiToken = request.headers['x-api-token'];
  if (typeof apiToken === 'string' && apiToken === TOKEN) return `token:${TOKEN}`;
  return undefined;
}

function parseRecipientList(value: unknown): string[] {
  if (Array.isArray(value)) return value.flatMap((item) => parseRecipientList(item));
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);
  }
  return [];
}

function normalizeHttpPayload(payload: Record<string, unknown>): Omit<StoredMessage, 'protocol' | 'authenticatedAs' | 'headers'> {
  const to = parseRecipientList(payload.to ?? payload.recipients ?? payload.rcpt_to);
  const subject = String(payload.subject ?? payload.Subject ?? '(no subject)');
  const text = String(payload.text ?? payload.text_body ?? payload.body ?? '');
  const html = typeof payload.html === 'string' ? payload.html : typeof payload.html_body === 'string' ? payload.html_body : undefined;
  const from = String(payload.from ?? payload.sender ?? payload.mail_from ?? '(unknown)');

  return {
    from,
    to,
    subject,
    text,
    ...(html ? { html } : {}),
  };
}

function sendJson(response: http.ServerResponse, statusCode: number, body: unknown): void {
  response.writeHead(statusCode, { 'content-type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(body, null, 2));
}

function startHttpServer(port: number): http.Server {
  return http
    .createServer(async (request, response) => {
      if ((request.method ?? 'GET') !== 'POST') {
        sendJson(response, 405, { ok: false, error: 'Method not allowed' });
        return;
      }

      const authenticatedAs = authorizeHttp(request);
      if (!authenticatedAs) {
        sendJson(response, 401, { ok: false, error: 'Unauthorized' });
        return;
      }

      const chunks: Buffer[] = [];
      for await (const chunk of request) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }

      let payload: Record<string, unknown>;
      try {
        payload = JSON.parse(Buffer.concat(chunks).toString('utf8')) as Record<string, unknown>;
      } catch {
        sendJson(response, 400, { ok: false, error: 'Invalid JSON body' });
        return;
      }

      const normalized = normalizeHttpPayload(payload);
      const message: StoredMessage = {
        protocol: 'http',
        authenticatedAs,
        from: normalized.from,
        to: normalized.to,
        subject: normalized.subject,
        text: normalized.text,
        ...(normalized.html ? { html: normalized.html } : {}),
        headers: Object.fromEntries(Object.entries(request.headers).map(([name, value]) => [name, Array.isArray(value) ? value.join(', ') : String(value ?? '')])),
      };

      console.log(normalizeStoredMessage(message));
      sendJson(response, 202, { ok: true, messageId: `mock-http-${Date.now()}` });
    })
    .listen(port, () => {
      console.log(`mock-mail-server HTTP listening on http://127.0.0.1:${port}`);
    });
}

function parseSmtpMessageHeaders(rawMessage: string): { headers: Record<string, string>; text: string; html?: string | undefined; subject: string } {
  const separator = rawMessage.indexOf('\n\n');
  const headerSection = separator >= 0 ? rawMessage.slice(0, separator) : '';
  const body = separator >= 0 ? rawMessage.slice(separator + 2) : rawMessage;
  const headers = normalizeHeaders(headerSection);
  const subject = headers.subject ?? '(no subject)';
  const contentType = headers['content-type'] ?? '';

  if (contentType.includes('text/html')) {
    return { headers, text: '', html: body, subject };
  }

  return { headers, text: body, subject };
}

function startSmtpServer(port: number): net.Server {
  const server = net.createServer((socket) => {
    socket.setEncoding('utf8');
    socket.write('220 mock-mail-server ESMTP ready\r\n');

    let authState: 'none' | 'plain' | 'login-username' | 'login-password' = 'none';
    let username = '';
    let authenticatedAs = '';
    let collectingData = false;
    let mailFrom = '';
    const recipients: string[] = [];
    let messageLines: string[] = [];
    let inputBuffer = '';

    const reply = (line: string): void => {
      socket.write(`${line}\r\n`);
    };

    const resetEnvelope = (): void => {
      mailFrom = '';
      recipients.length = 0;
      messageLines = [];
      collectingData = false;
    };

    const finishMessage = (): void => {
      const rawMessage = messageLines.join('\n');
      const normalized = parseSmtpMessageHeaders(rawMessage);
      const message: StoredMessage = {
        protocol: 'smtp',
        authenticatedAs,
        from: mailFrom || '(unknown)',
        to: [...recipients],
        subject: normalized.subject,
        text: normalized.text,
        ...(normalized.html ? { html: normalized.html } : {}),
        headers: normalized.headers,
      };

      console.log(normalizeStoredMessage(message));
      reply('250 2.0.0 Message accepted');
      resetEnvelope();
    };

    socket.on('data', (chunk) => {
      inputBuffer += chunk;

      while (inputBuffer.includes('\n')) {
        const newlineIndex = inputBuffer.indexOf('\n');
        const rawLine = inputBuffer.slice(0, newlineIndex).replace(/\r$/, '');
        inputBuffer = inputBuffer.slice(newlineIndex + 1);

        if (!rawLine && !collectingData) {
          continue;
        }

        if (collectingData) {
          if (rawLine === '.') {
            finishMessage();
          } else {
            messageLines.push(rawLine.startsWith('..') ? rawLine.slice(1) : rawLine);
          }
          continue;
        }

        if (authState === 'login-username') {
          username = Buffer.from(rawLine, 'base64').toString('utf8');
          authState = 'login-password';
          reply('334 UGFzc3dvcmQ6');
          continue;
        }

        if (authState === 'login-password') {
          const password = Buffer.from(rawLine, 'base64').toString('utf8');
          if ((username === USERNAME && password === PASSWORD) || password === TOKEN) {
            authenticatedAs = password === TOKEN ? `token:${TOKEN}` : username;
            reply('235 2.7.0 Authentication successful');
          } else {
            reply('535 5.7.8 Authentication credentials invalid');
          }
          authState = 'none';
          continue;
        }

        const [commandName, ...rest] = rawLine.trim().split(/\s+/);
        if (!commandName) {
          continue;
        }
        const command = commandName.toUpperCase();
        const arg = rest.join(' ');

        switch (command) {
          case 'EHLO':
          case 'HELO':
            reply('250-mock-mail-server');
            reply('250-AUTH PLAIN LOGIN');
            reply('250 PIPELINING');
            break;
          case 'AUTH': {
            const [mechanism, initialResponse] = arg.split(/\s+/, 2);
            if ((mechanism ?? '').toUpperCase() === 'PLAIN') {
              const decoded = Buffer.from(initialResponse ?? '', 'base64').toString('utf8');
              const [, authUser = '', authPass = ''] = decoded.split('\u0000');
              if ((authUser === USERNAME && authPass === PASSWORD) || authPass === TOKEN) {
                authenticatedAs = authPass === TOKEN ? `token:${TOKEN}` : authUser;
                reply('235 2.7.0 Authentication successful');
              } else {
                reply('535 5.7.8 Authentication credentials invalid');
              }
              break;
            }

            if ((mechanism ?? '').toUpperCase() === 'LOGIN') {
              authState = 'login-username';
              reply('334 VXNlcm5hbWU6');
              break;
            }

            reply('504 5.5.4 Unrecognized authentication type');
            break;
          }
          case 'MAIL':
            if (!authenticatedAs) {
              reply('530 5.7.0 Authentication required');
              break;
            }
            mailFrom = arg.replace(/^FROM:\s*/i, '').replace(/^<|>$/g, '');
            reply('250 2.1.0 Sender ok');
            break;
          case 'RCPT':
            if (!authenticatedAs) {
              reply('530 5.7.0 Authentication required');
              break;
            }
            recipients.push(arg.replace(/^TO:\s*/i, '').replace(/^<|>$/g, ''));
            reply('250 2.1.5 Recipient ok');
            break;
          case 'DATA':
            if (!authenticatedAs) {
              reply('530 5.7.0 Authentication required');
              break;
            }
            if (!mailFrom || recipients.length === 0) {
              reply('503 5.5.1 Need MAIL FROM and RCPT TO first');
              break;
            }
            collectingData = true;
            messageLines = [];
            reply('354 End data with <CR><LF>.<CR><LF>');
            break;
          case 'RSET':
            resetEnvelope();
            reply('250 2.0.0 Reset ok');
            break;
          case 'NOOP':
            reply('250 2.0.0 Ok');
            break;
          case 'QUIT':
            reply('221 2.0.0 Bye');
            socket.end();
            break;
          default:
            reply('502 5.5.2 Command not implemented');
            break;
        }
      }
    });
  });

  server.listen(port, () => {
    console.log(`mock-mail-server SMTP listening on smtp://127.0.0.1:${port}`);
  });

  return server;
}

export async function startMockMailServer(options: StartOptions = {}): Promise<{ httpServer: http.Server; smtpServer: net.Server }> {
  const smtpServer = startSmtpServer(options.smtpPort ?? DEFAULT_SMTP_PORT);
  const httpServer = startHttpServer(options.httpPort ?? DEFAULT_HTTP_PORT);
  return { httpServer, smtpServer };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  void startMockMailServer();
}
