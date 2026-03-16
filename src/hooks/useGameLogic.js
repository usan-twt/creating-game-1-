import { useState, useRef, useCallback } from "react";
import classifyIntent from "../utils/classifyIntent";

const NURSE_INTERVENTIONS = [
  "선생님, 환자분 증상부터 확인해 주세요.",
  "선생님, 대기 환자가 있습니다. 진료를 계속 진행해 주세요.",
  "(조용히) 선생님, 환자분이 기다리고 계십니다.",
  "선생님, 차트 확인하시고 진료 이어가 주세요.",
  "선생님, 환자분께 집중해 주세요.",
];

// intent → 계열 (같은 계열 연속 질문은 대본 진행 없이 같은 턴 재사용)
const INTENT_FAMILY = {
  onset:      "medical",
  character:  "medical",
  associated: "medical",
  symptom:    "medical",   // 레거시 키 호환
  empathy:    "emotional",
  comfort:    "emotional",
  personal:   "life",
  direct:     "clinical",
};

// 새 intent → 대본 JSON에서 시도할 키 순서 (하위 호환)
const FALLBACK_CHAIN = {
  onset:      ["onset",      "symptom"],
  character:  ["character",  "onset", "symptom"],
  associated: ["associated", "onset", "symptom"],
  empathy:    ["empathy"],
  comfort:    ["comfort",    "empathy"],
  personal:   ["personal",   "empathy"],
  direct:     ["direct",     "symptom"],
  symptom:    ["symptom"],
};

// intent → NotebookPanel 힌트 추적용 레거시 카테고리
const HINT_FAMILY = {
  onset:      "symptom",
  character:  "symptom",
  associated: "symptom",
  symptom:    "symptom",
  empathy:    "empathy",
  comfort:    "empathy",
  personal:   "personal",
  direct:     "direct",
};

// coverage 체크: requires = { medical: N, emotional: N, ... }
function checkCoverage(usedIntents, requires) {
  if (!requires) return true;
  const family = {
    medical:   (usedIntents.symptom  || 0),
    emotional: (usedIntents.empathy  || 0),
    life:      (usedIntents.personal || 0),
    clinical:  (usedIntents.direct   || 0),
  };
  return Object.entries(requires).every(([k, min]) => (family[k] || 0) >= min);
}

// requires 미충족 시 shallow 버전으로 강등
function applyShallow(resp) {
  return resp.shallow ?? {
    ...resp,
    flag_trigger: "none",
    rapport_change: Math.min(1, resp.rapport_change ?? 0),
  };
}

function resolveResponse(turnData, intent, usedIntents) {
  if (!turnData) return null;
  const chain = FALLBACK_CHAIN[intent] || [intent];
  for (const key of chain) {
    if (!turnData[key]) continue;
    const resp = turnData[key];
    if (resp.requires && !checkCoverage(usedIntents, resp.requires)) {
      return applyShallow(resp);
    }
    return resp;
  }
  // 레거시 순차 포맷 (키 없는 단순 객체)
  if (turnData.text) return turnData;
  return null;
}

