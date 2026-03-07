import type { Command } from 'commander';
import { changeStatusHandler } from '../handlers/status.handler.js';
import { jsonOption } from '../options/json.option.js';
import { projectOption } from '../options/project.option.js';

function register(
  program: Command,
  name: 'order' | 'prep' | 'cook' | 'serve'
): void {
  program
    .command(`${name} <ids...>`)
    .description(`task status -> ${name}`)
    .addOption(projectOption)
    .addOption(jsonOption)
    .action(async (ids: string[], options: { proj?: string; json?: boolean }) =>
      changeStatusHandler(name, ids, options)
    );
}

export function registerStatusCommands(program: Command): void {
  register(program, 'order');
  register(program, 'prep');
  register(program, 'cook');
  register(program, 'serve');
}
