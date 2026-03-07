import {
  DEFAULT_TASK_PRIORITY,
  DEFAULT_TASK_STATUS,
  TASK_PRIORITIES,
  TASK_STATUSES,
} from '../../domain/constants.js';
import { ValidationError } from '../../domain/errors.js';
import type { TaskPriority, TaskStatus } from '../../domain/types.js';
import { toJson } from '../../util/format.js';
import { createCliContext } from '../context.js';
import { editTemporaryFile, resolveEditor } from './editor.util.js';
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

interface DraftTaskValues {
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
}

function createTaskDraft(options: CreateOptions): string {
  return [
    '# New task',
    `Status: ${options.status ?? DEFAULT_TASK_STATUS}`,
    `Priority: ${options.priority ?? DEFAULT_TASK_PRIORITY}`,
    '',
    'Write the task description here.',
    '',
  ].join('\n');
}

function parseTaskDraft(content: string): DraftTaskValues {
  const normalized = content.replace(/\r\n/g, '\n').trimEnd();
  const lines = normalized.split('\n');
  const titleLine = lines[0]?.trim() ?? '';
  const statusLine = lines[1]?.trim() ?? '';
  const priorityLine = lines[2]?.trim() ?? '';
  const description = lines.slice(4).join('\n').trim();

  const title = titleLine.replace(/^#\s*/, '').trim();
  if (!title) {
    throw new ValidationError('タイトルを入力してください。');
  }

  const status = statusLine.replace(/^Status:\s*/i, '').trim() as TaskStatus;
  if (!TASK_STATUSES.includes(status)) {
    throw new ValidationError(`不正な status です: ${status}`);
  }

  const priority = priorityLine
    .replace(/^Priority:\s*/i, '')
    .trim() as TaskPriority;
  if (!TASK_PRIORITIES.includes(priority)) {
    throw new ValidationError(`不正な priority です: ${priority}`);
  }

  return {
    title,
    description: description || undefined,
    status,
    priority,
  };
}

export async function createHandler(
  title: string | undefined,
  options: CreateOptions
): Promise<void> {
  const context = createCliContext();
  const t = await getTranslator(context);
  const mixId = options.mix ? parseSingleId(options.mix) : undefined;

  const projectSlug = mixId
    ? await resolveMixProjectById(context, mixId, options.proj)
    : await resolveProjectSlug(context, options.proj);

  let nextTitle = title;
  let body = await resolveBody(context, options);
  let status = options.status;
  let priority = options.priority;

  if (!nextTitle || nextTitle === 'new') {
    const config = await context.configRepository.load();
    const editor = resolveEditor(config);
    const draft = await editTemporaryFile(
      editor,
      'task-draft.md',
      createTaskDraft(options),
      t('editorExitedAbnormally')
    );
    const parsed = parseTaskDraft(draft);
    nextTitle = parsed.title;
    body = parsed.description;
    status = parsed.status;
    priority = parsed.priority;
  }

  const task = await context.taskService.create({
    projectSlug,
    title: nextTitle,
    description: body,
    status,
    priority,
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
