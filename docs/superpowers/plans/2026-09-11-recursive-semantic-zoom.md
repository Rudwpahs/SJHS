# Recursive Semantic Zoom Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Repeat `WORLD → CONTINENT → REGION → CITY → STREET` inside any semantic node with descendants while preserving all canonical graph coordinates and knowledge data.

**Architecture:** Derive a deterministic UI-only semantic hierarchy from existing edges, keep canonical node coordinates immutable, and add a focus path that scopes visibility by relative hierarchy depth. Selection remains separate from drill-in; explicit inspector controls plus keyboard/wheel accelerators provide accessible entry and exit.

**Tech Stack:** Vanilla HTML/CSS/JavaScript, Canvas 2D, Node.js >=20 built-ins (`node:test`, `vm`, `crypto`, `zlib`), GitHub Pages.

**Spec:** `docs/superpowers/specs/2026-09-11-recursive-semantic-zoom-design.md`

## Global Constraints

- Existing canonical `node.x` / `node.y` values must not change.
- Existing graph cardinality remains 198 nodes / 291 edges / 24 curriculum units.
- No runtime third-party dependencies.
- `PART_OF` is the authoritative hierarchy relation.
- Fallback hierarchy parents must always have a lower absolute `level` than the child.
- `CONTRASTS_WITH` and `EXAMPLE_OF` must never become hierarchy parents.
- Search remains global and can leave a focus scope.
- Existing accessibility, theme, reduced-motion, and 44px hit-target gates remain green.

---

### Task 1: Deterministic semantic hierarchy

**Files:**
- Modify: `src/SJHS_Memory_Palace_UIUX.html`
- Modify: `tests/helpers.mjs`
- Modify: `tests/source.test.mjs`

**Interfaces:**
- Produces: `buildSemanticHierarchy(graph) -> { parentById, childrenById, descendantsById }`
- Produces: `semanticChildren(hierarchy, nodeId) -> string[]`
- Later tasks consume these interfaces without mutating `graph`.

- [ ] **Step 1: Add failing hierarchy tests**

Add test-runtime exports in `tests/helpers.mjs` for `buildSemanticHierarchy` and `semanticChildren`, then add tests equivalent to:

```js
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
```

- [ ] **Step 2: Run tests and verify RED**

Run: `node --test tests/source.test.mjs`

Expected: tests 27–29 fail because `buildSemanticHierarchy` / `semanticChildren` are not defined or exported.

- [ ] **Step 3: Implement hierarchy engine**

Add near the existing graph index helpers:

```js
const SEMANTIC_PARENT_RELATIONS = [
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

    const partOf = candidates
      .filter(({ edge }) => edge.type === 'PART_OF')
      .sort((a,b) => (node.level-a.source.level)-(node.level-b.source.level) ||
                     (b.edge.strength??0)-(a.edge.strength??0) ||
                     a.source.id.localeCompare(b.source.id));

    const fallback = candidates
      .filter(({ edge }) => priority.has(edge.type))
      .sort((a,b) => priority.get(a.edge.type)-priority.get(b.edge.type) ||
                     (node.level-a.source.level)-(node.level-b.source.level) ||
                     (b.edge.strength??0)-(a.edge.strength??0) ||
                     a.source.id.localeCompare(b.source.id));

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
```

- [ ] **Step 4: Run hierarchy tests and full existing suite**

Run: `node --test tests/source.test.mjs`

Expected: 29/29 passing.

- [ ] **Step 5: Commit**

Commit message: `feat: derive deterministic semantic hierarchy`

---

### Task 2: Focus scope and recursive visibility

**Files:**
- Modify: `src/SJHS_Memory_Palace_UIUX.html`
- Modify: `tests/helpers.mjs`
- Modify: `tests/source.test.mjs`

**Interfaces:**
- Consumes: `buildSemanticHierarchy(graph)` from Task 1.
- Produces: `hierarchyDepthFrom(hierarchy, rootId, nodeId) -> number | null`
- Produces: `getScopedVisibleNodes(graph, hierarchy, zoom, filters, focusRootId) -> Node[]`
- Produces: pure helpers `enterFocusPath(path, nodeId, hierarchy)` and `leaveFocusPath(path)`.

