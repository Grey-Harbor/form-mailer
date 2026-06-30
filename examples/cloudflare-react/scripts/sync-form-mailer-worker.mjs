import { cp, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const packageRoot = path.join(root, 'node_modules', '@greyharbor', 'form-mailer', 'dist', 'src');
const vendorRoot = path.join(root, 'vendor', 'form-mailer');
const manifestPath = path.join(vendorRoot, 'README.generated.txt');

await mkdir(vendorRoot, { recursive: true });
await cp(packageRoot, vendorRoot, { recursive: true, force: true });
await writeFile(
  manifestPath,
  'Generated from the installed @greyharbor/form-mailer package dist/src files.\n' +
    'Do not edit by hand.\n',
  'utf8',
);
