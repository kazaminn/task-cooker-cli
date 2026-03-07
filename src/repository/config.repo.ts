import { promises as fs } from 'node:fs';
import type { TckConfig } from '../domain/types.js';
import { atomicWriteFile } from '../util/fs.js';
import { getConfigPath } from '../util/path.js';

export interface ConfigRepository {
  load(): Promise<TckConfig | null>;
  save(config: TckConfig): Promise<void>;
}

export class FileConfigRepository implements ConfigRepository {
  private readonly startDir?: string;

  constructor(startDir?: string) {
    this.startDir = startDir;
  }

  async load(): Promise<TckConfig | null> {
    const configPath = getConfigPath(this.startDir);

    try {
      const raw = await fs.readFile(configPath, 'utf-8');
      return JSON.parse(raw) as TckConfig;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null;
      }

      throw error;
    }
  }

  async save(config: TckConfig): Promise<void> {
    const configPath = getConfigPath(this.startDir);
    await atomicWriteFile(configPath, `${JSON.stringify(config, null, 2)}\n`);
  }
}
