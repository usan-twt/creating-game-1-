/**
 * 에피소드 간 교차 의존성 조회 유틸.
 * dependsOn은 선언적 문서화 목적 — 실제 분기 로직은 각 에피소드 함수 내에 있음.
 */

/**
 * 특정 에피소드가 의존하는 플래그 목록 반환
 * @returns {{ flag: string, affects: string[] }[]}
 */
export function getDependencies(ep) {
  return ep.dependsOn?.flags ?? [];
}

/**
 * 전체 의존성 그래프 반환 (디버깅/문서화용)
 * @returns {{ [epId: string]: string[] }}
 */
export function buildDependencyGraph(episodeList) {
  return Object.fromEntries(
    episodeList
      .filter(ep => ep.dependsOn?.flags?.length > 0)
      .map(ep => [ep.id, ep.dependsOn.flags.map(d => d.flag)])
  );
}
