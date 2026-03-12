import matter from 'gray-matter';
import type { Subtask } from '../domain/types.js';
import { formatCheckboxLines, parseCheckboxLines } from './checkbox.js';

export interface ParsedIssueFile {
  metadata: Record<string, unknown>;
  subtasks: Subtask[];
  body: string;
}

function extractTasksSection(content: string): {
  subtasks: Subtask[];
  body: string;
} {
  const lines = content.split('\n');
  let inTasks = false;
  let tasksStart = -1;
  let tasksEnd = lines.length;
  const checkboxLines: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line === '## Tasks') {
      inTasks = true;
      tasksStart = i;
      continue;
    }

    if (inTasks) {
      if (line.startsWith('## ')) {
        tasksEnd = i;
        break;
      }
      if (line.trimStart().startsWith('- [')) {
        checkboxLines.push(line);
      } else if (line.trim() !== '') {
        // Non-blank non-checkbox content ends the Tasks section
        tasksEnd = i;
        break;
      }
    }
  }

  if (tasksStart === -1) {
    return { subtasks: [], body: content };
  }

  const before = lines.slice(0, tasksStart);
  const after = lines.slice(tasksEnd);
  const body = [...before, ...after]
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trimStart();

  return {
    subtasks: parseCheckboxLines(checkboxLines.join('\n')),
    body,
  };
}

export function parseIssueFile(input: string): ParsedIssueFile {
  const { data, content } = matter(input);
  const { subtasks, body } = extractTasksSection(content);

  return {
    metadata: data as Record<string, unknown>,
    subtasks,
    body: body.replace(/^\n+/, '').trimEnd(),
  };
}

export function formatIssueFile(parsed: ParsedIssueFile): string {
  let fullBody = '';

  if (parsed.subtasks.length > 0) {
    fullBody += `## Tasks\n\n${formatCheckboxLines(parsed.subtasks)}\n\n`;
  }

  if (parsed.body) {
    fullBody += parsed.body;
  }

  return matter.stringify('\n' + fullBody, parsed.metadata);
}
