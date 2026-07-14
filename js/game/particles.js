const MIN_LIFE = 0.25;
const MAX_LIFE = 0.6;
const SPEED = 140; // px/s

/** 폭발 파티클 풀. 사방으로 튀며 서서히 사라진다. */
export function createParticlePool(size = 120) {
  const items = Array.from({ length: size }, () => ({
    x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 1, color: '#fff', alive: false,
  }));

  function burst(x, y, color, count = 10) {
    let spawned = 0;
    for (const p of items) {
      if (spawned >= count) break;
      if (p.alive) continue;
      const angle = Math.random() * Math.PI * 2;
      const speed = SPEED * (0.4 + Math.random() * 0.6);
      const maxLife = MIN_LIFE + Math.random() * (MAX_LIFE - MIN_LIFE);
      Object.assign(p, {
        x, y, color, alive: true, maxLife, life: maxLife,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
      });
      spawned += 1;
    }
    // 풀이 모자라면 있는 만큼만 켠다 — 예외를 던지지 않는다.
  }

  function update(dt) {
    for (const p of items) {
      if (!p.alive) continue;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) p.alive = false;
    }
  }

  function render(ctx) {
    for (const p of items) {
      if (!p.alive) continue;
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife); // 서서히 투명해진다
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), 3, 3);
    }
    ctx.globalAlpha = 1;
  }

  return {
    items,
    burst,
    update,
    render,
    aliveCount: () => items.filter((p) => p.alive).length,
  };
}
