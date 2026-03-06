import { existsSync } from 'node:fs';
import path from 'node:path';
import { ConfigError } from '../domain/errors.js';

const TCK_DIR = '.tck';
const CONFIG_FILE = 'tck.config.json';

export function findProjectRoot(
  startDir: string = process.cwd()
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
