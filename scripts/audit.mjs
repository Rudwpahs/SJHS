import { extractGraph, readSourceBuffer, sha256, sourceSha256 } from './lib.mjs';

const source = readSourceBuffer();
const text = source.toString('utf8');
const graph = extractGraph(text);
const checks = [
  ['verified source sha', sha256(source) === sourceSha256],
  ['24 curriculum units', graph.curriculumUnits.length === 24],
  ['198 concepts', graph.nodes.length === 198],
  ['291 relations', graph.edges.length === 291],
  ['44px hit target token', /--control-hit-size:\s*44px/.test(text)],
  ['reduced motion support', /prefers-reduced-motion:\s*reduce/.test(text)],
  ['keyboard-focusable canvas', /<canvas[^>]+tabindex="0"/.test(text)],
  ['semantic live region', /id="map-status"[^>]+aria-live="polite"/.test(text)],
  ['no remote script', !/<script[^>]+src=["']https?:/i.test(text)],
  ['no remote stylesheet', !/<link[^>]+href=["']https?:/i.test(text)],
];

const failures = checks.filter(([, ok]) => !ok);
for (const [name, ok] of checks) console.log(`${ok ? 'PASS' : 'FAIL'} ${name}`);
if (failures.length) process.exit(1);
