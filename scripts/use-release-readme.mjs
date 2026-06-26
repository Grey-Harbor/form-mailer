import { copyFile, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const readmePath = path.join(root, 'README.md');
const releaseReadmePath = path.join(root, 'package-readme.md');
const backupPath = path.join(root, '.release-readme-backup.md');

async function main() {
  const [currentReadme, releaseReadme] = await Promise.all([
    readFile(readmePath, 'utf8'),
    readFile(releaseReadmePath, 'utf8'),
  ]);

  if (currentReadme === releaseReadme) {
    return;
  }

  await copyFile(readmePath, backupPath);
  await writeFile(readmePath, releaseReadme, 'utf8');
}

await main();
