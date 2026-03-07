import { describe, expect, it, vi } from 'vitest';
import { NotFoundError } from '../../src/domain/errors.js';
import { DefaultMixService } from '../../src/service/mix.service.js';

describe('DefaultMixService', () => {
  it('create saves mix with open status and syncs index', async () => {
    const mixRepository = {
      findById: vi.fn(),
      findAll: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn(),
    };
    const counterRepository = {
      load: vi.fn(),
      save: vi.fn(),
      next: vi.fn().mockResolvedValue(3),
    };
    const indexRepository = {
      load: vi.fn(),
      save: vi.fn(),
    };
    const indexService = {
      updateTask: vi.fn(),
      updateMix: vi.fn().mockResolvedValue(undefined),
      removeTask: vi.fn(),
      removeMix: vi.fn(),
      rebuild: vi.fn(),
    };

    const service = new DefaultMixService(
      mixRepository,
      counterRepository,
      indexRepository,
      indexService
    );
    const mix = await service.create({
      projectSlug: 'project-1',
      title: 'thread',
    });

    expect(mix).toMatchObject({
      id: 3,
      projectSlug: 'project-1',
      title: 'thread',
      status: 'open',
      comments: [],
    });
    expect(mixRepository.save).toHaveBeenCalledWith(mix);
    expect(indexService.updateMix).toHaveBeenCalledWith(mix);
  });

  it('addComment appends a new comment', async () => {
    const mixRepository = {
      findById: vi.fn().mockResolvedValue({
        id: 1,
        projectSlug: 'project-1',
        title: 'thread',
        status: 'open',
        comments: [],
      }),
      findAll: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn(),
    };
    const service = new DefaultMixService(
      mixRepository,
      { load: vi.fn(), save: vi.fn(), next: vi.fn() },
      { load: vi.fn(), save: vi.fn() },
      {
        updateTask: vi.fn(),
        updateMix: vi.fn().mockResolvedValue(undefined),
        removeTask: vi.fn(),
        removeMix: vi.fn(),
        rebuild: vi.fn(),
      }
    );

    const updated = await service.addComment(1, 'project-1', {
      author: 'codex',
      body: 'hello',
      timestamp: '2026-03-07T10:00:00.000Z',
    });

    expect(updated.comments).toEqual([
      {
        author: 'codex',
        body: 'hello',
        timestamp: '2026-03-07T10:00:00.000Z',
      },
    ]);
    expect(mixRepository.save).toHaveBeenCalled();
  });

  it('delete throws if mix does not exist', async () => {
    const service = new DefaultMixService(
      {
        findById: vi.fn().mockResolvedValue(null),
        findAll: vi.fn(),
        save: vi.fn(),
        remove: vi.fn(),
      },
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

    await expect(service.delete('project-1', 8)).rejects.toBeInstanceOf(
      NotFoundError
    );
  });
});
