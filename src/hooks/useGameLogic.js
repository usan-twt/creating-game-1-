import { useState, useRef, useCallback } from "react";
import classifyIntent from "../utils/classifyIntent";

export default function useGameLogic(systemPrompt, scriptData = null, initialRapport = 0) {
  const [emotion,       setEmotion]       = useState("neutral");
  const [talking,       setTalking]       = useState(false);
  const [history,       setHistory]       = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [rapportLevel,  setRapportLevel]  = useState(initialRapport);
  const [sessionFlags,  setSessionFlags]  = useState({});
  const rapportRef   = useRef(initialRapport);
  const turnIndexRef = useRef(0);
  const talkTimer    = useRef(null);

  const send = useCallback(async (text, extraCtx = "") => {
    if (!text.trim() || loading) return null;
    setLoading(true);
    setHistory(p => [...p, { role: "doctor", text }]);
    clearTimeout(talkTimer.current);

    await new Promise(r => setTimeout(r, 500));

    const script = scriptData || [];
    const idx = turnIndexRef.current;
    const turnData = script[idx];

    let parsed;
    if (turnData && turnData.symptom) {
      // Intent-branching format: pick response by classified intent
      const intent = classifyIntent(text);
      parsed = turnData[intent] || turnData.symptom;
    } else {
      // Legacy sequential format
      parsed = turnData || { emotion: "neutral", text: "...", rapport_change: 0, flag_trigger: "none" };
    }
    if (idx < script.length - 1) turnIndexRef.current = idx + 1;

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

  return { emotion, setEmotion, talking, setTalking, history, setHistory, loading, rapportLevel, setRapportLevel, sessionFlags, setSessionFlags, send, rapportRef, talkTimer };
}
