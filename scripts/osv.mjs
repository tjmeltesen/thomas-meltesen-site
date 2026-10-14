// SRS-025: OSV vulnerability scan of package-lock.json. Downloads the pinned osv-scanner binary once into .cache/.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { existsSync, mkdirSync, chmodSync, writeFileSync } from 'node:fs';
const v = '2.2.3';
const bin = `.cache/osv-scanner-${v}`;
// Pinned from the release's osv-scanner_SHA256SUMS. Verified before every run.
const SHA256 = {
  linux_amd64: '8cdb138b36cdb9c99c455cafb32a1c83e1823448dc00e1c8ab9afe474a5e93f0',
  linux_arm64: '7033a49a9566da169529b40bb12e90752b1498151d9e1927506781d36019f689',
  darwin_amd64: 'f20893dffc30411babf816e7799265c671ef6a5c8907408c889f00cd26d13a38',
  darwin_arm64: '2df8fe87db40ec268884bc2bfc984d2ea4f0de528a0c54803d20f7dccf307002',
};
const target = `${process.platform}_${process.arch === 'arm64' ? 'arm64' : 'amd64'}`;
if (!SHA256[target]) throw new Error(`osv-scanner: no pinned checksum for ${target}`);
if (!existsSync(bin)) {
  mkdirSync('.cache', { recursive: true });
  const arch = process.arch === 'arm64' ? 'arm64' : 'amd64';
  const res = await fetch(`https://github.com/google/osv-scanner/releases/download/v${v}/osv-scanner_${process.platform}_${arch}`);
  if (!res.ok) throw new Error(`osv-scanner download failed: ${res.status}`);
  writeFileSync(bin, Buffer.from(await res.arrayBuffer()));
  chmodSync(bin, 0o755);
}
const got = createHash('sha256').update(readFileSync(bin)).digest('hex');
if (got !== SHA256[target]) throw new Error(`osv-scanner checksum mismatch for ${target}: ${got}`);
execFileSync(bin, ['scan', 'source', '--lockfile', 'package-lock.json'], { stdio: 'inherit' });
