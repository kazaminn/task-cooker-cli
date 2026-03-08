import type { Command } from 'commander';

import { interactiveHandler } from '../handlers/interactive.handler.js';

export function registerInteractiveCommand(program: Command): void {
  program
    .command('interactive')
    .alias('i')
    .description('インタラクティブモードで起動')
    .action(interactiveHandler);
}
