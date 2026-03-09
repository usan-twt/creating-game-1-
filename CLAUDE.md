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

The app calls the Anthropic API **directly from the browser** using `anthropic-dangerous-direct-browser-access: true`. Model used: `claude-sonnet-4-20250514`, max_tokens 400, JSON-only responses.

## Architecture

React + Vite single-page narrative game. The player is a first-year medical resident having AI-powered consultations.

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
| `mechanics.dual` | `DualGameScreen` | EP7 (two simultaneous patients, shared turn budget) |
| `mechanics.noPatient` | `EP10Screen` | EP10 (colleague/professor/alone choice) |
| _(default)_ | `GameScreen` | EP1-EP6, EP8, EP9 |

### Core Game Hook: `useGameLogic` (src/hooks/useGameLogic.js)

Sends doctor input + `[rapport_level: N]` to Anthropic API. Expects JSON: `{ emotion, text, rapport_change, flag_trigger, ... }`. Maintains rapportLevel (0-5) and sessionFlags.

### Episode Data (src/data/)

- **episodes.js**: `EPISODE_LIST` array. Each episode has `day` (1-10), `getSystemPrompt(storyFlags, residentState)`, result lines, mechanics config. The `injectFatigue()` helper wraps prompts for EP4+.
- **prompts.js**: System prompts defining patient personas, rapport rules, flag conditions (all in Korean). AI must return pure JSON per episode schema.
- **interludes.js**: Scripted staff encounters after EP3/EP5/EP7/EP9. Not AI-powered — deterministic scenes with 1-2 choices that can affect fatigue or storyFlags.
- **emotions.js**: Emotion metadata (labels + colors).

### New Components

- **DayEndScreen**: End-of-day summary. Shows patient(s) completed, time indicator. Factual, no judgment (Papers Please style).
- **InterludeScreen**: Scripted medical staff encounters. Speaker + dialogue lines + choice buttons. Effects applied on choice.

### Cross-Episode Connections

- EP1 → EP4: `EP1_jinsu_opened` personalizes EP4's prompt and notebook
- EP2 → EP8: `EP2_reversal1/2` personalizes EP8's prompt and initial rapport
- EP10 ending: `depth` counts opened flags across EP1/2/3/5/8 for 3-tier ending

### Special Mechanics

- **translator** (EP2): toggle between daughter-mediated and direct-to-mother modes
- **breathing** (EP5): `breathingCalm` context sent to AI
- **article** (EP9): clue document revealed in notebook when `article_hint` fires
- **dual** (EP7): two `useGameLogic` instances, `focused` switches active patient
