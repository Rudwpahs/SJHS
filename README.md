# SJHS Science Memory Palace

세종과학고 출석면담 준비를 위한 **First Principles + Memory Palace** 과학 지식지도입니다.

## Live

https://rudwpahs.github.io/SJHS/

## Product rules

- 기존 canonical node의 공간 위치는 기억 좌표이므로 자동 재배치하지 않습니다.
- 원초 원리에서 현상·교과 개념·실험·심화로 이어지는 구조를 우선합니다.
- 오개념은 canonical knowledge node로 저장하지 않습니다.
- 2015 개정 중학교 과학의 24개 대단원 coverage를 유지합니다.
- 물리/화학/생명/지구과학은 칸막이보다 실제 개념 관계로 연결합니다.
- 의미 확대는 `WORLD → CONTINENT → REGION → CITY → STREET` 5단계를 반복하며, 하위 개념이 있는 노드는 다시 하나의 local WORLD가 될 수 있습니다.

## Current snapshot

- 198 concepts
- 291 relations
- 24/24 middle-school science major units mapped
- orphan curriculum units: 0
- dangling edges: 0
- recursive semantic focus scopes over immutable canonical coordinates
- guard-cell opening and thyroxine mechanisms
- quantum/relativity landmarks
- personal research landmarks

## Canonical source

현재 편집 가능한 source of truth는 `src/SJHS_Memory_Palace_UIUX.html`입니다.

- size: 167,375 bytes
- SHA-256: `47bc095f766b788a56eb1de4a92061c2467fab108dc62395530ed68c10fbaa06`

루트의 과거 `index.html` / `sjhs-payload-*.js` 파일은 구조 복원 이전의 legacy snapshot이며 더 이상 Pages 배포 입력으로 사용하지 않습니다. 현재 배포는 canonical source를 검증하고 `dist/`를 새로 생성합니다.

Verification commands:

```bash
npm test          # 42 automated tests
npm run audit     # source, graph, accessibility and dependency gates
npm run build     # four-chunk Pages package -> dist/
npm run verify    # all gates + byte-for-byte payload restoration
```

## Recursive semantic zoom

현재 지도는 canonical graph를 재배치하지 않고 UI-only semantic hierarchy를 파생합니다.

- `PART_OF`를 우선적인 계층 관계로 사용합니다.
- 선택(selection)과 내부 진입(drill-in)을 분리합니다.
- Inspector의 `이 개념 안으로`, `Shift+Enter`, STREET 단계에서의 추가 확대를 통해 local WORLD로 진입할 수 있습니다.
- `Escape` 또는 `한 단계 위로`로 이전 scope로 돌아갑니다.
- 검색과 교차 개념 링크는 현재 scope 밖의 canonical 위치로 이동할 수 있습니다.
- focus scope를 바꿔도 기존 node의 `x`, `y` 값은 변경하지 않습니다.

## UI/UX

The current UI follows the project [`SKILL.md`](./SKILL.md) and the checked UI/UX Pro Max / design-system / ui-styling guidance:
- accessibility-first
- visible keyboard focus
- >=44px interactive targets
- keyboard alternatives for map navigation
- semantic light/dark theme tokens
- reduced-motion support
- SVG structural icons
- fixed spatial landmarks for Memory Palace recall

Design system: [`design-system/sjhs-memory-palace/MASTER.md`](./design-system/sjhs-memory-palace/MASTER.md)

## Pages release flow

A push to `main` runs `.github/workflows/pages.yml`:

1. checkout
2. Node.js 20 setup
3. `npm run verify`
4. upload generated `dist/`
5. deploy that verified artifact to GitHub Pages

This prevents a stale root payload from being deployed instead of the current canonical source.

## Verification snapshot

Recursive semantic zoom feature verification:
- 42/42 automated tests including semantic-navigation review regression
- graph remains 198 concepts / 291 relations / 24 curriculum units
- canonical coordinates are unchanged by focus operations
- UI audit and generated payload round-trip are required before deployment

Current curriculum metrics are generated into `dist/coverage-report.json` during the build.
