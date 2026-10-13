import { describe, expect, test } from 'vitest';
import { decodeEmail, encodeEmail } from '../../src/lib/email';
import { pickStrategy } from '../../src/scripts/motion';
import * as motion from '../../src/scripts/motion';

describe('email + motion', () => {
  test('SRS-010 email is encoded and only assembled on decode', () => {
    const parts = encodeEmail('tjmeltesen', 'gmail.com');
    expect(parts.join('')).not.toContain('tjmeltesen');
    expect(parts.join('')).not.toContain('gmail');
    expect(decodeEmail(parts)).toBe(['tjmeltesen', 'gmail.com'].join('@'));
  });

  test('SRS-014 motion module exposes init() and no disable()', () => {
    expect(typeof motion.init).toBe('function');
    expect('disable' in motion).toBe(false);
  });

  test('SRS-016 strategy: scroll-timeline, else IntersectionObserver, none for reduced motion', () => {
    const base = { supportsScrollTimeline: true, prefersReducedMotion: false, hasIntersectionObserver: true };
    expect(pickStrategy(base)).toBe('css-scroll-timeline');
    expect(pickStrategy({ ...base, supportsScrollTimeline: false })).toBe('intersection-observer');
    expect(pickStrategy({ ...base, prefersReducedMotion: true })).toBe('none');
    expect(pickStrategy({ ...base, supportsScrollTimeline: false, hasIntersectionObserver: false })).toBe('none');
  });
});
