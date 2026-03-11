import { describe, expect, it } from 'vitest';
import { buildEditorCommand } from '../../src/cli/handlers/editor.util.js';

describe('buildEditorCommand', () => {
  it('adds --wait for code when no wait flag is provided', () => {
    expect(buildEditorCommand('code', '/tmp/task-draft.md')).toEqual({
      command: 'code',
      args: ['--wait', '/tmp/task-draft.md'],
    });
  });

  it('preserves existing wait flags for code', () => {
    expect(buildEditorCommand('code -w', '/tmp/task-draft.md')).toEqual({
      command: 'code',
      args: ['-w', '/tmp/task-draft.md'],
    });
  });

  it('keeps quoted command arguments intact', () => {
    expect(
      buildEditorCommand('node "/tmp/editor script.mjs"', '/tmp/task-draft.md')
    ).toEqual({
      command: 'node',
      args: ['/tmp/editor script.mjs', '/tmp/task-draft.md'],
    });
  });
});
