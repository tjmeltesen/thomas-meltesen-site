// Renders the Open Graph card and apple-touch icon into public/ (run once: node scripts/make-images.mjs).
import { chromium } from '@playwright/test';
const og = `<html><body style="margin:0;width:1200px;height:630px;display:grid;place-items:center;background:#000;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;overflow:hidden">
<div style="position:absolute;inset:0;background:radial-gradient(40% 50% at 25% 30%,#2997ff55,transparent 70%),radial-gradient(40% 50% at 75% 60%,#a970ff55,transparent 70%)"></div>
<div style="position:relative;text-align:center;color:#f5f5f7"><div style="font-size:120px;font-weight:700;letter-spacing:-5px;line-height:1">Thomas<br><span style="background:linear-gradient(100deg,#2997ff,#a970ff 55%,#ff5fa8);-webkit-background-clip:text;color:transparent">Meltesen</span></div>
<div style="font-size:34px;color:#a1a1a6;margin-top:28px">AI &amp; Agentic Systems Engineer</div></div></body></html>`;
const icon = `<html><body style="margin:0;width:180px;height:180px;display:grid;place-items:center;background:linear-gradient(140deg,#0071e3,#7d3cff 60%,#e8368f);font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif"><div style="color:#fff;font-size:76px;font-weight:700;letter-spacing:-3px">TM</div></body></html>`;
const b = await chromium.launch();
for (const [html, w, h, out] of [[og, 1200, 630, 'public/og.png'], [icon, 180, 180, 'public/apple-touch-icon.png']]) {
  const p = await b.newPage({ viewport: { width: w, height: h } });
  await p.setContent(html);
  await p.screenshot({ path: out });
}
await b.close();
