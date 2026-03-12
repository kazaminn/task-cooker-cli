import { promises as fs } from 'node:fs';
import path from 'node:path';
import type { Mix, MixComment, MixStatus } from '../domain/types.js';
import {
  formatCommentBlock,
  parseCommentBlock,
} from '../parser/comment-block.js';
import { formatIssueFile, parseIssueFile } from '../parser/issue-file.js';
import { atomicWriteFile } from '../util/fs.js';
import { getMixFile, getProjectDir } from '../util/path.js';

export interface MixRepository {
  findById(projectSlug: string, id: number): Promise<Mix | null>;
  findAll(projectSlug: string): Promise<Mix[]>;
  save(mix: Mix): Promise<void>;
  remove(projectSlug: string, id: number): Promise<void>;
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

function parseComments(body: string): MixComment[] {
  const lines = body.split('\n');
  const comments: MixComment[] = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i]?.trim();
    if (!line.startsWith('<!-- comment')) {
      continue;
    }

    const { author, timestamp } = parseCommentBlock(line);
    const bodyLines: string[] = [];
    i += 1;

    while (i < lines.length && !lines[i].trim().startsWith('<!-- comment')) {
      bodyLines.push(lines[i]);
      i += 1;
    }

    i -= 1;
    comments.push({ author, timestamp, body: bodyLines.join('\n').trim() });
  }

  return comments;
}

function formatComments(comments: MixComment[]): string {
  return comments
    .map((comment) => `${formatCommentBlock(comment)}\n${comment.body}`)
    .join('\n\n');
}

function toMix(projectSlug: string, raw: string): Mix {
  const parsed = parseIssueFile(raw);
  const m = parsed.metadata;

  return {
    id: Number(m.id ?? 0),
    projectSlug,
    title: toStr(m.title),
    status: toStr(m.status, 'open') as MixStatus,
    comments: parseComments(parsed.body),
    created: yamlDateToString(m.created),
    updated: yamlDateToString(m.updated),
    aliases: Array.isArray(m.aliases)
      ? m.aliases.map((a) => toStr(a))
      : undefined,
  };
}

function toIssueFile(mix: Mix): string {
  const metadata: Record<string, unknown> = {
    id: mix.id,
    project: mix.projectSlug,
    title: mix.title,
    status: mix.status,
  };

  if (mix.created) metadata.created = mix.created;
  if (mix.updated) metadata.updated = mix.updated;
  metadata.aliases = mix.aliases ?? [];

  return formatIssueFile({
    metadata,
    subtasks: [],
    body: formatComments(mix.comments),
  });
}

export class FileMixRepository implements MixRepository {
  private readonly startDir?: string;

  constructor(startDir?: string) {
    this.startDir = startDir;
  }

  async findById(projectSlug: string, id: number): Promise<Mix | null> {
    const filePath = getMixFile(projectSlug, id, this.startDir);

    try {
      const raw = await fs.readFile(filePath, 'utf-8');
      return toMix(projectSlug, raw);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }

      throw error;
    }
  }

  async findAll(projectSlug: string): Promise<Mix[]> {
    const dir = getProjectDir(projectSlug, this.startDir);

    try {
      const files = await fs.readdir(dir);
      const mixes = await Promise.all(
        files
          .filter((name) => /^mix-\d+\.md$/.test(name))
          .map(async (name) => {
            const raw = await fs.readFile(path.join(dir, name), 'utf-8');
            return toMix(projectSlug, raw);
          })
      );

      return mixes.sort((a, b) => a.id - b.id);
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return [];
      }

      throw error;
    }
  }

  async save(mix: Mix): Promise<void> {
    const filePath = getMixFile(mix.projectSlug, mix.id, this.startDir);
    await atomicWriteFile(filePath, `${toIssueFile(mix)}\n`);
  }

  async remove(projectSlug: string, id: number): Promise<void> {
    const filePath = getMixFile(projectSlug, id, this.startDir);
    await fs.rm(filePath, { force: true });
  }
}
