// Captures desktop hero, projects section and mobile views in light and dark (needs `npm run preview` running).
import { chromium } from '@playwright/test';
const base = process.env.BASE_URL ?? 'http://localhost:4321';
const b = await chromium.launch();
for (const scheme of ['light', 'dark']) {
  const desk = await b.newPage({ viewport: { width: 1440, height: 900 }, colorScheme: scheme });
  await desk.goto(base); await desk.waitForTimeout(1200);
  await desk.screenshot({ path: `screenshots/desktop-hero-${scheme}.png` });
  await desk.setViewportSize({ width: 1440, height: 1080 });
  await desk.evaluate(() => scrollTo({ top: document.getElementById('projects').offsetTop + 40, behavior: 'instant' }));
  await desk.waitForTimeout(900);
  await desk.screenshot({ path: `screenshots/desktop-projects-${scheme}.png` });
  await desk.setViewportSize({ width: 1440, height: 900 });
  await desk.goto(`${base}/projects/smart-mirror/`); await desk.waitForTimeout(1200);
  await desk.screenshot({ path: `screenshots/desktop-detail-${scheme}.png` });
  const mob = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, colorScheme: scheme });
  await mob.goto(base); await mob.waitForTimeout(1200);
  await mob.screenshot({ path: `screenshots/mobile-hero-${scheme}.png` });
  await mob.evaluate(() => document.getElementById('projects').scrollIntoView({ behavior: 'instant' }));
  await mob.waitForTimeout(900);
  await mob.screenshot({ path: `screenshots/mobile-projects-${scheme}.png` });
}
await b.close();
console.log('screenshots written to screenshots/');