- [ ] **Step 1: Add failing focus tests**

Add tests equivalent to:

```js
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
  assert.deepEqual(enterFocusPath([], 'a', buildSemanticHierarchy(fixture)), []);
});

test('32 enter and leave focus path is stable', () => {
  const { buildSemanticHierarchy, enterFocusPath, leaveFocusPath } = loadRuntime();
  const fixture={
    nodes:[{id:'a',level:0},{id:'b',level:1}],
    edges:[{source:'a',target:'b',type:'PART_OF',strength:1}],
  };
  const hierarchy=buildSemanticHierarchy(fixture);
  assert.deepEqual(leaveFocusPath(enterFocusPath([], 'a', hierarchy)), []);
});
```

- [ ] **Step 2: Run and verify RED**

Run: `node --test tests/source.test.mjs`

Expected: tests 30–32 fail because scoped visibility/focus helpers do not exist.

- [ ] **Step 3: Implement pure focus helpers**

Implement hierarchy-hop depth, scoped visibility, enter/leave path. Use the same `LEVEL_THRESHOLDS` against relative hop depth, with the focus root always visible. Preserve existing `getVisibleNodes()` unchanged for global scope and call it when `focusRootId` is null.

- [ ] **Step 4: Wire focus state into `init()`**

Add `semanticHierarchy`, `focusPath`, and `focusRootId` to state. Change `refreshVisible()` to call `getScopedVisibleNodes(...)`. Add `enterFocus(id)` and `leaveFocus()` that only mutate UI state/camera; never mutate a graph node.

- [ ] **Step 5: Prove canonical coordinates are unchanged**

Add a test that snapshots `graph.nodes.map(({id,x,y})=>[id,x,y])`, runs focus helpers, and asserts deep equality.

- [ ] **Step 6: Run full suite**

Run: `node --test tests/source.test.mjs`

Expected: all tests passing.

- [ ] **Step 7: Commit**

Commit message: `feat: add recursive focus scopes`

---

### Task 3: Accessible drill-in UI and release gates

**Files:**
- Modify: `src/SJHS_Memory_Palace_UIUX.html`
- Modify: `tests/source.test.mjs`
- Modify: `scripts/audit.mjs` only if a new static accessibility gate is needed.

**Interfaces:**
- Consumes: `enterFocus()` / `leaveFocus()` from Task 2.
- UI produces: inspector enter button, focus breadcrumb/back control, `Shift+Enter` shortcut, Escape-to-leave behavior when no selection is active, and zoom-at-STREET accelerator.

- [ ] **Step 1: Add failing static interaction tests**

Add assertions that the source contains:

```js
assert.match(readSource(), /data-action="enter-focus"/);
assert.match(readSource(), /data-action="leave-focus"/);
assert.match(readSource(), /event\.shiftKey\s*&&\s*event\.key\s*===\s*['"]Enter['"]/);
```

- [ ] **Step 2: Run and verify RED**

Run: `node --test tests/source.test.mjs`

Expected: new interaction assertions fail.

- [ ] **Step 3: Add inspector controls**

When the selected node has semantic children, render a 44px `이 개념 안으로` button. When `focusPath.length > 0`, render a compact breadcrumb/back button. Reuse existing component tokens; add no raw hex colors.

- [ ] **Step 4: Add keyboard and zoom accelerators**

- `Shift+Enter` on canvas: enter selected node if enterable.
- `Escape`: if selected, clear selection; otherwise if focused, leave one scope.
- When zoom-in is requested at the local STREET ceiling and selected node is enterable, enter focus instead of increasing scale further.
- Search result outside scope clears focus path before canonical navigation.

- [ ] **Step 5: Run project verification**

Run:

```bash
npm test
npm run audit
npm run build
node scripts/verify-generated.mjs
```

Expected: all commands exit 0; graph remains 198 nodes / 291 edges / 24 curriculum units.

- [ ] **Step 6: Inspect generated diff**

Confirm only source/tests/docs/tooling needed for the feature changed; root published payloads remain untouched on the feature branch.

- [ ] **Step 7: Commit and open PR**

Commit message: `feat: add recursive semantic zoom navigation`

PR target: `main`; do not merge until CI is green.
