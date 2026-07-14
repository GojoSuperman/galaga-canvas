import { WIDTH, HEIGHT } from '../config.js';
import { createStarfield } from '../gfx/starfield.js';

export function createPlayScene(game) {
  const stars = createStarfield();

  return {
    update(dt) {
      stars.update(dt);
      // 임시: Space로 게임오버 화면 확인 — Task 13에서 실제 게임 로직으로 대체된다.
      if (game.input.wasPressed('Space')) {
        game.changeScene('gameover', { score: 0, cleared: false });
      }
    },
    render(ctx) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      stars.render(ctx);
      ctx.fillStyle = '#fff';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PLAY (구현 예정)', WIDTH / 2, HEIGHT / 2);
      ctx.textAlign = 'left';
    },
  };
}
