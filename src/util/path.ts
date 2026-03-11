import { existsSync, promises as fs } from 'node:fs';
import path from 'node:path';
import { ConfigError } from '../domain/errors.js';

const TCK_DIR = '.tck';
const CONFIG_FILE = 'tck.config.json';

export function getWorkingDir(): string {
  return process.cwd();
}

export function findProjectRoot(
  startDir: string = getWorkingDir()
): string | null {
  let currentDir = path.resolve(startDir);

  while (true) {
    const hasConfig = existsSync(path.join(currentDir, CONFIG_FILE));
    const hasTckDir = existsSync(path.join(currentDir, TCK_DIR));

    if (hasConfig || hasTckDir) {
      return currentDir;
    }

    const parent = path.dirname(currentDir);
    if (parent === currentDir) {
      return null;
    }

    currentDir = parent;
  }
}

export function getProjectRoot(startDir?: string): string {
  const root = findProjectRoot(startDir);

  if (!root) {
    throw new ConfigError('tck.config.json または .tck/ が見つかりません。');
  }

  return root;
}

export function getTckDir(startDir?: string): string {
  return path.join(getProjectRoot(startDir), TCK_DIR);
}

export function getCounterPath(startDir?: string): string {
  return path.join(getTckDir(startDir), 'counter.json');
}

export function getIndexPath(startDir?: string): string {
  return path.join(getTckDir(startDir), 'index.json');
}

export function getActivityLogPath(startDir?: string): string {
  return path.join(getTckDir(startDir), 'activity.log');
}

export function getConfigPath(startDir?: string): string {
  return path.join(getProjectRoot(startDir), CONFIG_FILE);
}

export function getProjectsDir(startDir?: string): string {
  return path.join(getProjectRoot(startDir), 'projects');
}

export function getProjectDir(slug: string, startDir?: string): string {
  return path.join(getProjectsDir(startDir), slug);
}

export function getTaskFile(
  slug: string,
  id: number,
  startDir?: string
): string {
  return path.join(getProjectDir(slug, startDir), `task-${id}.md`);
}

const TASK_FILE_PATTERNS = [/^task-(\d+)(?:-.+)?\.md$/, /^t(\d+)(?:-.+)?\.md$/];

export function isTaskFileName(name: string): boolean {
  return getTaskIdFromFileName(name) !== null;
}

export function getTaskIdFromFileName(name: string): number | null {
  for (const pattern of TASK_FILE_PATTERNS) {
    const match = name.match(pattern);
    if (match) {
      return Number(match[1]);
    }
  }

  return null;
}

export async function resolveTaskFile(
  slug: string,
  id: number,
  startDir?: string
): Promise<string> {
  const projectDir = getProjectDir(slug, startDir);
  const canonicalPath = getTaskFile(slug, id, startDir);

  try {
    const names = await fs.readdir(projectDir);
    const matches = names
      .filter((name) => getTaskIdFromFileName(name) === id)
      .sort((a, b) => {
        const canonicalName = `task-${id}.md`;

        if (a === canonicalName) {
          return -1;
        }

        if (b === canonicalName) {
          return 1;
        }

        return a.localeCompare(b);
      });

    if (matches.length > 0) {
      return path.join(projectDir, matches[0]);
    }
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw error;
    }
  }

  return canonicalPath;
}

export function toProjectRelativePath(
  filePath: string,
  startDir?: string
): string {
  return path
    .relative(getProjectRoot(startDir), filePath)
    .replaceAll(path.sep, '/');
}

export function getMixFile(
  slug: string,
  id: number,
  startDir?: string
): string {
  return path.join(getProjectDir(slug, startDir), `mix-${id}.md`);
}

export function getProjectFile(slug: string, startDir?: string): string {
  return path.join(getProjectDir(slug, startDir), 'project.md');
}
