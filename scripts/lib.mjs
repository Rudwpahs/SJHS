import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const sourcePath = path.join(root, 'src', 'SJHS_Memory_Palace_UIUX.html');
export const sourceSha256 = '6cbf673c13c4a07d57855686d12991847fdf350b9e360bc58e9090dc261ce323';
export const readSourceBuffer = () => fs.readFileSync(sourcePath);
export const sha256 = data => crypto.createHash('sha256').update(data).digest('hex');
export const gitBlobSha = data => crypto.createHash('sha1').update(`blob ${data.length}\0`).update(data).digest('hex');

export function extractGraph(sourceText) {
  const startToken = 'const graph = ';
  const start = sourceText.indexOf(startToken);
  const end = sourceText.indexOf('\n\nconst LEVEL_THRESHOLDS', start);
  if (start < 0 || end < 0) throw new Error('graph payload markers not found');
  const raw = sourceText.slice(start + startToken.length, end).trim().replace(/;$/, '');
  return JSON.parse(raw);
}
