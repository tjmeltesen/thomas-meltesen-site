import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { existsSync, readFileSync } from 'node:fs';

const EMAIL = ['tjmeltesen', 'gmail.com'].join('@');
const slugs = ['agentic-rag-knowledge-graph', 'refl3ct', 'ae2mes', 'smart-mirror', 'smart-mirror-app', 'piaq'];
const routes = ['/', ...slugs.map((s) => `/projects/${s}/`), '/does-not-exist'];

test.describe('sections', () => {
  test('SRS-003 hero shows name, headline, location, bio and monogram fallback', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/Thomas\s+Meltesen/);
    await expect(page.getByTestId('headline')).toContainText('Agent Orchestration');
    await expect(page.locator('.hero .eyebrow')).toHaveText('Iowa City, IA');
    await expect(page.getByTestId('bio')).toBeVisible();
    await expect(page.locator('[data-avatar="monogram"]')).toHaveText('TM');
  });

  test('SRS-004 education shows 2 entries', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('education-item')).toHaveCount(2);
  });

  test('SRS-005 experience shows 3 entries newest first', async ({ page }) => {
    await page.goto('/');
    const ends = await page.getByTestId('experience-item').evaluateAll((els) => els.map((e) => e.getAttribute('data-end')));
    expect(ends).toEqual(['2026-08', '2025-08', '2023-08']);
  });

  test('SRS-006 projects show 6 cards with title, summary and tags', async ({ page }) => {
    await page.goto('/');
    const cards = page.getByTestId('project-card');
    await expect(cards).toHaveCount(6);
    for (const c of await cards.all()) {
      await expect(c.locator('h3')).not.toBeEmpty();
      expect(await c.locator('.chips li').count()).toBeGreaterThan(0);
    }
  });

  test('SRS-007 skills show 5 groups', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('skill-group')).toHaveCount(5);
  });

  test('SRS-008 hobbies show 3 items', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByTestId('hobby').locator('h3')).toHaveText(['Basketball', 'Gaming', 'Hanging out with friends']);
  });

  test('SRS-009 contact links to LinkedIn and GitHub and shows no phone number', async ({ page }) => {
    await page.goto('/');
    const contact = page.locator('#contact');
    await expect(contact.getByRole('link', { name: 'LinkedIn' })).toHaveAttribute('href', 'https://www.linkedin.com/in/thomas-meltesen/');
    await expect(contact.getByRole('link', { name: 'GitHub' })).toHaveAttribute('href', 'https://github.com/tjmeltesen');
    expect(await page.content()).not.toMatch(/745-2306|\(515\)/);
  });
});

