import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createPlayerState, applyPowerup, tickBuffs, onPlayerHit, shotOffsets,
  createPlayer,
  MAX_WEAPON_LEVEL, BUFF_DURATION,
} from '../js/game/player.js';
import { WIDTH } from '../js/config.js';

/** input의 최소 껍데기 — isDown은 항상 false, dragDelta만 지정값을 갖는다. */
function fakeInput({ dragDelta = 0 } = {}) {
  return { isDown: () => false, dragDelta };
}

function fakeGame() {
  return { audio: null, sprites: { get: () => ({}) } };
}

test('초기 상태는 무기 1레벨, 실드 없음, 버프 없음', () => {
  assert.deepEqual(createPlayerState(), {
    weaponLevel: 1, shield: false, rapidTimer: 0, speedTimer: 0,
  });
});

test('weapon 파워업은 무기 레벨을 올린다', () => {
  const s = applyPowerup(createPlayerState(), 'weapon');
  assert.equal(s.weaponLevel, 2);
});

test('무기 레벨은 최대치를 넘지 않는다', () => {
  let s = createPlayerState();
  for (let i = 0; i < 10; i += 1) s = applyPowerup(s, 'weapon');
  assert.equal(s.weaponLevel, MAX_WEAPON_LEVEL);
});

test('shield 파워업은 실드를 켠다', () => {
  assert.equal(applyPowerup(createPlayerState(), 'shield').shield, true);
});

test('rapid / speed 파워업은 타이머를 지속시간으로 채운다', () => {
  const s = applyPowerup(applyPowerup(createPlayerState(), 'rapid'), 'speed');
  assert.equal(s.rapidTimer, BUFF_DURATION);
  assert.equal(s.speedTimer, BUFF_DURATION);
});

test('같은 버프를 다시 먹으면 타이머가 갱신된다 (누적되지 않는다)', () => {
  let s = applyPowerup(createPlayerState(), 'rapid');
  s = tickBuffs(s, 6);              // 4초 남음
  s = applyPowerup(s, 'rapid');     // 다시 획득
  assert.equal(s.rapidTimer, BUFF_DURATION);
});

test('applyPowerup은 원본 상태를 바꾸지 않는다', () => {
  const original = createPlayerState();
  applyPowerup(original, 'weapon');
  assert.equal(original.weaponLevel, 1);
});

test('tickBuffs는 타이머를 줄이고 0 아래로 내리지 않는다', () => {
  let s = applyPowerup(createPlayerState(), 'rapid');
  s = tickBuffs(s, 3);
  assert.equal(s.rapidTimer, BUFF_DURATION - 3);
  s = tickBuffs(s, 100);
  assert.equal(s.rapidTimer, 0);
});

test('실드가 있으면 피격을 막고 죽지 않는다', () => {
  const shielded = applyPowerup(createPlayerState(), 'shield');
  const { state, died } = onPlayerHit(shielded);
  assert.equal(died, false);
  assert.equal(state.shield, false);      // 실드는 1회 소모
  assert.equal(state.weaponLevel, 1);     // 무기 레벨은 그대로
});

test('실드가 없으면 죽고 무기 레벨이 1 내려간다', () => {
  let s = applyPowerup(applyPowerup(createPlayerState(), 'weapon'), 'weapon'); // 3레벨
  const { state, died } = onPlayerHit(s);
  assert.equal(died, true);
  assert.equal(state.weaponLevel, 2);
});

test('무기 레벨은 사망해도 1 아래로 내려가지 않는다', () => {
  const { state } = onPlayerHit(createPlayerState());
  assert.equal(state.weaponLevel, 1);
});

test('사망하면 시한 버프가 전부 해제된다', () => {
  let s = applyPowerup(applyPowerup(createPlayerState(), 'rapid'), 'speed');
  const { state } = onPlayerHit(s);
  assert.equal(state.rapidTimer, 0);
  assert.equal(state.speedTimer, 0);
});

test('무기 레벨별 발사 수: 1발 / 2발 / 3발', () => {
  assert.equal(shotOffsets(1).length, 1);
  assert.equal(shotOffsets(2).length, 2);
  assert.equal(shotOffsets(3).length, 3);
});

test('1레벨은 정중앙으로 수직 발사', () => {
  const [shot] = shotOffsets(1);
  assert.equal(shot.dx, 0);
  assert.equal(shot.vx, 0);
});

test('3레벨은 좌우로 퍼지는 탄이 있다', () => {
  const shots = shotOffsets(3);
  assert.ok(shots.some((s) => s.vx < 0), '왼쪽으로 퍼지는 탄이 있어야 한다');
  assert.ok(shots.some((s) => s.vx > 0), '오른쪽으로 퍼지는 탄이 있어야 한다');
  assert.ok(shots.some((s) => s.vx === 0), '가운데 수직 탄이 있어야 한다');
});

// ── 터치 드래그 이동 ─────────────────────────────────────────────

test('dragDelta만큼 플레이어가 이동한다', () => {
  const player = createPlayer(fakeGame(), { spawn() {} });
  const startX = player.x;
  player.update(1 / 60, fakeInput({ dragDelta: 20 }));
  assert.equal(player.x, startX + 20);
});

test('음수 dragDelta는 왼쪽으로 이동시킨다', () => {
  const player = createPlayer(fakeGame(), { spawn() {} });
  const startX = player.x;
  player.update(1 / 60, fakeInput({ dragDelta: -20 }));
  assert.equal(player.x, startX - 20);
});

test('큰 dragDelta로도 화면 밖으로 나가지 않는다 (클램프)', () => {
  const player = createPlayer(fakeGame(), { spawn() {} });
  player.update(1 / 60, fakeInput({ dragDelta: 100000 }));
  assert.equal(player.x, WIDTH - player.w);

  player.update(1 / 60, fakeInput({ dragDelta: -100000 }));
  assert.equal(player.x, 0);
});
