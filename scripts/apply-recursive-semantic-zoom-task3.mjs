import crypto from 'node:crypto';
import fs from 'node:fs';

const sourcePath='src/SJHS_Memory_Palace_UIUX.html';
const helpersPath='tests/helpers.mjs';
const testsPath='tests/source.test.mjs';
const libPath='scripts/lib.mjs';
let source=fs.readFileSync(sourcePath,'utf8');

const cssMarker='.related-node:hover { color: var(--text-primary); background: var(--surface-control-hover); }\n';
const cssAdd=`
.focus-nav { display: grid; gap: var(--space-2); margin: 0 0 var(--space-4); }
.focus-breadcrumb { color: var(--text-muted); font-size: 11px; line-height: 1.5; overflow-wrap: anywhere; }
.focus-actions { display: grid; gap: var(--space-2); margin: var(--space-4) 0; }
.focus-action {
  min-height: var(--control-hit-size);
  padding: var(--space-2) var(--space-3);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-md);
  background: var(--surface-selected);
  color: var(--text-primary);
  text-align: left;
  cursor: pointer;
}
.focus-action:hover { background: var(--surface-control-hover); }

`;
if(!source.includes('.focus-action {')) source=source.replace(cssMarker,cssMarker+'\n'+cssAdd);

const idleOld=`  function renderIdleDetails() {
    details.innerHTML = \`
      <div class="inspector-idle">
        <div class="eyebrow">MEMORY PALACE</div>
        <h1>지식 세계지도</h1>
        <p>확대할수록 원리의 아래층이 열린다.</p>
        <div class="shortcut-row" aria-label="지도 조작 도움말">
          <span><kbd>+</kbd><kbd>−</kbd> 확대</span>
          <span><kbd>방향키</kbd> 이동</span>
          <span><kbd>/</kbd> 검색</span>
        </div>
      </div>\`;
  }
`;
const idleNew=`  function focusNavigationMarkup() {
    if (!state.focusPath.length) return '';
    const trail = state.focusPath.map(id => nodesById.get(id)?.name).filter(Boolean).join(' › ');
    return \`
      <div class="focus-nav" aria-label="현재 재귀 탐색 경로">
        <button type="button" class="focus-action" data-action="leave-focus">← 한 단계 위로</button>
        <div class="focus-breadcrumb">\${trail}</div>
      </div>\`;
  }

  function renderIdleDetails() {
    details.innerHTML = \`
      <div class="inspector-idle">
        \${focusNavigationMarkup()}
        <div class="eyebrow">MEMORY PALACE</div>
        <h1>\${state.focusRootId ? nodesById.get(state.focusRootId)?.name ?? '지식 세계지도' : '지식 세계지도'}</h1>
        <p>\${state.focusRootId ? '이 개념을 새로운 세계로 보고 같은 5단계 의미 확대를 반복한다.' : '확대할수록 원리의 아래층이 열린다.'}</p>
        <div class="shortcut-row" aria-label="지도 조작 도움말">
          <span><kbd>+</kbd><kbd>−</kbd> 확대</span>
          <span><kbd>방향키</kbd> 이동</span>
          <span><kbd>Shift</kbd><kbd>Enter</kbd> 안으로</span>
          <span><kbd>/</kbd> 검색</span>
        </div>
      </div>\`;
  }
`;
if(!source.includes('function focusNavigationMarkup()')){
  if(!source.includes(idleOld)) throw new Error('idle details marker missing');
  source=source.replace(idleOld,idleNew);
}

const leaveBlock=`  function leaveFocus() {
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
const ensure=`
  function ensureGlobalIfOutsideScope(nodeId) {
    if (!state.focusRootId) return false;
    if (hierarchyDepthFrom(semanticHierarchy, state.focusRootId, nodeId) !== null) return false;
    state.focusPath = [];
    state.focusRootId = null;
    refreshVisible();
    return true;
  }
`;
if(!source.includes('function ensureGlobalIfOutsideScope(nodeId)')) source=source.replace(leaveBlock,leaveBlock+ensure);

source=source.replace(
  "    const chips = [...new Set([node.community, ...units, ...(node.personalRefs ?? [])])].filter(Boolean);\n    const mechanism = node.mechanism ?? [];\n    details.innerHTML = `\n      <div class=\"inspector-head\">",
  "    const chips = [...new Set([node.community, ...units, ...(node.personalRefs ?? [])])].filter(Boolean);\n    const mechanism = node.mechanism ?? [];\n    const canEnter = state.focusRootId !== node.id && semanticChildren(semanticHierarchy, node.id).length > 0;\n    details.innerHTML = `\n      ${focusNavigationMarkup()}\n      <div class=\"inspector-head\">"
);
source=source.replace(
  "      <p>${node.summary || ''}</p>\n      <div class=\"meta\">${chips.map(chip => `<span class=\"chip\">${chip}</span>`).join('')}</div>",
  "      <p>${node.summary || ''}</p>\n      ${canEnter ? `<div class=\"focus-actions\"><button type=\"button\" class=\"focus-action\" data-action=\"enter-focus\">이 개념 안으로 · ${semanticChildren(semanticHierarchy, node.id).length}개 직접 하위 개념</button></div>` : ''}\n      <div class=\"meta\">${chips.map(chip => `<span class=\"chip\">${chip}</span>`).join('')}</div>"
);

