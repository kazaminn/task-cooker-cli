import type { Subtask } from '../domain/types.js';

const CHECKBOX_RE = /^(\s*)- \[([ xX])\] (.+)$/;

export function parseCheckboxLines(input: string): Subtask[] {
  const lines = input.split('\n').filter((line) => line.trim().length > 0);
  const roots: Subtask[] = [];
  const stack: { depth: number; node: Subtask }[] = [];

  for (const line of lines) {
    const matched = CHECKBOX_RE.exec(line);
    if (!matched) {
      continue;
    }

    const depth = Math.floor(matched[1].length / 2);
    const node: Subtask = {
      title: matched[3],
      done: matched[2].toLowerCase() === 'x',
      children: [],
    };

    while (stack.length > 0 && stack.at(-1)!.depth >= depth) {
      stack.pop();
    }

    if (stack.length === 0) {
      roots.push(node);
    } else {
      stack.at(-1)!.node.children.push(node);
    }

    stack.push({ depth, node });
  }

  return roots;
}

export function formatCheckboxLines(subtasks: Subtask[]): string {
  const lines: string[] = [];

  function visit(nodes: Subtask[], depth: number): void {
    for (const node of nodes) {
      const indent = '  '.repeat(depth);
      lines.push(`${indent}- [${node.done ? 'x' : ' '}] ${node.title}`);
      visit(node.children, depth + 1);
    }
  }

  visit(subtasks, 0);
  return lines.join('\n');
}
