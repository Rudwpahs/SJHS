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

## Current snapshot

- 198 concepts
- 291 relations
- 24/24 middle-school science major units mapped
- orphan curriculum units: 0
- dangling edges: 0
- guard-cell opening and thyroxine mechanisms
- quantum/relativity landmarks
- personal research landmarks

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

`index.html` + `sjhs-payload-*.js` are the generated static Pages snapshot. The payload reconstructs the exact locally verified UI build.

## Verification snapshot

The published payload reconstructs a 159,032-byte verified UI artifact with SHA-256:

`3b1a36475caebac8eebc0923c176bdb5ff0a46eb77e1704c45ec47971d053232`

Local source verification before packaging:
- 26/26 automated tests passed
- UI audit passed
- JS syntax checks passed

Current curriculum metrics are stored in [`coverage-report.json`](./coverage-report.json).
