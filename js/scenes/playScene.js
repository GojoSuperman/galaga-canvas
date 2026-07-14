import { WIDTH, HEIGHT } from '../config.js';
import { createStarfield } from '../gfx/starfield.js';
import { createBulletPool } from '../game/bullet.js';
import { createPlayer } from '../game/player.js';

export function createPlayScene(game) {
  const stars = createStarfield();
  const playerBullets = createBulletPool(48);
  const player = createPlayer(game, playerBullets);

  return {
    update(dt) {
      stars.update(dt);
      player.update(dt, game.input);
      playerBullets.update(dt, { width: WIDTH, height: HEIGHT });
    },
    render(ctx) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      stars.render(ctx);

      for (const b of playerBullets.items) {
        if (!b.alive) continue;
        ctx.drawImage(game.sprites.get(b.sprite), Math.round(b.x), Math.round(b.y));
      }
      player.render(ctx);
    },
  };
}
