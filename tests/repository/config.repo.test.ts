import { mkdtemp, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { TckConfig } from '../../src/domain/types.js';
import { FileConfigRepository } from '../../src/repository/config.repo.js';

async function createRoot(): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), 'tck-config-'));
  await writeFile(path.join(root, 'tck.config.json'), '{}\n', 'utf-8');
  return root;
}

describe('FileConfigRepository', () => {
  it('saves and loads config object', async () => {
    const root = await createRoot();
    const repo = new FileConfigRepository(root);

    const config: TckConfig = {
      user: { name: 'alice', email: 'alice@example.com' },
      defaultProject: 'project-1',
      editor: 'vi',
      dateFormat: 'YYYY-MM-DD',
      language: 'en',
    };

    await repo.save(config);
    await expect(repo.load()).resolves.toEqual(config);
  });
});
