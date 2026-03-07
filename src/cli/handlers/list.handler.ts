import type { TaskPriority, TaskStatus } from '../../domain/types.js';
import { formatTable, toJson } from '../../util/format.js';
import { createCliContext } from '../context.js';

export interface ListOptions {
  status?: TaskStatus;
  priority?: TaskPriority;
  proj?: string;
  due?: string;
  sort?: 'status' | 'priority' | 'due' | 'created' | 'updated';
  json?: boolean;
}

export async function listHandler(options: ListOptions): Promise<void> {
  const context = createCliContext();
  const entries = await context.taskService.list({
    status: options.status,
    priority: options.priority,
    projectSlug: options.proj,
    dueDate: options.due,
    sortBy: options.sort,
  });

  if (options.json) {
    console.log(toJson(entries));
    return;
  }

  const table = formatTable(
    ['ID', 'Project', 'Status', 'Priority', 'Due', 'Title'],
    entries.map((entry) => [
      entry.id,
      entry.project,
      entry.status,
      entry.priority,
      entry.due,
      entry.title,
    ])
  );
  console.log(table);
}
