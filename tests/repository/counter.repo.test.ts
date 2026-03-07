import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { FileCounterRepository } from '../../src/repository/counter.repo.js';

async function createRoot(): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), 'tck-counter-'));
  await writeFile(path.join(root, 'tck.config.json'), '{}\n', 'utf-8');
  await mkdir(path.join(root, '.tck'), { recursive: true });
  return root;
}

describe('FileCounterRepository', () => {
  it('returns initial values and increments each counter key', async () => {
    const root = await createRoot();
    const repo = new FileCounterRepository(root);

    await expect(repo.load()).resolves.toEqual({ task: 0, mix: 0, project: 0 });
    await expect(repo.next('task')).resolves.toBe(1);
    await expect(repo.next('task')).resolves.toBe(2);
    await expect(repo.next('mix')).resolves.toBe(1);

    await expect(repo.load()).resolves.toEqual({ task: 2, mix: 1, project: 0 });
  });
});
