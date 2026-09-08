import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';

const guard = resolve('scripts/check-public.mjs');

function repository(run: (root: string) => void) {
  const root = mkdtempSync(join(tmpdir(), 'focus-public-boundary-'));
  try {
    execFileSync('git', ['init', '--quiet'], { cwd: root });
    run(root);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
}

function stage(root: string, file: string, contents: string) {
  mkdirSync(dirname(join(root, file)), { recursive: true });
  writeFileSync(join(root, file), contents);
  execFileSync('git', ['add', '--', file], { cwd: root });
}

function inspect(root: string) {
  return spawnSync(process.execPath, [guard], { cwd: root, encoding: 'utf8' });
}

test('publication guard permits website files and benign generated guide files', () => repository(root => {
  stage(root, 'src/status.ts', 'export const status = "preview";');
  stage(root, 'AGENTS.md', '# Next development guide');
  stage(root, 'CLAUDE.md', '@AGENTS.md');
  assert.equal(inspect(root).status, 0);
}));

test('publication guard scans staged bytes even if a secret is hidden by an unstaged edit', () => repository(root => {
  const fakeSecret = ['sk', 'test', 'x'.repeat(32)].join('_');
  stage(root, 'src/status.ts', `export const badExample = "${fakeSecret}";`);
  writeFileSync(join(root, 'src/status.ts'), 'export const safe = true;');
  const result = inspect(root);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /Possible credential/);
}));

test('publication guard rejects empty and enclosing repositories', () => repository(root => {
  assert.equal(inspect(root).status, 1);
  stage(root, 'README.md', 'Website');
  const nested = join(root, 'nested');
  mkdirSync(nested);
  const result = inspect(nested);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /dedicated public repository root/);
}));

test('publication guard rejects desktop sources, credentials, symlinks and oversized artifacts', () => {
  for (const [file, content] of [
    ['Sources/Recorder.swift', 'private desktop implementation'],
    ['public/release.zip', 'private installer'],
    ['.env.local', 'private configuration'],
    ['src/config.ts', ['-----BEGIN ', 'ENCRYPTED ', 'PRIVATE KEY-----'].join('')],
    ['public/data.bin', '\0' + ['sk', 'test', 'x'.repeat(32)].join('_')],
    ['public/oversized.txt', 'x'.repeat(1_000_001)],
  ]) {
    repository(root => {
      stage(root, file, content);
      assert.equal(inspect(root).status, 1, file);
    });
  }
  repository(root => {
    stage(root, 'README.md', 'Website');
    mkdirSync(join(root, 'public'));
    symlinkSync('../README.md', join(root, 'public/linked.txt'));
    execFileSync('git', ['add', '--', 'public/linked.txt'], { cwd: root });
    const result = inspect(root);
    assert.equal(result.status, 1);
    assert.match(result.stderr, /Symlink/);
  });
});
