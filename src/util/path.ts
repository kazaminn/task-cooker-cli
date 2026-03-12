import { existsSync } from 'node:fs';
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

const MIX_FILE_PATTERN = /^mix-\d+\.md$/;

export function isTaskFileName(name: string): boolean {
  return (
    name.endsWith('.md') &&
    name !== 'project.md' &&
    !MIX_FILE_PATTERN.test(name)
  );
}

export function generateTaskFileName(): string {
  const iso = new Date().toISOString(); // e.g. 2026-03-12T10:30:00.123Z
  const withMs = iso.slice(0, 23); // 2026-03-12T10:30:00.123
  const safe = withMs.replace(/:/g, '-').replace('.', '-'); // 2026-03-12T10-30-00-123
  return `${safe}.md`;
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
