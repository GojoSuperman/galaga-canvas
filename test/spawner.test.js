import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSpawner } from '../js/game/spawner.js';
import { createFormation } from '../js/game/formation.js';
import { ENEMY_STATE } from '../js/game/enemy.js';

const fakeGame = { audio: { play() {} }, sprites: { get: () => null } };

const stage = {
  waves: [
    { type: 'bee', entryPath: 'leftLoop', row: 0, cols: [0, 1], delay: 0 },
    { type: 'butterfly', entryPath: 'rightLoop', row: 1, cols: [2], delay: 1 },
  ],
  diveInterval: 2, diveCount: 1, diveDuration: 2.5,
  enemyBulletSpeed: 180, enemyShootInterval: 0.8, dropRate: 0.1, isBoss: false,
};

function makeSpawner() {
  return createSpawner(stage, { formation: createFormation(), game: fakeGame });
}

test('delay가 0인 웨이브는 즉시 투입된다', () => {
  const spawner = makeSpawner();
  spawner.update(0);
  assert.equal(spawner.enemies.length, 2); // bee × 2
});

test('delay가 지나야 다음 웨이브가 나온다', () => {
  const spawner = makeSpawner();
  spawner.update(0);
  assert.equal(spawner.enemies.length, 2);
  spawner.update(0.5);
  assert.equal(spawner.enemies.length, 2, '아직 1초가 안 지났다');
  spawner.update(0.6);
  assert.equal(spawner.enemies.length, 3);
});

test('모든 웨이브를 내보내면 done이 된다', () => {
  const spawner = makeSpawner();
  assert.equal(spawner.done, false);
  spawner.update(0);
  spawner.update(1.1);
  assert.equal(spawner.done, true);
});

test('생성된 적은 웨이브에 지정된 타입과 슬롯을 갖는다', () => {
  const spawner = makeSpawner();
  spawner.update(0);
  const [first, second] = spawner.enemies;
  assert.equal(first.type, 'bee');
  assert.equal(first.row, 0);
  assert.equal(first.col, 0);
  assert.equal(second.col, 1);
  assert.equal(first.state, ENEMY_STATE.ENTERING);
});
