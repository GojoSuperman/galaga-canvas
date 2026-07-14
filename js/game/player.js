import { WIDTH, HEIGHT } from '../config.js';

export const PLAYER_BASE_SPEED = 220;   // px/s
export const PLAYER_SHOT_COOLDOWN = 0.28; // 초
export const PLAYER_SHOT_SPEED = 480;   // px/s (위로)
export const MAX_WEAPON_LEVEL = 3;
export const BUFF_DURATION = 10;        // 초
export const RAPID_MULTIPLIER = 0.5;    // 연사 시 쿨다운 배율
export const SPEED_MULTIPLIER = 1.4;    // 속도 버프 시 이동속도 배율
export const RESPAWN_INVULN = 2;        // 초 — 부활 후 무적

const PLAYER_W = 15; // 스프라이트 5px × scale 3
const PLAYER_H = 18; // 6px × 3
const PLAYER_Y = HEIGHT - 60;

// ── 순수 상태 함수 ─────────────────────────────────────────────

export function createPlayerState() {
  return { weaponLevel: 1, shield: false, rapidTimer: 0, speedTimer: 0 };
}

/** 파워업 획득. 새 상태를 반환한다 (원본 불변). */
export function applyPowerup(state, type) {
  switch (type) {
    case 'weapon':
      return { ...state, weaponLevel: Math.min(state.weaponLevel + 1, MAX_WEAPON_LEVEL) };
    case 'shield':
      return { ...state, shield: true };
    case 'rapid':
      return { ...state, rapidTimer: BUFF_DURATION }; // 갱신 — 누적하지 않는다
    case 'speed':
      return { ...state, speedTimer: BUFF_DURATION };
    default:
      throw new Error(`알 수 없는 파워업입니다: ${type}`);
  }
}

/** 시한 버프 타이머를 dt만큼 줄인다. */
export function tickBuffs(state, dt) {
  return {
    ...state,
    rapidTimer: Math.max(0, state.rapidTimer - dt),
    speedTimer: Math.max(0, state.speedTimer - dt),
  };
}

/**
 * 피격 처리.
 * 실드가 있으면 실드만 깎고 살아남는다. 없으면 죽고 무기 레벨이 1 내려가며 버프가 사라진다.
 */
export function onPlayerHit(state) {
  if (state.shield) {
    return { state: { ...state, shield: false }, died: false };
  }
  return {
    state: {
      weaponLevel: Math.max(1, state.weaponLevel - 1),
      shield: false,
      rapidTimer: 0,
      speedTimer: 0,
    },
    died: true,
  };
}

/** 무기 레벨별 탄 발사 오프셋. dx는 기체 중심 기준 수평 위치, vx는 수평 속도. */
export function shotOffsets(weaponLevel) {
  switch (weaponLevel) {
    case 1: return [{ dx: 0, vx: 0 }];
    case 2: return [{ dx: -5, vx: 0 }, { dx: 5, vx: 0 }];
    default: return [{ dx: -6, vx: -120 }, { dx: 0, vx: 0 }, { dx: 6, vx: 120 }];
  }
}

// ── 엔티티 ────────────────────────────────────────────────────

export function createPlayer(game, bulletPool) {
  const player = {
    x: WIDTH / 2 - PLAYER_W / 2,
    y: PLAYER_Y,
    w: PLAYER_W,
    h: PLAYER_H,
    alive: true,
    state: createPlayerState(),
    invulnTimer: 0,
    cooldown: 0,
    elapsed: 0, // 무적 깜빡임용

    update(dt, input) {
      this.elapsed += dt;
      this.state = tickBuffs(this.state, dt);
      this.invulnTimer = Math.max(0, this.invulnTimer - dt);
      this.cooldown = Math.max(0, this.cooldown - dt);

      const speed = PLAYER_BASE_SPEED * (this.state.speedTimer > 0 ? SPEED_MULTIPLIER : 1);
      if (input.isDown('ArrowLeft')) this.x -= speed * dt;
      if (input.isDown('ArrowRight')) this.x += speed * dt;
      this.x = Math.max(0, Math.min(WIDTH - this.w, this.x)); // 화면 밖으로 못 나간다

      if (input.isDown('Space') && this.cooldown === 0) this.shoot();
    },

    shoot() {
      const cooldown = PLAYER_SHOT_COOLDOWN
        * (this.state.rapidTimer > 0 ? RAPID_MULTIPLIER : 1);
      this.cooldown = cooldown;

      const centerX = this.x + this.w / 2;
      for (const { dx, vx } of shotOffsets(this.state.weaponLevel)) {
        bulletPool.spawn({
          x: centerX + dx - 1.5,
          y: this.y - 8,
          vx,
          vy: -PLAYER_SHOT_SPEED,
          w: 3,
          h: 12,
          sprite: 'playerShot',
        });
      }
      game.audio?.play('shoot');
    },

    /** 피격. 죽었으면 true를 반환한다 (목숨 차감은 호출한 쪽이 한다). */
    hit() {
      if (this.invulnTimer > 0) return false;
      const { state, died } = onPlayerHit(this.state);
      this.state = state;
      if (died) {
        game.audio?.play('playerDeath');
        this.alive = false;
      } else {
        game.audio?.play('shieldBreak');
        this.invulnTimer = 0.5; // 실드가 깨진 직후 연속 피격 방지
      }
      return died;
    },

    respawn() {
      this.alive = true;
      this.x = WIDTH / 2 - PLAYER_W / 2;
      this.invulnTimer = RESPAWN_INVULN;
      this.cooldown = 0;
    },

    render(ctx) {
      if (!this.alive) return;
      // 무적 중에는 깜빡인다 (2초 동안 초당 10번).
      const blinking = this.invulnTimer > 0 && Math.floor(this.elapsed * 10) % 2 === 0;
      if (blinking) return;

      ctx.drawImage(game.sprites.get('player'), Math.round(this.x), Math.round(this.y));

      if (this.state.shield) {
        ctx.strokeStyle = '#5ce1e6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x + this.w / 2, this.y + this.h / 2, 16, 0, Math.PI * 2);
        ctx.stroke();
      }
    },
  };

  return player;
}
