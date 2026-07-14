import { WIDTH, HEIGHT } from '../config.js';
import { createStarfield } from '../gfx/starfield.js';

export function createTitleScene(game) {
  const stars = createStarfield();

  return {
    update(dt) {
      stars.update(dt);
      if (game.input.wasPressed('Space')) game.changeScene('play');
    },
    render(ctx) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      stars.render(ctx);

      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd24a';
      ctx.font = 'bold 48px monospace';
      ctx.fillText('GALAGA', WIDTH / 2, 200);

      ctx.fillStyle = '#fff';
      ctx.font = '14px monospace';
      ctx.fillText('SPACE 키로 시작', WIDTH / 2, 300);

      ctx.fillStyle = '#8080a0';
      ctx.font = '12px monospace';
      ctx.fillText('← → 이동   SPACE 발사   P 일시정지   M 음소거', WIDTH / 2, 340);

      const scores = game.highScores.load();
      ctx.fillStyle = '#5ce1e6';
      ctx.fillText('- HIGH SCORES -', WIDTH / 2, 420);
      ctx.fillStyle = '#fff';
      scores.forEach((score, i) => {
        ctx.fillText(`${i + 1}.  ${String(score).padStart(6, '0')}`, WIDTH / 2, 450 + i * 22);
      });
      if (scores.length === 0) ctx.fillText('아직 기록이 없습니다', WIDTH / 2, 450);

      ctx.textAlign = 'left';
    },
  };
}
