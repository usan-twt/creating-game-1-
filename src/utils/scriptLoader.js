/**
 * Vite의 import.meta.glob()으로 scripts/ 폴더 JSON을 lazy 로드.
 * 파일 추가 시 manifest 없이 자동 인식.
 */
const scriptModules = import.meta.glob('../data/scripts/*.json');

export async function loadScript(filename) {
  const path = `../data/scripts/${filename}`;
  const loader = scriptModules[path];
  if (!loader) throw new Error(`Script not found: ${filename}`);
  const mod = await loader();
  return mod.default;
}
