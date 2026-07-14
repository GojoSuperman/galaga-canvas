import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBulletPool } from '../js/game/bullet.js';

const BOUNDS = { width: 480, height: 640 };

test('spawn하면 살아있는 탄이 하나 생긴다', () => {
  const pool = createBulletPool(4);
  const bullet = pool.spawn({ x: 10, y: 20, vy: -400, w: 3, h: 8, sprite: 'playerShot' });
  assert.equal(bullet.alive, true);
  assert.equal(bullet.x, 10);
  assert.equal(bullet.vy, -400);
  assert.equal(pool.aliveCount(), 1);
});

test('update는 속도만큼 위치를 옮긴다', () => {
  const pool = createBulletPool(4);
  const bullet = pool.spawn({ x: 100, y: 100, vx: 10, vy: -200, w: 3, h: 8, sprite: 's' });
  pool.update(0.5, BOUNDS);
  assert.equal(bullet.x, 105);
  assert.equal(bullet.y, 0);
});

test('화면 위로 나가면 죽는다', () => {
  const pool = createBulletPool(4);
  pool.spawn({ x: 100, y: 5, vy: -400, w: 3, h: 8, sprite: 's' });
  pool.update(0.1, BOUNDS);
  assert.equal(pool.aliveCount(), 0);
});

test('화면 아래로 나가면 죽는다', () => {
  const pool = createBulletPool(4);
  pool.spawn({ x: 100, y: 630, vy: 400, w: 3, h: 8, sprite: 's' });
  pool.update(0.1, BOUNDS);
  assert.equal(pool.aliveCount(), 0);
});

test('죽은 탄의 슬롯을 재사용한다 (새 객체를 만들지 않는다)', () => {
  const pool = createBulletPool(1);
  const first = pool.spawn({ x: 0, y: 5, vy: -400, w: 3, h: 8, sprite: 's' });
  pool.update(0.1, BOUNDS); // 화면 밖 → 사망
  const second = pool.spawn({ x: 50, y: 300, vy: -400, w: 3, h: 8, sprite: 's' });
  assert.equal(first, second); // 같은 객체가 재사용됐다
  assert.equal(second.x, 50);
  assert.equal(second.alive, true);
});

test('풀이 꽉 차면 null을 반환한다', () => {
  const pool = createBulletPool(1);
  pool.spawn({ x: 0, y: 300, vy: -400, w: 3, h: 8, sprite: 's' });
  const overflow = pool.spawn({ x: 0, y: 300, vy: -400, w: 3, h: 8, sprite: 's' });
  assert.equal(overflow, null);
});
