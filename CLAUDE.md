# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

`intern-ep01to10.jsx` at the repo root is a single-file prototype/reference; the active app is under `src/`.

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

These are intentionally separated: storyFlags drives story, residentState drives cost/consequence mechanics.

All `storyFlags` keys are declared upfront in `App.jsx` initial state (pattern: `EP{N}_completed`, `EP{N}_{flag}`). When `handleEnd` fires, local flags from a session get namespaced and merged in: `localFlags["jinsu_opened"]` → `storyFlags["EP1_jinsu_opened"]`.

### Intent Classification + Branching Scripts

`useGameLogic` (src/hooks/useGameLogic.js) classifies each doctor input via `classifyIntent()` (src/utils/classifyIntent.js) and selects the matching response from the current turn's branching script.

**Intent categories** (keyword regex matching on Korean medical vocabulary):
| Intent | Example inputs | Patient reaction |
|---|---|---|
| `symptom` | "어디가 아프세요", "언제부터" | Symptom description (clinical) |
| `empathy` | "힘드시겠다", "괜찮으세요" | Rapport boost, emotional opening |
| `personal` | "집에서는 어떠세요", "요즘 어떠세요" | Personal story hints |
| `direct` | "검사합시다", "약 드릴게요" | Short, clinical acknowledgment |
| `unrelated` | (no keyword match) | Confused/awkward response |

Short listening tokens (e.g. `"네"`, `"그렇군요"`) bypass scoring and always resolve to `empathy`.

**Script JSON format** — each turn is an object with 5 intent keys:
```json
[
  {
    "symptom":  {"emotion":"anxious","text":"어제부터요...","rapport_change":0,"flag_trigger":"none"},
    "empathy":  {"emotion":"conflicted","text":"...괜찮아요.","rapport_change":1,"flag_trigger":"none"},
    "personal": {"emotion":"anxious","text":"...혼자 왔어요.","rapport_change":1,"flag_trigger":"none"},
    "direct":   {"emotion":"neutral","text":"네, 검사요.","rapport_change":0,"flag_trigger":"none"},
    "unrelated":{"emotion":"neutral","text":"...네?","rapport_change":0,"flag_trigger":"none"}
  }
]
```

**Design principles:**
- Deep flags (`jinsu_opened`, `real_opened`, etc.) only trigger on `empathy`/`personal` intents
- `direct`/`unrelated` paths never unlock deep story content
- Tie-break priority: empathy > personal > symptom > direct
- Backward compatible: if a turn entry lacks `symptom` key, falls back to legacy sequential format

System prompts in `src/data/prompts.js` define patient personas and expected JSON response schemas — these were designed for live Anthropic API usage but are currently only passed through (unused by the scripted path).

### Fatigue System (Papers Please-inspired)

- **EP1-EP3**: Tutorial period. No fatigue cost.
- **EP4+**: Opening deep flags costs fatigue +1. EP7 always +1.
- **Effects at fatigue >= 3**: `injectFatigue()` in episodes.js adds context to AI prompts (patient notices doctor is tired). `GameScreen` adds +1 to `minTurns` (subtle gameplay delay).
- **No explicit UI** for fatigue. Player feels it through gameplay.

Deep flag map (which flags cause fatigue):
- EP4: `deeper_connection`, EP5: `real_opened`, EP6: `gave_comfort`/`answered_directly`, EP8: `grief_opened`, EP9: `real_opened`

### Three Game Screen Types

| Mechanic flag | Component | Used by |
|---|---|---|
| `mechanics.dual` | `DualGameScreen` | EP7 (two simultaneous patients, shared 12-turn budget) |
| `mechanics.noPatient` | `EP10Screen` | EP10 (colleague/professor/alone choice) |
| _(default)_ | `GameScreen` | EP1-EP6, EP8, EP9 |

### Episode Data (src/data/)

- **episodes.js**: `EPISODE_LIST` array. Each episode object has these fields:
  - `getSystemPrompt(storyFlags, residentState)` — always present
  - `getScriptData(storyFlags)` — present on all episodes except EP7/EP10; returns the appropriate JSON script based on flags
  - `ep.scripts` — only EP10: `{ colleague, professor }` keyed scripts used directly by `EP10Screen`
  - `notebookPre` — static string for most episodes
  - `getNotebookPre(storyFlags)` — function variant for EP4 and EP8 (content varies by prior flags)
  - `getInitialRapport(storyFlags)` — only EP8; sets starting rapport based on EP2 outcome
  - `articleText` — only EP9; revealed in notebook when `article_hint` flag fires
  - `mechanics` — object with optional boolean flags: `dual`, `noPatient`, `translator`, `breathing`, `article`
  - `localFlags` — array of flag names that can be set during the episode (namespaced to `EP{N}_*` on save)

- **scripts/*.json**: Intent-branching scripts. Some episodes have variant scripts selected by storyFlags (e.g. `ep4_opened.json` vs `ep4_base.json`, `ep8_r2.json` vs `ep8_base.json`).
- **prompts.js**: System prompts defining patient personas, rapport rules, flag conditions (all in Korean). Designed for AI JSON responses.
- **interludes.js**: Scripted staff encounters firing after EP3, EP5, EP7, EP9 only (`getInterlude()` returns `null` for all other episodes). Each interlude's choices have `effects: { fatigue?: number, flag?: string }` applied in `handleInterludeContinue`.
- **emotions.js**: Emotion metadata (labels + colors).

### Key Components

- **DayEndScreen**: End-of-day summary. Shows patient(s) completed, time indicator. Factual, no judgment (Papers Please style).
- **InterludeScreen**: Scripted medical staff encounters. Speaker + dialogue lines + choice buttons. Effects applied on choice.
- **NotebookPanel**: Slide-out panel with pre-written notes, user notepad, and optional article clue (EP9).
- **ClinicScene**: SVG-based patient visualization, responds to emotion/talking state.

### Cross-Episode Connections

- EP1 → EP4: `EP1_jinsu_opened` selects different script (`ep4_opened.json` vs `ep4_base.json`) and personalizes notebook
- EP2 → EP8: `EP2_reversal1/2` selects different script (`ep8_r2.json` vs `ep8_base.json`), sets initial rapport, personalizes notebook
- EP10 ending: `depth` counts opened flags across EP1/2/3/5/8 for 3-tier ending

### Special Mechanics

- **translator** (EP2): toggle between daughter-mediated and direct-to-mother modes via `translatorDirect` state
- **breathing** (EP5): `breathingCalm` context sent to AI
- **article** (EP9): clue document revealed in notebook when `article_hint` fires
- **dual** (EP7): two `useGameLogic` instances with separate scripts (`ep7a.json`, `ep7b.json`), `focused` switches active patient, 12-turn shared budget
- **noPatient** (EP10): three-way choice (colleague/professor/alone), each with its own script or static reflection. The `alone` path renders computed text directly from storyFlags with no script.
