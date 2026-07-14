import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STAGES, getStage } from '../js/stages/stages.js';
import { ENEMY_TYPES } from '../js/game/enemy.js';
import { ENTRY_PATHS } from '../js/game/paths.js';
import { FORMATION_COLS, FORMATION_ROWS } from '../js/game/formation.js';

test('스테이지는 10개다', () => {
  assert.equal(STAGES.length, 10);
});

test('보스는 5스테이지와 10스테이지 두 곳이다', () => {
  const bossIndexes = STAGES.map((s, i) => (s.isBoss ? i : -1)).filter((i) => i >= 0);
  assert.deepEqual(bossIndexes, [4, 9]); // 0-based → 5스테이지, 10스테이지
});

test('보스 스테이지는 티어를 갖고, 최종 보스가 더 높은 티어다', () => {
  assert.equal(STAGES[4].bossTier, 1);
  assert.equal(STAGES[9].bossTier, 2);
});

test('보스가 아닌 스테이지는 bossTier를 갖지 않는다', () => {
  for (const [i, stage] of STAGES.entries()) {
    if (stage.isBoss) continue;
    assert.equal(stage.bossTier, undefined, `스테이지 ${i + 1}에 불필요한 bossTier`);
  }
});

test('모든 웨이브가 유효한 적 타입과 진입 경로를 쓴다', () => {
  for (const [i, stage] of STAGES.entries()) {
    for (const wave of stage.waves) {
      assert.ok(wave.type in ENEMY_TYPES, `스테이지 ${i + 1}: 알 수 없는 적 ${wave.type}`);
      assert.ok(wave.entryPath in ENTRY_PATHS, `스테이지 ${i + 1}: 알 수 없는 경로 ${wave.entryPath}`);
    }
  }
});

test('모든 웨이브의 행·열이 대형 범위 안이다', () => {
  for (const [i, stage] of STAGES.entries()) {
    for (const wave of stage.waves) {
      assert.ok(wave.row >= 0 && wave.row < FORMATION_ROWS, `스테이지 ${i + 1}: 행 범위 초과`);
      for (const col of wave.cols) {
        assert.ok(col >= 0 && col < FORMATION_COLS, `스테이지 ${i + 1}: 열 범위 초과 (${col})`);
      }
    }
  }
});

test('한 슬롯(행,열)에 적이 둘 이상 배정되지 않는다', () => {
  for (const [i, stage] of STAGES.entries()) {
    const used = new Set();
    for (const wave of stage.waves) {
      for (const col of wave.cols) {
        const key = `${wave.row},${col}`;
        assert.ok(!used.has(key), `스테이지 ${i + 1}: 슬롯 ${key} 중복 배정`);
        used.add(key);
      }
    }
  }
});

test('일반 스테이지의 난이도는 뒤로 갈수록 높아진다', () => {
  const normal = STAGES.filter((s) => !s.isBoss);
  for (let i = 1; i < normal.length; i += 1) {
    assert.ok(
      normal[i].diveInterval <= normal[i - 1].diveInterval,
      `${i + 1}번째 일반 스테이지: 급강하 간격이 더 짧아져야 한다`,
    );
    assert.ok(
      normal[i].enemyBulletSpeed >= normal[i - 1].enemyBulletSpeed,
      `${i + 1}번째 일반 스테이지: 탄속이 느려지면 안 된다`,
    );
    assert.ok(
      normal[i].diveCount >= normal[i - 1].diveCount,
      `${i + 1}번째 일반 스테이지: 동시 급강하 수가 줄면 안 된다`,
    );
  }
});

test('getStage는 범위를 넘으면 마지막 스테이지를 준다', () => {
  assert.equal(getStage(0), STAGES[0]);
  assert.equal(getStage(99), STAGES[STAGES.length - 1]);
});

test('보스 스테이지는 보스 티어를 갖는다', () => {
  for (const [i, stage] of STAGES.entries()) {
    if (!stage.isBoss) continue;
    assert.ok(stage.bossTier >= 1, `스테이지 ${i + 1}: bossTier 누락`);
  }
});
