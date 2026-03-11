# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 기본 원칙

1. 채팅은 모두 한국어로 진행한다.
2. 코드는 최대한 효율적으로 짠다. 이때, 스파게티 코드가 되지 않도록 용도에 따라 폴더를 적절히 분류한다.
3. 코드 설계 및 기획 및 피드백은 claude-opus-4-6으로, 코드 작성은 claude-sonnet-4-6으로 한다.

## 엔진 및 언어

- **Godot 4** (GDScript 2.0)
- 테스트 명령 없음 (Godot 에디터에서 직접 실행)

## 프로젝트 구조

```
scenes/
  screens/       # 각 화면 씬 (.tscn)
  components/    # 재사용 컴포넌트 씬
scripts/
  core/          # 게임 핵심 로직 (autoload 포함)
  data/          # 에피소드/감정/인터루드 데이터 (autoload)
  screens/       # 각 화면 스크립트
  components/    # 컴포넌트 스크립트
data/
  scripts/       # 에피소드별 JSON 스크립트 (브랜칭 응답)
```

## Autoload 싱글톤

| 싱글톤 | 파일 | 역할 |
|---|---|---|
| `GameManager` | `scripts/core/GameManager.gd` | 페이즈 상태머신, storyFlags, residentState |
| `EpisodeData` | `scripts/data/EpisodeData.gd` | EPISODE_LIST, 에피소드 조회 |
| `EmotionData` | `scripts/data/EmotionData.gd` | 감정 메타데이터 (색상, 라벨) |
| `InterludeData` | `scripts/data/InterludeData.gd` | 인터루드 데이터, get_interlude() |

## 게임 아키텍처

### 페이즈 상태머신 (GameManager)

```
HUB → INTRO → GAME → RESULT → DAY_END → INTERLUDE → HUB
                                  ↓           ↓
                                 HUB         HUB  (인터루드 없음 / EP10)
```

`GameManager.dispatch(action, payload)` 로 전환. 잘못된 전환은 무시.

### 두 가지 상태 시스템

- `GameManager.story_flags` — 내러티브 분기 (에피소드 간 유지)
- `GameManager.resident_state` — 게임 메카닉 `{ "fatigue": 0~5 }` (에피소드 간 유지)

### 인텐트 분류 + 브랜칭 스크립트

`IntentClassifier.classify(text)` → `symptom / empathy / personal / direct / unrelated`

JSON 스크립트 포맷 (턴당 5개 인텐트 키):
```json
[{
  "symptom":  {"emotion":"anxious","text":"...","rapport_change":0,"flag_trigger":"none"},
  "empathy":  {"emotion":"conflicted","text":"...","rapport_change":1,"flag_trigger":"none"},
  "personal": {"emotion":"anxious","text":"...","rapport_change":1,"flag_trigger":"none"},
  "direct":   {"emotion":"neutral","text":"...","rapport_change":0,"flag_trigger":"none"},
  "unrelated":{"emotion":"neutral","text":"...","rapport_change":0,"flag_trigger":"none"}
}]
```

### 피로도 시스템

- EP1~EP3: 피로도 없음 (튜토리얼)
- EP4+: 딥 플래그 열면 +1, EP7은 항상 +1
- fatigue >= 3: minTurns +1 (GameScreen에서 처리)

### 세 가지 게임 화면

| 조건 | 씬 | 사용 |
|---|---|---|
| `ep.mechanics.dual == true` | `DualGameScreen.tscn` | EP7 |
| `ep.mechanics.no_patient == true` | `EP10Screen.tscn` | EP10 |
| 기본 | `GameScreen.tscn` | EP1~EP6, EP8, EP9 |

### 에피소드 간 연결

- EP1 → EP4: `EP1_jinsu_opened` 플래그로 스크립트/노트북 분기
- EP2 → EP8: `EP2_reversal1/2` 플래그로 스크립트/초기 라포 분기
- EP10 결말: EP1/2/3/5/8 딥 플래그 수로 3단계 엔딩 결정

### GameLogic (scripts/core/GameLogic.gd)

Node를 상속하는 클래스. GameScreen에서 인스턴스화.
- `send(text)` 비동기 메서드 → 스크립트에서 응답 선택 → 시그널 발생
- 시그널: `emotion_changed`, `talking_changed`, `history_updated`, `rapport_changed`, `session_flag_set`
