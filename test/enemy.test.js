import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createEnemy, ENEMY_STATE, ENEMY_TYPES } from '../js/game/enemy.js';
import { createFormation, SLOT_W, SLOT_H } from '../js/game/formation.js';

/** 적 생성에 필요한 최소 게임 컨텍스트 (렌더·오디오는 쓰지 않는다) */
const fakeGame = { audio: { play() {} }, sprites: { get: () => null } };

/** 슬롯 좌상단 좌표 → 슬롯 안에서 스프라이트를 가운데 정렬한 좌표 (enemy.js의 centerInSlot과 동일한 계산). */
function centerInSlot(slot, w, h) {
  return {
    x: slot.x + (SLOT_W - w) / 2,
    y: slot.y + (SLOT_H - h) / 2,
  };
}

function makeEnemy(overrides = {}) {
  return createEnemy({
    type: 'bee',
    col: 3,
    row: 1,
    entryPath: 'leftLoop',
    entryDuration: 2,
    formation: createFormation(),
    game: fakeGame,
    ...overrides,
  });
}

test('적은 ENTERING 상태로 시작한다', () => {
  assert.equal(makeEnemy().state, ENEMY_STATE.ENTERING);
});

test('진입이 끝나면 IN_FORMATION으로 전이한다', () => {
  const enemy = makeEnemy({ entryDuration: 2 });
  enemy.update(1);
  assert.equal(enemy.state, ENEMY_STATE.ENTERING);
  enemy.update(1.1);
  assert.equal(enemy.state, ENEMY_STATE.IN_FORMATION);
});

test('진입이 끝나면 슬롯 중앙 좌표에 있다', () => {
  const formation = createFormation();
  const enemy = makeEnemy({ formation, col: 2, row: 1, entryDuration: 1 });
  enemy.update(1.5);
  const slot = formation.slotAt(2, 1);
  const expected = centerInSlot(slot, ENEMY_TYPES.bee.w, ENEMY_TYPES.bee.h);
  assert.ok(Math.abs(enemy.x - expected.x) < 1, `x가 슬롯 중앙과 다름: ${enemy.x} vs ${expected.x}`);
  assert.ok(Math.abs(enemy.y - expected.y) < 1, `y가 슬롯 중앙과 다름: ${enemy.y} vs ${expected.y}`);
});

test('대형에 있는 적은 슬롯을 따라 좌우로 흔들린다', () => {
  const formation = createFormation();
  const enemy = makeEnemy({ formation, entryDuration: 0.1 });
  enemy.update(0.2); // 대형 합류
  const x1 = enemy.x;
  formation.update(1); // 대형이 흔들린다
  enemy.update(0.016);
  assert.notEqual(enemy.x, x1, '대형이 흔들리면 적도 따라 움직여야 한다');
});

test('startDive는 DIVING으로 전이시킨다', () => {
  const enemy = makeEnemy({ entryDuration: 0.1 });
  enemy.update(0.2);
  enemy.startDive(240, 2.5);
  assert.equal(enemy.state, ENEMY_STATE.DIVING);
});

test('대형에 있지 않은 적은 급강하하지 않는다', () => {
  const enemy = makeEnemy(); // 아직 ENTERING
  enemy.startDive(240, 2.5);
  assert.equal(enemy.state, ENEMY_STATE.ENTERING);
});

test('급강하가 끝나면 RETURNING으로 전이한다', () => {
  const enemy = makeEnemy({ entryDuration: 0.1 });
  enemy.update(0.2);
  enemy.startDive(240, 2);
  enemy.update(2.1);
  assert.equal(enemy.state, ENEMY_STATE.RETURNING);
});

test('복귀가 끝나면 다시 IN_FORMATION이 된다', () => {
  const enemy = makeEnemy({ entryDuration: 0.1 });
  enemy.update(0.2);
  enemy.startDive(240, 1);
  enemy.update(1.1);   // 급강하 종료 → RETURNING
  enemy.update(3);     // 복귀 완료
  assert.equal(enemy.state, ENEMY_STATE.IN_FORMATION);
});

test('hp가 남으면 hit은 false, 0이 되면 true', () => {
  const enemy = makeEnemy({ type: 'captain' });
  const hp = ENEMY_TYPES.captain.hp;
  for (let i = 1; i < hp; i += 1) {
    assert.equal(enemy.hit(1), false, `${i}번째 피격에 죽으면 안 된다`);
  }
  assert.equal(enemy.hit(1), true);
  assert.equal(enemy.alive, false);
});

