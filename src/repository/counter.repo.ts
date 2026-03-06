import { promises as fs } from 'node:fs';
import type { Counter } from '../domain/types.js';
import { atomicWriteFile } from '../util/fs.js';
import { getCounterPath } from '../util/path.js';

const INITIAL_COUNTER: Counter = {
  task: 0,
  mix: 0,
  project: 0,
};

export interface CounterRepository {
  load(): Promise<Counter>;
  save(counter: Counter): Promise<void>;
  next(kind: keyof Counter): Promise<number>;
}

export class FileCounterRepository implements CounterRepository {
  private readonly startDir?: string;

  constructor(startDir?: string) {
    this.startDir = startDir;
  }

  async load(): Promise<Counter> {
    const counterPath = getCounterPath(this.startDir);

    try {
      const raw = await fs.readFile(counterPath, 'utf-8');
      return JSON.parse(raw) as Counter;
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return INITIAL_COUNTER;
      }

      throw error;
    }
  }

  async save(counter: Counter): Promise<void> {
    const counterPath = getCounterPath(this.startDir);
    await atomicWriteFile(counterPath, `${JSON.stringify(counter, null, 2)}\n`);
  }

  async next(kind: keyof Counter): Promise<number> {
    const counter = await this.load();
    const nextValue = counter[kind] + 1;
    await this.save({ ...counter, [kind]: nextValue });
    return nextValue;
  }
}
