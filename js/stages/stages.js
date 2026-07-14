// ★ 게임 밸런스 데이터 전부. 난이도를 조정하려면 이 파일만 고치면 된다.
//
// waves[].delay — 스테이지 시작 후 이 웨이브가 투입되기까지의 대기 시간(초)
// diveInterval  — 대형에서 적을 급강하로 뽑아내는 간격(초). 작을수록 어렵다.
// diveCount     — 한 번에 뽑는 적 수
// diveDuration  — 급강하 곡선을 다 도는 데 걸리는 시간(초). 작을수록 빠르다.

export const STAGES = [
  // ── 스테이지 1 — 벌 8기, 급강하 드묾 ────────────────────────
  {
    waves: [
      { type: 'bee', entryPath: 'leftLoop', row: 2, cols: [0, 1, 2, 3], delay: 0 },
      { type: 'bee', entryPath: 'rightLoop', row: 2, cols: [4, 5, 6, 7], delay: 1.2 },
    ],
    diveInterval: 3.0,
    diveCount: 1,
    diveDuration: 3.0,
    enemyBulletSpeed: 170,
    enemyShootInterval: 1.0,
    dropRate: 0.12,
    isBoss: false,
  },

  // ── 스테이지 2 — 나비 추가 ─────────────────────────────────
  {
    waves: [
      { type: 'butterfly', entryPath: 'topDive', row: 1, cols: [2, 3, 4, 5], delay: 0 },
      { type: 'bee', entryPath: 'leftLoop', row: 2, cols: [0, 1, 2, 3], delay: 1.2 },
      { type: 'bee', entryPath: 'rightLoop', row: 2, cols: [4, 5, 6, 7], delay: 2.4 },
    ],
    diveInterval: 2.5,
    diveCount: 1,
    diveDuration: 2.8,
    enemyBulletSpeed: 190,
    enemyShootInterval: 0.9,
    dropRate: 0.12,
    isBoss: false,
  },

  // ── 스테이지 3 — 캡틴 등장, 동시 급강하 2기 ─────────────────
  {
    waves: [
      { type: 'captain', entryPath: 'topDive', row: 0, cols: [3, 4], delay: 0 },
      { type: 'butterfly', entryPath: 'leftLoop', row: 1, cols: [1, 2, 3, 4, 5, 6], delay: 1.0 },
      { type: 'bee', entryPath: 'rightLoop', row: 2, cols: [0, 1, 2, 3, 4, 5, 6, 7], delay: 2.2 },
    ],
    diveInterval: 2.0,
    diveCount: 2,
    diveDuration: 2.6,
    enemyBulletSpeed: 210,
    enemyShootInterval: 0.8,
    dropRate: 0.10,
    isBoss: false,
  },

  // ── 스테이지 4 — 대형 가득, 급강하 빈번 ─────────────────────
  {
    waves: [
      { type: 'captain', entryPath: 'topDive', row: 0, cols: [2, 3, 4, 5], delay: 0 },
      { type: 'butterfly', entryPath: 'leftLoop', row: 1, cols: [0, 1, 2, 3, 4, 5, 6, 7], delay: 1.0 },
      { type: 'butterfly', entryPath: 'rightLoop', row: 2, cols: [0, 1, 2, 3, 4, 5, 6, 7], delay: 2.2 },
      { type: 'bee', entryPath: 'leftLoop', row: 3, cols: [0, 1, 2, 3, 4, 5, 6, 7], delay: 3.4 },
    ],
    diveInterval: 1.5,
    diveCount: 2,
    diveDuration: 2.3,
    enemyBulletSpeed: 230,
    enemyShootInterval: 0.7,
    dropRate: 0.10,
    isBoss: false,
  },

  // ── 스테이지 5 — 보스전. 보스 + 호위 나비 ────────────────────
  {
    waves: [
      { type: 'butterfly', entryPath: 'leftLoop', row: 2, cols: [0, 1, 2], delay: 1.5 },
      { type: 'butterfly', entryPath: 'rightLoop', row: 2, cols: [5, 6, 7], delay: 1.5 },
    ],
    diveInterval: 2.5,
    diveCount: 1,
    diveDuration: 2.5,
    enemyBulletSpeed: 240,
    enemyShootInterval: 0.8,
    dropRate: 0.20, // 보스전은 드롭을 후하게
    isBoss: true,
  },
];

/** 범위를 넘어가면 마지막 스테이지를 돌려준다. */
export function getStage(index) {
  return STAGES[Math.min(index, STAGES.length - 1)];
}
