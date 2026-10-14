// SRS-022 (WCAG 2.2 AA): axe can't measure gradient-clipped text, so check the hero headline's
// gradient stops explicitly against the page background (--bg) and the brightest point of the hero glow behind it.
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/styles/global.css', 'utf8');
const lum = (c: number[]) => {
  const [r, g, b] = c.map((v) => { const s = v / 255; return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4; });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a: number[], b: number[]) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
const parse = (stop: string): number[] => {
  if (stop.startsWith('#')) { let h = stop.slice(1); if (h.length === 3) h = [...h].map((c) => c + c).join(''); return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)); }
  const m = stop.match(/rgb\((\d+) (\d+) (\d+)(?: \/ ([\d.]+))?\)/);
  if (!m) throw new Error(`unparsed stop ${stop}`);
  const a = m[4] ? Number(m[4]) : 1;
  return [m[1], m[2], m[3]].map((v) => Math.round(Number(v) * a)); // composited over black
};

const hex = (h: string) => parse(h);
const bg = hex(css.match(/--bg: (#[0-9a-f]{6})/)![1]);
// Worst case for the glow: both radial peaks at full strength stacked on --bg (source-over).
const over = (top: number[], a: number, base: number[]) => base.map((v, i) => Math.round(top[i] * a + v * (1 - a)));
const glowAlphas = [...css.matchAll(/radial-gradient\([^,]+, rgb\((\d+) (\d+) (\d+) \/ ([\d.]+)\)/g)].map((m) => ({ c: [m[1], m[2], m[3]].map(Number), a: Number(m[4]) }));
const glowPeak = glowAlphas.reduce((acc, g) => over(g.c, g.a, acc), bg);

const rgbOf = (s: string) => s.startsWith('#') ? parse(s) : s.match(/(\d+) (\d+) (\d+)/)!.slice(1, 4).map(Number);
const alphaOf = (s: string) => Number(s.match(/\/ ([\d.]+)/)?.[1] ?? 1);

describe('SRS-022 hero gradient headline contrast', () => {
  it('finds the hero glow layers', () => expect(glowAlphas.length).toBeGreaterThanOrEqual(2));
  it('every gradient stop clears 4.5:1 on --bg and on the glow peak (stricter than the 3:1 large-text rule)', () => {
    const rule = css.match(/\.hero h1 \{[^}]*linear-gradient\(([^;]+)\);/);
    expect(rule, '.hero h1 gradient not found').toBeTruthy();
    const stops = [...rule![1].matchAll(/(#[0-9a-f]{6}\b|#[0-9a-f]{3}\b|rgb\([^)]+\))/gi)].map((m) => m[1]);
    expect(stops.length).toBeGreaterThanOrEqual(2);
    for (const s of stops) {
      const fg = (alphaOf(s) < 1 ? null : parse(s));
      for (const [name, base] of [['--bg', bg], ['glow peak', glowPeak]] as const) {
        const c = fg ?? over([255, 255, 255].map((_, i) => rgbOf(s)[i]), alphaOf(s), base);
        expect(ratio(c, base), `${s} on ${name}`).toBeGreaterThanOrEqual(4.5);
      }
    }
  });
  it('solid card tint keeps body text and muted text above 4.5:1', () => {
    expect(ratio([0xf5, 0xf5, 0xf7], [0x0f, 0x0f, 0x11])).toBeGreaterThanOrEqual(4.5);
    expect(ratio([0xa1, 0xa1, 0xa6], [0x0f, 0x0f, 0x11])).toBeGreaterThanOrEqual(4.5);
  });
});
