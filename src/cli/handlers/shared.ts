import { promises as fs } from 'node:fs';
import { NotFoundError, ValidationError } from '../../domain/errors.js';
import { createTranslator } from '../../util/i18n.js';
import type { CliContext } from '../context.js';

export interface BodyInputOptions {
  body?: string;
  bodyFile?: string;
}

export async function getTranslator(context: CliContext) {
  const config = await context.configRepository.load();
  return createTranslator(config?.language ?? 'ja');
}

export async function resolveProjectSlug(
  context: CliContext,
  projectSlug?: string
): Promise<string> {
  if (projectSlug) {
    return projectSlug;
  }

  const config = await context.configRepository.load();
  if (config?.defaultProject) {
    return config.defaultProject;
  }

  const t = createTranslator(config?.language ?? 'ja');
  throw new ValidationError(t('defaultProjectRequired'));
}

export async function resolveBody(
  context: CliContext,
  options: BodyInputOptions
): Promise<string | undefined> {
  const t = await getTranslator(context);

  if (options.body && options.bodyFile) {
    throw new ValidationError(t('bodyConflict'));
  }

  if (options.bodyFile) {
    return fs.readFile(options.bodyFile, 'utf-8');
  }

  return options.body;
}

export function parseSingleId(value: string): number {
  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new ValidationError(`IDが不正です: ${value}`);
  }

  return id;
}

export function parseIds(values: string[]): number[] {
  if (values.length === 0) {
    throw new ValidationError('IDを1つ以上指定してください。');
  }

  return values.map((value) => parseSingleId(value));
}

export async function resolveTaskProjectById(
  context: CliContext,
  id: number,
  projectSlug?: string
): Promise<string> {
  if (projectSlug) {
    return projectSlug;
  }

  const index = await context.indexRepository.load();
  const entries = index.tasks.filter((entry) => entry.id === id);

  if (entries.length === 0) {
    throw new NotFoundError('task', id);
  }

  if (entries.length > 1) {
    throw new ValidationError(
      `task #${id} が複数プロジェクトで見つかりました。--proj を指定してください。`
    );
  }

  return entries[0].project;
}

export async function resolveMixProjectById(
  context: CliContext,
  id: number,
  projectSlug?: string
): Promise<string> {
  if (projectSlug) {
    return projectSlug;
  }

  const index = await context.indexRepository.load();
  const entries = index.mixes.filter((entry) => entry.id === id);

  if (entries.length === 0) {
    throw new NotFoundError('mix', id);
  }

  if (entries.length > 1) {
    throw new ValidationError(
      `mix #${id} が複数プロジェクトで見つかりました。--proj を指定してください。`
    );
  }

  return entries[0].project;
}

export async function requireForce(
  context: CliContext,
  force?: boolean
): Promise<void> {
  if (force) {
    return;
  }

  const t = await getTranslator(context);
  throw new ValidationError(t('forceRequired'));
}
