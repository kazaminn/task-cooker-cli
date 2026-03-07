import type { Command } from 'commander';
import {
  configGetHandler,
  configSetHandler,
} from '../handlers/config.handler.js';

export function registerConfigCommand(program: Command): void {
  const config = program.command('config').description('設定');

  config
    .command('get [key]')
    .description('設定を取得')
    .action(configGetHandler);
  config
    .command('set <key> <value>')
    .description('設定を更新')
    .action(configSetHandler);
}
