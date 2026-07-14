import { WIDTH } from '../config.js';

export const FORMATION_COLS = 8;
export const FORMATION_ROWS = 5;
export const SLOT_W = 44;
export const SLOT_H = 40;
export const FORMATION_TOP = 70;   // 첫 행의 y
export const SWAY_AMPLITUDE = 24;  // px — 좌우 흔들림 폭
export const SWAY_PERIOD = 4;      // 초 — 한 번 왕복하는 데 걸리는 시간

// 대형 전체 폭을 화면 중앙에 맞추기 위한 좌측 여백
const ORIGIN_X = (WIDTH - FORMATION_COLS * SLOT_W) / 2;

/** 흔들림을 뺀 슬롯 기준 좌표. */
export function slotPosition(col, row) {
  return {
    x: ORIGIN_X + col * SLOT_W,
    y: FORMATION_TOP + row * SLOT_H,
  };
}

/** 대형 전체의 좌우 흔들림 오프셋. 사인파라 끝에서 부드럽게 되돌아온다. */
export function swayOffset(time) {
  return Math.sin((time / SWAY_PERIOD) * Math.PI * 2) * SWAY_AMPLITUDE;
}

/** 흔들림이 반영된 실제 슬롯 좌표. 적은 매 프레임 이 값을 조회한다. */
export function formationSlot(col, row, time) {
  const base = slotPosition(col, row);
  return { x: base.x + swayOffset(time), y: base.y };
}

/**
 * 대형. 시간만 들고 있으면 되므로 상태가 거의 없다.
 * 적 개체는 자기 슬롯을 조회만 하므로, 대형 이동과 적 로직이 분리된다.
 */
export function createFormation() {
  let time = 0;
  return {
    update(dt) { time += dt; },
    slotAt(col, row) { return formationSlot(col, row, time); },
    get time() { return time; },
  };
}
