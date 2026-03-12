/**
 * EPISODE_LIST에서 storyFlags 초기값을 자동 생성.
 * 에피소드 추가 시 App.jsx를 건드릴 필요 없음.
 */
export function buildInitialFlags(episodeList) {
  const flags = {};
  for (const ep of episodeList) {
    flags[ep.completedFlag] = false;
    for (const flag of ep.localFlags) {
      const key = `${ep.id}_${flag}`;
      flags[key] = ep.numericFlags?.includes(flag) ? 0 : false;
    }
  }
  return flags;
}