export default function useGameLogic(systemPrompt, scriptData = null, initialRapport = 0) {
  const [emotion,          setEmotion]          = useState("neutral");
  const [talking,          setTalking]          = useState(false);
  const [history,          setHistory]          = useState([]);
  const [loading,          setLoading]          = useState(false);
  const [rapportLevel,     setRapportLevel]     = useState(initialRapport);
  const [sessionFlags,     setSessionFlags]     = useState({});
  const [turnIndex,        setTurnIndex]        = useState(0);
  const [usedIntents,      setUsedIntents]      = useState({});
  const [lastIntentFamily, setLastIntentFamily] = useState(null);
  const [observedSet,      setObservedSet]      = useState(new Set());
  const rapportRef             = useRef(initialRapport);
  const turnIndexRef           = useRef(0);
  const lastFamilyRef          = useRef(null);
  const scriptUsedRef          = useRef(false);
  const usedIntentsRef         = useRef({});
  const observedSetRef         = useRef(new Set());
  const turnExchangeCountRef   = useRef(0);
  const talkTimer              = useRef(null);

  // ── directChoice 공통 처리 (interpret/observe/custom 턴) ──────────────
  const applyDirectChoice = useCallback((idx, script, intent, directChoice, nextUsedIntents) => {
    const currentFamily = INTENT_FAMILY[intent] || intent;
    setLastIntentFamily(currentFamily);
    lastFamilyRef.current = currentFamily;

    // observe 타입: unlocks → observedSet 갱신
    if (directChoice.unlocks) {
      const newObserved = new Set([...observedSetRef.current, directChoice.unlocks]);
      observedSetRef.current = newObserved;
      setObservedSet(newObserved);
    }

    // 응답 선택 (requires/shallow 체크)
    let resp = directChoice.response || {};
    if (resp.requires && !checkCoverage(nextUsedIntents, resp.requires)) {
      resp = applyShallow(resp);
    }

    // 턴 진행 (exchangeCount 리셋)
    turnExchangeCountRef.current = 0;
    if (idx < script.length - 1) {
      turnIndexRef.current = idx + 1;
      setTurnIndex(idx + 1);
    } else {
      scriptUsedRef.current = true;
    }

    // 라포/감정/플래그
    const nr = Math.max(0, Math.min(5, rapportRef.current + (resp.rapport_change || 0)));
    rapportRef.current = nr;
    setRapportLevel(nr);
    if (resp.emotion) setEmotion(resp.emotion);
    const flag = resp.flag_trigger;
    if (flag && flag !== "none") setSessionFlags(p => ({ ...p, [flag]: true }));

    return resp;
  }, []);

  // ── auto 턴 자동 발화 ──────────────────────────────────────────────────
  const fireAuto = useCallback(async () => {
    if (loading) return;
    const script = scriptData || [];
    const idx = turnIndexRef.current;
    const turnData = script[idx];
    if (!turnData || turnData.type !== "auto") return;

    setLoading(true);
    clearTimeout(talkTimer.current);
    await new Promise(r => setTimeout(r, 400));

    if (turnData.narration) {
      setHistory(p => [...p, { role: "auto", text: turnData.narration }]);
    }

    if (turnData.patientLine?.text) {
      const pLine = turnData.patientLine;
      await new Promise(r => setTimeout(r, 300));
      setTalking(true);
      setEmotion(pLine.emotion || "neutral");
      setHistory(p => [...p, { role: "patient", text: pLine.text, emotion: pLine.emotion }]);
      talkTimer.current = setTimeout(() => setTalking(false), 2200);
      const nr = Math.max(0, Math.min(5, rapportRef.current + (pLine.rapport_change || 0)));
      rapportRef.current = nr;
      setRapportLevel(nr);
      const flag = pLine.flag_trigger;
      if (flag && flag !== "none") setSessionFlags(p => ({ ...p, [flag]: true }));
    }

    // 턴 진행 (exchangeCount 증가 없음)
    if (idx < script.length - 1) {
      turnIndexRef.current = idx + 1;
      setTurnIndex(idx + 1);
    } else {
      scriptUsedRef.current = true;
    }

    setLoading(false);
  }, [loading, scriptData]);

  const send = useCallback(async (text, _extraCtx = "", overrideIntent = null, thinking = null, directChoice = null) => {
    if (loading) return null;
    if (!directChoice && !text.trim()) return null;

    setLoading(true);
    if (text.trim()) {
      setHistory(p => [...p, { role: "doctor", text, ...(thinking ? { thinking } : {}) }]);
    }
    clearTimeout(talkTimer.current);

    await new Promise(r => setTimeout(r, 500));

    const script = scriptData || [];
    const idx = turnIndexRef.current;
    const turnData = script[idx];

    // ── 대본 소진 ────────────────────────────────────────────────────────
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

    // ── Intent 분류 ──────────────────────────────────────────────────────
    const intent = overrideIntent || classifyIntent(text);
    const hintKey = HINT_FAMILY[intent] || intent;
    const nextUsedIntents = { ...usedIntentsRef.current, [hintKey]: (usedIntentsRef.current[hintKey] || 0) + 1 };
    usedIntentsRef.current = nextUsedIntents;
    setUsedIntents(nextUsedIntents);

    // ── directChoice 경로 (interpret/observe/custom 턴) ─────────────────
    if (directChoice) {
      const resp = applyDirectChoice(idx, script, intent, directChoice, nextUsedIntents);
      if (resp.text) {
        setTalking(true);
        setHistory(p => [...p, { role: "patient", text: resp.text, emotion: resp.emotion, speaker: resp.speaker }]);
        talkTimer.current = setTimeout(() => setTalking(false), 2200);
      }
      setLoading(false);
      return resp;
    }

    // ── unrelated → 간호사 개입 ──────────────────────────────────────────
    if (intent === "unrelated") {
      const msg = NURSE_INTERVENTIONS[Math.floor(Math.random() * NURSE_INTERVENTIONS.length)];
      setTalking(true);
      setHistory(p => [...p, { role: "patient", text: msg, emotion: "neutral", speaker: "nurse" }]);
      talkTimer.current = setTimeout(() => setTalking(false), 2200);
      setLoading(false);
      return { speaker: "nurse", text: msg, rapport_change: 0, flag_trigger: "none" };
    }

    // ── 계열 기반 대본 진행 결정 ─────────────────────────────────────────
    const isBranching = turnData && (
      turnData.onset || turnData.character || turnData.associated ||
      turnData.empathy || turnData.personal || turnData.direct || turnData.symptom
    );
    const currentFamily = INTENT_FAMILY[intent] || intent;
    const familyChanged = lastFamilyRef.current !== currentFamily;
    const shouldAdvance = !isBranching || (familyChanged && turnExchangeCountRef.current >= 1);

    // ── 응답 선택 ────────────────────────────────────────────────────────
    let parsed;
    if (isBranching) {
      parsed = resolveResponse(turnData, intent, usedIntentsRef.current);
      if (!parsed) {
        const fallbackKey = ["onset","symptom","empathy","personal","direct"].find(k => turnData[k]);
        if (fallbackKey && turnData[fallbackKey]) {
          const fb = turnData[fallbackKey];
          parsed = (fb.requires && !checkCoverage(usedIntentsRef.current, fb.requires))
            ? applyShallow(fb)
            : fb;
        } else {
          parsed = { emotion: "neutral", text: "...", rapport_change: 0, flag_trigger: "none" };
        }
      }
    } else {
      parsed = turnData || { emotion: "neutral", text: "...", rapport_change: 0, flag_trigger: "none" };
    }

    setLastIntentFamily(currentFamily);
    lastFamilyRef.current = currentFamily;

    // ── 대본 인덱스 진행 + turnExchangeCount 관리 ────────────────────────
    if (shouldAdvance) {
      turnExchangeCountRef.current = 0;
      if (idx < script.length - 1) {
        turnIndexRef.current = idx + 1;
        setTurnIndex(idx + 1);
      } else {
        scriptUsedRef.current = true;
      }
    } else {
      if (isBranching) turnExchangeCountRef.current += 1;
    }

    // ── 라포 / 감정 / 플래그 업데이트 ────────────────────────────────────
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
  }, [loading, scriptData, applyDirectChoice]);

  return {
    emotion, setEmotion, talking, setTalking, history, setHistory, loading,
    rapportLevel, setRapportLevel, sessionFlags, setSessionFlags,
    send, rapportRef, talkTimer, turnIndex, usedIntents, lastIntentFamily,
    observedSet, fireAuto,
  };
}
