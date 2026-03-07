import type { Activity, ActivityType } from '../domain/types.js';
import type { ActivityRepository } from '../repository/activity.repo.js';

export interface ActivityService {
  log(activity: Omit<Activity, 'time'>): Promise<void>;
  getLog(filter?: {
    projectId?: string;
    type?: ActivityType;
  }): Promise<Activity[]>;
}

export class DefaultActivityService implements ActivityService {
  private readonly activityRepository: ActivityRepository;

  constructor(activityRepository: ActivityRepository) {
    this.activityRepository = activityRepository;
  }

  async log(activity: Omit<Activity, 'time'>): Promise<void> {
    await this.activityRepository.append({
      ...activity,
      time: new Date().toISOString(),
    });
  }

  async getLog(filter?: {
    projectId?: string;
    type?: ActivityType;
  }): Promise<Activity[]> {
    return this.activityRepository.findAll(filter);
  }
}
