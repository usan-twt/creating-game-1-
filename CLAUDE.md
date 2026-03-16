# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 작업 규칙

1. 채팅은 모두 한국어로 진행한다.
2. 코드는 최대한 효율적으로 짠다. 스파게티 코드가 되지 않도록 용도에 따라 폴더를 적절히 분류한다.
3. 코드 설계 및 기획 및 피드백은 claude-opus-4-6으로, 코드 작성은 claude-sonnet-4-6으로 한다.

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

### Intent Classification

`classifyIntent()` — 정규식 기반 7개 카테고리 + unrelated.

| Intent | Family | Priority (동점 시) |
|---|---|---|
| `empathy`, `comfort` | emotional | 1, 2 |
| `personal` | life | 3 |
| `onset`, `character`, `associated` | medical | 4, 5, 6 |
| `direct` | clinical | 7 |

### Script Progression Rules

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

### Game Screen Types

| Flag | Component | Episodes |
|---|---|---|
| `mechanics.dual` | `DualGameScreen` | EP7 (12턴 공유) |
| `mechanics.noPatient` | `EP10Screen` | EP10 |
| _(default)_ | `GameScreen` | EP1-6, EP8-9 |

### Cross-Episode Connections

- EP1 → EP4: `EP1_jinsu_opened` → 스크립트/notebook/prompt/result 분기
- EP2 → EP8: `EP2_reversal1/2` → 스크립트/초기 라포/notebook 분기
- EP10: opened flags 수로 3-tier 엔딩

### 디렉터리 구조

```
src/
  App.jsx               # Phase state machine + 전역 상태
  components/           # UI 컴포넌트
    GameScreen.jsx       # 기본 진료 화면 (EP1–6, EP8–9)
    DualGameScreen.jsx   # EP7: 두 환자 동시 진료
    EP10Screen.jsx       # EP10: 환자 없음 (동료/교수 대화)
    EpisodeHub.jsx       # 에피소드 선택 허브
    IntroScreen.jsx      # 진료 전 소개 화면
    ResultScreen.jsx     # 진료 결과 화면
    DayEndScreen.jsx     # 하루 마감 내러티브
    InterludeScreen.jsx  # 에피소드 간 의료진 만남
    ClinicScene.jsx      # 환자 비주얼 씬 (감정 표현)
    NotebookPanel.jsx    # 의사 노트 패널 (힌트 포함)
    RapportBar.jsx       # 라포 수치 UI
    DiscoveryFlash.jsx   # deep flag 발동 시 발견 알림
  data/
    episodes.js          # EPISODE_LIST 배열 + injectFatigue
    scripts/             # 에피소드별 대본 JSON
    emotions.js          # 감정 메타데이터
    interludes.js        # EP3/5/7/9 인터루드 정의
    prompts.js           # AI 시스템 프롬프트 (scripted path에선 미사용)
  hooks/
    useGameLogic.js      # 핵심 게임 로직 훅 (대본 진행, intent→응답, 라포, 플래그)
  utils/
    buildInitialFlags.js # EPISODE_LIST → storyFlags 초기값 자동 생성
    classifyIntent.js    # 정규식 기반 intent 분류
    scriptLoader.js      # import.meta.glob으로 scripts/*.json lazy 로드
    episodeDependencies.js # 에피소드 간 의존성 그래프 (문서화용)
```

### Data Files

- `src/data/episodes.js`: `EPISODE_LIST` 배열. 에피소드 스키마는 파일 내 참조. `injectFatigue()` 포함.
- `src/data/scripts/*.json`: `scriptLoader.js`가 `import.meta.glob`으로 자동 인식.
- `src/data/prompts.js`: AI 페르소나 (현재 scripted path에서는 미사용).
- `src/data/interludes.js`: EP3/5/7/9 후 의료진 만남. effects(`fatigue`, `flag`) 적용.
- `src/data/emotions.js`: `neutral`, `anxious`, `exhausted`, `conflicted`, `sad`, `distressed`, `resigned`, `resolute`.

### 스크립트 JSON 턴 포맷

Turn 0 (첫 선택지):
```json
{
  "firstChoices": [
    { "family":"medical", "intent":"onset", "label":"...", "text":"...", "innerVoice":"..." }
  ],
  "onset": { "emotion":"anxious", "text":"...", "rapport_change":0, "flag_trigger":"none" }
}
```

Turn 1+ (분기 대본):
```json
{
  "continue": {
    "after_medical":   { "family":"medical",   "intent":"character", "label":"...", "text":"...", "innerVoice":"..." },
    "after_emotional": { "family":"emotional", "intent":"empathy",   "label":"...", "text":"...", "innerVoice":"..." },
    "after_life":      { "family":"life",      "intent":"personal",  "label":"...", "text":"...", "innerVoice":"..." },
    "after_clinical":  { "family":"medical",   "intent":"associated","label":"...", "text":"...", "innerVoice":"..." }
  },
  "pivots": [
    { "family":"medical", "intent":"character", "label":"...", "text":"...", "innerVoice":"..." }
  ],
  "onset":    { "emotion":"neutral", "text":"...", "rapport_change":0, "flag_trigger":"none" },
  "empathy":  { "emotion":"neutral", "text":"...", "rapport_change":1, "flag_trigger":"jinsu_opened",
                "requires": { "medical": 2 }, "shallow": { "emotion":"neutral", "text":"...", "rapport_change":0, "flag_trigger":"none" } }
}
```

EP10 스크립트 파일은 `ep10_colleague.json` / `ep10_professor.json` 형식 (환자가 아닌 동료/교수 대화).

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
