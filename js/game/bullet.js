const MARGIN = 20; // 화면 밖 여유 — 이만큼 벗어나야 회수한다.

/**
 * 탄 오브젝트 풀. 죽은 슬롯을 재사용해 GC 스파이크를 막는다.
 * items에는 죽은 탄도 들어 있다 — 순회하는 쪽이 alive를 확인해야 한다.
 */
export function createBulletPool(size = 64) {
  const items = Array.from({ length: size }, () => ({
    x: 0, y: 0, vx: 0, vy: 0, w: 0, h: 0, sprite: null, alive: false,
  }));

  function spawn({ x, y, vx = 0, vy, w, h, sprite }) {
    const bullet = items.find((b) => !b.alive);
    if (!bullet) return null; // 풀이 꽉 참 — 조용히 무시한다.
    Object.assign(bullet, { x, y, vx, vy, w, h, sprite, alive: true });
    return bullet;
  }

  function update(dt, { width, height }) {
    for (const b of items) {
      if (!b.alive) continue;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      const outside = b.y < -MARGIN || b.y > height + MARGIN
        || b.x < -MARGIN || b.x > width + MARGIN;
      if (outside) b.alive = false;
    }
  }

  return {
    items,
    spawn,
    update,
    aliveCount: () => items.filter((b) => b.alive).length,
  };
}
