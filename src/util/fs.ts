import { promises as fs } from 'node:fs';
import path from 'node:path';

export async function atomicWriteFile(
  filePath: string,
  content: string
): Promise<void> {
  const dir = path.dirname(filePath);
  const tmpPath = path.join(
    dir,
    `.${path.basename(filePath)}.${Date.now()}.${Math.random().toString(16).slice(2)}.tmp`
  );

  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(tmpPath, content, 'utf-8');
  await fs.rename(tmpPath, filePath);
}
