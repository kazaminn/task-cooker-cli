import { describe, expect, it, vi } from 'vitest';
import { DefaultActivityService } from '../../src/service/activity.service.js';

describe('DefaultActivityService', () => {
  it('log appends entry with generated time', async () => {
    const activityRepository = {
      append: vi.fn().mockResolvedValue(undefined),
      findAll: vi.fn(),
    };
    const service = new DefaultActivityService(activityRepository);

    await service.log({
      type: 'task_create',
      projectId: 'project-1',
      taskId: 1,
      text: 'created',
    });

    expect(activityRepository.append).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'task_create',
        projectId: 'project-1',
        taskId: 1,
        text: 'created',
        time: expect.any(String) as unknown,
      })
    );
  });
});
