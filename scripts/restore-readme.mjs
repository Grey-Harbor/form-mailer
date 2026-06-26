import { access, copyFile, rm } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const readmePath = path.join(root, 'README.md');
const backupPath = path.join(root, '.release-readme-backup.md');

async function exists(filePath) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  if (!(await exists(backupPath))) {
    return;
  }

  await copyFile(backupPath, readmePath);
  await rm(backupPath, { force: true });
}

await main();
