export function sha256(b: Buffer): string;
export function waitForDeploy(o: { url: string; distHash: string; previousHash?: string; expectedHeaders?: Record<string, string>; fetchFn?: typeof fetch; timeoutMs?: number; intervalMs?: number; log?: (m: string) => void }): Promise<{ ok: boolean; attempts?: number; reason?: string }>;
