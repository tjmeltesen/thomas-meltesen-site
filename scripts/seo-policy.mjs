// SRS-031: which Lighthouse audits the live check may skip, decided per page from its real response.
// Preview (explicit --preview flag only): skip is-crawlable ONLY when the response carries
// X-Robots-Tag: noindex (Cloudflare adds it to version preview URLs). Production: noindex is a failure.
// Nothing else is ever skipped and no threshold changes.
export const hasNoindex = (robotsTag) =>
  String(robotsTag ?? '').split(/[,\s]+/).some((d) => d.trim().toLowerCase() === 'noindex');

export function seoPolicy({ preview, robotsTag }) {
  const noindex = hasNoindex(robotsTag);
  if (preview) return { ok: true, skipAudits: noindex ? ['is-crawlable'] : [] };
  return noindex
    ? { ok: false, skipAudits: [], reason: `production serves X-Robots-Tag: ${robotsTag}` }
    : { ok: true, skipAudits: [] };
}
