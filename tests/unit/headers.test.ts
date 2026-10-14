// SRS-029: dist/_headers carries the ADR-006 security + cache headers, and its CSP equals the <meta> CSP.
import { readFileSync, existsSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { CSP } from '../../src/lib/security-headers.mjs';

const headers = existsSync('dist/_headers') ? readFileSync('dist/_headers', 'utf8') : '';
const block = (path: string) => {
  const parts = headers.split(/\n\s*\n/).map((b) => b.trim().split('\n'));
  const b = parts.find((l) => l[0] === path);
  if (!b) throw new Error(`no ${path} rule`);
  return b.slice(1).map((l) => l.trim());
};
describe('SRS-029 dist/_headers', () => {
  it('SRS-029 /* has the exact security headers and HTML cache', () => {
    expect(block('/*')).toEqual([
      `Content-Security-Policy: ${CSP}`,
      'Strict-Transport-Security: max-age=31536000',
      'X-Content-Type-Options: nosniff',
      'Referrer-Policy: strict-origin-when-cross-origin',
      expect.stringMatching(/^Permissions-Policy: camera=\(\), microphone=\(\), geolocation=\(\), payment=\(\), usb=\(\), interest-cohort=\(\)/),
      'Cross-Origin-Opener-Policy: same-origin',
      'Cache-Control: public, max-age=0, must-revalidate',
    ]);
    expect(CSP).toContain("script-src 'self'");
    expect(CSP).not.toMatch(/sha256-|unsafe-/);
  });
  it('SRS-029 /_assets/* is immutable and detaches the HTML cache rule', () => {
    expect(block('/_assets/*')).toEqual(['! Cache-Control', 'Cache-Control: public, max-age=31536000, immutable']);
  });
  it('SRS-029 header CSP equals the built <meta> CSP', () => {
    const html = readFileSync('dist/index.html', 'utf8');
    const meta = html.match(/http-equiv="Content-Security-Policy" content="([^"]+)"/)?.[1].replace(/&#39;/g, "'");
    expect(meta).toBe(CSP);
  });
});
