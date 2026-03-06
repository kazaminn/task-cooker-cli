import type { TaskPriority, TaskStatus } from './types.js';

export const TASK_STATUSES: readonly TaskStatus[] = [
  'order',
  'prep',
  'cook',
  'serve',
];

export const TASK_PRIORITIES: readonly TaskPriority[] = [
  'urgent',
  'high',
  'medium',
  'low',
];

export const DEFAULT_TASK_STATUS: TaskStatus = 'order';
export const DEFAULT_TASK_PRIORITY: TaskPriority = 'medium';
