// SRS-031: waits for a fresh deploy to be served before the live check asserts anything.
// Retries ONLY on: 404, connection error, or a 200 whose HTML sha256 equals previousHash (old version
// still propagating). Once the HTML hash equals distHash, headers are checked exactly once.
// Each request is aborted after requestTimeoutMs (10s) and treated as a connection error.
// Any other 200 hash, wrong headers, or the timeout fails immediately.
import { createHash } from 'node:crypto';

export const sha256 = (b) => createHash('sha256').update(b).digest('hex');

export async function waitForDeploy({ url, distHash, previousHash = '', expectedHeaders = {},
  fetchFn = fetch, timeoutMs = 60_000, requestTimeoutMs = 10_000, intervalMs = 2_000, log = () => {} }) {
  const start = Date.now();
  for (let attempt = 1; ; attempt++) {
    let retry;
    try {
      const r = await fetchFn(url, { redirect: 'follow', cache: 'no-store', signal: AbortSignal.timeout(requestTimeoutMs) });
      if (r.status === 404) retry = '404';
      else if (r.status !== 200) return { ok: false, reason: `status ${r.status}` };
      else {
        const hash = sha256(Buffer.from(await r.arrayBuffer()));
        if (hash === distHash) {
          const bad = Object.entries(expectedHeaders).filter(([k, v]) => r.headers.get(k) !== v)
            .map(([k, v]) => `${k}: got ${JSON.stringify(r.headers.get(k))}, want ${JSON.stringify(v)}`);
          return bad.length ? { ok: false, reason: `wrong headers: ${bad.join('; ')}` } : { ok: true, attempts: attempt };
        }
        if (previousHash && hash === previousHash) retry = 'previous version still served';
        else return { ok: false, reason: `served HTML sha256 ${hash.slice(0, 12)} matches neither dist ${distHash.slice(0, 12)} nor previous` };
      }
    } catch (e) {
      retry = `connection error: ${e.message}`;
    }
    if (Date.now() - start + intervalMs > timeoutMs) return { ok: false, reason: `timed out after ${timeoutMs / 1000}s (last: ${retry})` };
    log(`waiting for propagation (${retry}), attempt ${attempt}`);
    await new Promise((res) => setTimeout(res, intervalMs));
  }
}
