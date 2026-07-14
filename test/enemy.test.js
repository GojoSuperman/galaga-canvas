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
