// SRS-025: OSV vulnerability scan of package-lock.json. Downloads the pinned osv-scanner binary once into .cache/.
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, chmodSync, writeFileSync } from 'node:fs';
const v = '2.2.3';
const bin = `.cache/osv-scanner-${v}`;
if (!existsSync(bin)) {
  mkdirSync('.cache', { recursive: true });
  const arch = process.arch === 'arm64' ? 'arm64' : 'amd64';
  const res = await fetch(`https://github.com/google/osv-scanner/releases/download/v${v}/osv-scanner_${process.platform}_${arch}`);
  if (!res.ok) throw new Error(`osv-scanner download failed: ${res.status}`);
  writeFileSync(bin, Buffer.from(await res.arrayBuffer()));
  chmodSync(bin, 0o755);
}
execFileSync(bin, ['scan', 'source', '--lockfile', 'package-lock.json'], { stdio: 'inherit' });
