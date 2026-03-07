import { mkdtemp, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Task } from '../../src/domain/types.js';
import { FileTaskRepository } from '../../src/repository/task.repo.js';

async function createRoot(): Promise<string> {
  const root = await mkdtemp(path.join(os.tmpdir(), 'tck-task-'));
  await writeFile(path.join(root, 'tck.config.json'), '{}\n', 'utf-8');
  return root;
}

describe('FileTaskRepository', () => {
  it('saves and finds task by id', async () => {
    const root = await createRoot();
    const repo = new FileTaskRepository(root);

    const task: Task = {
      id: 3,
      projectSlug: 'project-1',
      title: 'task title',
      description: 'task body',
      status: 'prep',
      priority: 'medium',
      dueDate: '2026-03-10',
      subtasks: [{ title: 'sub', done: false, children: [] }],
      linkedIssueIds: [1, 2],
    };

    await repo.save(task);
    await expect(repo.findById('project-1', 3)).resolves.toEqual(task);
  });

  it('findAll returns sorted tasks', async () => {
    const root = await createRoot();
    const repo = new FileTaskRepository(root);

    await repo.save({
      id: 5,
      projectSlug: 'project-1',
      title: 'later',
      status: 'order',
      priority: 'low',
      subtasks: [],
      linkedIssueIds: [],
    });

    await repo.save({
      id: 2,
      projectSlug: 'project-1',
      title: 'earlier',
      status: 'order',
      priority: 'high',
      subtasks: [],
      linkedIssueIds: [],
    });

    await expect(repo.findAll('project-1')).resolves.toMatchObject([
      { id: 2, title: 'earlier' },
      { id: 5, title: 'later' },
    ]);
  });
});
