import { execFileSync } from 'node:child_process';
import { realpathSync } from 'node:fs';

const allowedRoot = new Set(['.gitignore', '.env.example', 'README.md', 'SECURITY.md', 'AGENTS.md', 'CLAUDE.md', 'package.json', 'package-lock.json', 'next.config.ts', 'next-env.d.ts', 'tsconfig.json', 'eslint.config.mjs', 'vercel.json']);
const allowedDirs = ['src/', 'public/', 'docs/', 'scripts/', 'tests/', '.github/'];
const forbidden = /(?:^|\/)(?:Sources|windows|licensing|node_modules|\.next|\.vercel|graphify-out)(?:\/|$)|\.(?:pem|key|p12|pfx|license|frlicense|mov|mp4|zip|exe|dmg|msi|swift)$/i;
const secrets = [/-----BEGIN (?:RSA |EC |OPENSSH |ENCRYPTED |)PRIVATE KEY-----/, /\b(?:(?:sk|rk)_(?:live|test)|whsec)_[A-Za-z0-9]{16,}\b/, /\bgh[pousr]_[A-Za-z0-9]{30,}\b/, /\bgithub_pat_[A-Za-z0-9_]{40,}\b/];
const gitRoot = execFileSync('git', ['rev-parse', '--show-toplevel'], { encoding: 'utf8' }).trim();
if (realpathSync(gitRoot) !== realpathSync(process.cwd())) {
  console.error('Run the publication check from the dedicated public repository root, not an enclosing repository.');
  process.exit(1);
}
// Inspect the index (what will be committed), so unstaged edits cannot conceal a staged secret.
const entries = execFileSync('git', ['ls-files', '--stage', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);
if (!entries.length) {
  console.error('No tracked publication files found. Stage the intended public files before checking.');
  process.exit(1);
}
const errors = [];
for (const entry of entries) {
  const separator = entry.indexOf('\t');
  const [mode, objectId, stage] = entry.slice(0, separator).split(' ');
  const file = entry.slice(separator + 1);
  if ((!allowedRoot.has(file) && !allowedDirs.some(dir => file.startsWith(dir))) || forbidden.test(file)) errors.push(`Not approved for public source: ${file}`);
  if (/(?:^|\/)\.env/.test(file) && file !== '.env.example') errors.push(`Environment file: ${file}`);
  if (!['100644', '100755'].includes(mode) || stage !== '0') {
    errors.push(`Symlink, submodule or unmerged file is not approved: ${file}`);
    continue;
  }
  const size = Number(execFileSync('git', ['cat-file', '-s', objectId], { encoding: 'utf8' }));
  if (size > 1_000_000) {
    errors.push(`Large artifact requires review: ${file}`);
    continue;
  }
  const bytes = execFileSync('git', ['cat-file', 'blob', objectId], { maxBuffer: 1_000_001 });
  if (secrets.some(pattern => pattern.test(bytes.toString('utf8')))) errors.push(`Possible credential: ${file}`);
}
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`Public source boundary checked: ${entries.length} staged/tracked files; no desktop source or common credentials.`);
