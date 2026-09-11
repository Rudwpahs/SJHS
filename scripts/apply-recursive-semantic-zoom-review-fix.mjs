import crypto from 'node:crypto';
import fs from 'node:fs';

const sourcePath='src/SJHS_Memory_Palace_UIUX.html';
const helpersPath='tests/helpers.mjs';
const testsPath='tests/source.test.mjs';
const libPath='scripts/lib.mjs';
const readmePath='README.md';
const statusPath='docs/superpowers/plans/2026-09-11-recursive-semantic-zoom-status.md';

let source=fs.readFileSync(sourcePath,'utf8');
const scopedMarker='function getScopedVisibleNodes(graph, hierarchy, zoom, filters = {}, focusRootId = null) {';
const helper=`function semanticLevelForNode(hierarchy, focusRootId, node) {
  if (!node) return 0;
  if (!focusRootId) return node.level ?? 0;
  const relativeDepth = hierarchyDepthFrom(hierarchy, focusRootId, node.id);
  return relativeDepth ?? node.level ?? 0;
}

`;
if(!source.includes('function semanticLevelForNode(')){
  if(!source.includes(scopedMarker)) throw new Error('scoped visibility marker missing');
  source=source.replace(scopedMarker,helper+scopedMarker);
}
const oldFocus=`  function focusNode(node) {
    if (!node) return;
    const needed = zoomThresholdForLevel(node.level) + 0.28;`;
const newFocus=`  function focusNode(node) {
    if (!node) return;
    const semanticLevel = semanticLevelForNode(semanticHierarchy, state.focusRootId, node);
    const needed = zoomThresholdForLevel(semanticLevel) + 0.28;`;
if(source.includes(oldFocus)) source=source.replace(oldFocus,newFocus);
if(!source.includes('const semanticLevel = semanticLevelForNode(semanticHierarchy, state.focusRootId, node);')) throw new Error('focusNode semantic level wiring missing');
fs.writeFileSync(sourcePath,source);

const sourceBuffer=fs.readFileSync(sourcePath);
const sourceSha=crypto.createHash('sha256').update(sourceBuffer).digest('hex');
const sourceSize=sourceBuffer.length;

let helpers=fs.readFileSync(helpersPath,'utf8');
helpers=helpers.replace(/export const expectedSourceSha = '[0-9a-f]+';/,`export const expectedSourceSha = '${sourceSha}';`);
fs.writeFileSync(helpersPath,helpers);

let lib=fs.readFileSync(libPath,'utf8');
lib=lib.replace(/export const sourceSha256 = '[0-9a-f]+';/,`export const sourceSha256 = '${sourceSha}';`);
fs.writeFileSync(libPath,lib);

let tests=fs.readFileSync(testsPath,'utf8');
if(!tests.includes("import vm from 'node:vm';")) tests=tests.replace("import crypto from 'node:crypto';", "import crypto from 'node:crypto';\nimport vm from 'node:vm';");
if(!tests.includes('expectedSourceSha, extractScript')) tests=tests.replace("import { readSource, loadRuntime, expectedSourceSha } from './helpers.mjs';", "import { readSource, loadRuntime, expectedSourceSha, extractScript } from './helpers.mjs';");
const additions=`

test('41 semantic navigation level is relative inside a focus scope', () => {
  const script = extractScript();
  const context = { console };
  vm.createContext(context);
  vm.runInContext(\`${'${script}'}\\n;globalThis.__LEVEL__ = typeof semanticLevelForNode === 'function' ? semanticLevelForNode : null; globalThis.__H__ = buildSemanticHierarchy;\`, context);
  assert.equal(typeof context.__LEVEL__, 'function');
  const fixture = {
    nodes: [{id:'r',level:3},{id:'c',level:4},{id:'g',level:5}],
    edges: [
      {source:'r',target:'c',type:'PART_OF',strength:1},
      {source:'c',target:'g',type:'PART_OF',strength:1},
    ],
  };
  const hierarchy = context.__H__(fixture);
  assert.equal(context.__LEVEL__(hierarchy, 'r', fixture.nodes[2]), 2);
  assert.equal(context.__LEVEL__(hierarchy, null, fixture.nodes[2]), 5);
});

test('42 focusNode uses semantic navigation depth rather than absolute node level', () => {
  const source = readSource();
  assert.match(source, /const semanticLevel\\s*=\\s*semanticLevelForNode\\(semanticHierarchy,\\s*state\\.focusRootId,\\s*node\\)/);
  assert.match(source, /zoomThresholdForLevel\\(semanticLevel\\)/);
});
`;
if(!tests.includes('41 semantic navigation level is relative inside a focus scope')) tests+=additions;
fs.writeFileSync(testsPath,tests);

let readme=fs.readFileSync(readmePath,'utf8');
readme=readme.replace(/- size: [0-9,]+ bytes/,`- size: ${sourceSize.toLocaleString('en-US')} bytes`);
readme=readme.replace(/- SHA-256: `[0-9a-f]+`/,`- SHA-256: \`${sourceSha}\``);
readme=readme.replace(/npm test\s+# [0-9]+ automated tests/,`npm test          # 42 automated tests`);
readme=readme.replace(/- 40\/40 automated tests expected after release-wiring gate/,`- 42/42 automated tests including semantic-navigation review regression`);
fs.writeFileSync(readmePath,readme);

if(fs.existsSync(statusPath)){
  let status=fs.readFileSync(statusPath,'utf8');
  status=status.replace(/- Current canonical source: [0-9,]+ bytes/,`- Current canonical source: ${sourceSize.toLocaleString('en-US')} bytes`);
  status=status.replace(/- Current canonical source SHA-256: `[0-9a-f]+`/,`- Current canonical source SHA-256: \`${sourceSha}\``);
  status=status.replace(/Final gate: pull-request-triggered `npm run verify` must pass before merge\./,`Code-review fix: semantic node navigation now uses relative depth inside focus scopes. Final pull-request-triggered \`npm run verify\` must pass before merge.`);
  fs.writeFileSync(statusPath,status);
}

console.log(`Review fix applied; source ${sourceSize} bytes; SHA ${sourceSha}`);
