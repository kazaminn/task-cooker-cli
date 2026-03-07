import { type Command, Option } from 'commander';
import {
  mixCloseHandler,
  mixCommentHandler,
  mixCreateHandler,
  mixDeleteHandler,
  mixEditHandler,
  mixListHandler,
  mixReopenHandler,
  mixViewHandler,
} from '../handlers/mix.handler.js';
import { jsonOption } from '../options/json.option.js';
import { projectOption } from '../options/project.option.js';

const mixStatusOption = new Option('--status <status>', 'ステータス').choices([
  'open',
  'closed',
]);

export function registerMixCommand(program: Command): void {
  const mix = program.command('mix').description('ミックス操作');

  mix
    .command('create')
    .addOption(projectOption)
    .option('--title <text>', 'タイトル')
    .option('--body <text>', '本文')
    .option('--body-file <file>', '本文ファイル')
    .addOption(jsonOption)
    .action(mixCreateHandler);

  mix
    .command('list')
    .addOption(projectOption)
    .addOption(mixStatusOption)
    .addOption(jsonOption)
    .action(mixListHandler);

  mix
    .command('view <id>')
    .addOption(projectOption)
    .addOption(jsonOption)
    .action(mixViewHandler);

  mix
    .command('edit <id>')
    .addOption(projectOption)
    .option('--title <text>', 'タイトル')
    .option('--body <text>', '本文')
    .option('--body-file <file>', '本文ファイル')
    .addOption(jsonOption)
    .action(mixEditHandler);

  mix
    .command('close <id>')
    .addOption(projectOption)
    .addOption(jsonOption)
    .action(mixCloseHandler);

  mix
    .command('reopen <id>')
    .addOption(projectOption)
    .addOption(jsonOption)
    .action(mixReopenHandler);

  mix
    .command('comment <id>')
    .addOption(projectOption)
    .option('--body <text>', 'コメント本文')
    .option('--body-file <file>', 'コメント本文ファイル')
    .addOption(jsonOption)
    .action(mixCommentHandler);

  mix
    .command('delete <id>')
    .addOption(projectOption)
    .option('--force', '削除を強制実行')
    .addOption(jsonOption)
    .action(mixDeleteHandler);
}
