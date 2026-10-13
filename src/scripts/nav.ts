/** SRS-011: highlight the nav item for the section in view. */
export function initNav(root: Document = document): void {
  const links = [...root.querySelectorAll<HTMLAnchorElement>('[data-nav-link]')];
  const sections = links
    .map((a) => root.getElementById(a.dataset.navLink!))
    .filter((s): s is HTMLElement => !!s);
  if (!sections.length || !('IntersectionObserver' in window)) return;
  const set = (id: string | null) =>
    links.forEach((a) => (a.dataset.navLink === id ? a.setAttribute('aria-current', 'true') : a.removeAttribute('aria-current')));
  const visible = new Map<string, number>();
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) visible.set(e.target.id, e.isIntersecting ? e.intersectionRatio : 0);
      let best: string | null = null; let max = 0;
      for (const s of sections) { const r = visible.get(s.id) ?? 0; if (r > max) { max = r; best = s.id; } }
      set(best);
    },
    { rootMargin: '-45% 0px -45% 0px', threshold: [0, 0.01, 0.5, 1] },
  );
  sections.forEach((s) => io.observe(s));
}
