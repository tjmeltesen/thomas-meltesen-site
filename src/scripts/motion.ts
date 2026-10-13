/**
 * Motion module (SRS-014, SRS-016). Components opt in declaratively with
 * `data-reveal`; this module never runs before first paint and only adds
 * enhancements. CSS owns all timing, so reduced motion needs no JS (SRS-015).
 */
export interface MotionEnv {
  supportsScrollTimeline: boolean;
  prefersReducedMotion: boolean;
  hasIntersectionObserver: boolean;
}

export type RevealStrategy = 'none' | 'css-scroll-timeline' | 'intersection-observer';

export function pickStrategy(env: MotionEnv): RevealStrategy {
  if (env.prefersReducedMotion) return 'none';
  if (env.supportsScrollTimeline) return 'css-scroll-timeline';
  if (env.hasIntersectionObserver) return 'intersection-observer';
  return 'none';
}

export function detectEnv(win: Window = window): MotionEnv {
  return {
    supportsScrollTimeline: !!(win as Window & typeof globalThis).CSS?.supports?.('animation-timeline: view()'),
    prefersReducedMotion: win.matchMedia('(prefers-reduced-motion: reduce)').matches,
    hasIntersectionObserver: 'IntersectionObserver' in win,
  };
}

let observer: IntersectionObserver | null = null;

export function init(root: Document = document): RevealStrategy {
  const strategy = pickStrategy(detectEnv());
  root.documentElement.dataset.motion = strategy;
  if (strategy !== 'intersection-observer') return strategy;

  root.documentElement.classList.add('io');
  const vh = window.innerHeight;
  const targets = [...root.querySelectorAll<HTMLElement>('[data-reveal]')];
  observer = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (e.isIntersecting) {
          e.target.classList.remove('is-pending');
          observer?.unobserve(e.target);
        }
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
  );
  for (const el of targets) {
    // Only hide what the visitor can't see yet, so nothing flashes.
    if (el.getBoundingClientRect().top > vh) {
      el.classList.add('is-pending');
      observer.observe(el);
    }
  }
  return strategy;
}

export function destroy(root: Document = document): void {
  observer?.disconnect();
  observer = null;
  root.querySelectorAll('.is-pending').forEach((el) => el.classList.remove('is-pending'));
}
