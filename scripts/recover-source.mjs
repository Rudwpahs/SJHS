import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { root, sha256, sourcePath, sourceSha256 } from './lib.mjs';

const ifMissing = process.argv.includes('--if-missing');
if (ifMissing && fs.existsSync(sourcePath)) process.exit(0);

let payload = '';
for (let i = 1; i <= 4; i += 1) {
  const payloadPath = path.join(root, `sjhs-payload-${i}.js`);
  const text = fs.readFileSync(payloadPath, 'utf8');
  const match = text.match(/\+'([^']*)';/);
  if (!match) throw new Error(`payload ${i} wrapper malformed`);
  payload += match[1];
}

const source = zlib.gunzipSync(Buffer.from(payload, 'base64'));
const hash = sha256(source);
if (hash !== sourceSha256) throw new Error(`recovered source SHA mismatch: ${hash}`);
fs.mkdirSync(path.dirname(sourcePath), { recursive: true });
fs.writeFileSync(sourcePath, source);
console.log(`Recovered ${source.length} bytes -> ${path.relative(root, sourcePath)}`);
console.log(`source-sha256 ${hash}`);
