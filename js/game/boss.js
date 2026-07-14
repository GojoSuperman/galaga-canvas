import { WIDTH } from '../config.js';
import { spreadShot, aimedShot } from './shooting.js';


export const BOSS_W = 48; // 16px × scale 3
export const BOSS_H = 36; // 12px × scale 3
export const BOSS_Y = 60;

/** 보스 티어별 능력치. 1 = 중간 보스(5스테이지), 2 = 최종 보스(10스테이지). */
export const BOSS_TIERS = {
  1: {
    maxHp: 120, speedScale: 1.0, bulletSpeedScale: 1.0, spreadBonus: 0,
  },
  2: {
    maxHp: 220, speedScale: 1.35, bulletSpeedScale: 1.25, spreadBonus: 2,
  },
};

/** 페이즈별 행동 설정(티어 1 기준). 뒤로 갈수록 빨라지고 거세진다. */
export const BOSS_PHASE_CONFIG = {
  1: {
    moveSpeed: 60, shootInterval: 1.6, spreadCount: 5, bulletSpeed: 200, summon: false, aimed: false,
  },
  2: {
    moveSpeed: 90, shootInterval: 1.3, spreadCount: 5, bulletSpeed: 220, summon: true, aimed: false,
  },
  3: {
    moveSpeed: 140, shootInterval: 0.7, spreadCount: 7, bulletSpeed: 260, summon: true, aimed: true,
  },
};

export const SUMMON_INTERVAL = 6; // 초 — 졸개 소환 간격

/** HP 비율(0~1)로 페이즈를 정한다. 티어와 무관하게 항상 비율 기준이다. */
export function bossPhase(hpRatio) {
  if (hpRatio > 0.66) return 1;
  if (hpRatio > 0.33) return 2;
  return 3;
}

/** 페이즈 기본 설정에 티어의 스케일을 적용한다. */
function phaseConfig(phase, tier) {
  const base = BOSS_PHASE_CONFIG[phase];
  const scale = BOSS_TIERS[tier];
  return {
    ...base,
    moveSpeed: base.moveSpeed * scale.speedScale,
    bulletSpeed: base.bulletSpeed * scale.bulletSpeedScale,
    spreadCount: base.spreadCount + scale.spreadBonus,
  };
}

/** 보스 생성. tier=1(중간 보스, 기본값) | 2(최종 보스). */
export function createBoss(game, enemyBullets, tier = 1) {
  const maxHp = BOSS_TIERS[tier].maxHp;
  const label = tier === 2 ? 'FINAL BOSS' : 'BOSS';

  const boss = {
    x: WIDTH / 2 - BOSS_W / 2,
    y: BOSS_Y,
    w: BOSS_W,
    h: BOSS_H,
    tier,
    maxHp,
    hp: maxHp,
    alive: true,
    phase: 1,
    direction: 1,       // 1 = 오른쪽, -1 = 왼쪽
    shootTimer: 1.5,    // 등장 직후 잠깐의 유예
    summonTimer: SUMMON_INTERVAL,
    hitFlash: 0,        // 피격 시 흰색 점멸
    wantsSummon: false, // playScene이 읽고 졸개를 소환한 뒤 false로 되돌린다

    get hpRatio() { return this.hp / this.maxHp; },

    update(dt, playerX, playerY = 580) {
      if (!this.alive) return;
      this.phase = bossPhase(this.hpRatio);
      const config = phaseConfig(this.phase, this.tier);

      this.hitFlash = Math.max(0, this.hitFlash - dt);

      // 좌우 왕복 이동 — 벽에 닿으면 방향을 뒤집는다.
      this.x += config.moveSpeed * this.direction * dt;
      if (this.x <= 0) { this.x = 0; this.direction = 1; }
      if (this.x + this.w >= WIDTH) { this.x = WIDTH - this.w; this.direction = -1; }

      // 사격
      this.shootTimer -= dt;
      if (this.shootTimer <= 0) {
        this.shootTimer = config.shootInterval;
        this.shoot(config, playerX, playerY);
      }

      // 졸개 소환 (2페이즈부터)
      if (config.summon) {
        this.summonTimer -= dt;
        if (this.summonTimer <= 0) {
          this.summonTimer = SUMMON_INTERVAL;
          this.wantsSummon = true; // 실제 소환은 playScene이 한다
        }
      }
    },

    shoot(config, playerX, playerY) {
      const originX = this.x + this.w / 2;
      const originY = this.y + this.h;

      for (const { vx, vy } of spreadShot(originX, originY, config.spreadCount, config.bulletSpeed)) {
        enemyBullets.spawn({
          x: originX - 1.5, y: originY, vx, vy, w: 3, h: 12, sprite: 'enemyShot',
        });
      }

      if (config.aimed) {
        const { vx, vy } = aimedShot(originX, originY, playerX, playerY, config.bulletSpeed);
        enemyBullets.spawn({
          x: originX - 1.5, y: originY, vx, vy, w: 3, h: 12, sprite: 'enemyShot',
        });
      }

      game.audio?.play('bossShoot');
    },

    /** 피격. 죽었으면 true. */
    hit(damage = 1) {
      this.hp -= damage;
      this.hitFlash = 0.08;
      if (this.hp > 0) {
        game.audio?.play('bossHit');
        return false;
      }
      this.hp = 0;
      this.alive = false;
      return true;
    },

    render(ctx) {
      if (!this.alive) return;

      const sprite = game.sprites.get('boss');
      ctx.drawImage(sprite, Math.round(this.x), Math.round(this.y));

      // 피격 점멸 — 스프라이트 위에 흰색을 덧씌운다.
      if (this.hitFlash > 0) {
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = '#fff';
        ctx.fillRect(Math.round(this.x), Math.round(this.y), this.w, this.h);
        ctx.globalAlpha = 1;
      }

      this.renderHpBar(ctx);
    },

    renderHpBar(ctx) {
      const barW = WIDTH - 80;
      const barH = 8;
      const barX = 40;
      const barY = 24;

      ctx.fillStyle = '#3a1020';
      ctx.fillRect(barX, barY, barW, barH);

      // 페이즈가 오를수록 게이지 색이 붉어진다.
      const colors = { 1: '#7dff6b', 2: '#ffd24a', 3: '#e94040' };
      ctx.fillStyle = colors[this.phase];
      ctx.fillRect(barX, barY, barW * this.hpRatio, barH);

      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.strokeRect(barX + 0.5, barY + 0.5, barW - 1, barH - 1);

      ctx.fillStyle = '#fff';
      ctx.font = '10px monospace';
      ctx.fillText(`${label}  PHASE ${this.phase}`, barX, barY - 4);
    },
  };

  return boss;
}
