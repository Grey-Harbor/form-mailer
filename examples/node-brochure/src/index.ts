import fs from 'node:fs/promises';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createFormMailer } from '../../../../src/index.js';
import type { FormMailSubmission } from '../../../../src/index.js';

interface ExampleEnv {
  NODE_BROCHURE_FROM: string;
  NODE_BROCHURE_TO: string;
  NODE_BROCHURE_SMTP_HOST: string;
  NODE_BROCHURE_SMTP_PORT: string;
  NODE_BROCHURE_SMTP_USERNAME: string;
  NODE_BROCHURE_SMTP_PASSWORD: string;
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');
const DEFAULT_PORT = 3000;

function parseEnvFile(contents: string): Partial<ExampleEnv> {
  const result: Partial<ExampleEnv> = {};
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;
    const index = line.indexOf('=');
    if (index < 0) continue;
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim().replace(/^"|"$/g, '');
    (result as Record<string, string>)[key] = value;
  }
  return result;
}

async function loadExampleEnv(): Promise<Partial<ExampleEnv>> {
  const envPath = path.join(ROOT, '.env.var');
  try {
    const contents = await fs.readFile(envPath, 'utf8');
    return parseEnvFile(contents);
  } catch {
    return {};
  }
}

function getEnvValue(env: Partial<ExampleEnv>, key: keyof ExampleEnv, fallback = ''): string {
  return process.env[key] ?? env[key] ?? fallback;
}

