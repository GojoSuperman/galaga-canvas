export const POWERUP_TYPES = ['weapon', 'shield', 'rapid', 'speed'];
export const POWERUP_FALL_SPEED = 90; // px/s
const POWERUP_SIZE = 18;              // 6px 스프라이트 × scale 3

/**
 * 드롭 판정. 확률에 걸리면 타입 하나를 균등하게 고른다.
 * random을 주입받아 테스트할 수 있게 한다.
 */
export function rollDrop(dropRate, random = Math.random) {
  if (random() >= dropRate) return null;
  return POWERUP_TYPES[Math.floor(random() * POWERUP_TYPES.length)];
}

export function createPowerupPool(size = 8) {
  const items = Array.from({ length: size }, () => ({
    x: 0, y: 0, w: POWERUP_SIZE, h: POWERUP_SIZE, type: null, alive: false,
  }));

  function spawn(x, y, type) {
    const item = items.find((p) => !p.alive);
    if (!item) return null;
    Object.assign(item, { x, y, type, alive: true });
    return item;
  }

  function update(dt, height) {
    for (const p of items) {
      if (!p.alive) continue;
      p.y += POWERUP_FALL_SPEED * dt;
      if (p.y > height) p.alive = false; // 놓치면 사라진다
    }
  }

  function render(ctx, sprites) {
    for (const p of items) {
      if (!p.alive) continue;
      ctx.drawImage(sprites.get(`powerup_${p.type}`), Math.round(p.x), Math.round(p.y));
    }
  }

  return { items, spawn, update, render };
}
