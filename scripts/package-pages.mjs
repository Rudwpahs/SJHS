import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';
import { extractGraph, gitBlobSha, readSourceBuffer, root, sha256 } from './lib.mjs';

const source = readSourceBuffer();
const sourceHash = sha256(source);
const outDir = path.join(root, 'dist');
fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

const compressed = zlib.gzipSync(source, { level: 9, mtime: 0 });
const payload = compressed.toString('base64');
const chunkCount = 4;
const chunkSize = Math.ceil(payload.length / chunkCount);
const payloadFiles = [];
for (let i = 0; i < chunkCount; i += 1) {
  const chunk = payload.slice(i * chunkSize, (i + 1) * chunkSize);
  const content = `window.__SJHS_PAYLOAD=(window.__SJHS_PAYLOAD||'')+'${chunk}';\n`;
  const name = `sjhs-payload-${i + 1}.js`;
  fs.writeFileSync(path.join(outDir, name), content);
  payloadFiles.push([name, gitBlobSha(Buffer.from(content))]);
}

const cacheKey = sourceHash.slice(0, 8);
const scripts = payloadFiles.map(([name]) => `  <script src="./${name}?v=${cacheKey}"></script>`).join('\n');
const loader = `<!doctype html>\n<html lang="ko">\n<head>\n  <meta charset="utf-8">\n  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n  <meta name="theme-color" content="hsl(225 34% 4%)">\n  <title>SJHS Science Memory Palace</title>\n  <style>html,body{margin:0;min-height:100%;background:#080b12;color:#f5f7fb;font:16px/1.5 system-ui,sans-serif}body{display:grid;place-items:center}.boot{opacity:.72}</style>\n</head>\n<body>\n  <p class="boot" role="status">Loading SJHS Memory Palace…</p>\n  <script>window.__SJHS_PAYLOAD='';</script>\n${scripts}\n  <script>\n  (async()=>{\n    const bytes=Uint8Array.from(atob(window.__SJHS_PAYLOAD),c=>c.charCodeAt(0));\n    const stream=new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'));\n    const text=await new Response(stream).text();\n    document.open(); document.write(text); document.close();\n  })().catch(error=>{\n    document.body.innerHTML='<pre style="padding:24px;white-space:pre-wrap">Failed to load SJHS Memory Palace: '+String(error)+'</pre>';\n  });\n  </script>\n</body>\n</html>`;
fs.writeFileSync(path.join(outDir, 'index.html'), loader);
fs.writeFileSync(path.join(outDir, '.nojekyll'), '');

const graph = extractGraph(source.toString('utf8'));
const unitIds = new Set(graph.curriculumUnits.map(unit => unit.id));
const mapped = new Set();
for (const node of graph.nodes) for (const ref of node.curriculumRefs ?? []) if (unitIds.has(ref)) mapped.add(ref);
const nodeIds = graph.nodes.map(node => node.id);
const nodeIdSet = new Set(nodeIds);
const danglingEdges = graph.edges.filter(edge => !nodeIdSet.has(edge.source) || !nodeIdSet.has(edge.target)).length;
const coverage = {
  generated_at: new Date().toISOString().slice(0, 10),
  curriculum_items_total: graph.curriculumUnits.length,
  curriculum_items_mapped: mapped.size,
  curriculum_items_orphaned: graph.curriculumUnits.length - mapped.size,
  required_units_missing: graph.curriculumUnits.length - mapped.size,
  duplicate_node_ids: nodeIds.length - nodeIdSet.size,
  dangling_edges: danglingEdges,
  node_count: graph.nodes.length,
  edge_count: graph.edges.length,
  deep_nodes: graph.nodes.filter(node => node.level >= 4).length,
  personal_nodes: graph.nodes.filter(node => node.community === 'personal').length,
  modern_physics_nodes: graph.nodes.filter(node => node.community === 'modern').length,
  source_sha256: sourceHash,
};
fs.writeFileSync(path.join(outDir, 'coverage-report.json'), `${JSON.stringify(coverage, null, 2)}\n`);
fs.writeFileSync(path.join(outDir, 'payload-integrity.expected'), `${payloadFiles.map(([name, hash]) => `${name} ${hash}`).join('\n')}\nsource-sha256 ${sourceHash}\n`);
console.log(`Built ${outDir}`);
console.log(`source-sha256 ${sourceHash}`);