test('적 타입마다 체력이 다르다 (벌 1, 나비 1, 캡틴 2)', () => {
  assert.equal(ENEMY_TYPES.bee.hp, 1);
  assert.equal(ENEMY_TYPES.butterfly.hp, 1);
  assert.equal(ENEMY_TYPES.captain.hp, 2);
});

test('elite는 체력 3이고 조준탄 플래그를 가진다', () => {
  assert.equal(ENEMY_TYPES.elite.hp, 3);
  assert.equal(ENEMY_TYPES.elite.aimed, true);
});

test('elite는 3방 맞아야 죽는다', () => {
  const enemy = makeEnemy({ type: 'elite' });
  assert.equal(enemy.hit(1), false);
  assert.equal(enemy.hit(1), false);
  assert.equal(enemy.hit(1), true);
  assert.equal(enemy.alive, false);
});

test('일반 적은 조준탄을 쏘지 않는다', () => {
  assert.ok(!ENEMY_TYPES.bee.aimed);
  assert.ok(!ENEMY_TYPES.butterfly.aimed);
  assert.ok(!ENEMY_TYPES.captain.aimed);
});

test('진입 완료 시 대형에 튀지 않고 매끄럽게 합류한다', () => {
  const formation = createFormation();
  const enemy = makeEnemy({ formation, col: 3, row: 1, entryDuration: 2.5 });

  let prevX = enemy.x;
  let maxJump = 0;
  // 진입(2.5초) + 합류 직후까지 넉넉히 돌린다.
  for (let i = 0; i < 60 * 4; i += 1) {
    formation.update(1 / 60);
    enemy.update(1 / 60);
    maxJump = Math.max(maxJump, Math.abs(enemy.x - prevX));
    prevX = enemy.x;
  }
  assert.equal(enemy.state, ENEMY_STATE.IN_FORMATION);
  // 한 프레임에 5px 넘게 튀면 눈에 보이는 순간이동이다.
  assert.ok(maxJump < 5, `진입 합류에서 ${maxJump.toFixed(1)}px 순간이동 발생`);
});

test('적은 자기 사격 쿨다운을 직접 깎지 않는다 (playScene이 소유)', () => {
  const enemy = makeEnemy({ entryDuration: 0.1 });
  enemy.update(0.2);           // 대형 합류
  enemy.startDive(240, 2.5);
  const before = enemy.shootTimer;
  enemy.update(0.5);           // 적 자신의 update는 shootTimer를 건드리면 안 된다
  assert.equal(enemy.shootTimer, before,
    `enemy.update()가 shootTimer를 깎았다: ${before} → ${enemy.shootTimer}`);
});

test('복귀 완료 시 대형에 튀지 않고 매끄럽게 합류한다', () => {
  const formation = createFormation();
  const enemy = makeEnemy({ formation, col: 3, row: 1, entryDuration: 0.1 });

  // 먼저 대형에 합류시킨다.
  for (let i = 0; i < 20; i += 1) { formation.update(1 / 60); enemy.update(1 / 60); }
  assert.equal(enemy.state, ENEMY_STATE.IN_FORMATION);

  enemy.startDive(240, 2.0);

  let prevX = enemy.x;
  let maxJump = 0;
  let sawReturning = false;
  // 급강하(2초) + 복귀(2.5초)를 다 돌리고 대형 합류까지 본다.
  for (let i = 0; i < 60 * 6; i += 1) {
    formation.update(1 / 60);
    enemy.update(1 / 60);
    // 급강하 중에는 화면 밖으로 나갔다 위에서 재등장하므로 큰 이동이 정상이다.
    // DIVING→RETURNING으로 바뀌는 그 프레임 자체가 "화면 밖에서 재등장"하는 순간이라
    // (y가 화면 아래→위로 튀어 어차피 안 보인다) sawReturning을 그 프레임이 지난 "뒤"부터
    // true로 켜서, 재등장 프레임은 측정에서 제외하고 그 이후 대형 합류 과정만 잰다.
    if (sawReturning) {
      maxJump = Math.max(maxJump, Math.abs(enemy.x - prevX));
    }
    if (enemy.state === ENEMY_STATE.RETURNING) sawReturning = true;
    prevX = enemy.x;
  }
  assert.ok(sawReturning, 'RETURNING 상태를 거치지 않았다');
  assert.equal(enemy.state, ENEMY_STATE.IN_FORMATION);
  assert.ok(maxJump < 5, `복귀 합류에서 ${maxJump.toFixed(1)}px 순간이동 발생`);
});
