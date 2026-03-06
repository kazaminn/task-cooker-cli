import { describe, expect, it } from 'vitest';
import {
  formatProjectFile,
  parseProjectFile,
} from '../../src/parser/project-file.js';

describe('project file parser', () => {
  it('parses header and body', () => {
    const parsed = parseProjectFile('Slug: p1\nName: P1\n---\noverview');

    expect(parsed.metadata).toEqual({ Slug: 'p1', Name: 'P1' });
    expect(parsed.body).toBe('overview');
  });

  it('formats parsed project file', () => {
    expect(
      formatProjectFile({
        metadata: { Slug: 'p1' },
        body: 'overview',
      })
    ).toBe('Slug: p1\n---\noverview');
  });
});
