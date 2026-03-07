import { type Command, Option } from 'commander';
import { logHandler } from '../handlers/log.handler.js';
import { jsonOption } from '../options/json.option.js';
import { projectOption } from '../options/project.option.js';

const activityTypeOption = new Option('--type <type>', 'ログ種別').choices([
  'task_create',
  'task_update',
  'task_delete',
  'mix_create',
  'mix_post_create',
  'mix_delete',
  'project_create',
  'project_update',
  'project_delete',
]);

export function registerLogCommand(program: Command): void {
  program
    .command('log')
    .description('アクティビティログを表示')
    .addOption(projectOption)
    .addOption(activityTypeOption)
    .addOption(jsonOption)
    .action(logHandler);
}
