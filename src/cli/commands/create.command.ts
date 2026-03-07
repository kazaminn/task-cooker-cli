import type { Command } from 'commander';
import { createHandler } from '../handlers/create.handler.js';
import { jsonOption } from '../options/json.option.js';
import { addTaskOptions } from '../options/task-options.js';

export function registerCreateCommand(program: Command): void {
  const command = program
    .command('create <title>')
    .description('タスクを作成')
    .option('--mix <id>', 'ミックスに紐づけ')
    .option('--body <text>', '本文')
    .option('--body-file <file>', '本文ファイル')
    .addOption(jsonOption)
    .action(createHandler);

  addTaskOptions(command);
}
