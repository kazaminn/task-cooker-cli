import { ValidationError } from '../../domain/errors.js';
import type { TaskPriority, TaskStatus } from '../../domain/types.js';
import { toJson } from '../../util/format.js';
import { createCliContext } from '../context.js';
import {
  getTranslator,
  parseIds,
  resolveBody,
  resolveTaskProjectById,
} from './shared.js';

export interface UpdateOptions {
  title?: string;
  body?: string;
  bodyFile?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  proj?: string;
  json?: boolean;
}

export async function updateHandler(
  idInputs: string[],
  options: UpdateOptions
): Promise<void> {
  const context = createCliContext();
  const t = await getTranslator(context);
  const ids = parseIds(idInputs);
  const body = await resolveBody(context, options);

  const resolvedProjects = await Promise.all(
    ids.map((id) => resolveTaskProjectById(context, id, options.proj))
  );
  const projectSlug = resolvedProjects[0];
  if (!resolvedProjects.every((slug) => slug === projectSlug)) {
    throw new ValidationError(t('multiProjectTaskUpdate'));
  }

  const tasks = await context.taskService.update(ids, {
    projectSlug,
    title: options.title,
    description: body,
    status: options.status,
    priority: options.priority,
  });

  await Promise.all(
    tasks.map(async (task) =>
      context.activityService.log({
        type: 'task_update',
        projectId: task.projectSlug,
        taskId: task.id,
        text: t('activityTaskUpdated', { title: task.title }),
      })
    )
  );

  if (options.json) {
    console.log(toJson(tasks));
    return;
  }

  tasks.forEach((task) => {
    console.log(t('taskUpdated', { id: task.id }));
  });
}
