import type { Command } from 'commander';
import { initHandler } from '../handlers/init.handler.js';

export function registerInitCommand(program: Command): void {
  program.command('init').description('初期化').action(initHandler);
}
