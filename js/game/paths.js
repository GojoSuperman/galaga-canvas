import { WIDTH, HEIGHT } from '../config.js';

const P = (x, y) => ({ x, y });

/** 3차 베지어 곡선 위의 점. t는 0~1. */
export function cubicBezier(p0, p1, p2, p3, t) {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return {
    x: a * p0.x + b * p1.x + c * p2.x + d * p3.x,
    y: a * p0.y + b * p1.y + c * p2.y + d * p3.y,
  };
}

/**
 * 진입 경로. 화면 밖에서 출발해 목표 슬롯에서 끝난다.
 * 모양을 바꾸고 싶으면 중간 제어점(p1, p2)을 조정한다.
 */
export const ENTRY_PATHS = {
  // 왼쪽 아래에서 크게 원을 그리며 올라온다.
  leftLoop: (slot) => [
    P(-40, HEIGHT * 0.55),
    P(WIDTH * 0.15, HEIGHT * 0.15),
    P(WIDTH * 0.55, HEIGHT * 0.05),
    P(slot.x, slot.y),
  ],
  // 오른쪽 아래에서 크게 원을 그리며 올라온다.
  rightLoop: (slot) => [
    P(WIDTH + 40, HEIGHT * 0.55),
    P(WIDTH * 0.85, HEIGHT * 0.15),
    P(WIDTH * 0.45, HEIGHT * 0.05),
    P(slot.x, slot.y),
  ],
  // 위에서 S자로 흔들리며 내려온다.
  topDive: (slot) => [
    P(slot.x, -60),
    P(slot.x - 120, 60),
    P(slot.x + 120, 140),
    P(slot.x, slot.y),
  ],
};

/**
 * 급강하 경로. 대형의 자기 자리(from)에서 출발해 플레이어 쪽으로 휘며 화면 아래로 빠진다.
 */
export function divePath(from, playerX) {
  return [
    P(from.x, from.y),
    P(from.x + (playerX - from.x) * 0.2, from.y + 140), // 살짝 플레이어 쪽으로
    P(playerX, HEIGHT * 0.7),                            // 플레이어 바로 위를 지난다
    P(playerX + (playerX - from.x) * 0.3, HEIGHT + 40),  // 관성을 유지하며 이탈
  ];
}

/** 경로를 duration초에 걸쳐 따라간다. */
export function createPathFollower(points, duration) {
  let elapsed = 0;

  return {
    update(dt) { elapsed = Math.min(elapsed + dt, duration); },
    position() {
      const t = duration === 0 ? 1 : elapsed / duration;
      return cubicBezier(points[0], points[1], points[2], points[3], t);
    },
    get done() { return elapsed >= duration; },
    get progress() { return duration === 0 ? 1 : elapsed / duration; },
  };
}
