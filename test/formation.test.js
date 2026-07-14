import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  slotPosition, swayOffset, formationSlot, createFormation,
  FORMATION_COLS, SLOT_W, SWAY_AMPLITUDE, SWAY_PERIOD,
} from '../js/game/formation.js';
import { WIDTH } from '../js/config.js';

test('대형은 화면 가로 중앙에 정렬된다', () => {
  const left = slotPosition(0, 0);
  const right = slotPosition(FORMATION_COLS - 1, 0);
  const leftGap = left.x;
  const rightGap = WIDTH - (right.x + SLOT_W);
  // 좌우 여백이 같아야 중앙 정렬이다 (반올림 오차 1px 허용).
  assert.ok(Math.abs(leftGap - rightGap) <= 1, `좌우 여백 불일치: ${leftGap} vs ${rightGap}`);
});

test('열이 커지면 x가 SLOT_W만큼 커진다', () => {
  assert.equal(slotPosition(1, 0).x - slotPosition(0, 0).x, SLOT_W);
});

test('행이 커지면 y가 아래로 내려간다', () => {
  assert.ok(slotPosition(0, 1).y > slotPosition(0, 0).y);
});

test('흔들림은 t=0에서 0, 주기의 1/4에서 최대', () => {
  assert.equal(swayOffset(0), 0);
  assert.ok(Math.abs(swayOffset(SWAY_PERIOD / 4) - SWAY_AMPLITUDE) < 0.001);
});

test('흔들림은 진폭을 넘지 않는다', () => {
  for (let t = 0; t < SWAY_PERIOD * 2; t += 0.05) {
    assert.ok(Math.abs(swayOffset(t)) <= SWAY_AMPLITUDE + 0.001, `t=${t}에서 진폭 초과`);
  }
});

test('흔들림은 주기마다 반복된다', () => {
  assert.ok(Math.abs(swayOffset(1.3) - swayOffset(1.3 + SWAY_PERIOD)) < 0.001);
});

test('formationSlot은 기준 좌표에 흔들림을 더한 값', () => {
  const t = 0.7;
  const base = slotPosition(2, 1);
  const actual = formationSlot(2, 1, t);
  assert.ok(Math.abs(actual.x - (base.x + swayOffset(t))) < 0.001);
  assert.equal(actual.y, base.y); // y는 흔들리지 않는다
});

test('createFormation은 update로 시간을 누적한다', () => {
  const formation = createFormation();
  const before = formation.slotAt(0, 0).x;
  formation.update(SWAY_PERIOD / 4);
  const after = formation.slotAt(0, 0).x;
  assert.ok(Math.abs(after - before - SWAY_AMPLITUDE) < 0.001);
});
