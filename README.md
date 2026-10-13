# Thomas Meltesen — personal site

A fast, static, Apple-inspired portfolio built with **Astro 5 + TypeScript**, plain modern CSS and a tiny
vanilla motion module. No UI framework, no backend, no runtime network calls.

## Run it

```bash
npm install && npm run dev        # http://localhost:4321
```

Production build:

```bash
npm run build && npm run preview  # http://localhost:4321
```

Requires Node 20+.

## Edit content

Everything you see lives in typed JSON under `src/data/`, validated with Zod (`src/lib/schemas.ts`).
A typo in a field name or a bad date **fails the build** (SRS-001).

| File | What |
| --- | --- |
| `profile.json` | Name, headline, location, bio, photo, monogram |
| `education.json`, `experience.json` | Resume entries (experience is sorted newest-first in code) |
| `projects.json` | 6 projects; each also gets a page at `/projects/<slug>/` |
| `skills.json`, `hobbies.json` | Skill groups and hobbies |
| `contact.json` | Email parts, LinkedIn, GitHub. There is intentionally no phone field. |

**Add your photo:** drop a square image (800×800 or larger) at `src/assets/thomas.jpg` and set
`"photo": "thomas.jpg"` in `profile.json`. It's converted to responsive AVIF automatically. Leave it `null`
to keep the TM monogram.

## How it works

- **Routes:** `/`, `/projects/[slug]/`, custom `404`. Each has a title, description, Open Graph tags and favicon.
- **Motion:** all motion is in CSS inside `@media (prefers-reduced-motion: no-preference)`, so reduced motion is
  the default and needs no script. Scroll reveals use `animation-timeline: view()` behind `@supports`;
  other browsers get an IntersectionObserver fallback (`src/scripts/motion.ts`). Cross-page fades use
  CSS View Transitions where supported, with plain navigation everywhere else.
- **Security:** strict CSP (`script-src 'self'`, `style-src 'self'`), no inline scripts or styles (checked after
  every build by `scripts/check-dist.mjs`), and everything is self-hosted (system font stack).
- **Email:** the address is never written into HTML. The "Show email address" button decodes it in the browser.
  Without JS, a note points to LinkedIn and GitHub.

## Tests

```bash
npm run test:unit        # Vitest: schemas, sorting, email encoding, motion strategy
npm run test:e2e         # Playwright (Chromium, Firefox, WebKit) + axe; builds must exist (npm run build)
npm run lighthouse       # median of 3, mobile + desktop, needs `npm run preview` running
npm run screenshots      # light/dark desktop + mobile screenshots into screenshots/
```

Every test is named with its SRS ID. Unfinished requirements are **strict expected failures**
(`test.fail()`): CI stays green, and the build breaks if one starts passing before it's built for real.
The frame-timing test (SRS-019) uses CDP 4x CPU throttling, so it runs in Chromium only.

## Traceability

| URS | SRS | Test |
| --- | --- | --- |
| 001 | 003 | e2e `SRS-003`, unit `SRS-003` |
| 002 | 002, 004 | unit `SRS-002`, e2e `SRS-004` |
| 003 | 005 | unit + e2e `SRS-005` |
| 004 | 006 | unit + e2e `SRS-006` |
| 005 | 007 | unit + e2e `SRS-007` |
| 006 | 008 | unit + e2e `SRS-008` |
| 007 | 009 | unit + e2e `SRS-009` |
| 008 | 001 | unit `SRS-001` |
| 009 | — | Thomas's design review (taste, single sign-off) |
| 010 | 014, 019 | unit `SRS-014`, e2e `SRS-014`, `SRS-019` (Chromium) |
| 011 | 015, 023 | e2e `SRS-015 SRS-023` |
| 012 | 016, 024 | unit + e2e `SRS-016`, e2e `SRS-024` (no-JS), visual-snapshot placeholder (strict xfail) |
| 013 | — | e2e `URS-013` |
| 014 | 020, 021 | e2e `SRS-020` reading `lighthouse/summary.json` |
| 015 | 011, 022 | e2e `SRS-011`, `SRS-022` |
| 016 | 017 (merged with 026) | e2e `SRS-017` |
| 017 | 018 | e2e `SRS-018` |
| 018, 021 | 012 | e2e `SRS-012` |
| 019 | 013 | e2e `SRS-013` |
| 020 | 010 | unit + e2e `SRS-010`, `scripts/check-dist.mjs` |
| derived | 025 | e2e `SRS-025`, `check-dist.mjs`, `npm audit` in CI |
