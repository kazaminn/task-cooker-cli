import type { Command } from 'commander';
import { editHandler } from '../handlers/edit.handler.js';

export function registerEditCommand(program: Command): void {
  program.command('edit <id>').description('タスクを編集').action(editHandler);
}
