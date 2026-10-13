// Post-build guard: fails the build if the plaintext email or any inline script ships (URS-020, SRS-025).
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const EMAIL = ['tjmeltesen', 'gmail.com'].join('@');
const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
const files = walk('dist').filter((f) => /\.(html|js|css|txt|xml|json)$/.test(f));
const problems = [];
for (const f of files) {
  const s = readFileSync(f, 'utf8');
  if (s.includes(EMAIL)) problems.push(`${f}: plaintext email`);
  if (f.endsWith('.html')) {
    for (const m of s.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/g)) {
      if (!/\bsrc=/.test(m[1]) || m[2].trim()) problems.push(`${f}: inline <script>`);
    }
    if (/<style\b/.test(s) || /\sstyle="/.test(s)) problems.push(`${f}: inline style`);
  }
}
if (problems.length) { console.error(problems.join('\n')); process.exit(1); }
console.log(`check-dist: ${files.length} files clean (no plaintext email, no inline script/style)`);
