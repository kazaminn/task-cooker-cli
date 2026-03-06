import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const targetPath = resolve(__dirname, '..', 'dist', 'bin', 'tck.js');
const shebang = '#!/usr/bin/env node\n';

const content = readFileSync(targetPath, 'utf-8');

if (!content.startsWith('#!')) {
  writeFileSync(targetPath, shebang + content);
}