source=source.replace(
`  function zoomAt(screenX, screenY, delta, { announce = true } = {}) {
    const world = renderer.screenToWorld(screenX, screenY, state);
    const zoom = nextZoom(state.zoom, delta);
`,
`  function zoomAt(screenX, screenY, delta, { announce = true } = {}) {
    if (delta > 0 && zoomBand(state.zoom) === 'STREET' && state.selectedId) {
      if (enterFocus(state.selectedId)) {
        if (announce) announceStatus();
        return;
      }
    }
    const world = renderer.screenToWorld(screenX, screenY, state);
    const zoom = nextZoom(state.zoom, delta);
`);

source=source.replace(
`    if (event.key === 'Escape') {
      event.preventDefault();
      clearSelection();
      return;
    }
    if (event.key === 'Enter' && state.selectedId) {
`,
`    if (event.shiftKey && event.key === 'Enter' && state.selectedId) {
      event.preventDefault();
      enterFocus(state.selectedId);
      return;
    }
    if (event.key === 'Escape') {
      event.preventDefault();
      if (state.selectedId) clearSelection();
      else if (state.focusPath.length) leaveFocus();
      return;
    }
    if (event.key === 'Enter' && state.selectedId) {
`);

source=source.replace(
`    if (event.key === 'Enter') {
      const node = findByQuery(search.value);
      if (node) focusNode(node);
      else mapStatus.textContent = \`검색 결과 없음: \${search.value.trim()}\`;
    }
`,
`    if (event.key === 'Enter') {
      const node = findByQuery(search.value);
      if (node) {
        ensureGlobalIfOutsideScope(node.id);
        focusNode(node);
      } else mapStatus.textContent = \`검색 결과 없음: \${search.value.trim()}\`;
    }
`);

source=source.replace(
`  details.addEventListener('click', event => {
    const nodeButton = event.target.closest('button[data-node]');
    if (nodeButton) {
      focusNode(nodesById.get(nodeButton.dataset.node));
      return;
    }
    if (event.target.closest('[data-action="clear-selection"]')) {
      clearSelection();
      canvas.focus({ preventScroll: true });
    }
  });
`,
`  details.addEventListener('click', event => {
    const nodeButton = event.target.closest('button[data-node]');
    if (nodeButton) {
      ensureGlobalIfOutsideScope(nodeButton.dataset.node);
      focusNode(nodesById.get(nodeButton.dataset.node));
      return;
    }
    if (event.target.closest('[data-action="enter-focus"]')) {
      if (state.selectedId) enterFocus(state.selectedId);
      canvas.focus({ preventScroll: true });
      return;
    }
    if (event.target.closest('[data-action="leave-focus"]')) {
      leaveFocus();
      canvas.focus({ preventScroll: true });
      return;
    }
    if (event.target.closest('[data-action="clear-selection"]')) {
      clearSelection();
      canvas.focus({ preventScroll: true });
    }
  });
`);

fs.writeFileSync(sourcePath,source);
const sourceSha=crypto.createHash('sha256').update(source).digest('hex');
for(const path of [helpersPath,libPath]){
  let text=fs.readFileSync(path,'utf8');
  if(path===helpersPath) text=text.replace(/export const expectedSourceSha = '[0-9a-f]+';/,`export const expectedSourceSha = '${sourceSha}';`);
  else text=text.replace(/export const sourceSha256 = '[0-9a-f]+';/,`export const sourceSha256 = '${sourceSha}';`);
  fs.writeFileSync(path,text);
}

let tests=fs.readFileSync(testsPath,'utf8');
const additions=`

test('35 inspector exposes accessible enter and back focus controls', () => {
  const source = readSource();
  assert.match(source, /data-action="enter-focus"/);
  assert.match(source, /data-action="leave-focus"/);
  assert.match(source, /\\.focus-action[\\s\\S]*min-height:\\s*var\\(--control-hit-size\\)/);
});

test('36 keyboard supports Shift+Enter drill-in and Escape scope exit', () => {
  const source = readSource();
  assert.match(source, /event\\.shiftKey\\s*&&\\s*event\\.key\\s*===\\s*['"]Enter['"]/);
  assert.match(source, /if \\(state\\.selectedId\\) clearSelection\\(\\);[\\s\\S]*else if \\(state\\.focusPath\\.length\\) leaveFocus\\(\\);/);
});

test('37 search and cross-links can escape a recursive scope', () => {
  const source = readSource();
  assert.match(source, /function ensureGlobalIfOutsideScope\\(nodeId\\)/);
  assert.match(source, /ensureGlobalIfOutsideScope\\(node\\.id\\);[\\s\\S]*focusNode\\(node\\)/);
  assert.match(source, /ensureGlobalIfOutsideScope\\(nodeButton\\.dataset\\.node\\)/);
});

test('38 STREET zoom ceiling can recurse into selected semantic child world', () => {
  const source = readSource();
  assert.match(source, /zoomBand\\(state\\.zoom\\)\\s*===\\s*['"]STREET['"]/);
  assert.match(source, /enterFocus\\(state\\.selectedId\\)/);
});
`;
if(!tests.includes('35 inspector exposes accessible enter and back focus controls')) tests+=additions;
fs.writeFileSync(testsPath,tests);
console.log(`Task 3 applied; source SHA ${sourceSha}`);
