import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { Task, TaskPriority, TaskStatus } from '../domain/types.js';
import { formatIssueFile, parseIssueFile } from '../parser/issue-file.js';
import { atomicWriteFile } from '../util/fs.js';
import { getProjectDir, getTaskFile } from '../util/path.js';

export interface TaskRepository {
  findById(projectSlug: string, id: number): Promise<Task | null>;
  findAll(projectSlug: string): Promise<Task[]>;
  save(task: Task): Promise<void>;
  remove(projectSlug: string, id: number): Promise<void>;
}

function parseCsvNumbers(value?: string): number[] {
  if (!value) {
    return [];
  }

  return value
    .split(',')
    .map((entry) => Number(entry.trim()))
    .filter((n) => Number.isFinite(n));
}

function toTask(projectSlug: string, raw: string): Task {
  const parsed = parseIssueFile(raw);
  const id = Number(parsed.metadata.Id ?? '0');

  return {
    id,
    projectSlug,
    title: parsed.metadata.Title ?? '',
    description: parsed.body.replace(/\n$/, '') || undefined,
    status: (parsed.metadata.Status ?? 'order') as TaskStatus,
    priority: (parsed.metadata.Priority ?? 'medium') as TaskPriority,
    dueDate: parsed.metadata.Due || undefined,
    subtasks: parsed.subtasks,
    linkedIssueIds: parseCsvNumbers(parsed.metadata.Linked),
  };
}

function toIssueFile(task: Task): string {
  const metadata: Record<string, string> = {
    Id: String(task.id),
    Project: task.projectSlug,
    Title: task.title,
    Status: task.status,
    Priority: task.priority,
  };

  if (task.dueDate) {
    metadata.Due = task.dueDate;
  }

  if (task.linkedIssueIds.length > 0) {
    metadata.Linked = task.linkedIssueIds.join(', ');
  }

  return formatIssueFile({
    metadata,
    subtasks: task.subtasks,
    body: task.description ?? '',
  });
}

export class FileTaskRepository implements TaskRepository {
  private readonly startDir?: string;

  constructor(startDir?: string) {
    this.startDir = startDir;
  }

  async findById(projectSlug: string, id: number): Promise<Task | null> {
    const filePath = getTaskFile(projectSlug, id, this.startDir);

    try {
      const raw = await fs.readFile(filePath, 'utf-8');
      return toTask(projectSlug, raw);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }

      throw error;
    }
  }

  async findAll(projectSlug: string): Promise<Task[]> {
    const dir = getProjectDir(projectSlug, this.startDir);

    try {
      const files = await fs.readdir(dir);
      const tasks = await Promise.all(
        files
          .filter((name) => /^task-\d+\.md$/.test(name))
          .map(async (name) => {
            const raw = await fs.readFile(path.join(dir, name), 'utf-8');
            return toTask(projectSlug, raw);
          })
      );

      return tasks.sort((a, b) => a.id - b.id);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }

      throw error;
    }
  }

  async save(task: Task): Promise<void> {
    const filePath = getTaskFile(task.projectSlug, task.id, this.startDir);
    await atomicWriteFile(filePath, `${toIssueFile(task)}\n`);
  }

  async remove(projectSlug: string, id: number): Promise<void> {
    const filePath = getTaskFile(projectSlug, id, this.startDir);
    await fs.rm(filePath, { force: true });
  }
}
