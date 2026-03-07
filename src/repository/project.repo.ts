import { promises as fs } from 'node:fs';
import type { Project } from '../domain/types.js';
import { formatProjectFile, parseProjectFile } from '../parser/project-file.js';
import { atomicWriteFile } from '../util/fs.js';
import { getProjectFile, getProjectsDir } from '../util/path.js';

export interface ProjectRepository {
  findBySlug(slug: string): Promise<Project | null>;
  findAll(): Promise<Project[]>;
  save(project: Project): Promise<void>;
  remove(slug: string): Promise<void>;
}

function toProject(slug: string, raw: string): Project {
  const parsed = parseProjectFile(raw);

  return {
    slug,
    name: parsed.metadata.Name ?? slug,
    overview: parsed.body.replace(/\n$/, ''),
  };
}

function toProjectFile(project: Project): string {
  return formatProjectFile({
    metadata: {
      Slug: project.slug,
      Name: project.name,
    },
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
