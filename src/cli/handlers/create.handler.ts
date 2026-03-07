import type { TaskPriority, TaskStatus } from '../../domain/types.js';
import { toJson } from '../../util/format.js';
import { createCliContext } from '../context.js';
import {
  getTranslator,
  parseSingleId,
  resolveBody,
  resolveMixProjectById,
  resolveProjectSlug,
} from './shared.js';

export interface CreateOptions {
  status?: TaskStatus;
  priority?: TaskPriority;
  proj?: string;
  mix?: string;
  body?: string;
  bodyFile?: string;
  json?: boolean;
}

export async function createHandler(
  title: string,
  options: CreateOptions
): Promise<void> {
  const context = createCliContext();
  const t = await getTranslator(context);
  const body = await resolveBody(context, options);
  const mixId = options.mix ? parseSingleId(options.mix) : undefined;

  const projectSlug = mixId
    ? await resolveMixProjectById(context, mixId, options.proj)
    : await resolveProjectSlug(context, options.proj);

  const task = await context.taskService.create({
    projectSlug,
    title,
    description: body,
    status: options.status,
    priority: options.priority,
    linkedIssueIds: mixId ? [mixId] : [],
  });

  await context.activityService.log({
    type: 'task_create',
    projectId: projectSlug,
    taskId: task.id,
    text: t('activityTaskCreated', { title: task.title }),
  });

  if (options.json) {
    console.log(toJson(task));
    return;
  }

  console.log(t('taskCreated', { id: task.id, title: task.title }));
}
