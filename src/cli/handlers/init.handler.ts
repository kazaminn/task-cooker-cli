import { promises as fs } from 'node:fs';
import path from 'node:path';
import { atomicWriteFile } from '../../util/fs.js';
import { getWorkingDir } from '../../util/path.js';

const DEFAULT_CONFIG = {
  user: {
    name: process.env.USERNAME ?? process.env.USER ?? 'user',
    email: 'user@example.com',
  },
  defaultProject: 'project-1',
  editor: process.env.EDITOR ?? 'vi',
  dateFormat: 'YYYY-MM-DD',
  language: 'ja' as const,
};

async function writeIfMissing(
  filePath: string,
  content: string
): Promise<void> {
  try {
    await fs.access(filePath);
  } catch {
    await atomicWriteFile(filePath, content);
  }
}

export async function initHandler(): Promise<void> {
  const root = getWorkingDir();
  const tckDir = path.join(root, '.tck');
  const projectsDir = path.join(root, 'projects');

  await fs.mkdir(tckDir, { recursive: true });
  await fs.mkdir(projectsDir, { recursive: true });

  await writeIfMissing(
    path.join(root, 'tck.config.json'),
    `${JSON.stringify(DEFAULT_CONFIG, null, 2)}\n`
  );
  await writeIfMissing(
    path.join(tckDir, 'counter.json'),
    `${JSON.stringify({ task: 0, mix: 0, project: 0 }, null, 2)}\n`
  );
  await writeIfMissing(
    path.join(tckDir, 'index.json'),
    `${JSON.stringify({ tasks: [], mixes: [] }, null, 2)}\n`
  );
  await writeIfMissing(path.join(tckDir, 'activity.log'), '');

  console.log(root);
}