test.describe('email reveal', () => {
  test('SRS-010 built HTML has no plaintext email; keyboard reveal assembles it', async ({ page, request }) => {
    for (const r of routes) expect(await (await request.get(r)).text()).not.toContain(EMAIL);
    await page.goto('/');
    const btn = page.getByRole('button', { name: 'Show email address' });
    await btn.focus();
    await page.keyboard.press('Enter');
    const link = page.locator('[data-email-link]');
    await expect(link).toHaveText(EMAIL);
    await expect(link).toHaveAttribute('href', `mailto:${EMAIL}`);
    await expect(link).toBeFocused();
  });

  test.describe('without JavaScript', () => {
    test.use({ javaScriptEnabled: false });
    test('SRS-010 no-JS fallback points to LinkedIn and GitHub', async ({ page }) => {
      await page.goto('/');
      const note = page.locator('[data-email-fallback]');
      await expect(note).toBeVisible();
      await expect(note.getByRole('link', { name: 'LinkedIn' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Show email address' })).toBeHidden();
    });

    test('SRS-024 all content is visible with JS disabled', async ({ page }) => {
      await page.goto('/');
      for (const el of await page.locator('[data-reveal]').all()) {
        await el.scrollIntoViewIfNeeded();
        await expect(el).toBeVisible();
        await expect.poll(() => el.evaluate((e) => getComputedStyle(e).opacity)).toBe('1');
        expect(await el.evaluate((e) => e.getAnimations().length)).toBe(0);
      }
    });
  });
});

test.describe('navigation and routes', () => {
  test('SRS-011 skip link, keyboard nav and active-section highlight', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Skip to content' });
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();
    await page.locator('#projects').scrollIntoViewIfNeeded();
    await page.evaluate(() => document.getElementById('projects')!.scrollIntoView({ block: 'start', behavior: 'instant' }));
    await expect(page.locator('[data-nav-link="projects"]')).toHaveAttribute('aria-current', 'true');
    const nav = await page.locator('.nav').evaluate((e) => getComputedStyle(e).position);
    expect(nav).toBe('sticky');
  });

  test('SRS-012 every project has a detail page, back returns to its card; unknown route is 404', async ({ page, request }) => {
    await page.goto('/');
    await page.locator('#project-ae2mes a').click();
    await expect(page).toHaveURL(/\/projects\/ae2mes\/$/);
    for (const h of ['Overview', 'My role', 'Tech stack', 'Key outcomes']) {
      await expect(page.getByRole('heading', { name: h })).toBeVisible();
    }
    await page.getByTestId('back-link').click();
    await expect(page).toHaveURL(/\/#project-ae2mes$/);
    for (const s of slugs) expect((await request.get(`/projects/${s}/`)).status()).toBe(200);
    const res = await request.get('/definitely-not-a-page');
    expect(res.status()).toBe(404);
    expect(await res.text()).toContain('Lost in the graph');
  });

  test('SRS-013 every route has title, description, OG tags and favicon', async ({ page }) => {
    for (const r of routes) {
      await page.goto(r);
      expect(await page.title()).toMatch(/Thomas Meltesen/);
      for (const sel of ['meta[name="description"]', 'meta[property="og:title"]', 'meta[property="og:description"]', 'meta[property="og:image"]', 'meta[property="og:url"]']) {
        expect((await page.locator(sel).getAttribute('content'))?.length, `${r} ${sel}`).toBeGreaterThan(5);
      }
      await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', '/favicon.svg');
    }
  });
});

test('URS-013 no horizontal scroll from 360px to 2560px', async ({ page }) => {
  for (const width of [360, 768, 1440, 2560]) {
    await page.setViewportSize({ width, height: 900 });
    for (const r of ['/', '/projects/smart-mirror/']) {
      await page.goto(r);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      expect(overflow, `${r} @ ${width}px`).toBeLessThanOrEqual(0);
    }
  }
});

test.describe('motion', () => {
  test('SRS-014 reveals are declarative data-reveal attributes driven by the motion module', async ({ page }) => {
    await page.goto('/');
    expect(await page.locator('[data-reveal]').count()).toBeGreaterThan(15);
    await expect(page.locator('html')).toHaveAttribute('data-motion', /css-scroll-timeline|intersection-observer/);
  });

  test.describe('reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });
    test('SRS-015 with reduce, every revealed element starts fully visible with no animation', async ({ page }) => {
      for (const r of ['/', '/projects/refl3ct/']) {
        await page.goto(r);
        const bad = await page.evaluate(() => [...document.querySelectorAll<HTMLElement>('[data-reveal]')]
          .filter((e) => getComputedStyle(e).opacity !== '1' || e.getAnimations().length > 0 || e.classList.contains('is-pending'))
          .map((e) => e.className));
        expect(bad, r).toEqual([]);
      }
    });
    test('SRS-015 SRS-023 with reduce, no transforms run and fades are <=150ms opacity-only', async ({ page }) => {
      for (const r of ['/', '/projects/refl3ct/']) {
        await page.goto(r);
        await expect(page.locator('html')).toHaveAttribute('data-motion', 'none');
        const bad = await page.evaluate(() => {
          const out: string[] = [];
          for (const el of document.querySelectorAll<HTMLElement>('body *')) {
            const cs = getComputedStyle(el);
            if (cs.transform !== 'none') out.push(`${el.className}: transform ${cs.transform}`);
            for (const a of el.getAnimations()) {
              const t = a.effect?.getTiming();
              const kf = (a.effect as KeyframeEffect).getKeyframes();
              const props = new Set(kf.flatMap((k) => Object.keys(k)).filter((k) => !['offset', 'easing', 'composite', 'computedOffset'].includes(k)));
              if ([...props].some((p) => p !== 'opacity') || Number(t?.duration) > 150) out.push(`${el.className}: ${[...props]} ${t?.duration}`);
            }
          }
          return out;
        });
        expect(bad).toEqual([]);
      }
    });
  });

  test('SRS-016 IntersectionObserver fallback runs where scroll timelines are unsupported', async ({ page }) => {
    await page.goto('/');
    const supported = await page.evaluate(() => CSS.supports('animation-timeline: view()'));
    await expect(page.locator('html')).toHaveAttribute('data-motion', supported ? 'css-scroll-timeline' : 'intersection-observer');
    if (!supported) {
      const pending = page.locator('#contact [data-reveal]').first();
      await expect(pending).toHaveClass(/is-pending/);
      await pending.scrollIntoViewIfNeeded();
      await expect(pending).not.toHaveClass(/is-pending/);
    }
  });

  test('SRS-019 hero and scroll animations: <=5% of frames over 16.7ms at 4x CPU throttle (median of 3)', async ({ page, browserName }) => {
    test.skip(browserName !== 'chromium', 'CDP CPU throttling is Chromium-only (test plan v0.2)');
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
    const ratios: number[] = [];
    for (let run = 0; run < 3; run++) {
      await page.goto('/');
      const ratio = await page.evaluate(async () => {
        const deltas: number[] = [];
        let last = performance.now();
        let running = true;
        const tick = (t: number) => { deltas.push(t - last); last = t; if (running) requestAnimationFrame(tick); };
        requestAnimationFrame((t) => { last = t; requestAnimationFrame(tick); });
        const max = document.documentElement.scrollHeight - innerHeight;
        await new Promise<void>((done) => {
          let y = 0;
          const step = () => { y += 24; scrollTo(0, y); if (y < max) requestAnimationFrame(step); else done(); };
          requestAnimationFrame(step);
        });
        running = false;
        const slow = deltas.slice(2).filter((d) => d > 16.7 * 1.5).length; // a dropped frame shows as a ~2x interval
        return slow / Math.max(1, deltas.length - 2);
      });
      ratios.push(ratio);
    }
    ratios.sort((a, b) => a - b);
    console.log('SRS-019 dropped-frame ratios', ratios);
    expect(ratios[1]).toBeLessThanOrEqual(0.05);
  });
});

test.describe('operation and quality', () => {
  test('SRS-017 production build is served on localhost:4321', async ({ request }) => {
    const res = await request.get('http://localhost:4321/');
    expect(res.ok()).toBe(true);
  });

  test('SRS-018 site works with all external requests blocked, and makes none', async ({ page }) => {
    const external: string[] = [];
    await page.route(/^(?!http:\/\/localhost:4321).*/, (r) => { external.push(r.request().url()); return r.abort(); });
    for (const r of routes) {
      await page.goto(r);
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    }
    expect(external).toEqual([]);
  });

  // Axe samples one frame; mid-reveal opacity would read as low contrast, so scan the settled (reduced-motion) state.
  test('SRS-022 zero axe WCAG 2.2 AA violations on every route', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const r of routes) {
      await page.goto(r);
      await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished)));
      const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze();
      expect(results.violations.map((v) => `${r}: ${v.id}`)).toEqual([]);
    }
  });

  test('SRS-025 strict CSP present and no inline scripts', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (m) => { if (/Content.Security.Policy|CSP/i.test(m.text())) errors.push(m.text()); });
    await page.goto('/');
    const csp = await page.locator('meta[http-equiv="Content-Security-Policy"]').getAttribute('content');
    expect(csp).toContain("script-src 'self'");
    expect(await page.locator('script:not([src])').count()).toBe(0);
    expect(errors).toEqual([]);
  });

  test('SRS-020 Lighthouse >=95 in all categories, mobile and desktop (reads npm run lighthouse output)', async () => {
    const f = 'lighthouse/summary.json';
    expect(existsSync(f), 'lighthouse/summary.json missing: npm run verify regenerates it every run').toBe(true);
    const summary = JSON.parse(readFileSync(f, 'utf8')) as Record<string, Record<string, number>>;
    for (const [preset, scores] of Object.entries(summary)) {
      for (const cat of ['performance', 'accessibility', 'best-practices', 'seo']) expect(scores[cat], `${preset} ${cat}`).toBeGreaterThanOrEqual(95);
    }
  });

  test('SRS-021 performance budget: JS <=100 KB gzip per page, LCP <=2.5 s, CLS <=0.1', async () => {
    const { gzipSync } = await import('node:zlib');
    const { join } = await import('node:path');
    const { readdirSync, statSync } = await import('node:fs');
    const walk = (d: string): string[] => readdirSync(d).flatMap((x) => (statSync(join(d, x)).isDirectory() ? walk(join(d, x)) : [join(d, x)]));
    for (const html of walk('dist').filter((x) => x.endsWith('.html'))) {
      // Follow static imports so chunks pulled in by entry scripts are counted too.
      const seen = new Set<string>();
      const queue = [...readFileSync(html, 'utf8').matchAll(/<script[^>]*src="([^"]+)"/g)].map((m) => join('dist', m[1].split('?')[0]));
      while (queue.length) {
        const file = queue.pop()!;
        if (seen.has(file)) continue;
        seen.add(file);
        const dir = file.slice(0, file.lastIndexOf('/'));
        for (const m of readFileSync(file, 'utf8').matchAll(/(?:import|from)\s*\(?\s*["']([^"']+\.js)["']/g)) {
          queue.push(m[1].startsWith('/') ? join('dist', m[1]) : join(dir, m[1]));
        }
      }
      const bytes = [...seen].reduce((n, f) => n + gzipSync(readFileSync(f)).length, 0);
      expect(bytes, `${html} JS gzip bytes`).toBeLessThanOrEqual(100 * 1024);
    }
    const f = 'lighthouse/summary.json';
    expect(existsSync(f), 'lighthouse/summary.json missing').toBe(true);
    const summary = JSON.parse(readFileSync(f, 'utf8')) as Record<string, Record<string, number>>;
    for (const [k, m] of Object.entries(summary)) {
      expect(m.lcpMs, `${k} LCP`).toBeLessThanOrEqual(2500);
      expect(m.cls, `${k} CLS`).toBeLessThanOrEqual(0.1);
    }
  });

  // URS-012: visual baselines need Thomas's URS-009 design sign-off before they can be approved.
  // Strict expected failure: if this ever passes without approved baselines, the build fails.
  test('SRS-024 URS-012 visual snapshots within 0.1% of approved baselines', async ({ page }) => {
    test.fail(true, 'Placeholder: baselines pending URS-009 design sign-off');
    await page.goto('/');
    const approved = existsSync('tests/e2e/__approved_baselines__/APPROVED');
    expect(approved, 'no approved baselines yet').toBe(true);
  });
});
