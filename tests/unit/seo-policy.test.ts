// SRS-031: preview/production SEO skip policy.
import { describe, expect, it } from 'vitest';
import { seoPolicy } from '../../scripts/seo-policy.mjs';

describe('SRS-031 seoPolicy', () => {
  it('SRS-031 preview skips is-crawlable only when X-Robots-Tag noindex is present', () => {
    expect(seoPolicy({ preview: true, robotsTag: 'noindex' })).toEqual({ ok: true, skipAudits: ['is-crawlable'] });
    expect(seoPolicy({ preview: true, robotsTag: 'noindex, nofollow' }).skipAudits).toEqual(['is-crawlable']);
    expect(seoPolicy({ preview: true, robotsTag: null })).toEqual({ ok: true, skipAudits: [] });
    expect(seoPolicy({ preview: true, robotsTag: 'nofollow' })).toEqual({ ok: true, skipAudits: [] });
  });
  it('SRS-031 production fails on X-Robots-Tag noindex and skips nothing', () => {
    const r = seoPolicy({ preview: false, robotsTag: 'noindex' });
    expect(r.ok).toBe(false);
    expect(r.skipAudits).toEqual([]);
    expect(r.reason).toMatch(/noindex/);
    expect(seoPolicy({ preview: false, robotsTag: null })).toEqual({ ok: true, skipAudits: [] });
  });
});
