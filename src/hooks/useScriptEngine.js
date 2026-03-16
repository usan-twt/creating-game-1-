/**
 * 스크립트 포맷 감지 후 적절한 훅으로 위임.
 * - beat 포맷 ({ firstChoices, beats }): useBeatLogic
 * - 레거시 포맷 (배열): useGameLogic
 *
 * React 훅 규칙상 조건부 호출 불가 → 두 훅을 항상 호출하되 한쪽은 null 데이터로.
 */
import useGameLogic from "./useGameLogic";
import useBeatLogic from "./useBeatLogic";

export default function useScriptEngine(systemPrompt, scriptData, initialRapport) {
  const isBeat   = !!(scriptData && !Array.isArray(scriptData) && scriptData.beats);
  const beatData = isBeat ? scriptData : null;
  const legacyData = isBeat ? null : scriptData;

  const beat   = useBeatLogic(beatData, initialRapport);
  const legacy = useGameLogic(systemPrompt, legacyData, initialRapport);

  return isBeat ? { ...beat, _isBeat: true } : { ...legacy, _isBeat: false };
}
