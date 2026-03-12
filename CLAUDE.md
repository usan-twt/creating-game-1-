# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 작업 규칙

1. 채팅은 모두 한국어로 진행한다.
2. 코드는 최대한 효율적으로 짠다. 이때, 스파게티 코드가 되지 않도록 용도에 따라 폴더를 적절히 분류한다.
3. 코드 설계 및 기획 및 피드백은 claude-opus-4-6으로, 코드 작성은 claude-sonnet-4-6으로 한다.

## Commands

```bash
npm run dev       # Start dev server (Vite)
npm run build     # Production build
npm run lint      # ESLint check
npm run preview   # Preview production build
```

No test suite is configured.

## Environment Setup

Copy `.env.example` to `.env` and add a real Anthropic API key:
```
VITE_ANTHROPIC_API_KEY=sk-ant-...
```

The app is designed for direct browser-to-Anthropic API calls (`anthropic-dangerous-direct-browser-access: true`). However, the current implementation uses **pre-scripted JSON responses** (see `src/data/scripts/`), not live API calls.

## Architecture

React + Vite single-page narrative game (all UI in Korean). The player is a first-year medical resident having consultations across 10 episodes.

### Phase State Machine (App.jsx)

`App` uses `useReducer` with an explicit transition map:

```
hub → intro → game → result → dayEnd → interlude → hub
                                  ↓         ↓
                                 hub       hub  (SKIP if no interlude / EP10)
```

Valid transitions are defined in `TRANSITIONS` object. Invalid transitions are silently ignored.

### Two Separate State Systems

| State | Purpose | Scope |
|---|---|---|
| `storyFlags` | Narrative branching (e.g. `EP1_jinsu_opened`) | Cross-episode, persistent |
| `residentState` | Game mechanics (`{ fatigue: 0-5 }`) | Cross-episode, persistent |

`buildInitialFlags(EPISODE_LIST)` auto-generates initial `storyFlags` from each episode's `completedFlag` and `localFlags`. Numeric flags (listed in `numericFlags: [...]`) are initialized to `0` instead of `false`.

### Intent Classification + Branching Scripts

`useGameLogic` (src/hooks/useGameLogic.js) classifies each doctor input via `classifyIntent()` (src/utils/classifyIntent.js) and selects the matching response from the current turn's branching script.

**Intent categories** (7 active categories, keyword regex on Korean medical vocabulary):

| Intent | Family | Example inputs |
|---|---|---|
| `onset` | medical | 증상 시작, 언제부터, 어디가 아프, 열이, 기침 |
| `character` | medical | 어떻게 아프, 찌릿, 쑤시, 뻐근, 저리 |
| `associated` | medical | 다른 증상, 이전에도, 복용, 알레르기, 병력 |
| `empathy` | emotional | 힘드, 괜찮, 걱정, 위로, 천천히 |
| `comfort` | emotional | 오시는데, 기다리셨, 먼 길 (병원 방문 관련) |
| `personal` | life | 집에, 가족, 요즘, 혼자, 직장 |
| `direct` | clinical | 검사, 처방, CT, 약을, 입원 |
| `unrelated` | — | 위 패턴 미매칭 |

Priority order (동점 시): empathy > comfort > personal > onset > character > associated > direct

**Script JSON format** — each turn is an object with intent keys:
```json
[
  {
    "onset":    {"emotion":"anxious","text":"어제부터요...","rapport_change":0,"flag_trigger":"none"},
    "empathy":  {"emotion":"conflicted","text":"...괜찮아요.","rapport_change":1,"flag_trigger":"none"},
    "personal": {"emotion":"anxious","text":"...혼자 왔어요.","rapport_change":1,"flag_trigger":"none"},
    "direct":   {"emotion":"neutral","text":"네, 검사요.","rapport_change":0,"flag_trigger":"none"},
    "unrelated":{"emotion":"neutral","text":"...네?","rapport_change":0,"flag_trigger":"none"}
  }
]
```

