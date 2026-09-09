import assert from 'node:assert/strict';
import { execFileSync, spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, symlinkSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';

const guard = resolve('scripts/check-public.mjs');
const safeEnvironmentExample = [
  '# Local mock configuration; keep credentials empty.',
  'PAYMENTS_MODE=mock',
  'PAYPAL_ENV=sandbox',
  'PAYPAL_CLIENT_ID=',
  'PAYPAL_CLIENT_SECRET=',
  'PAYPAL_WEBHOOK_ID=',
  'APP_URL=http://localhost:3000',
  'ACCOUNT_LOGIN_ENABLED=false',
  'SUPABASE_URL=',
  'SUPABASE_PUBLISHABLE_KEY=',
  '',
].join('\n');

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

test('publication guard rejects Supabase secret keys without printing them', () => repository(root => {
  const fakeSecret = ['sb', 'secret', 'x'.repeat(32)].join('_');
  stage(root, 'src/config.ts', `export const key = "${fakeSecret}";`);
  const result = inspect(root);
  assert.equal(result.status, 1);
  assert.equal(result.stderr.includes(fakeSecret), false);
}));

test('publication guard rejects legacy privileged Supabase JWTs but permits public anon examples', () => {
  for (const role of ['service_role', 'anon']) repository(root => {
    const token = [Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64url'), Buffer.from(JSON.stringify({ role, iss: 'supabase' })).toString('base64url'), 'syntheticSignature'].join('.');
    stage(root, 'src/config.ts', `export const key = "${token}";`);
    const result = inspect(root);
    assert.equal(result.status, role === 'anon' ? 0 : 1);
    assert.equal(result.stderr.includes(token), false);
  });
});

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

test('publication guard allows only the complete blank mock environment template', () => repository(root => {
  stage(root, '.env.example', safeEnvironmentExample);
  assert.equal(inspect(root).status, 0);
}));

test('publication guard rejects opaque PayPal credentials without disclosing their values', () => {
  const fakeCredential = 'opaque-demo-credential-do-not-use-483920';
  for (const key of ['PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET', 'PAYPAL_WEBHOOK_ID']) {
    repository(root => {
      stage(root, '.env.example', safeEnvironmentExample.replace(`${key}=`, `${key}=${fakeCredential}`));
      const result = inspect(root);
      assert.equal(result.status, 1, key);
      assert.match(result.stderr, /Unsafe environment template value/);
      assert.equal(result.stderr.includes(fakeCredential), false, 'diagnostics must not print credential values');
    });
  }
});

test('publication guard rejects unknown, duplicate, missing, or live environment settings', () => {
  for (const contents of [
    `${safeEnvironmentExample}PAYPAL_ACCESS_TOKEN=not-a-real-token\n`,
    `${safeEnvironmentExample}PAYPAL_CLIENT_SECRET=\n`,
    safeEnvironmentExample.replace('PAYPAL_CLIENT_SECRET=\n', ''),
    safeEnvironmentExample.replace('PAYPAL_ENV=sandbox', 'PAYPAL_ENV=live'),
    safeEnvironmentExample.replace('PAYMENTS_MODE=mock', 'PAYMENTS_MODE=live'),
    safeEnvironmentExample.replace('APP_URL=http://localhost:3000', 'APP_URL=https://user:password@example.com'),
    safeEnvironmentExample.replace('PAYPAL_CLIENT_SECRET=', 'export PAYPAL_CLIENT_SECRET='),
  ]) repository(root => {
    stage(root, '.env.example', contents);
    assert.equal(inspect(root).status, 1);
  });
});

test('publication guard inspects staged environment values despite a safe working copy', () => repository(root => {
  stage(root, '.env.example', safeEnvironmentExample.replace('PAYPAL_CLIENT_SECRET=', 'PAYPAL_CLIENT_SECRET=opaque-test-only-value'));
  writeFileSync(join(root, '.env.example'), safeEnvironmentExample);
  const result = inspect(root);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /PAYPAL_CLIENT_SECRET/);
}));
