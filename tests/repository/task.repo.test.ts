import { mkdir, mkdtemp, readFile, rename, writeFile } from 'node:fs/promises';
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
    await expect(repo.findById('project-1', 3)).resolves.toEqual({
      ...task,
      path: 'projects/project-1/task-3.md',
    });
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

  it('finds and preserves renamed task files', async () => {
    const root = await createRoot();
    const repo = new FileTaskRepository(root);

    await repo.save({
      id: 1,
      projectSlug: 'project-1',
      title: 'hello',
      status: 'order',
      priority: 'medium',
      subtasks: [],
      linkedIssueIds: [],
    });

    const original = path.join(root, 'projects', 'project-1', 'task-1.md');
    const renamed = path.join(
      root,
      'projects',
      'project-1',
      'task-1-hello-world.md'
    );
    await rename(original, renamed);

    await expect(repo.findById('project-1', 1)).resolves.toMatchObject({
      id: 1,
      path: 'projects/project-1/task-1-hello-world.md',
      title: 'hello',
    });

    await repo.save({
      id: 1,
      projectSlug: 'project-1',
      path: 'projects/project-1/task-1-hello-world.md',
      title: 'updated',
      status: 'prep',
      priority: 'high',
      subtasks: [],
      linkedIssueIds: [],
    });

    await expect(readFile(renamed, 'utf-8')).resolves.toContain(
      'Title: updated'
    );
  });

  it('accepts short task prefixes like t1-hello-world.md', async () => {
    const root = await createRoot();
    const repo = new FileTaskRepository(root);
    const projectDir = path.join(root, 'projects', 'project-1');
    await mkdir(projectDir, { recursive: true });

    await writeFile(
      path.join(projectDir, 't1-hello-world.md'),
      [
        'Id: 1',
        'Project: project-1',
        'Title: hello short',
        'Status: order',
        'Priority: medium',
        '',
        'body',
        '',
      ].join('\n'),
      'utf-8'
    );

    await expect(repo.findById('project-1', 1)).resolves.toMatchObject({
      id: 1,
      path: 'projects/project-1/t1-hello-world.md',
      title: 'hello short',
    });

    await expect(repo.findAll('project-1')).resolves.toMatchObject([
      { id: 1, path: 'projects/project-1/t1-hello-world.md' },
    ]);

    await repo.remove('project-1', 1);
    await expect(repo.findById('project-1', 1)).resolves.toBeNull();
  });
});
