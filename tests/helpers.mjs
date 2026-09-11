import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export const sourcePath = path.join(root, 'src', 'SJHS_Memory_Palace_UIUX.html');
export const expectedSourceSha = '6cbf673c13c4a07d57855686d12991847fdf350b9e360bc58e9090dc261ce323';

export function readSource() { return fs.readFileSync(sourcePath, 'utf8'); }
export function extractScript(source = readSource()) {
  const match = source.match(/<script>([\s\S]*?)<\/script>/);
  if (!match) throw new Error('inline script not found');
  return match[1];
}
export function loadRuntime() {
  const script = extractScript();
  const context = { console };
  vm.createContext(context);
  vm.runInContext(`${script}\n;globalThis.__SJHS_TEST__={graph,buildIndexes,validateGraph,zoomThresholdForLevel,getVisibleNodes,shortestPath,worldToScreenPoint,screenToWorldPoint,nodeGlyph,labelVisibility,nodeRadius,directionalNeighbor,resolveThemePreference,zoomBand,nextZoom,buildSemanticHierarchy,semanticChildren,hierarchyDepthFrom,getScopedVisibleNodes,enterFocusPath,leaveFocusPath};`, context);
  return context.__SJHS_TEST__;
}
