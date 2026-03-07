import { describe, expect, it, vi } from 'vitest';
import type { TckIndex } from '../../src/domain/types.js';
import { DefaultIndexService } from '../../src/service/index.service.js';

describe('DefaultIndexService', () => {
  it('updateTask upserts task entry', async () => {
    const initial: TckIndex = {
      tasks: [
        {
          id: 1,
          project: 'project-1',
          title: 'old',
          status: 'order',
          priority: 'medium',
          path: 'projects/project-1/task-1.md',
        },
      ],
      mixes: [],
    };

    const indexRepository = {
      load: vi.fn().mockResolvedValue(initial),
      save: vi.fn().mockResolvedValue(undefined),
    };

    const service = new DefaultIndexService(
      indexRepository,
      { findBySlug: vi.fn(), findAll: vi.fn(), save: vi.fn(), remove: vi.fn() },
      { findById: vi.fn(), findAll: vi.fn(), save: vi.fn(), remove: vi.fn() },
      { findById: vi.fn(), findAll: vi.fn(), save: vi.fn(), remove: vi.fn() }
    );

    await service.updateTask({
      id: 1,
      projectSlug: 'project-1',
      title: 'new',
      status: 'cook',
      priority: 'high',
      subtasks: [],
      linkedIssueIds: [],
    });

    expect(indexRepository.save).toHaveBeenCalledWith({
      tasks: [
        {
          id: 1,
          project: 'project-1',
          title: 'new',
          status: 'cook',
          priority: 'high',
          path: 'projects/project-1/task-1.md',
          due: undefined,
        },
      ],
      mixes: [],
    });
  });

  it('removeMix removes target mix entry', async () => {
    const indexRepository = {
      load: vi.fn().mockResolvedValue({
        tasks: [],
        mixes: [
          {
            id: 1,
            project: 'project-1',
            title: 'a',
            status: 'open',
            path: 'projects/project-1/mix-1.md',
          },
          {
            id: 2,
            project: 'project-1',
            title: 'b',
            status: 'closed',
            path: 'projects/project-1/mix-2.md',
          },
        ],
      }),
      save: vi.fn().mockResolvedValue(undefined),
    };

    const service = new DefaultIndexService(
      indexRepository,
      { findBySlug: vi.fn(), findAll: vi.fn(), save: vi.fn(), remove: vi.fn() },
      { findById: vi.fn(), findAll: vi.fn(), save: vi.fn(), remove: vi.fn() },
      { findById: vi.fn(), findAll: vi.fn(), save: vi.fn(), remove: vi.fn() }
    );

    await service.removeMix('project-1', 1);

    expect(indexRepository.save).toHaveBeenCalledWith({
      tasks: [],
      mixes: [
        {
          id: 2,
          project: 'project-1',
          title: 'b',
          status: 'closed',
          path: 'projects/project-1/mix-2.md',
        },
      ],
    });
  });

  it('rebuild regenerates index from repositories', async () => {
    const indexRepository = {
      load: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
    };
    const projectRepository = {
      findBySlug: vi.fn(),
      findAll: vi.fn().mockResolvedValue([
        { slug: 'project-1', name: 'p1', overview: '' },
        { slug: 'project-2', name: 'p2', overview: '' },
      ]),
      save: vi.fn(),
      remove: vi.fn(),
    };
    const taskRepository = {
      findById: vi.fn(),
      findAll: vi
        .fn()
        .mockResolvedValueOnce([
          {
            id: 2,
            projectSlug: 'project-1',
            title: 'task-2',
            status: 'prep',
            priority: 'medium',
            subtasks: [],
            linkedIssueIds: [],
          },
        ])
        .mockResolvedValueOnce([]),
      save: vi.fn(),
      remove: vi.fn(),
    };
    const mixRepository = {
      findById: vi.fn(),
      findAll: vi
        .fn()
        .mockResolvedValueOnce([
          {
            id: 5,
            projectSlug: 'project-1',
            title: 'mix-5',
            status: 'open',
            comments: [],
          },
        ])
        .mockResolvedValueOnce([
          {
            id: 1,
            projectSlug: 'project-2',
            title: 'mix-1',
            status: 'closed',
            comments: [],
          },
        ]),
      save: vi.fn(),
      remove: vi.fn(),
    };

    const service = new DefaultIndexService(
      indexRepository,
      projectRepository,
      taskRepository,
      mixRepository
    );

    await service.rebuild();

    expect(indexRepository.save).toHaveBeenCalledWith({
      tasks: [
        {
          id: 2,
          project: 'project-1',
          title: 'task-2',
          status: 'prep',
          priority: 'medium',
          due: undefined,
          path: 'projects/project-1/task-2.md',
        },
      ],
      mixes: [
        {
          id: 5,
          project: 'project-1',
          title: 'mix-5',
          status: 'open',
          path: 'projects/project-1/mix-5.md',
        },
        {
          id: 1,
          project: 'project-2',
          title: 'mix-1',
          status: 'closed',
          path: 'projects/project-2/mix-1.md',
        },
      ],
    });
  });
});
