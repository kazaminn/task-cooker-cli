import { Option } from 'commander';
import { TASK_STATUSES } from '../../domain/constants.js';

export const statusOption = new Option(
  '-s, --status <status>',
  'ステータス指定'
).choices([...TASK_STATUSES]);
