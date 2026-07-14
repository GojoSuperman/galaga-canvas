import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLoop } from '../js/core/loop.js';

test('경과 시간이 step에 못 미치면 update를 호출하지 않는다', () => {
  const updates = [];
  const loop = createLoop({ update: (dt) => updates.push(dt), render: () => {}, step: 0.1 });
  loop.tick(0);
  loop.tick(0.05);
  assert.equal(updates.length, 0);
});

test('경과 시간만큼 update를 고정 step으로 반복 호출한다', () => {
  const updates = [];
  const loop = createLoop({ update: (dt) => updates.push(dt), render: () => {}, step: 0.1 });
  loop.tick(0);
  loop.tick(0.35);
  assert.equal(updates.length, 3);
  assert.deepEqual(updates, [0.1, 0.1, 0.1]);
});

test('render는 tick 1회당 1회 호출된다', () => {
  let renders = 0;
  const loop = createLoop({ update: () => {}, render: () => { renders += 1; }, step: 0.1 });
  loop.tick(0);
  loop.tick(0.35);
  assert.equal(renders, 2);
});

test('한 프레임이 maxFrameTime을 넘으면 잘라내 죽음의 나선을 막는다', () => {
  const updates = [];
  const loop = createLoop({
    update: (dt) => updates.push(dt), render: () => {}, step: 0.1, maxFrameTime: 0.25,
  });
  loop.tick(0);
  loop.tick(10); // 탭이 백그라운드에 있다가 돌아온 상황
  assert.equal(updates.length, 2); // 0.25초 → step 0.1 두 번
});
