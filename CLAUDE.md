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

### Scripted Responses vs. AI Responses

`useGameLogic` (src/hooks/useGameLogic.js) currently reads from **pre-scripted JSON arrays** (`src/data/scripts/*.json`). Each script entry has the shape: `{ emotion, text, rapport_change, flag_trigger, phone_check?, speaker?, hint? }`. The hook walks through entries sequentially via `turnIndexRef`.

System prompts in `src/data/prompts.js` define patient personas and expected JSON response schemas — these were designed for live Anthropic API usage but are currently only passed through (unused by the scripted path). If re-enabling AI: the hook would need to send conversation history + `[rapport_level: N]` to the API and parse the returned JSON.

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

- **episodes.js**: `EPISODE_LIST` array. Each episode has `day`, `getSystemPrompt(storyFlags, residentState)`, `getScriptData(storyFlags)`, result lines, mechanics config. The `injectFatigue()` helper wraps prompts for EP4+.
- **scripts/*.json**: Pre-scripted patient response arrays. Some episodes have branching scripts selected by storyFlags (e.g. `ep4_opened.json` vs `ep4_base.json`, `ep8_r2.json` vs `ep8_base.json`).
- **prompts.js**: System prompts defining patient personas, rapport rules, flag conditions (all in Korean). Designed for AI JSON responses.
- **interludes.js**: Scripted staff encounters after EP3/EP5/EP7/EP9. Not AI-powered — deterministic scenes with 1-2 choices that can affect fatigue or storyFlags.
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
- **noPatient** (EP10): three-way choice (colleague/professor/alone), each with its own script or static reflection
