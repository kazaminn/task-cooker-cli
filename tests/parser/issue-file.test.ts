import { describe, expect, it } from 'vitest';
import {
  formatIssueFile,
  parseIssueFile,
} from '../../src/parser/issue-file.js';

describe('issue file parser', () => {
  it('uses only first separator and keeps body as-is', () => {
    const input = [
      'Id: 1',
      'Title: sample',
      'Tasks:',
      '- [ ] one',
      '---',
      'body line',
      '---',
      'tail',
    ].join('\n');

    const parsed = parseIssueFile(input);

    expect(parsed.metadata).toEqual({ Id: '1', Title: 'sample' });
    expect(parsed.subtasks).toHaveLength(1);
    expect(parsed.body).toBe('body line\n---\ntail');
  });

  it('formats with tasks section', () => {
    const out = formatIssueFile({
      metadata: { Id: '1', Title: 'sample' },
      subtasks: [{ title: 'one', done: false, children: [] }],
      body: 'body',
    });

    expect(out).toContain('Tasks:\n- [ ] one');
    expect(out).toContain('\n---\nbody');
  });
});
