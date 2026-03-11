import { useState, useRef, useCallback } from "react";
import classifyIntent from "../utils/classifyIntent";

const NURSE_INTERVENTIONS = [
  "선생님, 환자분 증상부터 확인해 주세요.",
  "선생님, 대기 환자가 있습니다. 진료를 계속 진행해 주세요.",
  "(조용히) 선생님, 환자분이 기다리고 계십니다.",
  "선생님, 차트 확인하시고 진료 이어가 주세요.",
  "선생님, 환자분께 집중해 주세요.",
];

export default function useGameLogic(systemPrompt, scriptData = null, initialRapport = 0) {
  const [emotion,       setEmotion]       = useState("neutral");
  const [talking,       setTalking]       = useState(false);
  const [history,       setHistory]       = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [rapportLevel,  setRapportLevel]  = useState(initialRapport);
  const [sessionFlags,  setSessionFlags]  = useState({});
  const [turnIndex,     setTurnIndex]     = useState(0);
  const rapportRef      = useRef(initialRapport);
  const turnIndexRef    = useRef(0);
  const scriptUsedRef   = useRef(false); // true after the last entry has been used once
  const talkTimer       = useRef(null);

  const send = useCallback(async (text, extraCtx = "") => {
    if (!text.trim() || loading) return null;
    setLoading(true);
    setHistory(p => [...p, { role: "doctor", text }]);
    clearTimeout(talkTimer.current);

    await new Promise(r => setTimeout(r, 500));

    const script = scriptData || [];
    const idx = turnIndexRef.current;
    const turnData = script[idx];

    // ── Script exhaustion: last entry was already played ──────────────────
    if (scriptUsedRef.current) {
      const exhaustedLines = [
        "선생님, 진료 시간이 초과되었습니다.",
        "선생님, 다음 환자분이 계속 기다리고 있습니다.",
        "(간호사가 문을 두드린다) 선생님, 마무리 부탁드립니다.",
      ];
      const msg = exhaustedLines[Math.floor(Math.random() * exhaustedLines.length)];
      setTalking(true);
      setHistory(p => [...p, { role: "patient", text: msg, emotion: "neutral", speaker: "nurse" }]);
      talkTimer.current = setTimeout(() => setTalking(false), 2200);
      setLoading(false);
      return { speaker: "nurse", text: msg, rapport_change: 0, flag_trigger: "none" };
    }

    let parsed;
    if (turnData && turnData.symptom) {
      // Intent-branching format
      const intent = classifyIntent(text);

      // ── Nurse intervention on unrelated intent ────────────────────────
      if (intent === "unrelated") {
        const msg = NURSE_INTERVENTIONS[Math.floor(Math.random() * NURSE_INTERVENTIONS.length)];
        setTalking(true);
        setHistory(p => [...p, { role: "patient", text: msg, emotion: "neutral", speaker: "nurse" }]);
        talkTimer.current = setTimeout(() => setTalking(false), 2200);
        setLoading(false);
        return { speaker: "nurse", text: msg, rapport_change: 0, flag_trigger: "none" };
      }

      parsed = turnData[intent] || turnData.symptom;
    } else {
      // Legacy sequential format
      parsed = turnData || { emotion: "neutral", text: "...", rapport_change: 0, flag_trigger: "none" };
    }

    // Advance index (mark exhausted if this was the last entry)
    if (idx < script.length - 1) {
      turnIndexRef.current = idx + 1;
      setTurnIndex(idx + 1);
    } else {
      scriptUsedRef.current = true;
    }

    const rapport = rapportRef.current;
    const nr = Math.max(0, Math.min(5, rapport + (parsed.rapport_change || 0)));
    rapportRef.current = nr;
    setRapportLevel(nr);
    setEmotion(parsed.emotion || "neutral");

    const flag = parsed.flag_trigger;
    if (flag && flag !== "none") setSessionFlags(p => ({ ...p, [flag]: true }));

    setTalking(true);
    setHistory(p => [...p, { role: "patient", text: parsed.text, emotion: parsed.emotion, speaker: parsed.speaker, hint: parsed.hint }]);
    talkTimer.current = setTimeout(() => setTalking(false), 2200);

    setLoading(false);
    return parsed;
  }, [loading, scriptData]);

  return { emotion, setEmotion, talking, setTalking, history, setHistory, loading, rapportLevel, setRapportLevel, sessionFlags, setSessionFlags, send, rapportRef, talkTimer, turnIndex };
}
