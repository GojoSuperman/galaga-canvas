import { createPathFollower, ENTRY_PATHS, divePath } from './paths.js';
import { SLOT_W, SLOT_H, swayOffset } from './formation.js';

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
  // 엘리트 — 단단하고, 급강하 중 플레이어를 조준해서 쏜다.
  elite: {
    hp: 3, sprite: 'elite', w: 15, h: 15, aimed: true,
  },
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

  const entryFollower = createPathFollower(buildEntry(target), entryDuration);
  // 초기 위치는 슬롯이 아니라 진입 경로의 시작점이어야 한다.
  // (슬롯으로 잡으면 첫 프레임에 경로 시작점으로 순간이동하는 별개의 팝이 생긴다.)
  const startPos = entryFollower.position();

  /**
   * follower의 현재 위치에, 경로를 만든 시점 이후 대형이 흔들린 만큼(swayDelta) x를 보정해 적용한다.
   * (보정하지 않으면 진입/복귀가 끝나 대형에 합류하는 순간 수십 px 순간이동한다.)
   * ENTERING과 RETURNING 두 상태에서 동일하게 쓰인다.
   */
  function applySwayCorrectedPosition(target) {
    const pos = target.follower.position();
    const swayDelta = swayOffset(formation.time) - target.swayAtBuild;
    target.x = pos.x + swayDelta;
    target.y = pos.y;
  }

  const enemy = {
    type,
    col,
    row,
    w: spec.w,
    h: spec.h,
    hp: spec.hp,
    alive: true,
    state: ENEMY_STATE.ENTERING,
    x: startPos.x,
    y: startPos.y,
    follower: entryFollower,
    // 경로를 만든 시점의 흔들림 오프셋. 이후 흔들림과의 차이만큼 x를 보정한다.
    swayAtBuild: swayOffset(formation.time),
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
          applySwayCorrectedPosition(this);
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
          // shootTimer는 여기서 깎지 않는다 — playScene의 enemyShooting(dt)가 소유한다.
          // (여기서도 깎으면 두 배로 깎여 실제 사격 간격이 stage 데이터의 절반이 된다.)
          if (this.follower.done) this.startReturn();
          break;
        }

        case ENEMY_STATE.RETURNING: {
          this.follower.update(dt);
          applySwayCorrectedPosition(this);
          if (this.follower.done) this.state = ENEMY_STATE.IN_FORMATION;
          break;
        }
      }
    },

    /** 화면 아래로 빠진 뒤 위에서 재진입해 슬롯으로 돌아온다. */
    startReturn() {
      this.state = ENEMY_STATE.RETURNING;
      this.swayAtBuild = swayOffset(formation.time);
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
