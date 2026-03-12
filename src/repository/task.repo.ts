import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { Task, TaskPriority, TaskStatus } from '../domain/types.js';
import { formatIssueFile, parseIssueFile } from '../parser/issue-file.js';
import { atomicWriteFile } from '../util/fs.js';
import {
  generateTaskFileName,
  getProjectDir,
  isTaskFileName,
  toProjectRelativePath,
} from '../util/path.js';

export interface TaskRepository {
  findById(projectSlug: string, id: number): Promise<Task | null>;
  findAll(projectSlug: string): Promise<Task[]>;
  save(task: Task): Promise<void>;
  remove(projectSlug: string, id: number): Promise<void>;
  resolvePath(projectSlug: string, id: number): Promise<string | null>;
}

function toStr(v: unknown, fallback = ''): string {
  if (v == null) return fallback;
  if (typeof v === 'string') return v;
  if (typeof v === 'number' || typeof v === 'boolean') return String(v);
  return fallback;
}

function yamlDateToString(v: unknown): string | undefined {
  if (!v) return undefined;
  if (v instanceof Date) return v.toISOString().replace('Z', '');
  if (typeof v === 'string') return v;
  if (typeof v === 'number') return String(v);
  return undefined;
}

function toTask(projectSlug: string, raw: string, filePath?: string): Task {
  const parsed = parseIssueFile(raw);
  const m = parsed.metadata;
  const id = Number(m.id ?? 0);

  const linkedRaw = m.linkedIssueIds;
  const linkedIssueIds = Array.isArray(linkedRaw) ? linkedRaw.map(Number) : [];

  return {
    id,
    projectSlug,
    path: filePath,
    title: toStr(m.title),
    description: parsed.body || undefined,
    status: toStr(m.status, 'order') as TaskStatus,
    priority: toStr(m.priority, 'medium') as TaskPriority,
    dueDate: yamlDateToString(m.dueDate),
    subtasks: parsed.subtasks,
    linkedIssueIds,
    created: yamlDateToString(m.created),
    updated: yamlDateToString(m.updated),
    aliases: Array.isArray(m.aliases)
      ? m.aliases.map((a) => toStr(a))
      : undefined,
  };
}

function toIssueFile(task: Task): string {
  const metadata: Record<string, unknown> = {
    id: task.id,
    title: task.title,
    status: task.status,
    priority: task.priority,
  };

  if (task.dueDate) {
    metadata.dueDate = task.dueDate;
  }

  metadata.linkedIssueIds = task.linkedIssueIds;

  if (task.created) metadata.created = task.created;
  if (task.updated) metadata.updated = task.updated;
  if (task.aliases) metadata.aliases = task.aliases;

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
    const dir = getProjectDir(projectSlug, this.startDir);

    try {
      const names = await fs.readdir(dir);
      for (const name of names) {
        if (!isTaskFileName(name)) continue;
        const filePath = path.join(dir, name);
        const raw = await fs.readFile(filePath, 'utf-8');
        const parsed = parseIssueFile(raw);
        if (Number(parsed.metadata.id) === id) {
          return toTask(
            projectSlug,
            raw,
            toProjectRelativePath(filePath, this.startDir)
          );
        }
      }
      return null;
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
          .filter((name) => isTaskFileName(name))
          .map(async (name) => {
            const filePath = path.join(dir, name);
            const raw = await fs.readFile(filePath, 'utf-8');
            return toTask(
              projectSlug,
              raw,
              toProjectRelativePath(filePath, this.startDir)
            );
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
    let filePath: string;

    if (task.path) {
      const root = (await import('../util/path.js')).getProjectRoot(
        this.startDir
      );
      filePath = path.join(root, task.path);
    } else {
      const dir = getProjectDir(task.projectSlug, this.startDir);
      await fs.mkdir(dir, { recursive: true });
      filePath = path.join(dir, generateTaskFileName());
    }

    await atomicWriteFile(filePath, `${toIssueFile(task)}\n`);
  }

  async remove(projectSlug: string, id: number): Promise<void> {
    const dir = getProjectDir(projectSlug, this.startDir);

    try {
      const names = await fs.readdir(dir);
      for (const name of names) {
        if (!isTaskFileName(name)) continue;
        const filePath = path.join(dir, name);
        const raw = await fs.readFile(filePath, 'utf-8');
        const parsed = parseIssueFile(raw);
        if (Number(parsed.metadata.id) === id) {
          await fs.rm(filePath, { force: true });
          return;
        }
      }
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        throw error;
      }
    }
  }

  async resolvePath(projectSlug: string, id: number): Promise<string | null> {
    const dir = getProjectDir(projectSlug, this.startDir);

    try {
      const names = await fs.readdir(dir);
      for (const name of names) {
        if (!isTaskFileName(name)) continue;
        const filePath = path.join(dir, name);
        const raw = await fs.readFile(filePath, 'utf-8');
        const parsed = parseIssueFile(raw);
        if (Number(parsed.metadata.id) === id) {
          return toProjectRelativePath(filePath, this.startDir);
        }
      }
      return null;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }
      throw error;
    }
  }
}
