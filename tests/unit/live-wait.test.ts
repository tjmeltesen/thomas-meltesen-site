// SRS-031: propagation wait decisions, with mocked fetch.
import { afterEach, describe, expect, it, vi } from 'vitest';
import { waitForDeploy, sha256 } from '../../scripts/live-wait.mjs';

const NEW = '<html>new</html>', OLD = '<html>old</html>';
const H = { 'X-Content-Type-Options': 'nosniff' };
const res = (status: number, body = '', headers: Record<string, string> = H) => new Response(body, { status, headers });
const base = { url: 'https://x.workers.dev/', distHash: sha256(Buffer.from(NEW)), expectedHeaders: H };
afterEach(() => vi.useRealTimers());

describe('SRS-031 waitForDeploy', () => {
  it('SRS-031 404 then 200 with dist hash passes', async () => {
    vi.useFakeTimers();
    const fetchFn = vi.fn().mockResolvedValueOnce(res(404)).mockResolvedValueOnce(res(200, NEW));
    const p = waitForDeploy({ ...base, fetchFn });
    await vi.runAllTimersAsync();
    expect(await p).toEqual({ ok: true, attempts: 2 });
  });
  it('SRS-031 200 with dist hash but wrong headers fails with no retry', async () => {
    const fetchFn = vi.fn().mockResolvedValue(res(200, NEW, {}));
    const r = await waitForDeploy({ ...base, fetchFn });
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/wrong headers/);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });
  it('SRS-031 previous-hash 200 then new hash passes', async () => {
    vi.useFakeTimers();
    const fetchFn = vi.fn().mockResolvedValueOnce(res(200, OLD)).mockResolvedValueOnce(res(200, NEW));
    const p = waitForDeploy({ ...base, previousHash: sha256(Buffer.from(OLD)), fetchFn });
    await vi.runAllTimersAsync();
    expect((await p).ok).toBe(true);
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });
  it('SRS-031 hash matching neither dist nor previous fails at once', async () => {
    const fetchFn = vi.fn().mockResolvedValue(res(200, '<html>other</html>'));
    const r = await waitForDeploy({ ...base, previousHash: sha256(Buffer.from(OLD)), fetchFn });
    expect(r.ok).toBe(false);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });
  it('SRS-031 preview mode (no previous hash): 200 with the old hash fails at once', async () => {
    const fetchFn = vi.fn().mockResolvedValue(res(200, OLD));
    const r = await waitForDeploy({ ...base, previousHash: '', fetchFn });
    expect(r.ok).toBe(false);
    expect(fetchFn).toHaveBeenCalledTimes(1);
  });
  it('SRS-031 404s past 60s time out and fail', async () => {
    vi.useFakeTimers();
    const fetchFn = vi.fn().mockImplementation(async () => res(404));
    const p = waitForDeploy({ ...base, fetchFn });
    await vi.runAllTimersAsync();
    const r = await p;
    expect(r.ok).toBe(false);
    expect(r.reason).toMatch(/timed out after 60s/);
    expect(fetchFn.mock.calls.length).toBeLessThanOrEqual(31);
  });
  it('SRS-031 each request carries a 10s abort signal; a timed-out request is retried as a connection error', async () => {
    vi.useFakeTimers();
    const fetchFn = vi.fn()
      .mockImplementationOnce((_u: string, o: RequestInit) => {
        expect(o.signal).toBeInstanceOf(AbortSignal);
        return Promise.reject(new DOMException('The operation was aborted due to timeout', 'TimeoutError'));
      })
      .mockResolvedValueOnce(res(200, NEW));
    const p = waitForDeploy({ ...base, fetchFn });
    await vi.runAllTimersAsync();
    expect(await p).toEqual({ ok: true, attempts: 2 });
  });
});
