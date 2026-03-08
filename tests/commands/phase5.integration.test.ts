import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createProgram } from '../../src/cli/index.js';

async function runCli(args: string[]) {
  const stdout: string[] = [];
  const stderr: string[] = [];
  const logSpy = vi
    .spyOn(console, 'log')
    .mockImplementation((...values: unknown[]) => {
      stdout.push(values.map((value) => String(value)).join(' '));
    });
  const errorSpy = vi
    .spyOn(console, 'error')
    .mockImplementation((...values: unknown[]) => {
      stderr.push(values.map((value) => String(value)).join(' '));
    });

  try {
    const program = createProgram();
    program.exitOverride();
    await program.parseAsync(['node', 'tck', ...args]);
  } finally {
    logSpy.mockRestore();
    errorSpy.mockRestore();
  }

  return { stdout, stderr };
}

describe.sequential('Phase5 CLI integration', () => {
  const originalCwd = process.cwd();
  let workspaceDir: string;
  let originalEditor: string | undefined;

  beforeEach(async () => {
    workspaceDir = await mkdtemp(path.join(tmpdir(), 'tck-phase5-'));
    process.chdir(workspaceDir);
    originalEditor = process.env.EDITOR;
  });

  afterEach(async () => {
    process.chdir(originalCwd);
    if (originalEditor === undefined) {
      delete process.env.EDITOR;
    } else {
      process.env.EDITOR = originalEditor;
    }
    vi.restoreAllMocks();
    await rm(workspaceDir, { recursive: true, force: true });
  });

  it('covers init -> create -> list -> update -> serve -> log', async () => {
    const initResult = await runCli(['init']);
    expect(initResult.stderr).toEqual([]);
    expect(initResult.stdout).toEqual([workspaceDir]);

    const projectResult = await runCli([
      'project',
      'create',
      'CLI Project',
      '--slug',
      'project-1',
    ]);
    expect(projectResult.stderr).toEqual([]);
    expect(projectResult.stdout[0]).toContain('project-1');

    const createResult = await runCli([
      'create',
      'Initial task',
      '--body',
      'first body',
    ]);
    expect(createResult.stderr).toEqual([]);
    expect(createResult.stdout[0]).toContain('#1');

    const listResult = await runCli(['list', '--json']);
    expect(listResult.stderr).toEqual([]);
    expect(JSON.parse(listResult.stdout[0])).toEqual([
      {
        id: 1,
        project: 'project-1',
        title: 'Initial task',
        status: 'order',
        priority: 'medium',
        path: 'projects/project-1/task-1.md',
      },
    ]);

    const updateResult = await runCli([
      'update',
      '1',
      '--title',
      'Updated task',
      '--body',
      'updated body',
      '--priority',
      'high',
    ]);
    expect(updateResult.stderr).toEqual([]);
    expect(updateResult.stdout[0]).toContain('#1');

    const serveResult = await runCli(['serve', '1']);
    expect(serveResult.stderr).toEqual([]);
    expect(serveResult.stdout[0]).toContain('#1');

    const taskFile = await readFile(
      path.join(workspaceDir, 'projects', 'project-1', 'task-1.md'),
      'utf-8'
    );
    expect(taskFile).toContain('Title: Updated task');
    expect(taskFile).toContain('Status: serve');
    expect(taskFile).toContain('Priority: high');
    expect(taskFile).toContain('updated body');

    const index = JSON.parse(
      await readFile(path.join(workspaceDir, '.tck', 'index.json'), 'utf-8')
    ) as { tasks: unknown[] };
    expect(index.tasks).toEqual([
      {
        id: 1,
        project: 'project-1',
        title: 'Updated task',
        status: 'serve',
        priority: 'high',
        path: 'projects/project-1/task-1.md',
      },
    ]);

    const logResult = await runCli(['log', '--json']);
    expect(logResult.stderr).toEqual([]);
    const activityLog = JSON.parse(logResult.stdout[0]) as {
      type: string;
      projectId: string;
      taskId?: number;
      text: string;
    }[];
    expect(activityLog).toHaveLength(4);
    expect(activityLog.map((entry) => entry.type)).toEqual([
      'project_create',
      'task_create',
      'task_update',
      'task_update',
    ]);
    expect(activityLog.map((entry) => entry.projectId)).toEqual([
      'project-1',
      'project-1',
      'project-1',
      'project-1',
    ]);
    expect(activityLog[1]).toMatchObject({
      taskId: 1,
      text: 'タスクを作成: Initial task',
    });
    expect(activityLog[2]).toMatchObject({
      taskId: 1,
      text: 'タスクを更新: Updated task',
    });
    expect(activityLog[3]).toMatchObject({
      taskId: 1,
      text: 'ステータス変更: serve',
    });

    const rawActivityLog = await readFile(
      path.join(workspaceDir, '.tck', 'activity.log'),
      'utf-8'
    );
    expect(rawActivityLog.trim().split('\n')).toHaveLength(4);
  });

  it('creates a task and mix from editor drafts', async () => {
    await runCli(['init']);
    await runCli(['project', 'create', 'CLI Project', '--slug', 'project-1']);

    const taskEditorScript = path.join(workspaceDir, 'task-editor.mjs');
    await writeFile(
      taskEditorScript,
      [
        "import { writeFileSync } from 'node:fs';",
        'const filePath = process.argv[2];',
        "writeFileSync(filePath, '# Drafted task\\nStatus: prep\\nPriority: urgent\\n\\nTask body from editor.\\n', 'utf8');",
      ].join('\n'),
      'utf8'
    );
    process.env.EDITOR = `node "${taskEditorScript}"`;

    const createTaskResult = await runCli(['create', 'new']);
    expect(createTaskResult.stderr).toEqual([]);
    expect(createTaskResult.stdout[0]).toContain('#1');

    const taskFile = await readFile(
      path.join(workspaceDir, 'projects', 'project-1', 'task-1.md'),
      'utf8'
    );
    expect(taskFile).toContain('Title: Drafted task');
    expect(taskFile).toContain('Status: prep');
    expect(taskFile).toContain('Priority: urgent');
    expect(taskFile).toContain('Task body from editor.');

    const mixEditorScript = path.join(workspaceDir, 'mix-editor.mjs');
    await writeFile(
      mixEditorScript,
      [
        "import { writeFileSync } from 'node:fs';",
        'const filePath = process.argv[2];',
        "writeFileSync(filePath, '# Drafted mix\\n\\nFirst comment from editor.\\n', 'utf8');",
      ].join('\n'),
      'utf8'
    );
    process.env.EDITOR = `node "${mixEditorScript}"`;

    const createMixResult = await runCli(['mix', 'create', 'new']);
    expect(createMixResult.stderr).toEqual([]);
    expect(createMixResult.stdout[0]).toContain('#1');

    const mixFile = await readFile(
      path.join(workspaceDir, 'projects', 'project-1', 'mix-1.md'),
      'utf8'
    );
    expect(mixFile).toContain('Title: Drafted mix');
    expect(mixFile).toContain('First comment from editor.');
  });
});
