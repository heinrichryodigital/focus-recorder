import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const allowedRoot = new Set(['.gitignore', '.env.example', 'README.md', 'SECURITY.md', 'package.json', 'package-lock.json', 'next.config.ts', 'next-env.d.ts', 'tsconfig.json', 'eslint.config.mjs', 'vercel.json']);
const allowedDirs = ['src/', 'public/', 'docs/', 'scripts/', 'tests/', '.github/'];
const forbidden = /(?:^|\/)(?:Sources|windows|licensing|node_modules|\.next|\.vercel|graphify-out)(?:\/|$)|\.(?:pem|key|p12|pfx|license|mov|mp4|zip|exe|dmg|msi|swift)$/i;
const secrets = [/-----BEGIN (?:RSA |EC |OPENSSH |)PRIVATE KEY-----/, /\b(?:sk_live|rk_live|whsec)_[A-Za-z0-9]{16,}\b/, /\bgh[pousr]_[A-Za-z0-9]{30,}\b/];
const files = execFileSync('git', ['ls-files', '-z'], { encoding: 'utf8' }).split('\0').filter(Boolean);
const errors = [];
for (const file of files) {
  if ((!allowedRoot.has(file) && !allowedDirs.some(dir => file.startsWith(dir))) || forbidden.test(file)) errors.push(`Not approved for public source: ${file}`);
  if (/(?:^|\/)\.env/.test(file) && file !== '.env.example') errors.push(`Environment file: ${file}`);
  const bytes = readFileSync(file);
  if (bytes.length > 1_000_000) errors.push(`Large artifact requires review: ${file}`);
  if (!bytes.includes(0) && secrets.some(pattern => pattern.test(bytes.toString('utf8')))) errors.push(`Possible credential: ${file}`);
}
if (errors.length) { console.error(errors.join('\n')); process.exit(1); }
console.log(`Public source boundary checked: ${files.length} files; no desktop source or common credentials.`);
