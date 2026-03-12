import { mkdtemp, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { FileProjectRepository } from '../../src/repository/project.repo.js';

async function createRoot(): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), 'tck-project-'));
  await writeFile(path.join(root, 'tck.config.json'), '{}\n', 'utf-8');
  return root;
}

describe('FileProjectRepository', () => {
  it('saves and finds project by slug', async () => {
    const root = await createRoot();
    const repo = new FileProjectRepository(root);

    await repo.save({
      slug: 'project-1',
      name: 'プロジェクト1',
      overview: '概要',
    });

    const found = await repo.findBySlug('project-1');
    expect(found).toMatchObject({
      slug: 'project-1',
      name: 'プロジェクト1',
      overview: '概要',
    });
  });

  it('saves and finds project with status and ObsidianMetadata', async () => {
    const root = await createRoot();
    const repo = new FileProjectRepository(root);

    await repo.save({
      slug: 'project-2',
      name: 'TaskCooker',
      status: 'cooking',
      overview: 'overview',
      created: '2026-03-12T10:00:00',
      updated: '2026-03-12T10:00:00',
      aliases: ['project-2'],
    });

    const found = await repo.findBySlug('project-2');
    expect(found).toMatchObject({
      slug: 'project-2',
      name: 'TaskCooker',
      status: 'cooking',
      created: '2026-03-12T10:00:00',
      updated: '2026-03-12T10:00:00',
      aliases: ['project-2'],
    });
  });

  it('findAll loads all project directories', async () => {
    const root = await createRoot();
    const repo = new FileProjectRepository(root);

    await repo.save({ slug: 'a', name: 'A', overview: 'oa' });
    await repo.save({ slug: 'b', name: 'B', overview: 'ob' });

    await expect(repo.findAll()).resolves.toHaveLength(2);
  });
});
