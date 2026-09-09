# SJHS Science Memory Palace

세종과학고 출석면담 준비를 위한 **First Principles + Memory Palace** 과학 지식지도입니다. 단원을 카드처럼 나열하지 않고, 원초 원리에서 현상·교과 개념·실험·심화 개념이 자라나는 고정 좌표 그래프로 구성합니다.

## 핵심 UX

- **고정 지형**: 기존 노드 좌표는 자동 재배치하지 않습니다. 위치 자체를 장기 기억 단서로 사용합니다.
- **Fractal semantic zoom**: WORLD → CONTINENT → REGION → CITY → STREET 순으로 확대할수록 세부 개념과 메커니즘이 나타납니다.
- **First Principles**: 물질, 에너지, 상호작용, 정보, 평형, 공간·시간 같은 원초 원리를 큰 랜드마크로 둡니다.
- **모양으로도 구분**: 원초 원리=링, 일반 교과=원, 개인 탐구=다이아몬드, 현대물리=라운드 사각형입니다.
- **접근성**: 마우스/휠 없이도 검색, 확대/축소, 방향 탐색, 선택 해제가 가능합니다.
- **Light/Dark**: semantic token 기반 두 테마를 지원합니다.

## 조작

| 입력 | 동작 |
| --- | --- |
| 휠 / 트랙패드 | 포인터 위치를 유지하며 확대·축소 |
| 드래그 | 지도 이동 |
| 노드 클릭 | 상세 원리·메커니즘·직접 연결 표시 |
| `+` / `-` | 지도 확대 / 축소 |
| 방향키 | 현재 위치에서 해당 방향의 가까운 개념으로 이동 |
| `0` | WORLD 좌표로 복귀 |
| `Esc` | 선택 해제 |
| `/` | 검색창으로 이동 |
| 검색 + Enter | 해당 개념으로 이동 |

## 현재 지식 베이스

- 2015 개정 중학교 과학 대단원 앵커 **24/24**
- canonical node **198개**
- relation edge **291개**
- 공변세포 기공 개방, 티록신과 대사, 양자역학, 상대성이론 심화 seed
- 농구공 수분·미끄러짐, 순수 구름, 이분매칭, 슈팅 분석, 무선 송수신 개인 탐구 영역

24개 대단원은 모두 매핑되어 있지만, 최종 목표인 **모든 세부 성취기준을 atomic node 수준으로 누락 0**까지 분해한 상태는 아닙니다. `coverage-report.json`은 현재 v0 지식 coverage 검증 기록입니다.

## UI 규칙

프로젝트 루트의 [`SKILL.md`](./SKILL.md)가 이후 변경의 기준입니다. UI는 UI/UX Pro Max 계열 원칙을 반영해 accessibility-first, 44px minimum hit target, SVG structural icons, reduced-motion, mobile-safe-area, primitive → semantic → component token 구조를 강제합니다.

디자인 기준본은 [`design-system/sjhs-memory-palace/MASTER.md`](./design-system/sjhs-memory-palace/MASTER.md)입니다.

## 로컬 실행

별도 빌드가 필요 없는 정적 ES-module 사이트입니다.

```bash
python3 -m http.server 8765
```

브라우저에서 `http://localhost:8765/`을 엽니다.

## 검증

```bash
npm test
npm run audit
# 또는 둘 다
npm run verify
```

`npm run audit`은 UI token, 접근성 hook, 44px control, reduced motion, SVG icon, renderer/CSS raw-hex 사용을 검사합니다.

## GitHub Pages

배포 workflow: `.github/workflows/pages.yml`

예상 주소: `https://rudwpahs.github.io/SJHS/`

새 저장소에서 Pages가 아직 활성화되지 않았다면 GitHub의 **Settings → Pages → Build and deployment → Source → GitHub Actions**를 한 번 선택해야 합니다. 이후 `main` push마다 workflow가 자동 배포합니다.