**Fallback chains** (script JSON의 키가 없을 때 시도 순서):
- `onset` → `["onset", "symptom"]`
- `character` → `["character", "onset", "symptom"]`
- `associated` → `["associated", "onset", "symptom"]`
- `comfort` → `["comfort", "empathy"]`
- `direct` → `["direct", "symptom"]`
- `symptom` 키는 레거시 호환용 (`onset` 계열로 처리)

**Intent family 기반 스크립트 진행 규칙**:
- 같은 family의 intent가 연속되면 스크립트 인덱스가 진행되지 않음 (같은 턴 재사용)
- 다른 family로 바뀔 때만 다음 턴으로 이동
- `unrelated` 인텐트는 즉시 간호사 개입 (스크립트 진행 없음)
- 마지막 턴 소진 후에는 간호사 "진료 시간 초과" 메시지

**Design principles:**
- Deep flags (`jinsu_opened`, `real_opened` 등)은 `empathy`/`personal` 계열에서만 트리거
- `direct`/`unrelated` 경로는 깊은 스토리 컨텐츠를 열지 않음
- Backward compatible: `symptom` 키 없으면 레거시 순차 포맷으로 폴백

System prompts in `src/data/prompts.js` define patient personas — designed for live Anthropic API usage but currently unused by the scripted path.

### Fatigue System (Papers Please-inspired)

- **EP1-EP3**: Tutorial period. No fatigue cost.
- **EP4+**: Opening deep flags costs fatigue +1. EP7 always +1 (`alwaysFatigue: true`).
- **Effects at fatigue >= 3**: `injectFatigue()` in episodes.js adds context to AI prompts. `GameScreen` adds +1 to `minTurns` via `fatigueDelay` (`residentState.fatigue >= 3` and `ep.day >= 4`).
- **No explicit UI** for fatigue. Player feels it through gameplay.

Deep flag map (episode `deepFlags` array에 선언):
- EP4: `deeper_connection`, EP5: `real_opened`, EP6: `gave_comfort`/`answered_directly`, EP8: `grief_opened`, EP9: `real_opened`

### Three Game Screen Types

| Mechanic flag | Component | Used by |
|---|---|---|
| `mechanics.dual` | `DualGameScreen` | EP7 (two simultaneous patients, shared 12-turn budget) |
| `mechanics.noPatient` | `EP10Screen` | EP10 (colleague/professor/alone choice) |
| _(default)_ | `GameScreen` | EP1-EP6, EP8, EP9 |

### Episode Data (src/data/)

