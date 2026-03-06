import { describe, expect, it } from 'vitest';
import {
  formatCommentBlock,
  parseCommentBlock,
} from '../../src/parser/comment-block.js';

describe('comment block parser', () => {
  it('parses comment block', () => {
    expect(
      parseCommentBlock('<!-- comment @suzuki 2026-03-06T10:00:00+09:00 -->')
    ).toEqual({
      author: 'suzuki',
      timestamp: '2026-03-06T10:00:00+09:00',
    });
  });

  it('formats comment block', () => {
    expect(
      formatCommentBlock({
        author: 'suzuki',
        timestamp: '2026-03-06T10:00:00+09:00',
      })
    ).toBe('<!-- comment @suzuki 2026-03-06T10:00:00+09:00 -->');
  });
});
