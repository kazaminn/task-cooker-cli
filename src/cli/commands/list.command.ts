import { type Command, Option } from 'commander';
import { listHandler } from '../handlers/list.handler.js';
import { jsonOption } from '../options/json.option.js';
import { addTaskOptions } from '../options/task-options.js';

const sortOption = new Option('--sort <key>', 'ソートキー').choices([
  'status',
  'priority',
  'due',
  'created',
  'updated',
]);

export function registerListCommand(program: Command): void {
  const command = program
    .command('list')
    .description('タスク一覧')
    .option('--due <date>', '期限日')
    .addOption(sortOption)
    .addOption(jsonOption)
    .action(listHandler);

  addTaskOptions(command);
}
