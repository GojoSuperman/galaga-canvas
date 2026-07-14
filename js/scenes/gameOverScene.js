import { WIDTH, HEIGHT } from '../config.js';
import { createStarfield } from '../gfx/starfield.js';

// 사망 직후 Space/Enter를 연타하다가 점수 확인도 못 하고 바로 타이틀로
// 튕겨나가는 것을 막기 위한 입력 잠금 시간(초). 이 시간 동안은 모든 입력을 무시한다.
const INPUT_LOCK_DURATION = 1;

export function createGameOverScene(game, { score = 0, cleared = false } = {}) {
  const stars = createStarfield();
  // 0점은 하이스코어 테이블에 남길 가치가 없다 — 그대로 저장하면 TOP 5가 000000으로 채워진다.
  const ranked = score > 0 ? game.highScores.save(score) : game.highScores.load();
  const isNewBest = score > 0 && ranked[0] === score;

  let lockTimer = INPUT_LOCK_DURATION;

  return {
    update(dt) {
      stars.update(dt);
      lockTimer = Math.max(0, lockTimer - dt);
      // 잠금 중에는 Enter를 연타해도 무시한다 — Space는 이 화면에서 아무 동작도 하지 않는다.
      if (lockTimer > 0) return;
      if (game.input.wasPressed('Enter')) game.changeScene('title');
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

      // 잠금 해제 전에는 프롬프트를 흐리게 표시해 "아직 못 누른다"는 상태를 알려준다.
      ctx.fillStyle = lockTimer > 0 ? '#404058' : '#8080a0';
      ctx.font = '12px monospace';
      ctx.fillText('ENTER 키(또는 탭)로 타이틀로', WIDTH / 2, 400);
      ctx.textAlign = 'left';
    },
  };
}
