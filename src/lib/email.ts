/**
 * SRS-010: the address is never written to HTML. The build emits a reversed,
 * base64-encoded token; the browser decodes it only when the button is pressed.
 */
const b64encode = (s: string) => btoa(s);
const b64decode = (s: string) => atob(s);

export function encodeEmail(user: string, domain: string): string[] {
  return [b64encode([...user].reverse().join('')), b64encode([...domain].reverse().join(''))];
}

export function decodeEmail(parts: string[]): string {
  const [u, d] = parts.map((p) => [...b64decode(p)].reverse().join(''));
  return `${u}\u0040${d}`;
}
