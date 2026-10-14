// SRS-031 / URS-022: post-deploy live check. Usage: npm run live-check -- <url> [--no-lighthouse]
// Fails (exit 1) unless the deployed site serves the exact verified dist/ build with every
// required header, zero CSP violations, no injected third-party scripts, and Lighthouse >= 95.
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { chromium } from '@playwright/test';
import { waitForDeploy } from './live-wait.mjs';
import { SECURITY_HEADERS, HTML_CACHE, ASSET_CACHE, ASSETS_DIR } from '../src/lib/security-headers.mjs';

const base = process.argv.slice(2).find((a) => !a.startsWith('--'))?.replace(/\/$/, '');
if (!base) { console.error('usage: npm run live-check -- <url>'); process.exit(2); }
const failures = [];
const check = (ok, msg) => { console.log(`${ok ? 'PASS' : 'FAIL'} ${msg}`); if (!ok) failures.push(msg); };
const sha = (b) => createHash('sha256').update(b).digest('hex');
const project = readdirSync('dist/projects')[0];
const pages = ['/', `/projects/${project}/`];

// Wait for propagation (SRS-031): retry only on 404 / connection error / PREVIOUS_HASH still served.
const ready = await waitForDeploy({
  url: `${base}/`, distHash: sha(readFileSync('dist/index.html')), previousHash: process.env.PREVIOUS_HASH ?? '',
  expectedHeaders: { ...SECURITY_HEADERS, 'Cache-Control': HTML_CACHE }, log: console.log,
});
if (!ready.ok) { console.error(`FAIL propagation wait: ${ready.reason}`); process.exit(1); }
console.log(`PASS deploy is serving the dist build (attempt ${ready.attempts})`);

for (const p of pages) {
  const r = await fetch(base + p, { redirect: 'follow' });
  check(r.ok, `${p} status ${r.status}`);
  for (const [k, v] of Object.entries({ ...SECURITY_HEADERS, 'Cache-Control': HTML_CACHE })) {
    check(r.headers.get(k) === v, `${p} ${k} = ${JSON.stringify(r.headers.get(k))}`);
  }
  const body = Buffer.from(await r.arrayBuffer());
  const local = readFileSync(`dist${p}index.html`);
  check(sha(body) === sha(local), `${p} served HTML sha256 ${sha(body).slice(0, 12)} == dist ${sha(local).slice(0, 12)}`);
}
const asset = readdirSync(`dist/${ASSETS_DIR}`).find((f) => f.endsWith('.css') || f.endsWith('.js'));
const ar = await fetch(`${base}/${ASSETS_DIR}/${asset}`);
check(ar.ok && ar.headers.get('Cache-Control') === ASSET_CACHE, `/${ASSETS_DIR}/${asset} Cache-Control = ${JSON.stringify(ar.headers.get('Cache-Control'))}`);

const origin = new URL(base).origin;
const browser = await chromium.launch();
try {
  for (const p of pages) {
    const page = await browser.newPage();
    const violations = [];
    const foreign = [];
    page.on('console', (m) => { if (/Content Security Policy|Refused to/i.test(m.text())) violations.push(m.text()); });
    page.on('request', (rq) => { if (rq.resourceType() === 'script' && new URL(rq.url()).origin !== origin) foreign.push(rq.url()); });
    await page.addInitScript(() => { window.__csp = []; document.addEventListener('securitypolicyviolation', (e) => window.__csp.push(`${e.violatedDirective} ${e.blockedURI}`)); });
    await page.goto(base + p, { waitUntil: 'networkidle' });
    await page.mouse.wheel(0, 4000); await page.waitForTimeout(500);
    violations.push(...(await page.evaluate(() => window.__csp)));
    const scripts = await page.$$eval('script', (s) => s.map((x) => x.src || '[inline]'));
    foreign.push(...scripts.filter((s) => s === '[inline]' || new URL(s).origin !== origin));
    check(violations.length === 0, `${p} CSP violations: ${violations.length ? violations.join(' | ') : 0}`);
    check(foreign.length === 0, `${p} injected/third-party scripts: ${foreign.length ? foreign.join(' | ') : 0}`);
    await page.close();
  }
} finally { await browser.close(); }

if (!process.argv.includes('--no-lighthouse')) {
  execFileSync('node', ['scripts/lighthouse.mjs'], { stdio: 'inherit', env: { ...process.env, BASE_URL: base } });
  const summary = JSON.parse(readFileSync('lighthouse/summary.json', 'utf8'));
  for (const [k, v] of Object.entries(summary)) {
    for (const c of ['performance', 'accessibility', 'best-practices', 'seo']) check(v[c] >= 95, `Lighthouse ${k} ${c} ${v[c]} >= 95`);
  }
}
if (failures.length) { console.error(`\nLIVE CHECK FAILED (${failures.length})`); process.exit(1); }
console.log('\nLIVE CHECK PASSED');
