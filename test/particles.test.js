import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createParticlePool } from '../js/game/particles.js';

test('burst는 요청한 개수만큼 파티클을 켠다', () => {
  const pool = createParticlePool(50);
  pool.burst(100, 100, '#fff', 12);
  assert.equal(pool.aliveCount(), 12);
});

test('수명이 다하면 죽는다', () => {
  const pool = createParticlePool(50);
  pool.burst(100, 100, '#fff', 5);
  pool.update(10); // 수명(최대 0.6초)을 훌쩍 넘긴다
  assert.equal(pool.aliveCount(), 0);
});

test('풀 크기를 넘는 요청은 있는 만큼만 켠다 (터지지 않는다)', () => {
  const pool = createParticlePool(4);
  pool.burst(0, 0, '#fff', 100);
  assert.equal(pool.aliveCount(), 4);
});

test('죽은 파티클의 슬롯을 재사용한다', () => {
  const pool = createParticlePool(4);
  pool.burst(0, 0, '#fff', 4);
  pool.update(10);
  pool.burst(0, 0, '#fff', 4);
  assert.equal(pool.aliveCount(), 4);
});
