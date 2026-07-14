import { createPathFollower, ENTRY_PATHS, divePath } from './paths.js';
import { SLOT_W, SLOT_H } from './formation.js';

export const ENEMY_STATE = {
  ENTERING: 'ENTERING',
  IN_FORMATION: 'IN_FORMATION',
  DIVING: 'DIVING',
  RETURNING: 'RETURNING',
};

// 적 종류별 능력치. 스프라이트는 5×5px × scale 3 = 15px.
export const ENEMY_TYPES = {
  bee: { hp: 1, sprite: 'bee', w: 15, h: 15 },
  butterfly: { hp: 1, sprite: 'butterfly', w: 15, h: 15 },
  captain: { hp: 2, sprite: 'captain', w: 15, h: 15 },
};

const RETURN_DURATION = 2.5; // 초 — 화면 위에서 슬롯까지 복귀하는 시간

/** 슬롯 좌상단 좌표 → 슬롯 안에서 스프라이트를 가운데 정렬한 좌표. */
function centerInSlot(slot, w, h) {
  return {
    x: slot.x + (SLOT_W - w) / 2,
    y: slot.y + (SLOT_H - h) / 2,
  };
}

export function createEnemy({ type, col, row, entryPath, entryDuration = 2.5, formation, game }) {
  const spec = ENEMY_TYPES[type];
  if (!spec) throw new Error(`알 수 없는 적 타입입니다: ${type}`);

  const target = centerInSlot(formation.slotAt(col, row), spec.w, spec.h);
  const buildEntry = ENTRY_PATHS[entryPath];
  if (!buildEntry) throw new Error(`알 수 없는 진입 경로입니다: ${entryPath}`);

  const enemy = {
    type,
    col,
    row,
    w: spec.w,
    h: spec.h,
    hp: spec.hp,
    alive: true,
    state: ENEMY_STATE.ENTERING,
    x: target.x,
    y: target.y,
    follower: createPathFollower(buildEntry(target), entryDuration),
    shootTimer: 0, // 급강하 중 사격 쿨다운 (playScene이 관리)

    /** 대형에 있는 적만 급강하할 수 있다. */
    startDive(playerX, duration = 2.5) {
      if (this.state !== ENEMY_STATE.IN_FORMATION) return;
      this.state = ENEMY_STATE.DIVING;
      this.follower = createPathFollower(divePath({ x: this.x, y: this.y }, playerX), duration);
      this.shootTimer = 0.4; // 급강하 시작 직후 첫 발
    },

    update(dt) {
      switch (this.state) {
        case ENEMY_STATE.ENTERING: {
          this.follower.update(dt);
          const pos = this.follower.position();
          this.x = pos.x;
          this.y = pos.y;
          if (this.follower.done) this.state = ENEMY_STATE.IN_FORMATION;
          break;
        }

        case ENEMY_STATE.IN_FORMATION: {
          // 대형 전체의 흔들림을 따라간다. 슬롯 안에서 스프라이트를 가운데 정렬한다.
          const slotTarget = centerInSlot(formation.slotAt(this.col, this.row), this.w, this.h);
          this.x = slotTarget.x;
          this.y = slotTarget.y;
          break;
        }

        case ENEMY_STATE.DIVING: {
          this.follower.update(dt);
          const pos = this.follower.position();
          this.x = pos.x;
          this.y = pos.y;
          this.shootTimer = Math.max(0, this.shootTimer - dt);
          if (this.follower.done) this.startReturn();
          break;
        }

        case ENEMY_STATE.RETURNING: {
          this.follower.update(dt);
          const pos = this.follower.position();
          this.x = pos.x;
          this.y = pos.y;
          if (this.follower.done) this.state = ENEMY_STATE.IN_FORMATION;
          break;
        }
      }
    },

    /** 화면 아래로 빠진 뒤 위에서 재진입해 슬롯으로 돌아온다. */
    startReturn() {
      this.state = ENEMY_STATE.RETURNING;
      const slotTarget = centerInSlot(formation.slotAt(this.col, this.row), this.w, this.h);
      const entryX = slotTarget.x;
      this.follower = createPathFollower([
        { x: entryX, y: -50 },
        { x: entryX - 60, y: 40 },
        { x: entryX + 40, y: slotTarget.y - 60 },
        { x: slotTarget.x, y: slotTarget.y },
      ], RETURN_DURATION);
      this.x = entryX;
      this.y = -50;
    },

    /** 피격. 죽었으면 true. */
    hit(damage = 1) {
      this.hp -= damage;
      if (this.hp > 0) return false;
      this.alive = false;
      return true;
    },

    render(ctx) {
      if (!this.alive) return;
      ctx.drawImage(game.sprites.get(spec.sprite), Math.round(this.x), Math.round(this.y));
    },
  };

  return enemy;
}
