import { Option } from 'commander';
import { TASK_PRIORITIES } from '../../domain/constants.js';

export const priorityOption = new Option(
  '-p, --priority <priority>',
  '優先順位指定'
).choices([...TASK_PRIORITIES]);
