import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rollDrop, createPowerupPool, POWERUP_TYPES } from '../js/game/powerup.js';

test('드롭 확률이 0이면 절대 나오지 않는다', () => {
  assert.equal(rollDrop(0, () => 0), null);
});

test('드롭 확률이 1이면 항상 나온다', () => {
  assert.ok(POWERUP_TYPES.includes(rollDrop(1, () => 0.5)));
});

test('난수가 확률보다 크면 드롭하지 않는다', () => {
  // random()이 0.5 → dropRate 0.1보다 크므로 드롭 실패
  assert.equal(rollDrop(0.1, () => 0.5), null);
});

test('드롭되면 항상 유효한 타입이다', () => {
  for (let i = 0; i < 100; i += 1) {
    const type = rollDrop(1);
    assert.ok(POWERUP_TYPES.includes(type), `알 수 없는 타입: ${type}`);
  }
});

test('spawn한 파워업은 아래로 떨어진다', () => {
  const pool = createPowerupPool(4);
  const item = pool.spawn(100, 100, 'shield');
  pool.update(1, 640);
  assert.ok(item.y > 100, '아래로 내려가야 한다');
  assert.equal(item.type, 'shield');
});

test('화면 아래로 나가면 사라진다', () => {
  const pool = createPowerupPool(4);
  pool.spawn(100, 630, 'weapon');
  pool.update(1, 640);
  assert.equal(pool.items.filter((p) => p.alive).length, 0);
});

test('풀이 꽉 차면 null을 반환한다', () => {
  const pool = createPowerupPool(1);
  pool.spawn(0, 0, 'weapon');
  assert.equal(pool.spawn(0, 0, 'shield'), null);
});
