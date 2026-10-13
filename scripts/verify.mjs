// Full local pipeline: build + dist guard, Vitest, Playwright e2e + axe (incl. SRS-019 frame timing),
// Lighthouse mobile + desktop (SRS-020), and a plaintext-email grep of dist (URS-020).
import { spawn, execSync } from 'node:child_process';
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';

const run = (cmd) => { console.log(`\n=== ${cmd} ===`); execSync(cmd, { stdio: 'inherit' }); };
const up = async () => { try { return (await fetch('http://localhost:4321/')).ok; } catch { return false; } };

run('npm run build');
run('npm run test:unit');
let preview;
if (!(await up())) {
  preview = spawn('npm', ['run', 'preview'], { stdio: 'ignore', detached: true });
  for (let i = 0; i < 30 && !(await up()); i++) await new Promise((r) => setTimeout(r, 1000));
}
try {
  run('npx playwright test');
  if (process.env.SKIP_LIGHTHOUSE) console.log('\n=== Lighthouse skipped (SKIP_LIGHTHOUSE) ===');
  else { run('npm run lighthouse'); run('npx playwright test -g SRS-020 --project=chromium'); }
} finally {
  if (preview) process.kill(-preview.pid);
}
console.log('\n=== grep dist for plaintext email (URS-020) ===');
const email = ['tjmeltesen', 'gmail.com'].join('@');
const walk = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? walk(join(d, f)) : [join(d, f)]));
const hits = walk('dist').filter((f) => readFileSync(f).includes(email));
if (hits.length) { console.error('FOUND in:', hits); process.exit(1); }
console.log(`0 matches in ${walk('dist').length} files`);
console.log('\nVERIFY: ALL CHECKS PASSED');
