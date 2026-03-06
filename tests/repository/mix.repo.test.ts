import { mkdtemp, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Mix } from '../../src/domain/types.js';
import { FileMixRepository } from '../../src/repository/mix.repo.js';

async function createRoot(): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), 'tck-mix-'));
  await writeFile(path.join(root, 'tck.config.json'), '{}\n', 'utf-8');
  return root;
}

describe('FileMixRepository', () => {
  it('saves and finds mix', async () => {
    const root = await createRoot();
    const repo = new FileMixRepository(root);

    const mix: Mix = {
      id: 10,
      projectSlug: 'project-1',
      title: 'mix title',
      status: 'open',
      comments: [
        {
          author: 'alice',
          timestamp: '2026-03-06T10:00:00+09:00',
          body: 'hello',
        },
      ],
    };

    await repo.save(mix);
    await expect(repo.findById('project-1', 10)).resolves.toEqual(mix);
  });
});
