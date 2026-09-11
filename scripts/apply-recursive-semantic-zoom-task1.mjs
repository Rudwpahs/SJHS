import crypto from 'node:crypto';
import fs from 'node:fs';

const sourcePath = 'src/SJHS_Memory_Palace_UIUX.html';
const helpersPath = 'tests/helpers.mjs';
const testsPath = 'tests/source.test.mjs';

let source = fs.readFileSync(sourcePath, 'utf8');
const marker = 'function validateGraph(graph) {';
const production = `const SEMANTIC_PARENT_RELATIONS = [
  'EXPLAINS','CAUSES','REQUIRES','DERIVED_FROM',
  'REGULATES','CONVERTS_TO','MEASURED_BY','APPLIES_TO',
];

function buildSemanticHierarchy(graph) {
  const nodeById = new Map(graph.nodes.map(node => [node.id, node]));
  const incoming = new Map(graph.nodes.map(node => [node.id, []]));
  for (const edge of graph.edges) {
    if (incoming.has(edge.target)) incoming.get(edge.target).push(edge);
  }

  const parentById = new Map(graph.nodes.map(node => [node.id, null]));
  const priority = new Map(SEMANTIC_PARENT_RELATIONS.map((type, index) => [type, index]));

  for (const node of graph.nodes) {
    const candidates = (incoming.get(node.id) ?? [])
      .map(edge => ({ edge, source: nodeById.get(edge.source) }))
      .filter(({ source }) => source && source.level < node.level);

    const sortCandidates = (a,b) =>
      (node.level-a.source.level)-(node.level-b.source.level) ||
      (b.edge.strength??0)-(a.edge.strength??0) ||
      a.source.id.localeCompare(b.source.id);

    const partOf = candidates
      .filter(({ edge }) => edge.type === 'PART_OF')
      .sort(sortCandidates);

    const fallback = candidates
      .filter(({ edge }) => priority.has(edge.type))
      .sort((a,b) => priority.get(a.edge.type)-priority.get(b.edge.type) || sortCandidates(a,b));

    const chosen = partOf[0] ?? fallback[0];
    if (chosen) parentById.set(node.id, chosen.source.id);
  }

  const childrenById = new Map(graph.nodes.map(node => [node.id, []]));
  for (const [childId, parentId] of parentById) {
    if (parentId) childrenById.get(parentId)?.push(childId);
  }
  for (const children of childrenById.values()) children.sort();

  const descendantsById = new Map();
  for (const node of graph.nodes) {
    const descendants = new Set();
    const stack = [...(childrenById.get(node.id) ?? [])];
    while (stack.length) {
      const childId = stack.pop();
      if (descendants.has(childId)) continue;
      descendants.add(childId);
      stack.push(...(childrenById.get(childId) ?? []));
    }
    descendantsById.set(node.id, descendants);
  }

  return { parentById, childrenById, descendantsById };
}

function semanticChildren(hierarchy, nodeId) {
  return hierarchy.childrenById.get(nodeId) ?? [];
}

`;
if (!source.includes('function buildSemanticHierarchy(graph)')) {
  if (!source.includes(marker)) throw new Error('source insertion marker missing');
  source = source.replace(marker, production + marker);
  fs.writeFileSync(sourcePath, source);
}

const sourceSha = crypto.createHash('sha256').update(source).digest('hex');
let helpers = fs.readFileSync(helpersPath, 'utf8');
helpers = helpers.replace(/export const expectedSourceSha = '[0-9a-f]+';/, `export const expectedSourceSha = '${sourceSha}';`);
if (!helpers.includes('buildSemanticHierarchy,semanticChildren')) {
  helpers = helpers.replace('resolveThemePreference,zoomBand,nextZoom};', 'resolveThemePreference,zoomBand,nextZoom,buildSemanticHierarchy,semanticChildren};');
}
fs.writeFileSync(helpersPath, helpers);

let tests = fs.readFileSync(testsPath, 'utf8');
const additions = `

test('27 hierarchy prefers PART_OF over fallback relations', () => {
  const { buildSemanticHierarchy } = loadRuntime();
  const fixture = {
    nodes: [
      { id:'root', level:0 },
      { id:'other', level:1 },
      { id:'child', level:2 },
    ],
    edges: [
      { source:'other', target:'child', type:'CAUSES', strength:5 },
      { source:'root', target:'child', type:'PART_OF', strength:1 },
    ],
  };
  assert.equal(buildSemanticHierarchy(fixture).parentById.get('child'), 'root');
});

test('28 fallback hierarchy is deterministic and only climbs level', () => {
  const { buildSemanticHierarchy } = loadRuntime();
  const fixture = {
    nodes: [
      { id:'a', level:1 },
      { id:'b', level:1 },
      { id:'c', level:2 },
    ],
    edges: [
      { source:'b', target:'c', type:'CAUSES', strength:4 },
      { source:'a', target:'c', type:'CAUSES', strength:4 },
    ],
  };
  assert.equal(buildSemanticHierarchy(fixture).parentById.get('c'), 'a');
});

test('29 hierarchy descendants are transitively indexed', () => {
  const { buildSemanticHierarchy } = loadRuntime();
  const fixture = {
    nodes: [{id:'a',level:0},{id:'b',level:1},{id:'c',level:2}],
    edges: [
      {source:'a',target:'b',type:'PART_OF',strength:1},
      {source:'b',target:'c',type:'PART_OF',strength:1},
    ],
  };
  assert.deepEqual([...buildSemanticHierarchy(fixture).descendantsById.get('a')].sort(), ['b','c']);
});
`;
if (!tests.includes("27 hierarchy prefers PART_OF")) tests += additions;
fs.writeFileSync(testsPath, tests);

console.log(`Task 1 applied; source SHA ${sourceSha}`);
