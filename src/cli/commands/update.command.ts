import type { Command } from 'commander';
import { updateHandler } from '../handlers/update.handler.js';
import { jsonOption } from '../options/json.option.js';
import { addTaskOptions } from '../options/task-options.js';

export function registerUpdateCommand(program: Command): void {
  const command = program
    .command('update <ids...>')
    .description('タスクを更新')
    .option('--title <text>', 'タイトル')
    .option('--body <text>', '本文')
    .option('--body-file <file>', '本文ファイル')
    .addOption(jsonOption)
    .action(updateHandler);

  addTaskOptions(command);
}
