import type { Command } from 'commander';
import {
  projectCreateHandler,
  projectDeleteHandler,
  projectListHandler,
  projectViewHandler,
} from '../handlers/project.handler.js';
import { jsonOption } from '../options/json.option.js';

export function registerProjectCommand(program: Command): void {
  const project = program.command('project').description('プロジェクト操作');

  project.command('list').addOption(jsonOption).action(projectListHandler);
  project
    .command('create <name>')
    .option('--slug <slug>', 'slug')
    .addOption(jsonOption)
    .action(projectCreateHandler);
  project
    .command('view <slug>')
    .addOption(jsonOption)
    .action(projectViewHandler);
  project
    .command('delete <slug>')
    .option('--force', '削除を強制実行')
    .addOption(jsonOption)
    .action(projectDeleteHandler);
}
