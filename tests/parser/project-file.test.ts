import { describe, expect, it } from 'vitest';
import {
  formatProjectFile,
  parseProjectFile,
} from '../../src/parser/project-file.js';

describe('project file parser', () => {
  it('parses frontmatter and body', () => {
    const input = [
      '---',
      'slug: p1',
      'name: P1',
      'status: cooking',
      '---',
      '',
      '# P1',
      '',
      'overview',
    ].join('\n');

    const parsed = parseProjectFile(input);

    expect(parsed.metadata).toMatchObject({
      slug: 'p1',
      name: 'P1',
      status: 'cooking',
    });
    expect(parsed.body).toContain('overview');
  });

  it('formats project file', () => {
    const out = formatProjectFile({
      metadata: { slug: 'p1', name: 'P1' },
      body: '# P1\n\noverview',
    });

    expect(out).toMatch(/^---\n/);
    expect(out).toContain('slug: p1');
    expect(out).toContain('# P1');
    expect(out).toContain('overview');
  });

  it('round-trips', () => {
    const input = [
      '---',
      'slug: project-1',
      'name: My Project',
      '---',
      '',
      'overview here',
    ].join('\n');

    const parsed = parseProjectFile(input);
    const formatted = formatProjectFile(parsed);
    const reparsed = parseProjectFile(formatted);

    expect(reparsed.metadata).toMatchObject({
      slug: 'project-1',
      name: 'My Project',
    });
    expect(reparsed.body.trim()).toBe('overview here');
  });
});
