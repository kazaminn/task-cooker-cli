import type { Command } from 'commander';
import { priorityOption } from './priority.option.js';
import { projectOption } from './project.option.js';
import { statusOption } from './status.option.js';

export function addTaskOptions(command: Command): Command {
  return command
    .addOption(statusOption)
    .addOption(priorityOption)
    .addOption(projectOption);
}
