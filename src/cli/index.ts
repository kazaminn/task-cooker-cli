import { Command } from 'commander';
import { registerConfigCommand } from './commands/config.command.js';
import { registerCreateCommand } from './commands/create.command.js';
import { registerDeleteCommand } from './commands/delete.command.js';
import { registerEditCommand } from './commands/edit.command.js';
import { registerInitCommand } from './commands/init.command.js';
import { registerListCommand } from './commands/list.command.js';
import { registerLogCommand } from './commands/log.command.js';
import { registerMixCommand } from './commands/mix.command.js';
import { registerProjectCommand } from './commands/project.command.js';
import { registerRebuildCommand } from './commands/rebuild.command.js';
import { registerStatusCommands } from './commands/status.command.js';
import { registerUpdateCommand } from './commands/update.command.js';
import { registerViewCommand } from './commands/view.command.js';

export function createProgram(): Command {
  const program = new Command();
  program
    .name('tck')
    .description('TaskCooker CLI')
    .version('0.1.0')
    .showHelpAfterError();

  registerInitCommand(program);
  registerConfigCommand(program);
  registerCreateCommand(program);
  registerListCommand(program);
  registerViewCommand(program);
  registerEditCommand(program);
  registerUpdateCommand(program);
  registerDeleteCommand(program);
  registerLogCommand(program);
  registerStatusCommands(program);
  registerProjectCommand(program);
  registerMixCommand(program);
  registerRebuildCommand(program);

  return program;
}
