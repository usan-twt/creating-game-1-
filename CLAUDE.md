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

This is a React + Vite single-page narrative game where the player acts as a first-year medical resident having consultations with AI-powered patients.

### Game Flow (App.jsx)

`App` manages a top-level `phase` state machine:
- `hub` → `EpisodeHub`: episode selection screen
- `intro` → `IntroScreen`: episode briefing
- `game` → one of three game screens (see below)
- `result` → `ResultScreen`: narrative outcome display

Episode completion updates a global `storyFlags` object that persists across episodes and influences later episodes' prompts and content.

### Three Game Screen Types

| Mechanic flag | Component | Used by |
|---|---|---|
| `mechanics.dual` | `DualGameScreen` | EP7 (two simultaneous patients, turn budget shared) |
| `mechanics.noPatient` | `EP10Screen` | EP10 (no patient; choice between colleague/professor/alone) |
| _(default)_ | `GameScreen` | EP1–EP6, EP8, EP9 |

### Core Game Hook: `useGameLogic` (`src/hooks/useGameLogic.js`)

All gameplay communication funnels through this hook. It:
- Sends doctor input + `[rapport_level: N]` context to the Anthropic API
- Expects a JSON response with: `{ emotion, text, rapport_change, flag_trigger, phone_check?, breathing_calm?, hint?, speaker? }`
- Maintains `rapportLevel` (0–5) and `sessionFlags` (flags set when `flag_trigger` fires)
- Appends raw parsed `.text` (not the full JSON) into the API message history

### Episode Data (`src/data/episodes.js`, `src/data/prompts.js`)

Each episode object in `EPISODE_LIST` has:
- **Static fields**: patient appearance, vitals, initial emotion, CC (chief complaint)
- **`getSystemPrompt(storyFlags)`**: returns the LLM system prompt, optionally personalized by prior episode outcomes
- **`getNotebookPre(storyFlags)`** or **`notebookPre`**: pre-filled doctor's notebook content
- **`getResultLines(storyFlags, localFlags)`**: generates the narrative result text
- **`completedFlag`** and **`localFlags`**: flag names written back to `storyFlags` on episode completion
- **`mechanics`**: `{}` | `{ dual }` | `{ noPatient }` | `{ translator }` | `{ breathing }` | `{ article }`

System prompts in `prompts.js` define patient personas, rapport change rules, and flag trigger conditions entirely in Korean. The AI must return pure JSON matching a per-episode schema.

### Branching Narrative via storyFlags

`storyFlags` is the primary cross-episode state. Key patterns:
- EP4 checks `EP1_jinsu_opened` to personalize both the notebook and the patient's AI persona
- EP8 checks `EP2_reversal1/2` to personalize its prompt
- EP10's result checks how many "depth" flags were earned across all prior episodes to determine the final ending

### Special Mechanics

- **translator** (EP2): `translatorDirect` toggle switches between daughter-mediated and direct-to-mother conversation modes; the flag `reversal1` enables the direct-mode button
- **breathing** (EP5): `breathingCalm` state is sent as context to the LLM
- **article** (EP9): `articleVisible` reveals a clue document in the notebook panel when `article_hint` flag fires
- **dual** (EP7): Two independent `useGameLogic` instances; `focused` state switches which patient receives input; result is based on turn distribution between patients A and B
