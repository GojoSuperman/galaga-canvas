const KEY = 'galaga.highscores';
const LIMIT = 5;

/** 점수를 내림차순 목록에 끼워 넣고 상위 limit개만 남긴다. (순수 함수) */
export function insertScore(scores, newScore, limit = LIMIT) {
  return [...scores, newScore].sort((a, b) => b - a).slice(0, limit);
}

/**
 * 하이스코어 TOP 5.
 * store는 getItem/setItem을 가진 객체(브라우저에선 localStorage).
 * 저장소 접근이 실패해도(프라이빗 모드 등) 메모리 캐시로 계속 동작한다.
 */
export function createHighScores(store) {
  let cache = null;

  function load() {
    if (cache !== null) return cache;
    try {
      const raw = store.getItem(KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      cache = Array.isArray(parsed) ? parsed.filter((n) => typeof n === 'number') : [];
    } catch {
      cache = []; // 저장소가 막혔거나 JSON이 깨진 경우
    }
    return cache;
  }

  function save(score) {
    cache = insertScore(load(), score);
    try {
      store.setItem(KEY, JSON.stringify(cache));
    } catch {
      // 저장 실패는 무시한다 — 이번 세션 동안은 메모리 캐시가 유지된다.
    }
    return cache;
  }

  const best = () => load()[0] ?? 0;

  return { load, save, best };
}
