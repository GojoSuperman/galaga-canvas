import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  scoreFor, ENEMY_BASE_SCORE, STAGE_CLEAR_BONUS, BOSS_SCORE,
} from '../js/game/score.js';
import { ENEMY_STATE } from '../js/game/enemy.js';

test('대형 안의 적은 기본 점수', () => {
  const enemy = { type: 'bee', state: ENEMY_STATE.IN_FORMATION };
  assert.equal(scoreFor(enemy), ENEMY_BASE_SCORE.bee);
});

test('급강하 중인 적은 2배 점수', () => {
  const enemy = { type: 'bee', state: ENEMY_STATE.DIVING };
  assert.equal(scoreFor(enemy), ENEMY_BASE_SCORE.bee * 2);
});

test('복귀 중인 적도 2배 점수 (아직 대형 밖이다)', () => {
  const enemy = { type: 'butterfly', state: ENEMY_STATE.RETURNING };
  assert.equal(scoreFor(enemy), ENEMY_BASE_SCORE.butterfly * 2);
});

test('진입 중인 적은 기본 점수', () => {
  const enemy = { type: 'captain', state: ENEMY_STATE.ENTERING };
  assert.equal(scoreFor(enemy), ENEMY_BASE_SCORE.captain);
});

test('적 종류별 점수는 벌 < 나비 < 캡틴', () => {
  assert.ok(ENEMY_BASE_SCORE.bee < ENEMY_BASE_SCORE.butterfly);
  assert.ok(ENEMY_BASE_SCORE.butterfly < ENEMY_BASE_SCORE.captain);
});

test('스테이지 클리어 보너스는 스테이지 번호에 비례한다', () => {
  assert.ok(STAGE_CLEAR_BONUS(2) > STAGE_CLEAR_BONUS(1));
});

test('최종 보스 격파 점수가 중간 보스보다 높다', () => {
  assert.ok(BOSS_SCORE[2] > BOSS_SCORE[1]);
});
