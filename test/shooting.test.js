import { test } from 'node:test';
import assert from 'node:assert/strict';
import { enemyShotVelocity } from '../js/game/shooting.js';

const ORIGIN = { x: 240, y: 200 };
const SPEED = 250;

test('elite는 플레이어를 향해 쏜다 — 왼쪽/가운데/오른쪽', () => {
  const left = enemyShotVelocity('elite', ORIGIN, { x: 20, y: 580 }, SPEED);
  const center = enemyShotVelocity('elite', ORIGIN, { x: 240, y: 580 }, SPEED);
  const right = enemyShotVelocity('elite', ORIGIN, { x: 460, y: 580 }, SPEED);

  assert.ok(left.vx < -10, `왼쪽 플레이어인데 vx=${left.vx}`);
  assert.ok(Math.abs(center.vx) < 1, `정면인데 vx=${center.vx}`);
  assert.ok(right.vx > 10, `오른쪽 플레이어인데 vx=${right.vx}`);

  // 전부 아래로 향해야 한다.
  for (const shot of [left, center, right]) {
    assert.ok(shot.vy > 0, `아래로 안 감: vy=${shot.vy}`);
  }
});

test('조준탄의 속력은 지정한 속도와 같다', () => {
  const shot = enemyShotVelocity('elite', ORIGIN, { x: 20, y: 580 }, SPEED);
  assert.ok(Math.abs(Math.hypot(shot.vx, shot.vy) - SPEED) < 0.001);
});

test('일반 적은 플레이어 위치와 무관하게 아래로만 쏜다', () => {
  for (const type of ['bee', 'butterfly', 'captain']) {
    for (const px of [20, 240, 460]) {
      const shot = enemyShotVelocity(type, ORIGIN, { x: px, y: 580 }, SPEED);
      assert.equal(shot.vx, 0, `${type}가 조준했다 (플레이어 x=${px})`);
      assert.equal(shot.vy, SPEED);
    }
  }
});

test('플레이어가 죽었으면(target=null) elite도 조준하지 않고 아래로 쏜다', () => {
  const shot = enemyShotVelocity('elite', ORIGIN, null, SPEED);
  assert.equal(shot.vx, 0);
  assert.equal(shot.vy, SPEED);
});

test('알 수 없는 적 타입은 아래로 쏜다 (터지지 않는다)', () => {
  const shot = enemyShotVelocity('없는타입', ORIGIN, { x: 20, y: 580 }, SPEED);
  assert.equal(shot.vx, 0);
  assert.equal(shot.vy, SPEED);
});
