import { WIDTH, HEIGHT } from '../config.js';
import { BUFF_DURATION } from '../game/player.js';

const LIFE_ICON_W = 15;
const LIFE_ICON_GAP = 4;

export function createHud(game) {
  return {
    render(ctx, { score, lives, stageNumber, playerState }) {
      ctx.font = '12px monospace';
      ctx.textAlign = 'left';

      // 좌상단 — 점수
      ctx.fillStyle = '#fff';
      ctx.fillText('SCORE', 10, 16);
      ctx.fillStyle = '#ffd24a';
      ctx.fillText(String(score).padStart(6, '0'), 10, 32);

      // 우상단 — 최고 점수
      ctx.textAlign = 'right';
      ctx.fillStyle = '#fff';
      ctx.fillText('HI-SCORE', WIDTH - 10, 16);
      ctx.fillStyle = '#5ce1e6';
      ctx.fillText(String(Math.max(game.highScores.best(), score)).padStart(6, '0'), WIDTH - 10, 32);

      // 우하단 — 스테이지 + 무기 레벨
      ctx.textAlign = 'right';
      ctx.fillStyle = '#fff';
      ctx.fillText(`STAGE ${stageNumber}`, WIDTH - 10, HEIGHT - 26);
      ctx.fillStyle = '#ffd24a';
      ctx.fillText(`WEAPON Lv.${playerState.weaponLevel}`, WIDTH - 10, HEIGHT - 10);

      // 좌하단 — 남은 목숨 (미니 기체 아이콘)
      ctx.textAlign = 'left';
      const shipSprite = game.sprites.get('player');
      for (let i = 0; i < lives; i += 1) {
        ctx.drawImage(shipSprite, 10 + i * (LIFE_ICON_W + LIFE_ICON_GAP), HEIGHT - 26);
      }

      this.renderBuffs(ctx, playerState);
    },

    /** 활성 버프의 남은 시간을 게이지 바로 보여준다. */
    renderBuffs(ctx, state) {
      const buffs = [];
      if (state.shield) buffs.push({ label: 'S', ratio: 1, color: '#5ce1e6' });
      if (state.rapidTimer > 0) {
        buffs.push({ label: 'R', ratio: state.rapidTimer / BUFF_DURATION, color: '#ff7ad9' });
      }
      if (state.speedTimer > 0) {
        buffs.push({ label: 'P', ratio: state.speedTimer / BUFF_DURATION, color: '#7dff6b' });
      }

      const barW = 40;
      const barH = 5;
      let x = 10;
      const y = HEIGHT - 42;

      for (const buff of buffs) {
        ctx.fillStyle = '#333';
        ctx.fillRect(x, y, barW, barH);
        ctx.fillStyle = buff.color;
        ctx.fillRect(x, y, barW * buff.ratio, barH);
        ctx.font = '9px monospace';
        ctx.fillText(buff.label, x + barW + 3, y + barH);
        x += barW + 16;
      }
    },
  };
}
