# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 작업 규칙

1. 채팅은 모두 한국어로 진행한다.
2. 코드는 최대한 효율적으로 짠다. 스파게티 코드가 되지 않도록 용도에 따라 폴더를 적절히 분류한다.
3. 코드 설계 및 기획 및 피드백은 claude-opus-4-6으로, 코드 작성은 claude-sonnet-4-6으로 한다.
4. 파일을 교차읽기하거나 심화해서 얻어야 하는 정보가 아니면 CLAUDE.md에 추가하지 않는다.

## Commands

```bash
npm run dev       # Start dev server (Vite)
npm run build     # Production build
npm run lint      # ESLint check
```

No test suite is configured.

## Architecture

React + Vite SPA 내러티브 게임 (한국어). 1년차 레지던트의 외래 진료 10 에피소드.

### Phase State Machine (App.jsx)

```
hub → intro → game → result → dayEnd → interlude → hub
                                  ↓         ↓
                                 hub       hub  (SKIP if no interlude / EP10)
```

### Two State Systems

| State | Purpose | Scope |
|---|---|---|
| `storyFlags` | 서사 분기 (`EP1_jinsu_opened` 등) | Cross-episode, persistent |
| `residentState` | 게임 메카닉 (`{ fatigue: 0-5 }`) | Cross-episode, persistent |

`buildInitialFlags(EPISODE_LIST)`로 storyFlags 초기값 자동 생성. `numericFlags`는 `0`, 나머지는 `false`.

### Script Progression Rules

`classifyIntent()` → intent → family 매핑(`useGameLogic.js` INTENT_FAMILY) → 대본 진행 판단.

- 같은 family 연속 → 같은 턴 재사용 (진행 안 됨)
- 다른 family + 현재 턴 1회 이상 교환 → 다음 턴으로 이동
- `unrelated` → 간호사 개입, 스크립트 진행 없음
- 대본 소진 → 간호사 "진료 시간 초과" 메시지

### Coverage-gated Enrichment

응답에 `requires: { medical: N }` 필드가 있으면, `usedIntents` 기반 coverage 체크 후 미충족 시 `shallow` 버전으로 강등. Deep flag는 empathy/personal 계열에서만 트리거되며, 의료 커버리지 선행 요구 가능.

### `canEnd` 조건 (마치기 버튼)

`exchangeCount >= minTurns + fatigueDelay AND checkEndCondition(ep.endCondition, usedIntents)`. EP별 `endCondition: { medical: N, emotional: N }` 형태.

### Fatigue System

EP1-EP3 튜토리얼 (피로 없음). EP4+ deep flag 발동 시 +1. EP7 항상 +1. fatigue ≥ 3이면 `minTurns + 1` 및 AI 프롬프트에 피로 컨텍스트 주입. UI 없음.

### Cross-Episode Connections

- EP1 → EP4: `EP1_jinsu_opened` → 스크립트/notebook/prompt/result 분기
- EP2 → EP8: `EP2_reversal1/2` → 스크립트/초기 라포/notebook 분기
- EP10: opened flags 수로 3-tier 엔딩

---

## 에피소드 설계 방법론

**EP1/EP2/EP3가 표준**. EP4+ 스크립트는 아직 레거시 포맷. 신규 에피소드는 아래 방식으로 설계한다. 재진 에피소드는 스크립트 파일을 base/opened로 분리한다.

### 1단계: 캐릭터 바이블

```
[표면] 주소(CC) + 첫인상
[진짜] 숨겨진 이유. 스크립트 후반부에서만 열림
[성격] 의사 반응에 따른 행동 패턴
[라포 규칙] +1 / 0 / -1 조건
[deep flag] rapport N 이상 AND empathy/personal 계열. requires로 의료 커버리지 선행 요구 가능
```

### 2단계: 10턴 흐름 설계

| 구간 | 역할 |
|---|---|
| Turn 0 | 첫인상 + 3방향 진입 (`firstChoices`) |
| Turn 1–3 | 의료 정보 수집 + 관계 탐색 |
| Turn 4–6 | 갈등 노출 + 전환 신호 |
| Turn 7–8 | **Deep flag zone** |
| Turn 9 | 마무리 + 여운 |

### 3단계: 선택지 설계

각 턴은 `continue` (직전 family 기반 연속 선택지) + `pivots` (medical/emotional/life 3방향) + intent 키 응답으로 구성. Turn 0만 `firstChoices` 사용.

- `innerVoice`: 의사의 내면 추론. 선택의 이유가 보여야 함.
- `label`: 내적 판단 ("아들 얘기가 신경 쓰인다"), `text`: 실제 발화.
- Deep flag 응답에는 `requires` + `shallow` 추가.

### 재진 에피소드 설계 (EP4, EP8 등)

base/opened 파일 분리. opened가 더 긴 경험을 제공한다 (이전 투자에 비례).

| 경로 | 턴 수 | 특징 |
|---|---|---|
| base | 6–7턴 | 관계 없음. 사무적. deep flag 없거나 제한적 |
| opened | 8–10턴 | 이전 관계가 콘텐츠를 연다. deep flag 가능 |

- opened의 `firstChoices`에 **"기억하는" 선택지 1개 필수** (예: "지난번 이후 어떠셨어요?")
- `endCondition: { medical: 1 }` — 관계 형성 이미 완료이므로 emotional 불필요
- opened의 deep flag는 이전 에피소드 플래그를 전제 조건으로 포함

### 스크립트 파일 네이밍

```
ep{N}.json              기본
ep{N}_{variant}.json    플래그 분기 (ep4_opened.json, ep8_r2.json)
ep{N}a.json / b.json    dual 메카닉 (EP7)
```

### 레퍼런스

`intern-ep01to10.jsx` (루트): EP1-10 전체 로직이 담긴 단일 파일 원본. 설계 참고용.
