import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInput } from '../js/core/input.js';

/** addEventListener를 흉내내는 가짜 타겟 — 등록된 핸들러를 직접 호출할 수 있다. */
function createFakeTarget() {
  const handlers = {};
  return {
    addEventListener(type, fn) { (handlers[type] ??= []).push(fn); },
    removeEventListener(type, fn) {
      handlers[type] = (handlers[type] ?? []).filter((h) => h !== fn);
    },
    emit(type, event) { (handlers[type] ?? []).forEach((fn) => fn(event)); },
    countFor(type) { return (handlers[type] ?? []).length; },
  };
}

test('키를 누르면 isDown이 true, 떼면 false', () => {
  const target = createFakeTarget();
  const input = createInput(target);

  assert.equal(input.isDown('ArrowLeft'), false);
  target.emit('keydown', { code: 'ArrowLeft', preventDefault() {} });
  assert.equal(input.isDown('ArrowLeft'), true);
  target.emit('keyup', { code: 'ArrowLeft', preventDefault() {} });
  assert.equal(input.isDown('ArrowLeft'), false);
});

test('wasPressed는 누른 프레임에만 true이고 endFrame 후 false', () => {
  const target = createFakeTarget();
  const input = createInput(target);

  target.emit('keydown', { code: 'Space', preventDefault() {} });
  assert.equal(input.wasPressed('Space'), true);

  input.endFrame();
  assert.equal(input.wasPressed('Space'), false);
  // 키를 떼지 않았으므로 여전히 눌린 상태다.
  assert.equal(input.isDown('Space'), true);
});

test('키를 누르고 있어도 wasPressed는 반복 발동하지 않는다', () => {
  const target = createFakeTarget();
  const input = createInput(target);

  target.emit('keydown', { code: 'Space', preventDefault() {} });
  input.endFrame();
  // OS 키 리피트로 keydown이 또 와도 눌린 상태면 무시한다.
  target.emit('keydown', { code: 'Space', preventDefault() {} });
  assert.equal(input.wasPressed('Space'), false);
});

test('dispose는 등록한 리스너를 제거한다', () => {
  const target = createFakeTarget();
  const input = createInput(target);
  assert.equal(target.countFor('keydown'), 1);
  input.dispose();
  assert.equal(target.countFor('keydown'), 0);
  assert.equal(target.countFor('keyup'), 0);
});

// ── 터치 ──────────────────────────────────────────────────────
// 480 논리 폭 캔버스가 CSS로 절반(240px) 크기로 표시되는 상황을 흉내낸다.
function createFakeCanvas({ left = 100, top = 0, width = 240, height = 320 } = {}) {
  const handlers = {};
  return {
    addEventListener(type, fn) { (handlers[type] ??= []).push(fn); },
    removeEventListener(type, fn) {
      handlers[type] = (handlers[type] ?? []).filter((h) => h !== fn);
    },
    emit(type, event) { (handlers[type] ?? []).forEach((fn) => fn(event)); },
    countFor(type) { return (handlers[type] ?? []).length; },
    getBoundingClientRect() { return { left, top, width, height }; },
  };
}

function touchEvent(touches) {
  return { touches, changedTouches: touches, preventDefault() {} };
}

test('touchstart는 Space를 누른 상태로 만들고, Space/Enter 둘 다 이번 프레임에 눌린다', () => {
  const target = createFakeTarget();
  const canvas = createFakeCanvas();
  const input = createInput(target, canvas);

  canvas.emit('touchstart', touchEvent([{ identifier: 0, clientX: 200, clientY: 100 }]));
  assert.equal(input.isDown('Space'), true);
  assert.equal(input.wasPressed('Space'), true);
  assert.equal(input.wasPressed('Enter'), true);

  input.endFrame();
  assert.equal(input.wasPressed('Space'), false);
  assert.equal(input.wasPressed('Enter'), false);
  // 손가락을 떼지 않았으므로 여전히 눌린 상태다.
  assert.equal(input.isDown('Space'), true);
});

test('touchend는 Space를 뗀 상태로 만든다', () => {
  const target = createFakeTarget();
  const canvas = createFakeCanvas();
  const input = createInput(target, canvas);

  canvas.emit('touchstart', touchEvent([{ identifier: 0, clientX: 200, clientY: 100 }]));
  assert.equal(input.isDown('Space'), true);
  canvas.emit('touchend', touchEvent([{ identifier: 0, clientX: 200, clientY: 100 }]));
  assert.equal(input.isDown('Space'), false);
});

