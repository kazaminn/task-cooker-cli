import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
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
    const found = await repo.findById('project-1', 3);
    expect(found).toMatchObject({
      id: 3,
      projectSlug: 'project-1',
      title: 'task title',
      description: 'task body',
      status: 'prep',
      priority: 'medium',
      dueDate: '2026-03-10',
      subtasks: [{ title: 'sub', done: false, children: [] }],
      linkedIssueIds: [1, 2],
    });
    expect(found?.path).toMatch(/^projects\/project-1\/.+\.md$/);
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

  it('saves to existing path when task.path is set', async () => {
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

    const found = await repo.findById('project-1', 1);
    expect(found).not.toBeNull();

    await repo.save({
      ...found!,
      title: 'updated',
      status: 'prep',
    });

    const updated = await repo.findById('project-1', 1);
    expect(updated).toMatchObject({ id: 1, title: 'updated', status: 'prep' });
    expect(updated?.path).toBe(found?.path);
  });

  it('reads arbitrary task filenames like nyanyan.md', async () => {
    const root = await createRoot();
    const repo = new FileTaskRepository(root);
    const projectDir = path.join(root, 'projects', 'project-1');
    await mkdir(projectDir, { recursive: true });

    await writeFile(
      path.join(projectDir, 'nyanyan.md'),
      [
        '---',
        'id: 7',
        'title: nyan task',
        'status: order',
        'priority: medium',
        'linkedIssueIds: []',
        '---',
        '',
        'body',
        '',
      ].join('\n'),
      'utf-8'
    );

    await expect(repo.findById('project-1', 7)).resolves.toMatchObject({
      id: 7,
      path: 'projects/project-1/nyanyan.md',
      title: 'nyan task',
    });

    await expect(repo.findAll('project-1')).resolves.toMatchObject([
      { id: 7, path: 'projects/project-1/nyanyan.md' },
    ]);

    await repo.remove('project-1', 7);
    await expect(repo.findById('project-1', 7)).resolves.toBeNull();
  });
});
