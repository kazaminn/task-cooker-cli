import { NotFoundError } from '../../domain/errors.js';
import { toJson } from '../../util/format.js';
import { createCliContext } from '../context.js';
import { parseSingleId, resolveTaskProjectById } from './shared.js';

export interface ViewOptions {
  json?: boolean;
  proj?: string;
}

export async function viewHandler(idInput: string, options: ViewOptions) {
  const context = createCliContext();
  const id = parseSingleId(idInput);
  const projectSlug = await resolveTaskProjectById(context, id, options.proj);
  const task = await context.taskRepository.findById(projectSlug, id);

  if (!task) {
    throw new NotFoundError('task', id);
  }

  if (options.json) {
    console.log(toJson(task));
    return;
  }

  console.log(`Id: ${task.id}`);
  console.log(`Project: ${task.projectSlug}`);
  console.log(`Title: ${task.title}`);
  console.log(`Status: ${task.status}`);
  console.log(`Priority: ${task.priority}`);
  if (task.dueDate) {
    console.log(`Due: ${task.dueDate}`);
  }
  if (task.linkedIssueIds.length > 0) {
    console.log(`Linked: ${task.linkedIssueIds.join(', ')}`);
  }
  if (task.description) {
    console.log('');
    console.log(task.description);
  }
}
