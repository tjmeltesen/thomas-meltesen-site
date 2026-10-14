// URS-014 / SRS-020: median of 3 Lighthouse runs, mobile and desktop presets, against the
// production build (needs `npm run preview`). Writes lighthouse/summary.json.
import { execFileSync } from 'node:child_process';
import { rmSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { chromium } from '@playwright/test';

const base = process.env.BASE_URL ?? 'http://localhost:4321';
const pages = ['/', '/projects/smart-mirror/', '/404.html'];
const cats = ['performance', 'accessibility', 'best-practices', 'seo'];
const chrome = process.env.CHROME_PATH ?? chromium.executablePath();
rmSync('lighthouse', { recursive: true, force: true });
mkdirSync('lighthouse', { recursive: true });
const median = (xs) => [...xs].sort((a, b) => a - b)[Math.floor(xs.length / 2)];
const summary = {};
for (const preset of ['mobile', 'desktop']) {
  for (const path of pages) {
    const runs = [];
    for (let i = 0; i < 3; i++) {
      const out = `lighthouse/${preset}-${path.replace(/\W+/g, '_') || 'home'}-${i}.json`;
      const args = [`${base}${path}`, '--quiet', '--output=json', `--output-path=${out}`, `--chrome-flags=--headless=new --no-sandbox`, `--only-categories=${cats.join(',')}`];
      if (preset === 'desktop') args.push('--preset=desktop');
      // Retry a run that crashes (e.g. Lighthouse NO_NAVSTART trace error); scores are never retried.
      for (let t = 1; ; t++) {
        try { execFileSync('npx', ['lighthouse', ...args], { stdio: 'inherit', env: { ...process.env, CHROME_PATH: chrome } }); break; }
        catch (e) { if (t >= 3) throw e; console.warn(`lighthouse run crashed, retry ${t}/2`); }
      }
      const r = JSON.parse(readFileSync(out, 'utf8'));
      runs.push({ ...Object.fromEntries(cats.map((c) => [c, Math.round(r.categories[c].score * 100)])), lcpMs: r.audits['largest-contentful-paint'].numericValue, cls: r.audits['cumulative-layout-shift'].numericValue });
    }
    summary[`${preset} ${path}`] = Object.fromEntries([...cats, 'lcpMs', 'cls'].map((c) => [c, median(runs.map((r) => r[c]))]));
  }
}
writeFileSync('lighthouse/summary.json', JSON.stringify(summary, null, 2));
console.table(summary);
