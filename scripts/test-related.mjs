#!/usr/bin/env node

import { spawnSync } from 'node:child_process';

const JS_RELATED_PATTERN = /\.(ts|tsx|js|jsx|mjs|cjs|mts|cts|json)$/;

function runCommand(command, args, options = {}) {
  const bin = process.platform === 'win32' ? `${command}.cmd` : command;
  return spawnSync(bin, args, { encoding: 'utf8', ...options });
}

function captureCommand(command, args) {
  const result = runCommand(command, args);
  if (result.status !== 0) return null;
  return result.stdout.trim();
}

function findBaseRef() {
  if (process.env.BASE_REF) {
    return process.env.BASE_REF;
  }

  runCommand('git', ['fetch', '--no-tags', '--prune', '--depth=0', 'origin'], {
    stdio: 'ignore',
  });

  const remoteCandidates = [
    'refs/remotes/origin/main',
    'refs/remotes/origin/master',
  ];
  for (const ref of remoteCandidates) {
    const check = runCommand('git', ['show-ref', '--verify', '--quiet', ref]);
    if (check.status === 0) {
      return ref.replace('refs/remotes/', '');
    }
  }

  const headPrev = runCommand('git', [
    'rev-parse',
    '--verify',
    '--quiet',
    'HEAD~1',
  ]);
  if (headPrev.status === 0) {
    return 'HEAD~1';
  }

  return null;
}

const baseRef = findBaseRef();
if (!baseRef) {
  console.log('[test:related] Could not determine base ref; skip test.');
  process.exit(0);
}

const mergeBase = captureCommand('git', ['merge-base', baseRef, 'HEAD']);
if (!mergeBase) {
  console.log('[test:related] Could not determine merge-base; skip test.');
  process.exit(0);
}

const diffOutput =
  captureCommand('git', ['diff', '--name-only', `${mergeBase}...HEAD`]) ?? '';
const changedFiles = diffOutput
  .split(/\r?\n/)
  .map((line) => line.trim())
  .filter((line) => line.length > 0 && JS_RELATED_PATTERN.test(line));

if (changedFiles.length === 0) {
  console.log('[test:related] No relevant changed files; skip test.');
  process.exit(0);
}

console.log('[test:related] Running vitest related for changed files:');
for (const file of changedFiles) {
  console.log(file);
}

const vitestResult = runCommand(
  'pnpm',
  ['exec', 'vitest', 'related', '--run', ...changedFiles],
  {
    stdio: 'inherit',
  }
);

process.exit(vitestResult.status ?? 1);
