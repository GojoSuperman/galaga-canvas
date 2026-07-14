import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aabbOverlap, forEachHit } from '../js/game/collision.js';

const box = (x, y, w = 10, h = 10) => ({ x, y, w, h, alive: true });

test('완전히 겹치면 true', () => {
  assert.equal(aabbOverlap(box(0, 0), box(0, 0)), true);
});

test('일부만 겹쳐도 true', () => {
  assert.equal(aabbOverlap(box(0, 0), box(5, 5)), true);
});

test('떨어져 있으면 false', () => {
  assert.equal(aabbOverlap(box(0, 0), box(20, 0)), false);
  assert.equal(aabbOverlap(box(0, 0), box(0, 20)), false);
});

test('모서리가 정확히 맞닿기만 하면 겹친 것으로 보지 않는다', () => {
  // a는 x 0~10, b는 x 10~20 — 접점의 두께가 0이므로 충돌이 아니다.
  assert.equal(aabbOverlap(box(0, 0), box(10, 0)), false);
});

test('forEachHit은 겹치는 모든 쌍에 콜백을 부른다', () => {
  const bullets = [box(0, 0), box(100, 100)];
  const enemies = [box(5, 5), box(200, 200)];
  const hits = [];
  forEachHit(bullets, enemies, (a, b) => hits.push([a, b]));
  assert.equal(hits.length, 1);
  assert.equal(hits[0][0], bullets[0]);
  assert.equal(hits[0][1], enemies[0]);
});

test('forEachHit은 죽은 엔티티를 건너뛴다', () => {
  const bullets = [{ ...box(0, 0), alive: false }];
  const enemies = [box(0, 0)];
  const hits = [];
  forEachHit(bullets, enemies, (a, b) => hits.push([a, b]));
  assert.equal(hits.length, 0);
});

test('forEachHit은 콜백이 죽인 엔티티를 다시 맞히지 않는다', () => {
  // 총알 1발이 겹친 적 2기를 관통해서는 안 된다 (콜백이 총알을 죽이면 즉시 멈춘다).
  const bullet = box(0, 0);
  const enemies = [box(0, 0), box(2, 2)];
  const hits = [];
  forEachHit([bullet], enemies, (a, b) => {
    hits.push(b);
    a.alive = false; // 총알 소멸
  });
  assert.equal(hits.length, 1);
});
