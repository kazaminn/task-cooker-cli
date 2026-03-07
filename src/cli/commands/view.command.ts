import type { Command } from 'commander';
import { viewHandler } from '../handlers/view.handler.js';
import { jsonOption } from '../options/json.option.js';
import { projectOption } from '../options/project.option.js';

export function registerViewCommand(program: Command): void {
  program
    .command('view <id>')
    .description('タスク詳細を表示')
    .addOption(projectOption)
    .addOption(jsonOption)
    .action(viewHandler);
}
