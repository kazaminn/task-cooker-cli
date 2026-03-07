import { describe, expect, it, vi } from 'vitest';
import { NotFoundError } from '../../src/domain/errors.js';
import { DefaultProjectService } from '../../src/service/project.service.js';

describe('DefaultProjectService', () => {
  it('create auto-generates slug when omitted', async () => {
    const projectRepository = {
      findBySlug: vi.fn().mockResolvedValue(null),
      findAll: vi.fn(),
      save: vi.fn().mockResolvedValue(undefined),
      remove: vi.fn(),
    };
    const counterRepository = {
      load: vi.fn(),
      save: vi.fn(),
      next: vi.fn().mockResolvedValue(4),
    };
    const service = new DefaultProjectService(
      projectRepository,
      counterRepository
    );

    const project = await service.create({ name: 'Project X' });

    expect(project).toEqual({
      slug: 'project-4',
      name: 'Project X',
      overview: '',
    });
    expect(projectRepository.save).toHaveBeenCalledWith(project);
  });

  it('getBySlug throws when project does not exist', async () => {
    const service = new DefaultProjectService(
      {
        findBySlug: vi.fn().mockResolvedValue(null),
        findAll: vi.fn(),
        save: vi.fn(),
        remove: vi.fn(),
      },
      { load: vi.fn(), save: vi.fn(), next: vi.fn() }
    );

    await expect(service.getBySlug('missing')).rejects.toBeInstanceOf(
      NotFoundError
    );
  });
});
