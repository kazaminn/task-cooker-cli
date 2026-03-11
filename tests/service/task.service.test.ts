import { describe, expect, it, vi } from 'vitest';
import { NotFoundError } from '../../src/domain/errors.js';
import { DefaultTaskService } from '../../src/service/task.service.js';

describe('DefaultTaskService', () => {
  it('create saves task with defaults and updates index', async () => {
    const taskRepository = {
      findById: vi.fn().mockResolvedValue({
        id: 7,
        projectSlug: 'project-1',
        path: 'projects/project-1/t7-new-task.md',
        title: 'new task',
        status: 'order',
        priority: 'medium',
        subtasks: [],
        linkedIssueIds: [],
      }),
      findAll: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn(),
      resolvePath: vi.fn(),
    };
    const counterRepository = {
      load: vi.fn(),
      save: vi.fn(),
      next: vi.fn().mockResolvedValue(7),
    };
    const indexRepository = {
      load: vi.fn(),
      save: vi.fn(),
    };
    const indexService = {
      updateTask: vi.fn().mockResolvedValue(undefined),
      updateMix: vi.fn(),
      removeTask: vi.fn(),
      removeMix: vi.fn(),
      rebuild: vi.fn(),
    };

    const service = new DefaultTaskService(
      taskRepository,
      counterRepository,
      indexRepository,
      indexService
    );

    const created = await service.create({
      projectSlug: 'project-1',
      title: 'new task',
    });

    expect(created).toMatchObject({
      id: 7,
      projectSlug: 'project-1',
      path: 'projects/project-1/t7-new-task.md',
      title: 'new task',
      status: 'order',
      priority: 'medium',
      subtasks: [],
      linkedIssueIds: [],
    });
    expect(taskRepository.save).toHaveBeenCalledWith({
      id: 7,
      projectSlug: 'project-1',
      title: 'new task',
      description: undefined,
      status: 'order',
      priority: 'medium',
      dueDate: undefined,
      subtasks: [],
      linkedIssueIds: [],
    });
    expect(indexService.updateTask).toHaveBeenCalledWith(created);
  });

  it('update throws when task does not exist', async () => {
    const taskRepository = {
      findById: vi.fn().mockResolvedValue(null),
      findAll: vi.fn(),
      save: vi.fn(),
      remove: vi.fn(),
      resolvePath: vi.fn(),
    };

    const service = new DefaultTaskService(
      taskRepository,
      { load: vi.fn(), save: vi.fn(), next: vi.fn() },
      { load: vi.fn(), save: vi.fn() },
      {
        updateTask: vi.fn(),
        updateMix: vi.fn(),
        removeTask: vi.fn(),
        removeMix: vi.fn(),
        rebuild: vi.fn(),
      }
    );

    await expect(
      service.update([1], { projectSlug: 'project-1', title: 'changed' })
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it('list filters and sorts by priority', async () => {
    const service = new DefaultTaskService(
      {
        findById: vi.fn(),
        findAll: vi.fn(),
        save: vi.fn(),
        remove: vi.fn(),
        resolvePath: vi.fn(),
      },
      { load: vi.fn(), save: vi.fn(), next: vi.fn() },
      {
        load: vi.fn().mockResolvedValue({
          tasks: [
            {
              id: 2,
              project: 'project-1',
              title: 'b',
              status: 'order',
              priority: 'low',
              path: 'projects/project-1/task-2.md',
            },
            {
              id: 1,
              project: 'project-1',
              title: 'a',
              status: 'order',
              priority: 'high',
              path: 'projects/project-1/task-1.md',
            },
          ],
          mixes: [],
        }),
        save: vi.fn(),
      },
      {
        updateTask: vi.fn(),
        updateMix: vi.fn(),
        removeTask: vi.fn(),
        removeMix: vi.fn(),
        rebuild: vi.fn(),
      }
    );

    const rows = await service.list({
      projectSlug: 'project-1',
      status: 'order',
      sortBy: 'priority',
    });

    expect(rows.map((row) => row.id)).toEqual([1, 2]);
  });
});
