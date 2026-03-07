import { toJson } from '../../util/format.js';
import { createCliContext } from '../context.js';
import {
  getTranslator,
  parseSingleId,
  requireForce,
  resolveTaskProjectById,
} from './shared.js';

export interface DeleteOptions {
  force?: boolean;
  proj?: string;
  json?: boolean;
}

export async function deleteHandler(
  idInput: string,
  options: DeleteOptions
): Promise<void> {
  const context = createCliContext();
  const t = await getTranslator(context);
  await requireForce(context, options.force);
  const id = parseSingleId(idInput);
  const projectSlug = await resolveTaskProjectById(context, id, options.proj);
  await context.taskService.delete(projectSlug, id);
  await context.activityService.log({
    type: 'task_delete',
    projectId: projectSlug,
    taskId: id,
    text: t('activityTaskDeleted', { id }),
  });

  if (options.json) {
    console.log(toJson({ ok: true, id, project: projectSlug }));
    return;
  }

  console.log(t('taskDeleted', { id }));
}
