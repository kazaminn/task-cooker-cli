import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { FileIndexRepository } from '../../src/repository/index.repo.js';

async function createRoot(): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), 'tck-index-'));
  await writeFile(path.join(root, 'tck.config.json'), '{}\n', 'utf-8');
  await mkdir(path.join(root, '.tck'), { recursive: true });
  return root;
}

describe('FileIndexRepository', () => {
  it('returns empty index when file is missing', async () => {
    const root = await createRoot();
    const repo = new FileIndexRepository(root);

    await expect(repo.load()).resolves.toEqual({ tasks: [], mixes: [] });
  });

  it('saves and loads index file', async () => {
    const root = await createRoot();
    const repo = new FileIndexRepository(root);

    await repo.save({
      tasks: [
        {
          id: 1,
          project: 'project-1',
          title: 't1',
          status: 'order',
          priority: 'high',
          path: 'projects/project-1/task-1.md',
        },
      ],
      mixes: [],
    });

    await expect(repo.load()).resolves.toMatchObject({
      tasks: [{ id: 1, title: 't1' }],
    });
  });
});
