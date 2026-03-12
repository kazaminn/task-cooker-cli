import {
  chmod,
  mkdtemp,
  readFile,
  readdir,
  rename,
  rm,
  writeFile,
} from 'node:fs/promises';
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

/** Returns the first task .md file in the given project directory */
async function findTaskFile(
  workspaceDir: string,
  projectSlug: string
): Promise<string> {
  const projectDir = path.join(workspaceDir, 'projects', projectSlug);
  const files = await readdir(projectDir);
  const taskFile = files.find(
    (f) => f.endsWith('.md') && f !== 'project.md' && !/^mix-\d+\.md$/.test(f)
  );
  if (!taskFile) throw new Error('No task file found in ' + projectDir);
  return path.join(projectDir, taskFile);
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
    const listEntries = JSON.parse(listResult.stdout[0]) as {
      id: number;
      project: string;
      title: string;
      status: string;
      priority: string;
      path: string;
    }[];
    expect(listEntries).toHaveLength(1);
    expect(listEntries[0]).toMatchObject({
      id: 1,
      project: 'project-1',
      title: 'Initial task',
      status: 'order',
      priority: 'medium',
    });
    expect(listEntries[0].path).toMatch(/^projects\/project-1\/.+\.md$/);

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

    const taskFilePath = await findTaskFile(workspaceDir, 'project-1');
    const taskFile = await readFile(taskFilePath, 'utf-8');
    expect(taskFile).toContain('title: Updated task');
    expect(taskFile).toContain('status: serve');
    expect(taskFile).toContain('priority: high');
    expect(taskFile).toContain('updated body');

    const index = JSON.parse(
      await readFile(path.join(workspaceDir, '.tck', 'index.json'), 'utf-8')
    ) as {
      tasks: {
        id: number;
        project: string;
        title: string;
        status: string;
        priority: string;
        path: string;
      }[];
    };
    expect(index.tasks).toHaveLength(1);
    expect(index.tasks[0]).toMatchObject({
      id: 1,
      project: 'project-1',
      title: 'Updated task',
      status: 'serve',
      priority: 'high',
    });
    expect(index.tasks[0].path).toMatch(/^projects\/project-1\/.+\.md$/);

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

    const taskFilePath = await findTaskFile(workspaceDir, 'project-1');
    const taskFile = await readFile(taskFilePath, 'utf8');
    expect(taskFile).toContain('title: Drafted task');
    expect(taskFile).toContain('status: prep');
    expect(taskFile).toContain('priority: urgent');
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
    expect(mixFile).toContain('title: Drafted mix');
    expect(mixFile).toContain('First comment from editor.');
  });

  it('supports code editor defaults for draft creation', async () => {
    await runCli(['init']);
    await runCli(['project', 'create', 'CLI Project', '--slug', 'project-1']);

    const fakeCodeScript = path.join(workspaceDir, 'code');
    await writeFile(
      fakeCodeScript,
      [
        '#!/usr/bin/env node',
        "import { writeFileSync } from 'node:fs';",
        'const args = process.argv.slice(2);',
        'const filePath = args.at(-1);',
        "if (!args.includes('--wait')) {",
        "  console.error('missing --wait');",
        '  process.exit(2);',
        '}',
        "writeFileSync(filePath, '# Drafted via code\\nStatus: prep\\nPriority: high\\n\\nCreated from code.\\n', 'utf8');",
      ].join('\n'),
      'utf8'
    );
    await chmod(fakeCodeScript, 0o755);

    process.env.EDITOR = 'code';
    const originalPath = process.env.PATH ?? '';
    process.env.PATH = `${workspaceDir}:${originalPath}`;

    try {
      const result = await runCli(['create', 'new']);
      expect(result.stderr).toEqual([]);
      expect(result.stdout[0]).toContain('#1');
    } finally {
      process.env.PATH = originalPath;
    }

    const taskFilePath = await findTaskFile(workspaceDir, 'project-1');
    const taskFile = await readFile(taskFilePath, 'utf8');
    expect(taskFile).toContain('title: Drafted via code');
    expect(taskFile).toContain('Created from code.');
  });

  it('keeps working after a task file is renamed with a readable suffix', async () => {
    await runCli(['init']);
    await runCli(['project', 'create', 'CLI Project', '--slug', 'project-1']);
    await runCli(['create', 'Initial task', '--body', 'first body']);

    const originalTaskPath = await findTaskFile(workspaceDir, 'project-1');
    const renamedTaskPath = path.join(
      workspaceDir,
      'projects',
      'project-1',
      't1-hello-world.md'
    );
    await rename(originalTaskPath, renamedTaskPath);

    const updateResult = await runCli([
      'update',
      '1',
      '--title',
      'Updated task',
      '--body',
      'updated body',
    ]);
    expect(updateResult.stderr).toEqual([]);

    const listResult = await runCli(['list', '--json']);
    const listEntries = JSON.parse(listResult.stdout[0]) as {
      id: number;
      project: string;
      title: string;
      status: string;
      priority: string;
      path: string;
    }[];
    expect(listEntries).toHaveLength(1);
    expect(listEntries[0]).toMatchObject({
      id: 1,
      project: 'project-1',
      title: 'Updated task',
      status: 'order',
      priority: 'medium',
      path: 'projects/project-1/t1-hello-world.md',
    });

    const taskFile = await readFile(renamedTaskPath, 'utf-8');
    expect(taskFile).toContain('title: Updated task');
    expect(taskFile).toContain('updated body');
  });
});
