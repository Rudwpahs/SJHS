import crypto from 'node:crypto';
import fs from 'node:fs';

const sourcePath='src/SJHS_Memory_Palace_UIUX.html';
const helpersPath='tests/helpers.mjs';
const testsPath='tests/source.test.mjs';
let source=fs.readFileSync(sourcePath,'utf8');

const oldVisible=`function getVisibleNodes(graph, zoom, filters = {}) {
  const query=(filters.query ?? '').trim().toLowerCase();
  return graph.nodes.filter(node => {
    if (zoom < zoomThresholdForLevel(node.level)) return false;
    if (filters.community && filters.community !== 'all' && node.community !== filters.community) return false;
    if (filters.curriculum === true && !(node.curriculumRefs?.length)) return false;
    if (filters.personal === true && !(node.tags?.includes('personal'))) return false;
    if (filters.modern === true && !(node.tags?.includes('modern') || node.community === 'modern')) return false;
    if (query) {
      const haystack=[node.name,node.summary,...(node.tags??[])].join(' ').toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    return true;
  });
}
`;
const newVisible=`function nodeMatchesFilters(node, filters = {}) {
  const query=(filters.query ?? '').trim().toLowerCase();
  if (filters.community && filters.community !== 'all' && node.community !== filters.community) return false;
  if (filters.curriculum === true && !(node.curriculumRefs?.length)) return false;
  if (filters.personal === true && !(node.tags?.includes('personal'))) return false;
  if (filters.modern === true && !(node.tags?.includes('modern') || node.community === 'modern')) return false;
  if (query) {
    const haystack=[node.name,node.summary,...(node.tags??[])].join(' ').toLowerCase();
    if (!haystack.includes(query)) return false;
  }
  return true;
}

function getVisibleNodes(graph, zoom, filters = {}) {
  return graph.nodes.filter(node =>
    zoom >= zoomThresholdForLevel(node.level) && nodeMatchesFilters(node, filters));
}

function hierarchyDepthFrom(hierarchy, rootId, nodeId) {
  if (!rootId || !nodeId) return null;
  if (rootId === nodeId) return 0;
  let depth = 0;
  let cursor = nodeId;
  const visited = new Set();
  while (cursor && !visited.has(cursor)) {
    visited.add(cursor);
    cursor = hierarchy.parentById.get(cursor) ?? null;
    depth += 1;
    if (cursor === rootId) return depth;
  }
  return null;
}

function getScopedVisibleNodes(graph, hierarchy, zoom, filters = {}, focusRootId = null) {
  if (!focusRootId) return getVisibleNodes(graph, zoom, filters);
  return graph.nodes.filter(node => {
    const relativeDepth = hierarchyDepthFrom(hierarchy, focusRootId, node.id);
    if (relativeDepth === null) return false;
    if (zoom < zoomThresholdForLevel(relativeDepth)) return false;
    return nodeMatchesFilters(node, filters);
  });
}

function enterFocusPath(path, nodeId, hierarchy) {
  if (!nodeId || semanticChildren(hierarchy, nodeId).length === 0) return [...path];
  if (path.at(-1) === nodeId) return [...path];
  return [...path, nodeId];
}

function leaveFocusPath(path) {
  return path.length ? path.slice(0, -1) : [];
}
`;
if(!source.includes('function hierarchyDepthFrom(')){
  if(!source.includes(oldVisible)) throw new Error('visible block missing');
  source=source.replace(oldVisible,newVisible);
}
source=source.replace(
  "  const { nodesById, adjacency } = buildIndexes(graph);\n  const curriculumById = new Map(graph.curriculumUnits.map(unit => [unit.id, unit]));",
  "  const { nodesById, adjacency } = buildIndexes(graph);\n  const semanticHierarchy = buildSemanticHierarchy(graph);\n  const curriculumById = new Map(graph.curriculumUnits.map(unit => [unit.id, unit]));");
source=source.replace(
  "    activeFilter: 'all',\n    visibleNodes: [],",
  "    activeFilter: 'all',\n    focusPath: [],\n    focusRootId: null,\n    visibleNodes: [],");
source=source.replace(
  "  function refreshVisible({ announce = false } = {}) {\n    state.visibleNodes = getVisibleNodes(graph, state.zoom, filtersForState());",
  "  function refreshVisible({ announce = false } = {}) {\n    state.visibleNodes = getScopedVisibleNodes(graph, semanticHierarchy, state.zoom, filtersForState(), state.focusRootId);");
