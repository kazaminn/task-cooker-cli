import { ValidationError } from '../../domain/errors.js';
import type { MixStatus } from '../../domain/types.js';
import { formatTable, toJson } from '../../util/format.js';
import { createCliContext } from '../context.js';
import type { CliContext } from '../context.js';
import {
  getTranslator,
  parseSingleId,
  requireForce,
  resolveBody,
  resolveMixProjectById,
  resolveProjectSlug,
} from './shared.js';

export interface MixCreateOptions {
  proj?: string;
  title?: string;
  body?: string;
  bodyFile?: string;
  json?: boolean;
}

export interface MixListOptions {
  proj?: string;
  status?: MixStatus;
  json?: boolean;
}

export interface MixViewOptions {
  proj?: string;
  json?: boolean;
}

export interface MixEditOptions {
  proj?: string;
  title?: string;
  body?: string;
  bodyFile?: string;
  json?: boolean;
}

export interface MixCommentOptions {
  proj?: string;
  body?: string;
  bodyFile?: string;
  json?: boolean;
}

export interface MixDeleteOptions {
  proj?: string;
  force?: boolean;
  json?: boolean;
}

async function resolveActorName(context: CliContext): Promise<string> {
  const config = await context.configRepository.load();
  return config?.user.name ?? 'codex';
}

export async function mixCreateHandler(
  options: MixCreateOptions
): Promise<void> {
  const context = createCliContext();
  const t = await getTranslator(context);
  const projectSlug = await resolveProjectSlug(context, options.proj);
  const body = await resolveBody(context, options);
  const actor = await resolveActorName(context);

  const mix = await context.mixService.create({
    projectSlug,
    title: options.title ?? 'Untitled mix',
  });

  if (body) {
    await context.mixService.addComment(mix.id, projectSlug, {
      author: actor,
      body,
    });
  }

  await context.activityService.log({
    type: 'mix_create',
    projectId: projectSlug,
    mixId: mix.id,
    text: t('activityMixCreated', { title: mix.title }),
  });

  if (options.json) {
    const loaded = await context.mixService.getById(mix.id, projectSlug);
    console.log(toJson(loaded));
    return;
  }

  console.log(t('mixCreated', { id: mix.id, title: mix.title }));
}

export async function mixListHandler(options: MixListOptions): Promise<void> {
  const context = createCliContext();
  const mixes = await context.mixService.list({
    projectSlug: options.proj,
    status: options.status,
  });

  if (options.json) {
    console.log(toJson(mixes));
    return;
  }

  console.log(
    formatTable(
      ['ID', 'Project', 'Status', 'Title'],
      mixes.map((mix) => [mix.id, mix.projectSlug, mix.status, mix.title])
    )
  );
}

export async function mixViewHandler(
  idInput: string,
  options: MixViewOptions
): Promise<void> {
  const context = createCliContext();
  const id = parseSingleId(idInput);
  const projectSlug = await resolveMixProjectById(context, id, options.proj);
  const mix = await context.mixService.getById(id, projectSlug);

  if (options.json) {
    console.log(toJson(mix));
    return;
  }

  console.log(`Id: ${mix.id}`);
  console.log(`Project: ${mix.projectSlug}`);
  console.log(`Title: ${mix.title}`);
  console.log(`Status: ${mix.status}`);
  if (mix.comments.length > 0) {
    console.log('');
  }
  mix.comments.forEach((comment, index) => {
    console.log(`@${comment.author} ${comment.timestamp}`);
    console.log(comment.body);
    if (index < mix.comments.length - 1) {
      console.log('');
    }
  });
}

export async function mixEditHandler(
  idInput: string,
  options: MixEditOptions
): Promise<void> {
  const context = createCliContext();
  const t = await getTranslator(context);
  const id = parseSingleId(idInput);
  const body = await resolveBody(context, options);
  const projectSlug = await resolveMixProjectById(context, id, options.proj);

  let mix = await context.mixService.getById(id, projectSlug);
  if (options.title) {
    mix = await context.mixService.update(id, {
      projectSlug,
      title: options.title,
    });
  }

  if (body) {
    const actor = await resolveActorName(context);
    mix = await context.mixService.addComment(id, projectSlug, {
      author: actor,
      body,
    });
    await context.activityService.log({
      type: 'mix_post_create',
      projectId: projectSlug,
      mixId: id,
      text: t('activityMixCommentAdded', { actor }),
    });
  }

  if (options.json) {
    console.log(toJson(mix));
    return;
  }

  console.log(t('mixUpdated', { id: mix.id }));
}

async function mixChangeStatusHandler(
  idInput: string,
  status: MixStatus,
  options: MixViewOptions
): Promise<void> {
  const context = createCliContext();
  const t = await getTranslator(context);
  const id = parseSingleId(idInput);
  const projectSlug = await resolveMixProjectById(context, id, options.proj);
  const mix =
    status === 'closed'
      ? await context.mixService.close(id, projectSlug)
      : await context.mixService.reopen(id, projectSlug);

  if (options.json) {
    console.log(toJson(mix));
    return;
  }

  console.log(t('mixUpdated', { id: mix.id }));
}

export async function mixCloseHandler(
  idInput: string,
  options: MixViewOptions
): Promise<void> {
  return mixChangeStatusHandler(idInput, 'closed', options);
}

export async function mixReopenHandler(
  idInput: string,
  options: MixViewOptions
): Promise<void> {
  return mixChangeStatusHandler(idInput, 'open', options);
}

export async function mixCommentHandler(
  idInput: string,
  options: MixCommentOptions
): Promise<void> {
  const context = createCliContext();
  const t = await getTranslator(context);
  const id = parseSingleId(idInput);
  const body = await resolveBody(context, options);
  if (!body) {
    throw new ValidationError(t('mixCommentBodyRequired'));
  }

  const actor = await resolveActorName(context);
  const projectSlug = await resolveMixProjectById(context, id, options.proj);
  const mix = await context.mixService.addComment(id, projectSlug, {
    author: actor,
    body,
  });

  await context.activityService.log({
    type: 'mix_post_create',
    projectId: projectSlug,
    mixId: id,
    text: t('activityMixCommentAdded', { actor }),
  });

  if (options.json) {
    console.log(toJson(mix));
    return;
  }

  console.log(t('mixUpdated', { id: mix.id }));
}

export async function mixDeleteHandler(
  idInput: string,
  options: MixDeleteOptions
): Promise<void> {
  const context = createCliContext();
  const t = await getTranslator(context);
  await requireForce(context, options.force);
  const id = parseSingleId(idInput);
  const projectSlug = await resolveMixProjectById(context, id, options.proj);
  await context.mixService.delete(projectSlug, id);
  await context.activityService.log({
    type: 'mix_delete',
    projectId: projectSlug,
    mixId: id,
    text: t('activityMixDeleted', { id }),
  });

  if (options.json) {
    console.log(toJson({ ok: true, id, project: projectSlug }));
    return;
  }

  console.log(t('mixDeleted', { id }));
}
