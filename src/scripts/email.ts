import { decodeEmail } from '../lib/email';

/** SRS-010: assemble the address only when the visitor asks for it. */
export function initEmail(root: Document = document): void {
  root.querySelectorAll<HTMLElement>('[data-email-reveal]').forEach((box) => {
    const btn = box.querySelector<HTMLButtonElement>('[data-email-button]')!;
    const link = box.querySelector<HTMLAnchorElement>('[data-email-link]')!;
    const fallback = box.querySelector<HTMLElement>('[data-email-fallback]')!;
    const status = box.querySelector<HTMLElement>('[data-email-status]')!;
    btn.hidden = false;
    fallback.hidden = true;
    btn.addEventListener('click', () => {
      const addr = decodeEmail([box.dataset.a!, box.dataset.b!]);
      link.href = `mailto:${addr}`;
      link.textContent = addr;
      link.hidden = false;
      btn.hidden = true;
      status.textContent = `Email address revealed: ${addr}`;
      link.focus();
    });
  });
}
