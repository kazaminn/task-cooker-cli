import { describe, expect, it } from 'vitest';
import {
  formatCheckboxLines,
  parseCheckboxLines,
} from '../../src/parser/checkbox.js';

describe('checkbox parser', () => {
  it('parses nested checkboxes', () => {
    const text = ['- [ ] parent', '  - [x] child'].join('\n');
    expect(parseCheckboxLines(text)).toEqual([
      {
        title: 'parent',
        done: false,
        children: [{ title: 'child', done: true, children: [] }],
      },
    ]);
  });

  it('formats nested checkboxes', () => {
    const result = formatCheckboxLines([
      {
        title: 'root',
        done: true,
        children: [{ title: 'leaf', done: false, children: [] }],
      },
    ]);

    expect(result).toBe('- [x] root\n  - [ ] leaf');
  });
});
