import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { ValidationError } from '../../domain/errors.js';
import type { TckConfig } from '../../domain/types.js';

export function resolveEditor(config: TckConfig | null): string {
  return process.env.EDITOR ?? config?.editor ?? 'vi';
}

export function runEditor(
  editor: string,
  filePath: string,
  editorExitedAbnormallyMessage: string
): Promise<void> {
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

      reject(
        new ValidationError(
          editorExitedAbnormallyMessage.replace('{code}', String(code ?? -1))
        )
      );
    });
  });
}

export async function editTemporaryFile(
  editor: string,
  fileName: string,
  initialContent: string,
  editorExitedAbnormallyMessage: string
): Promise<string> {
  const tempDir = await mkdtemp(path.join(tmpdir(), 'tck-editor-'));
  const filePath = path.join(tempDir, fileName);

  try {
    await writeFile(filePath, initialContent, 'utf8');
    await runEditor(editor, filePath, editorExitedAbnormallyMessage);
    return await readFile(filePath, 'utf8');
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}
