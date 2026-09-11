# Recursive Semantic Zoom Design

**Date:** 2026-09-11

## Goal

Turn the current one-pass semantic zoom into a true fractal Memory Palace: `WORLD → CONTINENT → REGION → CITY → STREET`, then allow a detailed node to become the next local `WORLD` without moving or rewriting canonical node coordinates.

This implements the already-approved product design in `SKILL.md` and the 2026-09-09 Memory-Palace design: space is memory, existing anchors stay fixed, subject boundaries remain filters rather than walls, and detail is progressively disclosed.

## Current gap

The current source has global `LEVEL_THRESHOLDS` and `getVisibleNodes()` compares the viewport zoom directly with each node's absolute `level`. Levels 0–5 therefore form only one global ladder. Once level 5 is visible, the model cannot recurse into the selected concept as a new local world.

## Considered approaches

### A. Re-level/re-layout the graph on every drill-in

Recompute `level`, `x`, and `y` around the selected concept.

**Rejected:** this directly violates fixed geography and would make remembered landmarks drift.

### B. Add explicit parent/local coordinates to all 198 nodes

Migrate every node to a strict hierarchy with `parentId`, `localX`, and `localY`.

**Deferred:** deterministic, but it creates a large data migration before the interaction model is proven and risks forcing cross-disciplinary graph relationships into a tree.

### C. Derived focus scopes over immutable canonical coordinates — chosen

Keep the canonical graph untouched and derive a semantic hierarchy for navigation only. `PART_OF` is authoritative. When no `PART_OF` parent exists, a lower-level incoming explanatory edge may provide a deterministic UI parent. Parent selection always moves from lower absolute level to higher absolute level, so the derived hierarchy is acyclic.

A focus path is UI state, not knowledge data. Entering a node changes the viewport/scope but never changes node coordinates.

## Semantic hierarchy

Add `buildSemanticHierarchy(graph)` returning:

- `parentById: Map<nodeId, parentId | null>`
- `childrenById: Map<nodeId, nodeId[]>`
- `descendantsById: Map<nodeId, Set<nodeId>>`

Parent selection order:

1. incoming `PART_OF` edge from a lower-level node;
2. otherwise an incoming edge from a lower-level node using the relation priority below;
3. otherwise no parent.

Eligible fallback relations, in priority order:

`EXPLAINS`, `CAUSES`, `REQUIRES`, `DERIVED_FROM`, `REGULATES`, `CONVERTS_TO`, `MEASURED_BY`, `APPLIES_TO`.

Within the same relation class, prefer the smallest positive level gap, then greater edge strength, then lexical source id. `CONTRASTS_WITH` and `EXAMPLE_OF` are never hierarchy parents.

## Focus state

Extend UI state with:

- `focusPath: string[]` — roots entered from outermost to innermost;
- `focusRootId: string | null` — last item of `focusPath`;
- `focusBaseLevel: number` — absolute level of the current focus root;
- `focusZoom: number` — local semantic zoom, using the same five named bands.

The existing `zoom` remains the canvas scale. Semantic visibility is calculated from a local zoom value so physical viewport scaling and semantic recursion are no longer permanently coupled.

For the first implementation, `zoom` and `focusZoom` move together inside a scope. On entering/leaving a scope, the canvas recenters around the canonical root coordinate and resets to the local WORLD scale; no canonical coordinate is modified.

## Scope visibility

At global scope, behavior remains compatible with the current map.

Inside a focus scope:

- show the focus root;
- show descendants of the focus root from the derived hierarchy;
- reveal descendants according to hierarchy hop distance from the focus root, mapped onto the five semantic bands;
- keep current filter/search behavior;
- draw only edges whose endpoints are both visible;
- external cross-links remain available in the inspector as navigation targets and may leave the current scope when activated.

A node with no derived children is not enterable.

## Interaction

Selection and drill-in remain separate concepts.

- single click / arrow navigation: select, unchanged;
- inspector adds a 44px `이 개념 안으로` button only when the selected node has semantic children;
- `Shift+Enter` on the focused canvas enters the selected node;
- zooming further inward while already at the local STREET ceiling enters the selected node when it is enterable;
- `Escape` clears selection first, unchanged; when no selection is active and a focus scope exists, Escape leaves one scope;
- inspector shows a compact breadcrumb/back control for the current focus path;
- leaving a scope recenters on its parent root and restores a stable local zoom.

The explicit button is the accessibility baseline; wheel/keyboard gestures are accelerators only.

## Rendering and memory stability

The renderer continues to consume canonical `node.x` / `node.y`. Enter/leave only changes camera pan/zoom and the visible-node set. No force layout, automatic coordinate migration, or randomized placement is introduced.

The selected node and its neighbors stay legible under the existing selection rules. Semantic scope never changes a node's canonical glyph/category.

## Search and cross-links

Search remains global. If a search result is outside the current scope, focusing the result clears the current focus path and navigates to its canonical global position before selection.

Inspector neighbor buttons may also navigate outside the current scope using the same rule. This keeps cross-disciplinary links usable rather than trapping the learner inside a tree.

## Testing

TDD additions must cover:

1. hierarchy prefers `PART_OF`;
2. hierarchy fallback is deterministic and level-increasing;
3. no parent cycle can be produced;
4. descendants are correct;
5. focus-scope visibility uses relative hierarchy depth rather than absolute node level;
6. global visibility remains backward compatible;
7. entering a leaf is rejected;
8. enter/leave maintains a stable focus path;
9. canonical node coordinates are byte-for-byte unchanged by focus operations;
10. existing 26 characterization tests continue to pass;
11. `npm run audit`, build, and payload round-trip remain green.

## Non-goals for this slice

- no new science concepts;
- no coordinate re-layout;
- no automatic Island generation;
- no persistence of focus state across sessions yet;
- no visual map decoration beyond breadcrumb/enter/back controls;
- no graph-data migration to explicit `parentId` fields.

## Acceptance criteria

- existing 198 concepts, 291 relations, and 24/24 curriculum coverage are unchanged;
- canonical coordinates are unchanged;
- a node with descendants can be entered as a new local semantic world and exited again;
- the same five semantic bands repeat inside the new scope;
- mouse, wheel, button, and keyboard users all have a usable path;
- full verification passes before PR creation.
