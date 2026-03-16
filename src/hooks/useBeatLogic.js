import { useState, useRef, useCallback, useMemo } from "react";
import classifyIntent from "../utils/classifyIntent";

const NURSE_INTERVENTIONS = [
  "선생님, 환자분 증상부터 확인해 주세요.",
  "선생님, 대기 환자가 있습니다. 진료를 계속 진행해 주세요.",
  "(조용히) 선생님, 환자분이 기다리고 계십니다.",
];

const INTENT_FAMILY = {
  onset: "medical", character: "medical", associated: "medical", symptom: "medical",
  empathy: "emotional", comfort: "emotional",
  personal: "life",
  direct: "clinical",
};

const HINT_FAMILY = {
  onset: "symptom", character: "symptom", associated: "symptom", symptom: "symptom",
  empathy: "empathy", comfort: "empathy",
  personal: "personal",
  direct: "direct",
};

function checkCoverage(usedIntents, requires) {
  if (!requires) return true;
  const family = {
    medical:   usedIntents.symptom  || 0,
    emotional: usedIntents.empathy  || 0,
    life:      usedIntents.personal || 0,
    clinical:  usedIntents.direct   || 0,
  };
  return Object.entries(requires).every(([k, min]) => (family[k] || 0) >= min);
}

export default function useBeatLogic(scriptData = null, initialRapport = 0) {
  const [emotion,          setEmotion]          = useState("neutral");
  const [talking,          setTalking]          = useState(false);
  const [history,          setHistory]          = useState([]);
  const [loading,          setLoading]          = useState(false);
  const [rapportLevel,     setRapportLevel]     = useState(initialRapport);
  const [sessionFlags,     setSessionFlags]     = useState({});
  const [usedIntents,      setUsedIntents]      = useState({});
  const [lastIntentFamily, setLastIntentFamily] = useState(null);
  const [usedBeats,        setUsedBeats]        = useState(new Set());
  const [availableChoices, setAvailableChoices] = useState(null);

  const rapportRef     = useRef(initialRapport);
  const usedIntentsRef = useRef({});
  const usedBeatsRef   = useRef(new Set());
  const talkTimer      = useRef(null);

  // 사용 가능한 beat 수 (prereqs 충족, 미사용)
  const beatsRemaining = useMemo(() => {
    if (!scriptData?.beats) return 0;
    return scriptData.beats.filter(b =>
      !usedBeats.has(b.id) &&
      (b.prereqs?.every(p => usedBeats.has(p)) ?? true)
    ).length;
  }, [scriptData, usedBeats]);

  // 현재 상태에서 사용 가능한 beat 목록 (intent 필터 없이)
  const getAvailableBeats = useCallback(() => {
    if (!scriptData?.beats) return [];
    const usedBeats = usedBeatsRef.current;
    const rapport = rapportRef.current;
    return scriptData.beats.filter(b =>
      !usedBeats.has(b.id) &&
      (b.prereqs?.every(p => usedBeats.has(p)) ?? true) &&
      (!b.minRapport || rapport >= b.minRapport)
    );
  }, [scriptData]);

  // 다음 선택지 계산: continue(같은 family) + pivots(다른 family들)
  const computeChoices = useCallback((lastFamily) => {
    const available = getAvailableBeats();
    if (!available.length) return null;

    const contBeat = available.find(b => b.family === lastFamily);
    const cont = contBeat ? {
      family: contBeat.family,
      intent: contBeat.intents[0],
      label:  contBeat.choice.label,
      text:   contBeat.choice.text,
      innerVoice: contBeat.choice.innerVoice || "",
      _beatId: contBeat.id,
    } : null;

    const otherFamilies = ["medical", "emotional", "life", "clinical"].filter(f => f !== lastFamily);
    const pivots = otherFamilies.flatMap(fam => {
      const b = available.find(beat => beat.family === fam);
      if (!b) return [];
      return [{ family: b.family, intent: b.intents[0], label: b.choice.label, text: b.choice.text, innerVoice: b.choice.innerVoice || "", _beatId: b.id }];
    });

    const result = cont ? [cont, ...pivots.slice(0, 2)] : pivots.slice(0, 3);
    return result.length ? result : null;
  }, [getAvailableBeats]);

  const send = useCallback(async (text, extraCtx, overrideIntent = null, thinking, overrideBeatId = null) => {
    if (!text.trim() || loading || !scriptData?.beats) return null;
    setLoading(true);
    setHistory(p => [...p, { role: "doctor", text }]);
    clearTimeout(talkTimer.current);

    await new Promise(r => setTimeout(r, 500));

    const intent  = overrideIntent || classifyIntent(text);
    const hintKey = HINT_FAMILY[intent] || intent;
    const family  = INTENT_FAMILY[intent] || intent;

    const nextUsedIntents = { ...usedIntentsRef.current, [hintKey]: (usedIntentsRef.current[hintKey] || 0) + 1 };
    usedIntentsRef.current = nextUsedIntents;
    setUsedIntents(nextUsedIntents);
    setLastIntentFamily(family);

    if (intent === "unrelated") {
      const msg = NURSE_INTERVENTIONS[Math.floor(Math.random() * NURSE_INTERVENTIONS.length)];
      setTalking(true);
      setHistory(p => [...p, { role: "patient", text: msg, emotion: "neutral", speaker: "nurse" }]);
      talkTimer.current = setTimeout(() => setTalking(false), 2200);
      setLoading(false);
      setAvailableChoices(computeChoices(lastIntentFamily));
      return { speaker: "nurse", text: msg, rapport_change: 0, flag_trigger: "none" };
    }

    // Beat 선택: overrideBeatId > intent 매칭 > family 폴백
    const beats    = scriptData.beats;
    const curUsed  = usedBeatsRef.current;
    const rapport  = rapportRef.current;

    let beat = null;

    if (overrideBeatId) {
      beat = beats.find(b => b.id === overrideBeatId && !curUsed.has(b.id));
    }

    if (!beat) {
      beat = beats.find(b =>
        !curUsed.has(b.id) &&
        b.intents.includes(intent) &&
        (b.prereqs?.every(p => curUsed.has(p)) ?? true) &&
        (!b.minRapport || rapport >= b.minRapport)
      );
    }

    if (!beat) {
      // intent 매칭 없으면 같은 family의 첫 번째 가용 beat
      beat = beats.find(b =>
        !curUsed.has(b.id) &&
        b.family === family &&
        (b.prereqs?.every(p => curUsed.has(p)) ?? true) &&
        (!b.minRapport || rapport >= b.minRapport)
      );
    }

    let parsed;
    if (beat) {
      const newUsedBeats = new Set([...curUsed, beat.id]);
      usedBeatsRef.current = newUsedBeats;
      setUsedBeats(newUsedBeats);

      // coverage 미충족 시 shallow 강등
      parsed = (beat.requires && !checkCoverage(nextUsedIntents, beat.requires) && beat.shallow)
        ? beat.shallow
        : beat.response;
    } else {
      parsed = { emotion: "neutral", text: "...", rapport_change: 0, flag_trigger: "none" };
    }

    const nr = Math.max(0, Math.min(5, rapportRef.current + (parsed.rapport_change || 0)));
    rapportRef.current = nr;
    setRapportLevel(nr);
    setEmotion(parsed.emotion || "neutral");

    const flag = parsed.flag_trigger;
    if (flag && flag !== "none") setSessionFlags(p => ({ ...p, [flag]: true }));

    if (parsed.phone_check !== undefined) {
      // phone_check는 GameScreen에서 parsed 결과를 보고 처리
    }

    setTalking(true);
    setHistory(p => [...p, { role: "patient", text: parsed.text, emotion: parsed.emotion, speaker: parsed.speaker }]);
    talkTimer.current = setTimeout(() => setTalking(false), 2200);

    setLoading(false);
    setAvailableChoices(computeChoices(family));

    return parsed;
  }, [loading, scriptData, computeChoices, lastIntentFamily]);

  return {
    emotion, setEmotion, talking, setTalking, history, setHistory, loading,
    rapportLevel, setRapportLevel, sessionFlags, setSessionFlags,
    send, rapportRef, talkTimer,
    usedIntents, lastIntentFamily,
    availableChoices, beatsRemaining,
  };
}
