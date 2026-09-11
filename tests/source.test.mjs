import test from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'node:crypto';
import { readSource, loadRuntime, expectedSourceSha } from './helpers.mjs';

const sha256 = text => crypto.createHash('sha256').update(text).digest('hex');

test('01 canonical source hash matches verified artifact', () => assert.equal(sha256(readSource()), expectedSourceSha));
test('02 canonical source retains Korean document language', () => assert.match(readSource(), /<html lang="ko"/));
test('03 canonical source retains dark preferred theme', () => assert.match(readSource(), /data-theme="dark"/));
test('04 source declares 44px control hit size', () => assert.match(readSource(), /--control-hit-size:\s*44px/));
test('05 source supports reduced motion', () => assert.match(readSource(), /prefers-reduced-motion:\s*reduce/));
test('06 source has no remote script dependency', () => assert.doesNotMatch(readSource(), /<script[^>]+src=["']https?:/i));
test('07 source has no remote stylesheet dependency', () => assert.doesNotMatch(readSource(), /<link[^>]+href=["']https?:/i));
test('08 canvas is keyboard focusable', () => assert.match(readSource(), /<canvas[^>]+tabindex="0"/));
test('09 live status region is present', () => assert.match(readSource(), /id="map-status"[^>]+aria-live="polite"/));
test('10 zoom bands include all five semantic levels', () => { const s=readSource(); for (const x of ['WORLD','CONTINENT','REGION','CITY','STREET']) assert.match(s,new RegExp(`['"]${x}['"]`)); });

test('11 graph has 24 curriculum units', () => assert.equal(loadRuntime().graph.curriculumUnits.length, 24));
test('12 graph has 198 nodes', () => assert.equal(loadRuntime().graph.nodes.length, 198));
test('13 graph has 291 relations', () => assert.equal(loadRuntime().graph.edges.length, 291));
test('14 curriculum ids are unique', () => { const ids=loadRuntime().graph.curriculumUnits.map(x=>x.id); assert.equal(new Set(ids).size,ids.length); });
test('15 node ids are unique', () => { const ids=loadRuntime().graph.nodes.map(x=>x.id); assert.equal(new Set(ids).size,ids.length); });
test('16 every edge source exists', () => { const g=loadRuntime().graph, ids=new Set(g.nodes.map(x=>x.id)); for(const e of g.edges) assert.ok(ids.has(e.source),e.source); });
test('17 every edge target exists', () => { const g=loadRuntime().graph, ids=new Set(g.nodes.map(x=>x.id)); for(const e of g.edges) assert.ok(ids.has(e.target),e.target); });
test('18 every curriculum reference resolves', () => { const g=loadRuntime().graph, ids=new Set(g.curriculumUnits.map(x=>x.id)); for(const n of g.nodes) for(const r of n.curriculumRefs??[]) assert.ok(ids.has(r),`${n.id}:${r}`); });
test('19 node coordinates are finite', () => { for(const n of loadRuntime().graph.nodes){ assert.ok(Number.isFinite(n.x),n.id); assert.ok(Number.isFinite(n.y),n.id);} });
test('20 canonical levels are non-negative integers and preserve deep detail', () => { const levels=loadRuntime().graph.nodes.map(n=>n.level); for(const level of levels) assert.ok(Number.isInteger(level)&&level>=0, String(level)); assert.ok(Math.max(...levels)>=5, 'recursive detail levels must not be capped at STREET'); });

test('21 graph validator reports no dangling edges', () => { const {graph,validateGraph}=loadRuntime(); assert.equal(validateGraph(graph).danglingEdges.length,0); });
test('22 zoom band thresholds are stable', () => { const {zoomBand}=loadRuntime(); assert.deepEqual([zoomBand(.8),zoomBand(1.2),zoomBand(2),zoomBand(3.1),zoomBand(4.5)],['WORLD','CONTINENT','REGION','CITY','STREET']); });
test('23 nextZoom clamps lower bound', () => assert.equal(loadRuntime().nextZoom(.5,-10),.5));
test('24 nextZoom clamps upper bound', () => assert.equal(loadRuntime().nextZoom(6,10),6));
test('25 explicit theme preference wins', () => { const {resolveThemePreference}=loadRuntime(); assert.equal(resolveThemePreference('light',true),'light'); assert.equal(resolveThemePreference('dark',false),'dark'); });
test('26 world/screen transforms round-trip', () => { const {worldToScreenPoint,screenToWorldPoint}=loadRuntime(); const state={zoom:2.25,panX:413,panY:287}; const p={x:-91.2,y:44.5}; const q=screenToWorldPoint(worldToScreenPoint(p,state),state); assert.ok(Math.abs(q.x-p.x)<1e-9); assert.ok(Math.abs(q.y-p.y)<1e-9); });


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
  assert.match(source, /const semanticHierarchy\s*=\s*buildSemanticHierarchy\(graph\)/);
  assert.match(source, /focusPath:\s*\[\]/);
  assert.match(source, /getScopedVisibleNodes\(graph,\s*semanticHierarchy,\s*state\.zoom,\s*filtersForState\(\),\s*state\.focusRootId\)/);
  assert.match(source, /function enterFocus\(id\)/);
  assert.match(source, /function leaveFocus\(\)/);
});
