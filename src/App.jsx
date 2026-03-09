import { useState, useReducer, useCallback } from "react";
import { EPISODE_LIST } from "./data/episodes";
import { getInterlude } from "./data/interludes";
import EpisodeHub from "./components/EpisodeHub";
import IntroScreen from "./components/IntroScreen";
import ResultScreen from "./components/ResultScreen";
import GameScreen from "./components/GameScreen";
import DualGameScreen from "./components/DualGameScreen";
import EP10Screen from "./components/EP10Screen";
import DayEndScreen from "./components/DayEndScreen";
import InterludeScreen from "./components/InterludeScreen";

/* ── Phase state machine ── */
const TRANSITIONS = {
  hub:       { PLAY: "intro" },
  intro:     { START: "game" },
  game:      { END: "result" },
  result:    { CONTINUE: "dayEnd", SKIP: "hub" },
  dayEnd:    { CONTINUE: "interlude", SKIP: "hub" },
  interlude: { CONTINUE: "hub" },
};

function gameReducer(state, action) {
  const nextPhase = TRANSITIONS[state.phase]?.[action.type];
  if (!nextPhase) return state;
  const next = { ...state, phase: nextPhase };
  if (action.payload) {
    if (action.payload.epId !== undefined) next.currentEpId = action.payload.epId;
    if (action.payload.sessionSnap !== undefined) next.sessionSnap = action.payload.sessionSnap;
  }
  if (nextPhase === "hub") {
    next.currentEpId = null;
    next.sessionSnap = {};
  }
  return next;
}

/* ── Deep flags that cause fatigue (EP4+ only) ── */
const DEEP_FLAG_MAP = {
  EP4: ["deeper_connection"],
  EP5: ["real_opened"],
  EP6: ["gave_comfort", "answered_directly"],
  EP8: ["grief_opened"],
  EP9: ["real_opened"],
};

export default function App() {
  const [gameState, dispatch] = useReducer(gameReducer, {
    phase: "hub",
    currentEpId: null,
    sessionSnap: {},
  });

  const [storyFlags, setStoryFlags] = useState({
    EP1_completed:false, EP1_jinsu_opened:false,
    EP2_completed:false, EP2_daughter_suspicious:false, EP2_reversal1:false, EP2_reversal2:false,
    EP3_completed:false, EP3_real_opened:false,
    EP4_completed:false, EP4_deeper_connection:false,
    EP5_completed:false, EP5_real_opened:false,
    EP6_completed:false, EP6_asked_the_question:false, EP6_answered_directly:false, EP6_gave_comfort:false, EP6_deflected:false,
    EP7_completed:false,
    EP8_completed:false, EP8_grief_opened:false,
    EP9_completed:false, EP9_article_hint:false, EP9_real_opened:false,
    EP10_completed:false,
  });

  const [residentState, setResidentState] = useState({
    fatigue: 0,
  });

  const { phase, currentEpId, sessionSnap } = gameState;
  const ep = currentEpId ? EPISODE_LIST.find(e => e.id === currentEpId) : null;

  /* ── Handlers ── */
  const handlePlay = useCallback((epId) => {
    dispatch({ type: "PLAY", payload: { epId } });
  }, []);

  const handleStart = useCallback(() => {
    dispatch({ type: "START" });
  }, []);

  const handleEnd = useCallback((localFlags) => {
    const epDef = EPISODE_LIST.find(e => e.id === currentEpId);

    // Update story flags
    const updates = { [epDef.completedFlag]: true };
    epDef.localFlags.forEach(flag => {
      if (localFlags[flag]) updates[`${epDef.id}_${flag}`] = true;
    });
    if (epDef.id === "EP7") {
      if (localFlags.turnsA !== undefined) updates.EP7_turnsA = localFlags.turnsA;
      if (localFlags.turnsB !== undefined) updates.EP7_turnsB = localFlags.turnsB;
    }
    setStoryFlags(p => ({ ...p, ...updates }));

    // Update fatigue (EP4+ only)
    let fatigueDelta = 0;
    if (epDef.id === "EP7") {
      fatigueDelta = 1;
    } else {
      const deepFlags = DEEP_FLAG_MAP[epDef.id];
      if (deepFlags && deepFlags.some(f => localFlags[f])) {
        fatigueDelta = 1;
      }
    }
    if (fatigueDelta > 0) {
      setResidentState(p => ({ ...p, fatigue: Math.min(5, p.fatigue + fatigueDelta) }));
    }

    dispatch({ type: "END", payload: { sessionSnap: localFlags } });
  }, [currentEpId]);

  const handleResultContinue = useCallback(() => {
    if (currentEpId === "EP10") {
      dispatch({ type: "SKIP" }); // EP10 skips dayEnd
    } else {
      dispatch({ type: "CONTINUE" }); // result → dayEnd
    }
  }, [currentEpId]);

  const handleDayEndContinue = useCallback(() => {
    const interlude = getInterlude(currentEpId);
    if (interlude) {
      dispatch({ type: "CONTINUE" }); // dayEnd → interlude
    } else {
      dispatch({ type: "SKIP" }); // dayEnd → hub
    }
  }, [currentEpId]);

  const handleInterludeContinue = useCallback((effects) => {
    if (effects?.fatigue) {
      setResidentState(p => ({ ...p, fatigue: Math.min(5, p.fatigue + effects.fatigue) }));
    }
    if (effects?.flag) {
      setStoryFlags(p => ({ ...p, [effects.flag]: true }));
    }
    dispatch({ type: "CONTINUE" }); // interlude → hub
  }, []);

  /* ── Render ── */
  if (phase === "hub")
    return <EpisodeHub storyFlags={storyFlags} onPlay={handlePlay} />;

  if (phase === "intro")
    return <IntroScreen ep={ep} onStart={handleStart} />;

  if (phase === "result")
    return <ResultScreen ep={ep} storyFlags={storyFlags} sessionFlags={sessionSnap} onContinue={handleResultContinue} />;

  if (phase === "dayEnd")
    return <DayEndScreen ep={ep} sessionSnap={sessionSnap} onContinue={handleDayEndContinue} />;

  if (phase === "interlude") {
    const interlude = getInterlude(currentEpId);
    return <InterludeScreen interlude={interlude} storyFlags={storyFlags} residentState={residentState} onContinue={handleInterludeContinue} />;
  }

  // Game screens
  if (ep.mechanics?.dual)
    return <DualGameScreen ep={ep} storyFlags={storyFlags} residentState={residentState} onEnd={handleEnd} />;
  if (ep.mechanics?.noPatient)
    return <EP10Screen ep={ep} storyFlags={storyFlags} residentState={residentState} onEnd={handleEnd} />;
  return <GameScreen ep={ep} storyFlags={storyFlags} residentState={residentState} onEnd={handleEnd} />;
}
