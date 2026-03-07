import { spawn } from 'node:child_process';
import { ValidationError } from '../../domain/errors.js';
import type { TckConfig } from '../../domain/types.js';
import { getTaskFile } from '../../util/path.js';
import { createCliContext } from '../context.js';
import { parseSingleId, resolveTaskProjectById } from './shared.js';

function runEditor(editor: string, filePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(editor, [filePath], {
      stdio: 'inherit',
      shell: true,
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new ValidationError(`エディタが異常終了しました: ${code ?? -1}`));
    });
  });
}

function resolveEditor(config: TckConfig | null): string {
  return process.env.EDITOR ?? config?.editor ?? 'vi';
}

export async function editHandler(idInput: string): Promise<void> {
  const context = createCliContext();
  const id = parseSingleId(idInput);
  const projectSlug = await resolveTaskProjectById(context, id);
  const filePath = getTaskFile(projectSlug, id);
  const config = await context.configRepository.load();
  const editor = resolveEditor(config);
  await runEditor(editor, filePath);
}