function renderPage(message = ''): string {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>ACME Inc.</title>
    <style>
      :root {
        color-scheme: light;
        --bg: #f6f1ea;
        --panel: #ffffff;
        --ink: #1e232b;
        --muted: #5f6b7a;
        --line: #d8d0c5;
        --accent: #1e5f74;
        --accent-strong: #123b49;
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        font-family: Arial, Helvetica, sans-serif;
        background: linear-gradient(180deg, #f8f4ee 0%, #efe6db 100%);
        color: var(--ink);
      }
      main {
        max-width: 1080px;
        margin: 0 auto;
        padding: 32px 20px 72px;
      }
      section {
        background: var(--panel);
        border: 1px solid var(--line);
        border-radius: 24px;
        padding: 28px;
        margin-bottom: 20px;
        box-shadow: 0 10px 30px rgba(23, 29, 36, 0.06);
      }
      .hero {
        padding: 48px 28px;
        background: linear-gradient(135deg, #17313d 0%, #1e5f74 100%);
        color: white;
      }
      .hero h1 {
        margin: 0 0 12px;
        font-size: clamp(2.4rem, 5vw, 4.8rem);
        line-height: 0.95;
      }
      .hero p {
        max-width: 52rem;
        color: rgba(255,255,255,.88);
        font-size: 1.08rem;
        line-height: 1.7;
      }
      .grid {
        display: grid;
        gap: 18px;
      }
      form {
        display: grid;
        gap: 14px;
      }
      label { display: grid; gap: 8px; font-size: 0.95rem; }
      input, textarea, button {
        font: inherit;
        border-radius: 14px;
        border: 1px solid var(--line);
        padding: 14px 16px;
      }
      textarea { min-height: 140px; resize: vertical; }
      button {
        background: var(--accent);
        color: white;
        border: none;
        font-weight: 700;
        cursor: pointer;
      }
      button:hover { background: var(--accent-strong); }
      .flash {
        margin-bottom: 20px;
        padding: 14px 16px;
        border-radius: 14px;
        background: #e3f0ec;
        border: 1px solid #b9d4cb;
      }
      .muted { color: var(--muted); }
    </style>
  </head>
  <body>
    <main>
      ${message ? `<div class="flash">${message}</div>` : ''}
      <section class="hero">
        <p class="muted" style="color: rgba(255,255,255,.72); text-transform: uppercase; letter-spacing: .2em; margin: 0 0 12px;">ACME Inc.</p>
        <h1>Practical brochure pages that keep the contact path simple.</h1>
        <p>ACME Inc. is a placeholder company used to show how a small Node site can present a clean story, keep the layout readable, and route contact requests through <code>form-mailer</code> without hiding the flow behind extra abstraction.</p>
      </section>
      <section>
        <h2>What ACME Inc. does</h2>
        <p class="muted">ACME Inc. is a boilerplate company overview for the examples workspace. The point is to show a familiar brochure pattern: explain the company, earn attention, and give visitors a clear way to reach out.</p>
        <div class="grid" style="grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); margin-top: 18px;">
          <article>
            <h3>Clear positioning</h3>
            <p class="muted">Short, useful copy that tells visitors what the company does and who it helps.</p>
          </article>
          <article>
            <h3>Simple delivery</h3>
            <p class="muted">A contact form backed by the package mailer keeps the example close to a real app flow.</p>
          </article>
          <article>
            <h3>Local-friendly defaults</h3>
            <p class="muted">Example env values point at the mock SMTP server so the site works without a provider account.</p>
          </article>
        </div>
      </section>
      <section>
        <h2>Contact ACME Inc.</h2>
        <form method="post" action="/contact">
          <label>
            Your name
            <input name="name" autocomplete="name" />
          </label>
          <label>
            Your email
            <input name="email" type="email" autocomplete="email" required />
          </label>
          <input type="hidden" name="website" value="" />
          <label>
            Message
            <textarea name="message" required></textarea>
          </label>
          <button type="submit">Send message</button>
        </form>
      </section>
    </main>
  </body>
</html>`;
}

async function readForm(request: http.IncomingMessage): Promise<FormData> {
  const chunks: Buffer[] = [];
  for await (const chunk of request) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  const body = Buffer.concat(chunks).toString('utf8');
  const form = new FormData();
  const params = new URLSearchParams(body);
  for (const [key, value] of params.entries()) {
    form.set(key, value);
  }
  return form;
}

function buildMailer(env: Partial<ExampleEnv>) {
  return createFormMailer({
    from: getEnvValue(env, 'NODE_BROCHURE_FROM', 'ACME Inc. <hello@acme.example>'),
    to: [getEnvValue(env, 'NODE_BROCHURE_TO', 'hello@acme.example')],
    subject: 'ACME Inc. brochure inquiry',
    smtp: {
      host: getEnvValue(env, 'NODE_BROCHURE_SMTP_HOST', '127.0.0.1'),
      port: Number(getEnvValue(env, 'NODE_BROCHURE_SMTP_PORT', '2525')),
      username: getEnvValue(env, 'NODE_BROCHURE_SMTP_USERNAME', 'admin'),
      password: getEnvValue(env, 'NODE_BROCHURE_SMTP_PASSWORD', 'admin'),
    },
  });
}

async function main(): Promise<void> {
  const env = await loadExampleEnv();
  const mailer = buildMailer(env);

  http
    .createServer(async (request, response) => {
      if ((request.method ?? 'GET') === 'GET' && (request.url ?? '/') === '/') {
        response.writeHead(200, { 'content-type': 'text/html; charset=utf-8' });
        response.end(renderPage());
        return;
      }

      if ((request.method ?? 'GET') === 'POST' && (request.url ?? '') === '/contact') {
        const form = await readForm(request);
        const submission: FormMailSubmission = {
          name: String(form.get('name') ?? ''),
          email: String(form.get('email') ?? ''),
          message: String(form.get('message') ?? ''),
          honeypot: String(form.get('website') ?? ''),
        };

        const result = await mailer.send(submission);
        const body = result.ok
          ? renderPage('Thanks. Your message is on its way through the mock SMTP server.')
          : renderPage(`Message failed: ${result.error.message}`);

        response.writeHead(result.ok ? 200 : 400, { 'content-type': 'text/html; charset=utf-8' });
        response.end(body);
        return;
      }

      response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
      response.end('Not found');
    })
    .listen(Number(process.env.PORT ?? DEFAULT_PORT), () => {
      console.log(`node-brochure listening on http://127.0.0.1:${process.env.PORT ?? DEFAULT_PORT}`);
    });
}

void main();