test('dragDelta는 캔버스 CSS 스케일을 반영해 논리 픽셀로 환산된다', () => {
  const target = createFakeTarget();
  // 480 논리 폭이 240px(절반 크기)로 표시된다 — 스케일 배율 2.
  const canvas = createFakeCanvas({ width: 240 });
  const input = createInput(target, canvas);

  canvas.emit('touchstart', touchEvent([{ identifier: 0, clientX: 200, clientY: 100 }]));
  // 클라이언트 좌표계에서 30px 이동 → 논리 좌표계에서는 60px이어야 한다.
  canvas.emit('touchmove', touchEvent([{ identifier: 0, clientX: 230, clientY: 100 }]));
  assert.equal(input.dragDelta, 60);
});

test('터치가 없으면 dragDelta는 0이고, endFrame이 호출되면 소비되어 0이 된다', () => {
  const target = createFakeTarget();
  const canvas = createFakeCanvas({ width: 240 });
  const input = createInput(target, canvas);

  assert.equal(input.dragDelta, 0);

  canvas.emit('touchstart', touchEvent([{ identifier: 0, clientX: 200, clientY: 100 }]));
  canvas.emit('touchmove', touchEvent([{ identifier: 0, clientX: 220, clientY: 100 }]));
  assert.ok(input.dragDelta !== 0);

  input.endFrame();
  assert.equal(input.dragDelta, 0);
});

test('두 번째 손가락은 무시된다 — 드래그량에 영향을 주지 않는다', () => {
  const target = createFakeTarget();
  const canvas = createFakeCanvas({ width: 240 });
  const input = createInput(target, canvas);

  canvas.emit('touchstart', touchEvent([{ identifier: 0, clientX: 200, clientY: 100 }]));
  // 두 번째 손가락이 추가로 닿는다 — 첫 손가락(0)이 이미 추적 중이므로 무시돼야 한다.
  canvas.emit('touchstart', touchEvent([{ identifier: 1, clientX: 300, clientY: 100 }]));
  // 두 번째 손가락만 크게 움직인다 — 추적 대상이 아니므로 드래그에 반영되지 않는다.
  canvas.emit('touchmove', touchEvent([{ identifier: 1, clientX: 400, clientY: 100 }]));
  assert.equal(input.dragDelta, 0);

  // 추적 중인 첫 손가락을 움직이면 정상적으로 반영된다.
  canvas.emit('touchmove', touchEvent([{ identifier: 0, clientX: 210, clientY: 100 }]));
  assert.ok(input.dragDelta > 0);
});

test('touchcancel은 Space를 뗀 상태로 만든다 (자동 연사 중지)', () => {
  const target = createFakeTarget();
  const canvas = createFakeCanvas();
  const input = createInput(target, canvas);

  canvas.emit('touchstart', touchEvent([{ identifier: 0, clientX: 200, clientY: 100 }]));
  assert.equal(input.isDown('Space'), true);
  canvas.emit('touchcancel', touchEvent([{ identifier: 0, clientX: 200, clientY: 100 }]));
  assert.equal(input.isDown('Space'), false);
});

test('dispose는 터치 리스너도 제거한다', () => {
  const target = createFakeTarget();
  const canvas = createFakeCanvas();
  const input = createInput(target, canvas);
  assert.equal(canvas.countFor('touchstart'), 1);
  assert.equal(canvas.countFor('touchmove'), 1);
  assert.equal(canvas.countFor('touchend'), 1);
  assert.equal(canvas.countFor('touchcancel'), 1);
  input.dispose();
  assert.equal(canvas.countFor('touchstart'), 0);
  assert.equal(canvas.countFor('touchmove'), 0);
  assert.equal(canvas.countFor('touchend'), 0);
  assert.equal(canvas.countFor('touchcancel'), 0);
});

test('canvas 없이 createInput을 호출해도 정상 동작한다 (테스트 환경 하위호환)', () => {
  const target = createFakeTarget();
  const input = createInput(target);
  assert.equal(input.dragDelta, 0);
  target.emit('keydown', { code: 'Space', preventDefault() {} });
  assert.equal(input.isDown('Space'), true);
});
