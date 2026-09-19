# SJHS Science Memory Palace

세종과학고 출석면담을 준비하면서 과학 개념을 과목별 목록으로 외우기보다, **서로 연결된 하나의 공간처럼 기억하려고 만든 지식지도**입니다.

물리·화학·생명·지구과학을 따로 끊지 않고, 원초 원리에서 현상·교과 개념·실험·심화 내용으로 이어지게 구성했습니다.

Live: `https://rudwpahs.github.io/SJHS/`

## 현재 데이터

- 198 concepts
- 291 relations
- 중학교 과학 24/24 대단원 연결
- orphan curriculum unit 0
- dangling edge 0

## Memory Palace의 핵심 규칙

개념의 위치는 단순한 UI 배치가 아니라 기억 좌표로 사용합니다. 그래서 semantic zoom을 하더라도 기존 node의 `x`, `y` 좌표를 자동으로 다시 배치하지 않습니다.

## 그래프 구성 알고리즘

```text
canonical concept node
   ↓
각 node의 고정 x / y 위치 유지
   ↓
relation edge 연결
   ↓
PART_OF 관계를 우선해 의미 계층 파생
   ↓
현재 focus scope 안에 들어오는 node 계산
   ↓
좌표는 그대로 두고 해당 scope만 화면에 표시
```

즉, zoom할 때 graph 자체를 바꾸는 게 아니라 **같은 canonical graph에서 보여줄 범위만 바꿉니다.**

## Recursive semantic zoom

의미 확대 단계는 다음처럼 반복됩니다.

```text
WORLD → CONTINENT → REGION → CITY → STREET
```

STREET에 도착한 뒤에도 그 개념 아래에 더 세부 구조가 있다면 해당 node를 다시 하나의 local WORLD처럼 열 수 있습니다.

진입 과정은:

```text
node 선택
   ↓
선택한 node의 PART_OF 하위 관계 탐색
   ↓
local scope 생성
   ↓
기존 canonical coordinate를 새 scope에 투영
   ↓
현재 scope만 렌더링
```

`Escape` 또는 `한 단계 위로`를 누르면 이전 scope stack으로 돌아갑니다. 검색이나 교차 링크는 현재 scope 밖의 canonical 위치로 바로 이동할 수 있습니다.

## 데이터 검증 알고리즘

빌드 전에 graph가 깨지지 않았는지 검사합니다.

```text
canonical source 읽기
   ↓
node id uniqueness 검사
   ↓
edge의 from / to가 실제 node인지 검사
   ↓
24개 curriculum unit coverage 검사
   ↓
접근성 / dependency gate 검사
   ↓
dist 생성
   ↓
생성된 payload를 다시 복원해 원본과 일치하는지 확인
```

## Source of truth

현재 편집 가능한 canonical source는:

`src/SJHS_Memory_Palace_UIUX.html`

루트에 남아 있는 과거 `index.html` / `sjhs-payload-*`는 legacy snapshot이고 Pages 배포 입력으로 사용하지 않습니다.

## 검증

```bash
npm test
npm run audit
npm run build
npm run verify
```

`npm run verify`는 테스트, graph 상태, 접근성 gate, build와 payload round-trip을 함께 확인합니다.

## 조작

- node 클릭 — 선택
- `이 개념 안으로` / `Shift+Enter` — 하위 scope 진입
- `Escape` — 한 단계 위로
- 검색 — 현재 위치와 관계없이 canonical node 탐색

## UI 원칙

- keyboard focus를 항상 보이게 함
- interactive target 최소 44px
- map navigation의 keyboard 대안 제공
- light / dark semantic token 사용
- reduced-motion 지원
- 색 하나만으로 의미를 전달하지 않음

디자인 시스템은 `design-system/sjhs-memory-palace/MASTER.md`를 기준으로 합니다.
