import path from 'node:path';
import { NotFoundError } from '../../domain/errors.js';
import { getProjectRoot } from '../../util/path.js';
import { createCliContext } from '../context.js';
import { resolveEditor, runEditor } from './editor.util.js';
import {
  getTranslator,
  parseSingleId,
  resolveTaskProjectById,
} from './shared.js';

export async function editHandler(idInput: string): Promise<void> {
  const context = createCliContext();
  const t = await getTranslator(context);
  const id = parseSingleId(idInput);
  const projectSlug = await resolveTaskProjectById(context, id);
  const task = await context.taskRepository.findById(projectSlug, id);
  if (!task) {
    throw new NotFoundError('task', id);
  }
  if (!task.path) {
    throw new NotFoundError('task', id);
  }
  const filePath = path.join(getProjectRoot(), task.path);
  const config = await context.configRepository.load();
  const editor = resolveEditor(config);
  await runEditor(editor, filePath, t('editorExitedAbnormally'));
}
