import { describe, expect, it } from 'vitest';
import { formatTags, parseTags } from '../../src/parser/tag.js';

describe('tag parser', () => {
  it('parses tags with and without values', () => {
    expect(parseTags('@a, @b(1), plain')).toEqual([
      { name: 'a', value: undefined },
      { name: 'b', value: '1' },
      { name: 'plain', value: undefined },
    ]);
  });

  it('formats tags', () => {
    expect(formatTags([{ name: 'a' }, { name: 'b', value: '1' }])).toBe(
      '@a, @b(1)'
    );
  });
});
