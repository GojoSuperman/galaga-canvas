import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  bossPhase, spreadShot, aimedShot, createBoss, BOSS_TIERS,
} from '../js/game/boss.js';

const fakeGame = { audio: { play() {} }, sprites: { get: () => null } };
const fakeBullets = { spawn: () => ({}), items: [] };

test('HP 비율로 페이즈가 결정된다', () => {
  assert.equal(bossPhase(1.0), 1);
  assert.equal(bossPhase(0.7), 1);
  assert.equal(bossPhase(0.66), 2);  // 경계는 아래 페이즈에 속한다
  assert.equal(bossPhase(0.5), 2);
  assert.equal(bossPhase(0.33), 3);
  assert.equal(bossPhase(0.1), 3);
  assert.equal(bossPhase(0), 3);
});

test('확산탄은 요청한 개수만큼 나온다', () => {
  assert.equal(spreadShot(100, 100, 5, 200).length, 5);
});

test('확산탄은 전부 아래를 향한다', () => {
  for (const shot of spreadShot(100, 100, 5, 200)) {
    assert.ok(shot.vy > 0, `아래로 안 간다: vy=${shot.vy}`);
  }
});

test('확산탄은 좌우 대칭으로 퍼진다', () => {
  const shots = spreadShot(100, 100, 5, 200);
  assert.ok(shots.some((s) => s.vx < -1), '왼쪽으로 퍼지는 탄이 있어야 한다');
  assert.ok(shots.some((s) => s.vx > 1), '오른쪽으로 퍼지는 탄이 있어야 한다');
  // 가운데 탄은 거의 수직이다
  assert.ok(shots.some((s) => Math.abs(s.vx) < 1));
});

test('확산탄의 속력은 일정하다', () => {
  for (const shot of spreadShot(100, 100, 5, 200)) {
    const speed = Math.hypot(shot.vx, shot.vy);
    assert.ok(Math.abs(speed - 200) < 0.001, `속력이 다르다: ${speed}`);
  }
});

test('조준탄은 목표를 향한다', () => {
  // 목표가 정확히 아래에 있으면 수직으로 내려간다.
  const straight = aimedShot(100, 100, 100, 500, 200);
  assert.ok(Math.abs(straight.vx) < 0.001);
  assert.ok(straight.vy > 0);

  // 목표가 오른쪽 아래면 오른쪽으로 기운다.
  const right = aimedShot(100, 100, 400, 500, 200);
  assert.ok(right.vx > 0);
  assert.ok(right.vy > 0);
});

test('보스는 최대 체력으로 시작하고 1페이즈다', () => {
  const boss = createBoss(fakeGame, fakeBullets);
  assert.equal(boss.hp, BOSS_TIERS[1].maxHp);
  assert.equal(boss.phase, 1);
  assert.equal(boss.alive, true);
});

test('체력이 줄면 페이즈가 올라간다', () => {
  const boss = createBoss(fakeGame, fakeBullets);
  boss.hit(BOSS_TIERS[1].maxHp * 0.4); // 60% 남음
  boss.update(0, 240);
  assert.equal(boss.phase, 2);

  boss.hit(BOSS_TIERS[1].maxHp * 0.4); // 20% 남음
  boss.update(0, 240);
  assert.equal(boss.phase, 3);
});

test('체력이 0이 되면 죽는다', () => {
  const boss = createBoss(fakeGame, fakeBullets);
  assert.equal(boss.hit(BOSS_TIERS[1].maxHp - 1), false);
  assert.equal(boss.hit(1), true);
  assert.equal(boss.alive, false);
});

test('보스는 좌우로 움직이며 화면 밖으로 나가지 않는다', () => {
  const boss = createBoss(fakeGame, fakeBullets);
  for (let i = 0; i < 600; i += 1) {
    boss.update(0.05, 240);
    assert.ok(boss.x >= 0, `왼쪽 이탈: ${boss.x}`);
    assert.ok(boss.x + boss.w <= 480, `오른쪽 이탈: ${boss.x + boss.w}`);
  }
});

test('티어 2 보스는 티어 1보다 체력이 많다', () => {
  assert.ok(BOSS_TIERS[2].maxHp > BOSS_TIERS[1].maxHp);
});

test('티어에 따라 최대 체력이 정해진다', () => {
  const mid = createBoss(fakeGame, fakeBullets, 1);
  const final = createBoss(fakeGame, fakeBullets, 2);
  assert.equal(mid.hp, BOSS_TIERS[1].maxHp);
  assert.equal(final.hp, BOSS_TIERS[2].maxHp);
});

test('페이즈 전이 기준은 티어와 무관하게 비율로 정해진다', () => {
  const final = createBoss(fakeGame, fakeBullets, 2);
  final.hit(BOSS_TIERS[2].maxHp * 0.4); // 60% 남음
  final.update(0, 240);
  assert.equal(final.phase, 2);
});

test('최종 보스가 중간 보스보다 확산탄이 많다', () => {
  assert.ok(BOSS_TIERS[2].spreadBonus > 0);
});
