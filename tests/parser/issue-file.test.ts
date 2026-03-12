import { describe, expect, it } from 'vitest';
import {
  formatIssueFile,
  parseIssueFile,
} from '../../src/parser/issue-file.js';

describe('issue file parser', () => {
  it('parses frontmatter and body', () => {
    const input = [
      '---',
      'id: 1',
      'title: sample',
      'status: order',
      'priority: medium',
      '---',
      '',
      'body line',
    ].join('\n');

    const parsed = parseIssueFile(input);

    expect(parsed.metadata).toMatchObject({ id: 1, title: 'sample' });
    expect(parsed.subtasks).toHaveLength(0);
    expect(parsed.body).toBe('body line');
  });

  it('extracts ## Tasks section as subtasks', () => {
    const input = [
      '---',
      'id: 1',
      'title: sample',
      '---',
      '',
      '## Tasks',
      '',
      '- [x] Read README.md',
      '  - [ ] Understand how to use this tool',
      '- [ ] Run pnpm run list',
      '',
      '## Notes',
      '',
      'body line',
    ].join('\n');

    const parsed = parseIssueFile(input);

    expect(parsed.subtasks).toHaveLength(2);
    expect(parsed.subtasks[0]).toMatchObject({
      title: 'Read README.md',
      done: true,
    });
    expect(parsed.subtasks[0].children).toHaveLength(1);
    expect(parsed.subtasks[1]).toMatchObject({
      title: 'Run pnpm run list',
      done: false,
    });
    expect(parsed.body).toContain('## Notes');
    expect(parsed.body).toContain('body line');
    expect(parsed.body).not.toContain('## Tasks');
  });

  it('formats with Tasks section in body', () => {
    const out = formatIssueFile({
      metadata: { id: 1, title: 'sample' },
      subtasks: [{ title: 'one', done: false, children: [] }],
      body: '## Notes\n\nbody',
    });

    expect(out).toContain('## Tasks\n\n- [ ] one');
    expect(out).toContain('## Notes');
    expect(out).toMatch(/^---\n/);
  });

  it('round-trips without subtasks', () => {
    const original = [
      '---',
      'id: 2',
      'title: hello',
      'status: prep',
      'priority: high',
      '---',
      '',
      'some body',
    ].join('\n');

    const parsed = parseIssueFile(original);
    const formatted = formatIssueFile(parsed);
    const reparsed = parseIssueFile(formatted);

    expect(reparsed.metadata).toMatchObject({ id: 2, title: 'hello' });
    expect(reparsed.body.trim()).toBe('some body');
  });
});
