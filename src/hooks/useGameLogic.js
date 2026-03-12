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

function resolveResponse(turnData, intent) {
  if (!turnData) return null;
  const chain = FALLBACK_CHAIN[intent] || [intent];
  for (const key of chain) {
    if (turnData[key]) return turnData[key];
  }
  // 레거시 순차 포맷 (키 없는 단순 객체)
  if (turnData.text) return turnData;
  return null;
}

export default function useGameLogic(systemPrompt, scriptData = null, initialRapport = 0) {
  const [emotion,       setEmotion]       = useState("neutral");
  const [talking,       setTalking]       = useState(false);
  const [history,       setHistory]       = useState([]);
  const [loading,       setLoading]       = useState(false);
  const [rapportLevel,  setRapportLevel]  = useState(initialRapport);
  const [sessionFlags,  setSessionFlags]  = useState({});
  const [turnIndex,     setTurnIndex]     = useState(0);
  const [usedIntents,   setUsedIntents]   = useState({});
  const rapportRef      = useRef(initialRapport);
  const turnIndexRef    = useRef(0);
  const lastFamilyRef   = useRef(null);   // 직전 intent 계열
  const scriptUsedRef   = useRef(false);  // 마지막 항목이 이미 사용된 경우
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

    // ── 대본 소진: 마지막 항목까지 이미 사용됨 ──────────────────────────
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
    const intent = classifyIntent(text);
    const hintKey = HINT_FAMILY[intent] || intent;
    setUsedIntents(p => ({ ...p, [hintKey]: (p[hintKey] || 0) + 1 }));

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
    // 레거시 순차 포맷(키 없는 단순 텍스트 객체)이면 항상 진행
    const isBranching = turnData && (
      turnData.onset || turnData.character || turnData.associated ||
      turnData.empathy || turnData.personal || turnData.direct || turnData.symptom
    );
    const currentFamily = INTENT_FAMILY[intent] || intent;
    const shouldAdvance = !isBranching || (lastFamilyRef.current !== currentFamily);

    // ── 응답 선택 ────────────────────────────────────────────────────────
    let parsed;
    if (isBranching) {
      parsed = resolveResponse(turnData, intent);
      if (!parsed) {
        // 모든 체인 실패 시 첫 번째 사용 가능한 키로 폴백
        const fallbackKey = ["onset","symptom","empathy","personal","direct"].find(k => turnData[k]);
        parsed = turnData[fallbackKey] || { emotion: "neutral", text: "...", rapport_change: 0, flag_trigger: "none" };
      }
    } else {
      // 레거시 순차 포맷
      parsed = turnData || { emotion: "neutral", text: "...", rapport_change: 0, flag_trigger: "none" };
    }

    // ── 대본 인덱스 진행 ─────────────────────────────────────────────────
    if (shouldAdvance) {
      lastFamilyRef.current = currentFamily;
      if (idx < script.length - 1) {
        turnIndexRef.current = idx + 1;
        setTurnIndex(idx + 1);
      } else {
        scriptUsedRef.current = true;
      }
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
  }, [loading, scriptData]);

  return { emotion, setEmotion, talking, setTalking, history, setHistory, loading, rapportLevel, setRapportLevel, sessionFlags, setSessionFlags, send, rapportRef, talkTimer, turnIndex, usedIntents };
}
