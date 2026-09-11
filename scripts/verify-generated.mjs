import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { readSourceBuffer, root, sha256, sourceSha256 } from './lib.mjs';

const outDir = path.join(root, 'dist');
let payload = '';
for (let i = 1; i <= 4; i += 1) {
  const text = fs.readFileSync(path.join(outDir, `sjhs-payload-${i}.js`), 'utf8');
  const match = text.match(/\+'([^']*)';/);
  if (!match) throw new Error(`payload ${i} wrapper malformed`);
  payload += match[1];
}
const restored = zlib.gunzipSync(Buffer.from(payload, 'base64'));
const source = readSourceBuffer();
if (!restored.equals(source)) throw new Error('generated payload does not restore canonical source byte-for-byte');
if (sha256(restored) !== sourceSha256) throw new Error('generated payload source sha mismatch');
console.log(`PASS generated payload restores ${restored.length} bytes`);
console.log(`PASS source-sha256 ${sha256(restored)}`);
