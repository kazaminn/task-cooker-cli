import { promises as fs } from 'node:fs';
import type { Project, ProjectStatus } from '../domain/types.js';
import { formatProjectFile, parseProjectFile } from '../parser/project-file.js';
import { atomicWriteFile } from '../util/fs.js';
import { getProjectFile, getProjectsDir } from '../util/path.js';

export interface ProjectRepository {
  findBySlug(slug: string): Promise<Project | null>;
  findAll(): Promise<Project[]>;
  save(project: Project): Promise<void>;
  remove(slug: string): Promise<void>;
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

function toProject(slug: string, raw: string): Project {
  const parsed = parseProjectFile(raw);
  const m = parsed.metadata;

  return {
    slug: toStr(m.slug, slug),
    name: toStr(m.name, slug),
    status: (m.status ? toStr(m.status) : undefined) as
      | ProjectStatus
      | undefined,
    overview: parsed.body,
    created: yamlDateToString(m.created),
    updated: yamlDateToString(m.updated),
    aliases: Array.isArray(m.aliases)
      ? m.aliases.map((a) => toStr(a))
      : undefined,
  };
}

function toProjectFile(project: Project): string {
  const metadata: Record<string, unknown> = {
    slug: project.slug,
    name: project.name,
  };

  if (project.status) metadata.status = project.status;
  if (project.created) metadata.created = project.created;
  if (project.updated) metadata.updated = project.updated;
  metadata.aliases = project.aliases ?? [];

  return formatProjectFile({
    metadata,
    body: project.overview,
  });
}

export class FileProjectRepository implements ProjectRepository {
  private readonly startDir?: string;

  constructor(startDir?: string) {
    this.startDir = startDir;
  }

  async findBySlug(slug: string): Promise<Project | null> {
    const filePath = getProjectFile(slug, this.startDir);

    try {
      const raw = await fs.readFile(filePath, 'utf-8');
      return toProject(slug, raw);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }

      throw error;
    }
  }

  async findAll(): Promise<Project[]> {
    const projectsDir = getProjectsDir(this.startDir);

    try {
      const entries = await fs.readdir(projectsDir, { withFileTypes: true });
      const slugs = entries
        .filter((entry) => entry.isDirectory())
        .map((entry) => entry.name);
      const projects = await Promise.all(
        slugs.map((slug) => this.findBySlug(slug))
      );
      return projects.filter((project): project is Project => project !== null);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }

      throw error;
    }
  }

  async save(project: Project): Promise<void> {
    const filePath = getProjectFile(project.slug, this.startDir);
    await atomicWriteFile(filePath, `${toProjectFile(project)}\n`);
  }

  async remove(slug: string): Promise<void> {
    const projectFile = getProjectFile(slug, this.startDir);
    await fs.rm(projectFile, { force: true });
  }
}
