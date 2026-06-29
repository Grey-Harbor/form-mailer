import fs from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'vite';

function loadDotenvVar(filePath: string): Record<string, string> {
  if (!fs.existsSync(filePath)) return {};

  const env: Record<string, string> = {};
  const contents = fs.readFileSync(filePath, 'utf8');
  for (const rawLine of contents.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith('#')) continue;

    const index = line.indexOf('=');
    if (index < 0) continue;

    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim().replace(/^"|"$/g, '');
    env[key] = value;
  }

  return env;
}

const exampleEnv = loadDotenvVar(path.resolve(process.cwd(), '.env.var'));
for (const [key, value] of Object.entries(exampleEnv)) {
  if (process.env[key] === undefined) {
    process.env[key] = value;
  }
}

export default defineConfig({
  envPrefix: ['TURNSTILE_'],
});
