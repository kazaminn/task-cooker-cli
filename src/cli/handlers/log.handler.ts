import type { ActivityType } from '../../domain/types.js';
import { formatTable, toJson } from '../../util/format.js';
import { createCliContext } from '../context.js';

export interface LogOptions {
  proj?: string;
  type?: ActivityType;
  json?: boolean;
}

export async function logHandler(options: LogOptions): Promise<void> {
  const context = createCliContext();
  const entries = await context.activityService.getLog({
    projectId: options.proj,
    type: options.type,
  });

  if (options.json) {
    console.log(toJson(entries));
    return;
  }

  const table = formatTable(
    ['Time', 'Type', 'Project', 'Text'],
    entries.map((entry) => [
      entry.time,
      entry.type,
      entry.projectId,
      entry.text.replaceAll('\n', ' '),
    ])
  );

  console.log(table);
}