- **episodes.js**: `EPISODE_LIST` array. `injectFatigue()` helper wraps prompts for EP4+.
- **scripts/*.json**: Intent-branching scripts. `scriptLoader.js` uses Vite's `import.meta.glob` — 파일 추가만 하면 자동 인식, manifest 불필요.
- **prompts.js**: System prompts defining patient personas (Korean). Designed for AI JSON responses.
- **interludes.js**: Scripted staff encounters after EP3/EP5/EP7/EP9. Deterministic, with 1-2 choices affecting fatigue or storyFlags.
- **emotions.js**: Emotion metadata (labels + colors). Valid values: `neutral`, `anxious`, `exhausted`, `conflicted`, `sad`, `distressed`, `resigned`, `resolute`.

**Episode object schema** (전체 필드):
```js
{
  id: "EP1",                        // completedFlag prefix
  day: 1,
  titleNum: "EP.01",                // 허브 표시용
  name: "박진수", age: 54, sex: "남",
  cc: "주소 텍스트",                 // 첫 환자 대사
  subtitle: "월요일 오전 8시",
  teaser: "허브 카드 설명",
  skin/shirt/hairColor/hairType,    // ClinicScene SVG 파라미터
  vitals: { BP, HR, SpO2 },
  initialEmotion: "anxious",
  initialPhoneCheck: true,
  minTurns: 5,                      // 세션 종료 버튼 최소 교환 횟수
  notebookPre: "...",               // 정적 사전 메모
  getNotebookPre: (sf) => "...",   // 동적 버전 (이전 에피 플래그 참조 시)
  getInitialRapport: (sf) => 0,    // 라포 초기값 (선택적, EP8 등에서 사용)
  getSystemPrompt: (sf, rs) => PROMPT,
  getScriptData: (sf) => loadScript("ep1.json"),  // Promise 반환
  getResultLines: (sf, lf) => ({ lines: [...], footer: "..." }),
  getDayEndNarrative: (lf) => ["..."],            // DayEndScreen 서술 라인
  completedFlag: "EP1_completed",
  localFlags: ["jinsu_opened"],     // 글로벌 저장 시 `EP1_jinsu_opened`
  numericFlags: ["turnsA"],         // 초기값 0 (불리언 아님)
  deepFlags: [],                    // 피로도 +1 유발 플래그
  alwaysFatigue: false,             // true이면 에피 완료 시 항상 +1 (EP7)
  mechanics: {},                    // { dual, noPatient, translator, breathing }
  dependsOn: {                      // 교차 의존성 문서화 (선언적)
    flags: [{ flag: "EP1_jinsu_opened", affects: ["script","notebook","prompt","result"] }]
  },
  hints: [                          // NotebookPanel 진료 가이드
    { intent: "symptom", category: "증상 파악", guide: "...", questions: ["..."] }
  ],
  hintUnlockTurn: 3,                // 이 교환 횟수 이후 hints 표시
  glossaryEntries: [                // 의학 용어 설명 (NotebookPanel 용어집)
    { key, symbol, source, reading, meaning }
  ],
  discoveries: {                    // flag_trigger → DiscoveryFlash 표시 내용
    jinsu_opened: { title: "진짜 이유", text: "...", color: "#6a8faa" }
  },
}
```

**storyFlags naming convention**: `localFlags: ["flag_name"]` in `EP{n}` → 글로벌 키 `EP{n}_flag_name`.

**Script exhaustion + nurse behavior**: 마지막 스크립트 턴 소진 시 간호사 메시지. `unrelated` 인텐트는 즉시 간호사 개입 (스크립트 인덱스 진행 없음). 둘 다 `{ speaker: "nurse" }` 반환.

### Key Components

- **DayEndScreen**: End-of-day summary. Papers Please 스타일 (판단 없음). `getDayEndNarrative()` 서술 표시.
- **InterludeScreen**: 1-2 선택지 있는 의료진 만남. 선택 시 effects(`fatigue`, `flag`) 적용.
- **NotebookPanel**: 사전 메모 + 사용자 메모장 + hints 섹션 + 의학 용어집 + EP9 article clue.
  - `hints`는 `hintUnlockTurn` 이후 표시, `usedIntents` 추적으로 사용 여부 표시.
- **ClinicScene**: SVG 기반 환자 시각화. emotion/talking 상태에 반응.
- **DiscoveryFlash**: `flag_trigger` 발동 시 오버레이로 discovery 제목/텍스트 표시.
- **RapportBar**: 라포 수치 시각화.

### Cross-Episode Connections

- EP1 → EP4: `EP1_jinsu_opened` → 스크립트(`ep4_opened.json` vs `ep4_base.json`), notebook, prompt, result 분기
- EP2 → EP8: `EP2_reversal1/2` → 스크립트(`ep8_r2.json` vs `ep8_base.json`), 초기 라포, notebook 분기
- EP10 ending: `depth` counts opened flags across EP1/2/3/5/8 for 3-tier ending

### Special Mechanics

- **translator** (EP2): `translatorDirect` 상태로 딸 통역/직접 대화 토글
- **breathing** (EP5): `breathingCalm` 컨텍스트 전달
- **article** (EP9): `article_hint` 플래그 발동 시 notebook에 단서 문서 표시
- **dual** (EP7): 두 `useGameLogic` 인스턴스, 별도 스크립트(`ep7a.json`, `ep7b.json`), `focused`로 활성 환자 전환, 12턴 공유 예산
- **noPatient** (EP10): 동료/교수/혼자 3방향 선택, 각각 스크립트 또는 정적 성찰
