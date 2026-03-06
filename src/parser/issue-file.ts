import type { Subtask } from '../domain/types.js';
import { formatCheckboxLines, parseCheckboxLines } from './checkbox.js';

export interface ParsedIssueFile {
  metadata: Record<string, string>;
  subtasks: Subtask[];
  body: string;
}

const SEPARATOR = '\n---\n';

export function parseIssueFile(input: string): ParsedIssueFile {
  const sepIndex = input.indexOf(SEPARATOR);
  const headerPart = sepIndex === -1 ? input : input.slice(0, sepIndex);
  const body = sepIndex === -1 ? '' : input.slice(sepIndex + SEPARATOR.length);

  const metadata: Record<string, string> = {};
  const checkboxLines: string[] = [];
  let inTasksSection = false;

  for (const line of headerPart.split('\n')) {
    if (line.startsWith('Tasks:')) {
      inTasksSection = true;
      continue;
    }

    if (inTasksSection && line.trimStart().startsWith('- [')) {
      checkboxLines.push(line);
      continue;
    }

    if (line.trim() === '') {
      continue;
    }

    inTasksSection = false;
    const index = line.indexOf(':');
    if (index === -1) {
      continue;
    }

    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim();
    metadata[key] = value;
  }

  return {
    metadata,
    subtasks: parseCheckboxLines(checkboxLines.join('\n')),
    body,
  };
}

export function formatIssueFile(parsed: ParsedIssueFile): string {
  const headerLines = Object.entries(parsed.metadata).map(
    ([key, value]) => `${key}: ${value}`
  );

  if (parsed.subtasks.length > 0) {
    headerLines.push('Tasks:');
    headerLines.push(formatCheckboxLines(parsed.subtasks));
  }

  return `${headerLines.join('\n')}\n---\n${parsed.body}`;
}
