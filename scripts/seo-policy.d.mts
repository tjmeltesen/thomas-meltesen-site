export function hasNoindex(robotsTag: string | null | undefined): boolean;
export function seoPolicy(o: { preview: boolean; robotsTag: string | null | undefined }):
  { ok: boolean; skipAudits: string[]; reason?: string };
