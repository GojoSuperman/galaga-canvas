// ★ 게임 밸런스 데이터 전부. 난이도를 조정하려면 이 파일만 고치면 된다.
//
// waves[].delay — 스테이지 시작 후 이 웨이브가 투입되기까지의 대기 시간(초)
// diveInterval  — 대형에서 적을 급강하로 뽑아내는 간격(초). 작을수록 어렵다.
// diveCount     — 한 번에 뽑는 적 수
// diveDuration  — 급강하 곡선을 다 도는 데 걸리는 시간(초). 작을수록 빠르다.
// enemyShootInterval — 급강하 중인 적의 실제 사격 간격(초). 예전에는 enemy.js와 playScene.js가
//   shootTimer를 이중으로 깎는 버그가 있어 실제 간격이 여기 적힌 값의 절반이었다(=화력이 2배였다).
//   그 버그를 고치면서, 이미 그 화력으로 플레이테스트해 밸런싱한 결과를 그대로 유지하기 위해
//   여기 값을 전부 절반으로 낮췄다 — 지금부터는 이 값이 실제 사격 간격과 일치한다.

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
    enemyShootInterval: 0.5,
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
    enemyShootInterval: 0.45,
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
    enemyShootInterval: 0.4,
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
    enemyShootInterval: 0.35,
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
    enemyShootInterval: 0.4,
    dropRate: 0.20, // 보스전은 드롭을 후하게
    isBoss: true,
    bossTier: 1,
  },

  // ── 스테이지 6 — 엘리트 등장. 조준탄이 처음 날아온다 ──────────
  {
    waves: [
      { type: 'elite', entryPath: 'topDive', row: 0, cols: [3, 4], delay: 0 },
      { type: 'butterfly', entryPath: 'spiralLeft', row: 1, cols: [1, 2, 3, 4, 5, 6], delay: 1.0 },
      { type: 'bee', entryPath: 'leftLoop', row: 2, cols: [0, 1, 2, 3, 4, 5, 6, 7], delay: 2.0 },
      { type: 'captain', entryPath: 'rightLoop', row: 3, cols: [2, 5], delay: 3.0 },
    ],
    diveInterval: 1.4,
    diveCount: 2,
    diveDuration: 2.2,
    enemyBulletSpeed: 245,
    enemyShootInterval: 0.35,
    dropRate: 0.12,
    isBoss: false,
  },

  // ── 스테이지 7 — 나선 진입 본격화, 엘리트 4기 ────────────────
  {
    waves: [
      { type: 'elite', entryPath: 'spiralRight', row: 0, cols: [2, 3, 4, 5], delay: 0 },
      { type: 'captain', entryPath: 'topDive', row: 1, cols: [0, 7], delay: 1.0 },
      { type: 'butterfly', entryPath: 'spiralLeft', row: 2, cols: [0, 1, 2, 3, 4, 5, 6, 7], delay: 2.0 },
      { type: 'bee', entryPath: 'rightLoop', row: 3, cols: [0, 1, 2, 3, 4, 5, 6, 7], delay: 3.2 },
      { type: 'bee', entryPath: 'leftLoop', row: 4, cols: [3, 4], delay: 4.2 },
    ],
    diveInterval: 1.3,
    diveCount: 3,
    diveDuration: 2.1,
    enemyBulletSpeed: 255,
    enemyShootInterval: 0.325,
    dropRate: 0.12,
    isBoss: false,
  },

  // ── 스테이지 8 — 단단한 적 위주. 화력이 부족하면 벽에 막힌다 ──
  {
    waves: [
      { type: 'elite', entryPath: 'spiralLeft', row: 0, cols: [1, 3, 4, 6], delay: 0 },
      { type: 'captain', entryPath: 'spiralRight', row: 1, cols: [0, 2, 5, 7], delay: 1.0 },
      { type: 'butterfly', entryPath: 'topDive', row: 2, cols: [0, 1, 2, 3, 4, 5, 6, 7], delay: 2.0 },
      { type: 'butterfly', entryPath: 'leftLoop', row: 3, cols: [0, 1, 2, 3, 4, 5, 6, 7], delay: 3.2 },
      { type: 'bee', entryPath: 'rightLoop', row: 4, cols: [0, 1, 2, 3, 4, 5, 6, 7], delay: 4.4 },
    ],
    diveInterval: 1.15,
    diveCount: 3,
    diveDuration: 2.0,
    enemyBulletSpeed: 265,
    enemyShootInterval: 0.30,
    dropRate: 0.14,
    isBoss: false,
  },

  // ── 스테이지 9 — 대형이 거의 꽉 찬다. 최종 보스 직전의 벽 ─────
  {
    waves: [
      { type: 'elite', entryPath: 'spiralLeft', row: 0, cols: [1, 2, 5, 6], delay: 0 },
      { type: 'captain', entryPath: 'spiralRight', row: 0, cols: [0, 3, 4, 7], delay: 0.8 },
      { type: 'butterfly', entryPath: 'topDive', row: 1, cols: [0, 1, 2, 3, 4, 5, 6, 7], delay: 1.8 },
      { type: 'butterfly', entryPath: 'leftLoop', row: 2, cols: [0, 1, 2, 3, 4, 5, 6, 7], delay: 3.0 },
      { type: 'bee', entryPath: 'rightLoop', row: 3, cols: [0, 1, 2, 3, 4, 5, 6, 7], delay: 4.2 },
      { type: 'bee', entryPath: 'leftLoop', row: 4, cols: [2, 3, 4, 5], delay: 5.4 },
    ],
    diveInterval: 1.0,
    diveCount: 4,
    diveDuration: 1.9,
    enemyBulletSpeed: 280,
    enemyShootInterval: 0.275,
    dropRate: 0.15,
    isBoss: false,
  },

  // ── 스테이지 10 — 최종 보스. 엘리트 호위 6기 ─────────────────
  {
    waves: [
      { type: 'elite', entryPath: 'spiralLeft', row: 2, cols: [0, 1, 2], delay: 2.0 },
      { type: 'elite', entryPath: 'spiralRight', row: 2, cols: [5, 6, 7], delay: 2.0 },
    ],
    diveInterval: 2.2,
    diveCount: 1,
    diveDuration: 2.2,
    enemyBulletSpeed: 280,
    enemyShootInterval: 0.35,
    dropRate: 0.25, // 최종전은 드롭을 후하게
    isBoss: true,
    bossTier: 2, // 최종 보스
  },
];

/** 범위를 넘어가면 마지막 스테이지를 돌려준다. */
export function getStage(index) {
  return STAGES[Math.min(index, STAGES.length - 1)];
}
