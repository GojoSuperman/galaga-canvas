import { ENEMY_TYPES } from './enemy.js';

const SPREAD_ARC = Math.PI / 3; // 확산탄이 퍼지는 각도(60°)

/** 부채꼴 확산탄의 속도 벡터들. 아래(+y)를 중심으로 좌우 대칭. */
export function spreadShot(originX, originY, count, speed) {
  const shots = [];
  const step = count > 1 ? SPREAD_ARC / (count - 1) : 0;
  const start = -SPREAD_ARC / 2;
  for (let i = 0; i < count; i += 1) {
    const angle = start + step * i; // 0이 정중앙(수직 아래)
    shots.push({
      vx: Math.sin(angle) * speed,
      vy: Math.cos(angle) * speed,
    });
  }
  return shots;
}

/** 목표 지점을 향하는 조준탄 속도 벡터. */
export function aimedShot(originX, originY, targetX, targetY, speed) {
  const dx = targetX - originX;
  const dy = targetY - originY;
  const dist = Math.hypot(dx, dy) || 1; // 0으로 나누기 방지
  return { vx: (dx / dist) * speed, vy: (dy / dist) * speed };
}

/**
 * 적 한 기가 쏘는 탄의 속도 벡터.
 * 조준 능력이 있는 적(elite)은 플레이어를 향해 쏘고, 나머지는 아래로 곧장 쏜다.
 * target이 null이면(플레이어 사망) 조준하지 않고 아래로 쏜다 — 죽은 위치를 향해 쏘면 안 된다.
 */
export function enemyShotVelocity(enemyType, origin, target, speed) {
  const canAim = ENEMY_TYPES[enemyType]?.aimed === true;
  if (!canAim || !target) return { vx: 0, vy: speed };
  return aimedShot(origin.x, origin.y, target.x, target.y, speed);
}
