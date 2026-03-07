import type { Command } from 'commander';
import { rebuildHandler } from '../handlers/rebuild.handler.js';

export function registerRebuildCommand(program: Command): void {
  program
    .command('rebuild')
    .description('index を再構築')
    .action(rebuildHandler);
}
