import type { Command } from 'commander';
import { deleteHandler } from '../handlers/delete.handler.js';
import { jsonOption } from '../options/json.option.js';
import { projectOption } from '../options/project.option.js';

export function registerDeleteCommand(program: Command): void {
  program
    .command('delete <id>')
    .description('タスクを削除')
    .option('--force', '削除を強制実行')
    .addOption(projectOption)
    .addOption(jsonOption)
    .action(deleteHandler);
}