const focusNode=`  function focusNode(node) {
    if (!node) return;
    const needed = zoomThresholdForLevel(node.level) + 0.28;
    state.zoom = Math.max(state.zoom, Math.min(5.25, needed));
    const targetX = window.innerWidth * (window.innerWidth > 980 ? 0.42 : 0.5);
    const targetY = window.innerHeight * (window.innerWidth > 980 ? 0.50 : 0.42);
    state.panX = targetX - node.x * state.zoom;
    state.panY = targetY - node.y * state.zoom;
    refreshVisible();
    setSelected(node.id);
  }
`;
const focusFns=`
  function enterFocus(id) {
    const nextPath = enterFocusPath(state.focusPath, id, semanticHierarchy);
    if (nextPath.length === state.focusPath.length) return false;
    const root = nodesById.get(id);
    if (!root) return false;
    state.focusPath = nextPath;
    state.focusRootId = nextPath.at(-1) ?? null;
    state.zoom = 0.8;
    const targetX = window.innerWidth * (window.innerWidth > 980 ? 0.42 : 0.5);
    const targetY = window.innerHeight * (window.innerWidth > 980 ? 0.50 : 0.42);
    state.panX = targetX - root.x * state.zoom;
    state.panY = targetY - root.y * state.zoom;
    refreshVisible();
    clearSelection();
    return true;
  }

  function leaveFocus() {
    if (!state.focusPath.length) return false;
    const nextPath = leaveFocusPath(state.focusPath);
    state.focusPath = nextPath;
    state.focusRootId = nextPath.at(-1) ?? null;
    state.zoom = 0.8;
    const root = state.focusRootId ? nodesById.get(state.focusRootId) : null;
    if (root) {
      const targetX = window.innerWidth * (window.innerWidth > 980 ? 0.42 : 0.5);
      const targetY = window.innerHeight * (window.innerWidth > 980 ? 0.50 : 0.42);
      state.panX = targetX - root.x * state.zoom;
      state.panY = targetY - root.y * state.zoom;
    } else {
      state.panX = window.innerWidth / 2;
      state.panY = window.innerHeight / 2;
    }
    refreshVisible();
    clearSelection();
    return true;
  }
`;
if(!source.includes('function enterFocus(id)')) source=source.replace(focusNode,focusNode+focusFns);
source=source.replace(
  "    state.activeFilter = 'all';\n    search.value = '';",
  "    state.activeFilter = 'all';\n    state.focusPath = [];\n    state.focusRootId = null;\n    search.value = '';");
fs.writeFileSync(sourcePath,source);

const sourceSha=crypto.createHash('sha256').update(source).digest('hex');
let helpers=fs.readFileSync(helpersPath,'utf8');
helpers=helpers.replace(/export const expectedSourceSha = '[0-9a-f]+';/,`export const expectedSourceSha = '${sourceSha}';`);
helpers=helpers.replace('buildSemanticHierarchy,semanticChildren};','buildSemanticHierarchy,semanticChildren,hierarchyDepthFrom,getScopedVisibleNodes,enterFocusPath,leaveFocusPath};');
fs.writeFileSync(helpersPath,helpers);

let tests=fs.readFileSync(testsPath,'utf8');
const additions=`

test('30 scoped visibility uses relative hierarchy depth', () => {
  const { buildSemanticHierarchy, getScopedVisibleNodes } = loadRuntime();
  const fixture = {
    nodes: [
      {id:'r',level:3,community:'x',curriculumRefs:[],tags:[]},
      {id:'c',level:4,community:'x',curriculumRefs:[],tags:[]},
      {id:'g',level:5,community:'x',curriculumRefs:[],tags:[]},
    ],
    edges: [
      {source:'r',target:'c',type:'PART_OF',strength:1},
      {source:'c',target:'g',type:'PART_OF',strength:1},
    ],
  };
  const hierarchy = buildSemanticHierarchy(fixture);
  assert.deepEqual(getScopedVisibleNodes(fixture,hierarchy,.8,{},'r').map(n=>n.id), ['r','c']);
});

test('31 entering a leaf is rejected', () => {
  const { buildSemanticHierarchy, enterFocusPath } = loadRuntime();
  const fixture={nodes:[{id:'a',level:0}],edges:[]};
  assert.deepEqual([...enterFocusPath([], 'a', buildSemanticHierarchy(fixture))], []);
});

test('32 enter and leave focus path is stable', () => {
  const { buildSemanticHierarchy, enterFocusPath, leaveFocusPath } = loadRuntime();
  const fixture={
    nodes:[{id:'a',level:0},{id:'b',level:1}],
    edges:[{source:'a',target:'b',type:'PART_OF',strength:1}],
  };
  const hierarchy=buildSemanticHierarchy(fixture);
  assert.deepEqual([...leaveFocusPath(enterFocusPath([], 'a', hierarchy))], []);
});

test('33 focus helpers never mutate canonical coordinates', () => {
  const { graph, buildSemanticHierarchy, enterFocusPath, leaveFocusPath, getScopedVisibleNodes } = loadRuntime();
  const before = graph.nodes.map(({id,x,y}) => [id,x,y]);
  const hierarchy = buildSemanticHierarchy(graph);
  const enterable = graph.nodes.find(node => (hierarchy.childrenById.get(node.id) ?? []).length);
  const path = enterFocusPath([], enterable.id, hierarchy);
  getScopedVisibleNodes(graph, hierarchy, 3.3, {}, path.at(-1));
  leaveFocusPath(path);
  assert.deepEqual(graph.nodes.map(({id,x,y}) => [id,x,y]), before);
});

test('34 app state wires semantic hierarchy and recursive focus scope', () => {
  const source = readSource();
  assert.match(source, /const semanticHierarchy\\s*=\\s*buildSemanticHierarchy\\(graph\\)/);
  assert.match(source, /focusPath:\\s*\\[\\]/);
  assert.match(source, /getScopedVisibleNodes\\(graph,\\s*semanticHierarchy,\\s*state\\.zoom,\\s*filtersForState\\(\\),\\s*state\\.focusRootId\\)/);
  assert.match(source, /function enterFocus\\(id\\)/);
  assert.match(source, /function leaveFocus\\(\\)/);
});
`;
if(!tests.includes("30 scoped visibility uses relative hierarchy depth")) tests+=additions;
fs.writeFileSync(testsPath,tests);
console.log(`Task 2 applied; source SHA ${sourceSha}`);
