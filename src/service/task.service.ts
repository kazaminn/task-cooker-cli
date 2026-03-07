import {
  DEFAULT_TASK_PRIORITY,
  DEFAULT_TASK_STATUS,
  TASK_PRIORITIES,
  TASK_STATUSES,
} from '../domain/constants.js';
import { NotFoundError, ValidationError } from '../domain/errors.js';
import { createTranslator } from '../util/i18n.js';
import type {
  Subtask,
  Task,
  TaskFilter,
  TaskIndexEntry,
  TaskPriority,
  TaskStatus,
} from '../domain/types.js';
import type { CounterRepository } from '../repository/counter.repo.js';
import type { IndexRepository } from '../repository/index.repo.js';
import type { TaskRepository } from '../repository/task.repo.js';
import type { IndexService } from './index.service.js';

export interface CreateTaskInput {
  projectSlug: string;
  title: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  subtasks?: Subtask[];
  linkedIssueIds?: number[];
}

export interface UpdateTaskInput {
  projectSlug: string;
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | null;
  subtasks?: Subtask[];
  linkedIssueIds?: number[];
}

export interface TaskService {
  create(input: CreateTaskInput): Promise<Task>;
  update(ids: number[], input: UpdateTaskInput): Promise<Task[]>;
  changeStatus(
    ids: number[],
    projectSlug: string,
    status: TaskStatus
  ): Promise<Task[]>;
  delete(projectSlug: string, id: number): Promise<void>;
  list(filter: TaskFilter): Promise<TaskIndexEntry[]>;
}

function getStatusRank(status: TaskStatus): number {
  return TASK_STATUSES.indexOf(status);
}

function getPriorityRank(priority: TaskPriority): number {
  return TASK_PRIORITIES.indexOf(priority);
}

function compareDueDate(a?: string, b?: string): number {
  if (!a && !b) {
    return 0;
  }

  if (!a) {
    return 1;
  }

  if (!b) {
    return -1;
  }

  return a.localeCompare(b);
}

function sortByFilter(
  entries: TaskIndexEntry[],
  sortBy: TaskFilter['sortBy']
): TaskIndexEntry[] {
  const copied = [...entries];

  switch (sortBy) {
    case 'status':
      return copied.sort(
        (a, b) => getStatusRank(a.status) - getStatusRank(b.status)
      );
    case 'priority':
      return copied.sort(
        (a, b) => getPriorityRank(a.priority) - getPriorityRank(b.priority)
      );
    case 'due':
      return copied.sort((a, b) => compareDueDate(a.due, b.due));
    case 'updated':
      return copied.sort((a, b) => b.id - a.id);
    case 'created':
    default:
      return copied.sort((a, b) => a.id - b.id);
  }
}

export class DefaultTaskService implements TaskService {
  private readonly taskRepository: TaskRepository;
  private readonly counterRepository: CounterRepository;
  private readonly indexRepository: IndexRepository;
  private readonly indexService: IndexService;

  constructor(
    taskRepository: TaskRepository,
    counterRepository: CounterRepository,
    indexRepository: IndexRepository,
    indexService: IndexService
  ) {
    this.taskRepository = taskRepository;
    this.counterRepository = counterRepository;
    this.indexRepository = indexRepository;
    this.indexService = indexService;
  }

  async create(input: CreateTaskInput): Promise<Task> {
    const id = await this.counterRepository.next('task');

    const task: Task = {
      id,
      projectSlug: input.projectSlug,
      title: input.title,
      description: input.description,
      status: input.status ?? DEFAULT_TASK_STATUS,
      priority: input.priority ?? DEFAULT_TASK_PRIORITY,
      dueDate: input.dueDate,
      subtasks: input.subtasks ?? [],
      linkedIssueIds: input.linkedIssueIds ?? [],
    };

    await this.taskRepository.save(task);
    await this.indexService.updateTask(task);
    return task;
  }

  async update(ids: number[], input: UpdateTaskInput): Promise<Task[]> {
    if (ids.length === 0) {
      const t = createTranslator('ja');
      throw new ValidationError(t('taskUpdateIdsRequired'));
    }

    const updated: Task[] = [];

    for (const id of ids) {
      const current = await this.taskRepository.findById(input.projectSlug, id);
      if (!current) {
        throw new NotFoundError('task', id);
      }

      const next: Task = {
        ...current,
        title: input.title ?? current.title,
        description: input.description ?? current.description,
        status: input.status ?? current.status,
        priority: input.priority ?? current.priority,
        dueDate:
          input.dueDate === null
            ? undefined
            : (input.dueDate ?? current.dueDate),
        subtasks: input.subtasks ?? current.subtasks,
        linkedIssueIds: input.linkedIssueIds ?? current.linkedIssueIds,
      };

      await this.taskRepository.save(next);
      await this.indexService.updateTask(next);
      updated.push(next);
    }

    return updated;
  }

  async changeStatus(
    ids: number[],
    projectSlug: string,
    status: TaskStatus
  ): Promise<Task[]> {
    return this.update(ids, { projectSlug, status });
  }

  async delete(projectSlug: string, id: number): Promise<void> {
    const existing = await this.taskRepository.findById(projectSlug, id);
    if (!existing) {
      throw new NotFoundError('task', id);
    }

    await this.taskRepository.remove(projectSlug, id);
    await this.indexService.removeTask(projectSlug, id);
  }

  async list(filter: TaskFilter): Promise<TaskIndexEntry[]> {
    const index = await this.indexRepository.load();
    const filtered = index.tasks.filter((entry) => {
      if (filter.projectSlug && entry.project !== filter.projectSlug) {
        return false;
      }

      if (filter.status && entry.status !== filter.status) {
        return false;
      }

      if (filter.priority && entry.priority !== filter.priority) {
        return false;
      }

      if (filter.dueDate && entry.due !== filter.dueDate) {
        return false;
      }

      return true;
    });

    return sortByFilter(filtered, filter.sortBy);
  }
}
