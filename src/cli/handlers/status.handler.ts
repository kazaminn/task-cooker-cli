import { ValidationError } from '../../domain/errors.js';
import type { TaskStatus } from '../../domain/types.js';
import { toJson } from '../../util/format.js';
import { createCliContext } from '../context.js';
import { getTranslator, parseIds, resolveTaskProjectById } from './shared.js';

export interface StatusOptions {
  proj?: string;
  json?: boolean;
}

export async function changeStatusHandler(
  status: TaskStatus,
  idInputs: string[],
  options: StatusOptions
): Promise<void> {
  const context = createCliContext();
  const t = await getTranslator(context);
  const ids = parseIds(idInputs);
  const resolvedProjects = await Promise.all(
    ids.map((id) => resolveTaskProjectById(context, id, options.proj))
  );
  const projectSlug = resolvedProjects[0];
  if (!resolvedProjects.every((slug) => slug === projectSlug)) {
    throw new ValidationError(
      '複数プロジェクトの task を同時更新できません。--proj で絞り込んでください。'
    );
  }

  const tasks = await context.taskService.changeStatus(
    ids,
    projectSlug,
    status
  );
  await Promise.all(
    tasks.map(async (task) =>
      context.activityService.log({
        type: 'task_update',
        projectId: task.projectSlug,
        taskId: task.id,
        text: `ステータス変更: ${task.status}`,
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
