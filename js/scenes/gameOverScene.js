import { WIDTH, HEIGHT } from '../config.js';
import { createStarfield } from '../gfx/starfield.js';

export function createGameOverScene(game, { score = 0, cleared = false } = {}) {
  const stars = createStarfield();
  const ranked = game.highScores.save(score);
  const isNewBest = ranked[0] === score && score > 0;

  return {
    update(dt) {
      stars.update(dt);
      if (game.input.wasPressed('Space')) game.changeScene('title');
    },
    render(ctx) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      stars.render(ctx);

      ctx.textAlign = 'center';
      ctx.fillStyle = cleared ? '#7dff6b' : '#e94040';
      ctx.font = 'bold 32px monospace';
      ctx.fillText(cleared ? 'STAGE CLEAR!' : 'GAME OVER', WIDTH / 2, 220);

      ctx.fillStyle = '#fff';
      ctx.font = '16px monospace';
      ctx.fillText(`SCORE  ${String(score).padStart(6, '0')}`, WIDTH / 2, 290);

      if (isNewBest) {
        ctx.fillStyle = '#ffd24a';
        ctx.fillText('★ 신기록! ★', WIDTH / 2, 325);
      }

      ctx.fillStyle = '#8080a0';
      ctx.font = '12px monospace';
      ctx.fillText('SPACE 키로 타이틀로', WIDTH / 2, 400);
      ctx.textAlign = 'left';
    },
  };
}
