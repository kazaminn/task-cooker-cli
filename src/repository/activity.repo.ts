import { promises as fs } from 'node:fs';
import type { Activity, ActivityType } from '../domain/types.js';
import { getActivityLogPath } from '../util/path.js';

export interface ActivityRepository {
  append(activity: Activity): Promise<void>;
  findAll(filter?: {
    projectId?: string;
    type?: ActivityType;
  }): Promise<Activity[]>;
}

export class FileActivityRepository implements ActivityRepository {
  private readonly startDir?: string;

  constructor(startDir?: string) {
    this.startDir = startDir;
  }

  async append(activity: Activity): Promise<void> {
    const logPath = getActivityLogPath(this.startDir);
    await fs.appendFile(logPath, `${JSON.stringify(activity)}\n`, 'utf-8');
  }

  async findAll(filter?: {
    projectId?: string;
    type?: ActivityType;
  }): Promise<Activity[]> {
    const logPath = getActivityLogPath(this.startDir);

    try {
      const raw = await fs.readFile(logPath, 'utf-8');
      const entries = raw
        .split('\n')
        .filter(Boolean)
        .map((line) => JSON.parse(line) as Activity);

      return entries.filter((entry) => {
        if (filter?.projectId && filter.projectId !== entry.projectId) {
          return false;
        }

        if (filter?.type && filter.type !== entry.type) {
          return false;
        }

        return true;
      });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }

      throw error;
    }
  }
}
