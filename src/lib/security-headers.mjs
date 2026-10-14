// Single source for the CSP (SRS-025) and the Cloudflare _headers file (SRS-029, ADR-006).
// Base.astro uses CSP for its <meta> tag; scripts/write-headers.mjs writes dist/_headers from it,
// so the header and meta CSP cannot drift.
export const CSP = [
  "default-src 'self'", "script-src 'self'", "style-src 'self'", "img-src 'self' data:",
  "font-src 'self'", "connect-src 'self'", "object-src 'none'", "base-uri 'self'", "form-action 'self'",
].join('; ');

export const SECURITY_HEADERS = {
  'Content-Security-Policy': CSP,
  'Strict-Transport-Security': 'max-age=31536000',
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=(), browsing-topics=(), magnetometer=(), gyroscope=(), accelerometer=()',
  'Cross-Origin-Opener-Policy': 'same-origin',
};
export const HTML_CACHE = 'public, max-age=0, must-revalidate';
export const ASSET_CACHE = 'public, max-age=31536000, immutable';
export const ASSETS_DIR = '_assets';

// Cloudflare merges every matching rule, so the /_assets/* rule detaches the HTML Cache-Control first ("! Cache-Control").
export function renderHeaders() {
  const lines = ['/*', ...Object.entries(SECURITY_HEADERS).map(([k, v]) => `  ${k}: ${v}`), `  Cache-Control: ${HTML_CACHE}`,
    '', `/${ASSETS_DIR}/*`, '  ! Cache-Control', `  Cache-Control: ${ASSET_CACHE}`, ''];
  return lines.join('\n');
}
