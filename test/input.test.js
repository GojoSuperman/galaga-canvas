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
