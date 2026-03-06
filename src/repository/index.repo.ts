import { promises as fs } from 'node:fs';
import type { TckIndex } from '../domain/types.js';
import { atomicWriteFile } from '../util/fs.js';
import { getIndexPath } from '../util/path.js';

const EMPTY_INDEX: TckIndex = {
  tasks: [],
  mixes: [],
};

export interface IndexRepository {
  load(): Promise<TckIndex>;
  save(index: TckIndex): Promise<void>;
}

export class FileIndexRepository implements IndexRepository {
  private readonly startDir?: string;

  constructor(startDir?: string) {
    this.startDir = startDir;
  }

  async load(): Promise<TckIndex> {
    const indexPath = getIndexPath(this.startDir);

    try {
      const raw = await fs.readFile(indexPath, 'utf-8');
      return JSON.parse(raw) as TckIndex;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return EMPTY_INDEX;
      }

      throw error;
    }
  }

  async save(index: TckIndex): Promise<void> {
    const indexPath = getIndexPath(this.startDir);
    await atomicWriteFile(indexPath, `${JSON.stringify(index, null, 2)}\n`);
  }
}
