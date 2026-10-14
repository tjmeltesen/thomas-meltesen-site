// SRS-029: writes dist/_headers from the shared security-headers module after astro build.
import { existsSync, writeFileSync } from 'node:fs';
import { renderHeaders, ASSETS_DIR } from '../src/lib/security-headers.mjs';
if (!existsSync(`dist/${ASSETS_DIR}`)) { console.error(`write-headers: dist/${ASSETS_DIR} missing; astro build.assets changed?`); process.exit(1); }
writeFileSync('dist/_headers', renderHeaders());
console.log('write-headers: dist/_headers written');
