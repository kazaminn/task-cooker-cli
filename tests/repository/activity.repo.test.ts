import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Activity } from '../../src/domain/types.js';
import { FileActivityRepository } from '../../src/repository/activity.repo.js';

async function createRoot(): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), 'tck-activity-'));
  await writeFile(path.join(root, 'tck.config.json'), '{}\n', 'utf-8');
  await mkdir(path.join(root, '.tck'), { recursive: true });
  return root;
}

describe('FileActivityRepository', () => {
  it('appends and filters activity entries', async () => {
    const root = await createRoot();
    const repo = new FileActivityRepository(root);

    const first: Activity = {
      time: '2026-03-07T00:00:00.000Z',
      type: 'task_create',
      projectId: 'project-1',
      taskId: 1,
      text: 'created',
    };
    const second: Activity = {
      time: '2026-03-07T00:00:01.000Z',
      type: 'task_delete',
      projectId: 'project-2',
      taskId: 2,
      text: 'deleted',
    };

    await repo.append(first);
    await repo.append(second);

    await expect(repo.findAll()).resolves.toEqual([first, second]);
    await expect(repo.findAll({ projectId: 'project-1' })).resolves.toEqual([
      first,
    ]);
    await expect(repo.findAll({ type: 'task_delete' })).resolves.toEqual([
      second,
    ]);
  });
});
