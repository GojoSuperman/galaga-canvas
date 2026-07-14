import { ENEMY_STATE } from './enemy.js';

/** 적 종류별 기본 점수. */
export const ENEMY_BASE_SCORE = {
  bee: 50,
  butterfly: 80,
  captain: 150,
  elite: 250,
};

/** 보스 격파 점수. 티어별로 다르다. */
export const BOSS_SCORE = { 1: 5000, 2: 12000 };

/** 스테이지 클리어 보너스 — 뒤로 갈수록 커진다. */
export const STAGE_CLEAR_BONUS = (stageNumber) => stageNumber * 500;

// 대형 밖으로 나온 적을 잡는 게 더 어렵다 → 갤러그의 리스크-리워드 규칙.
const RISK_STATES = new Set([ENEMY_STATE.DIVING, ENEMY_STATE.RETURNING]);

/** 적 격파 점수. 급강하/복귀 중이면 2배. */
export function scoreFor(enemy) {
  const base = ENEMY_BASE_SCORE[enemy.type] ?? 0;
  return RISK_STATES.has(enemy.state) ? base * 2 : base;
}
