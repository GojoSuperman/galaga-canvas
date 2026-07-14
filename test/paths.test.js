import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cubicBezier, ENTRY_PATHS, divePath, createPathFollower } from '../js/game/paths.js';
import { WIDTH, HEIGHT } from '../js/config.js';

const P = (x, y) => ({ x, y });

test('t=0이면 시작점, t=1이면 끝점', () => {
  const pts = [P(0, 0), P(10, 50), P(90, 50), P(100, 100)];
  assert.deepEqual(cubicBezier(...pts, 0), { x: 0, y: 0 });
  const end = cubicBezier(...pts, 1);
  assert.ok(Math.abs(end.x - 100) < 0.001);
  assert.ok(Math.abs(end.y - 100) < 0.001);
});

test('t=0.5는 시작점과 끝점 사이에 있다', () => {
  const mid = cubicBezier(P(0, 0), P(0, 100), P(100, 100), P(100, 0), 0.5);
  assert.ok(mid.x > 0 && mid.x < 100);
  assert.ok(mid.y > 0);
});

test('모든 진입 경로는 목표 슬롯에서 끝난다', () => {
  const slot = P(200, 150);
  for (const [name, build] of Object.entries(ENTRY_PATHS)) {
    const points = build(slot);
    const end = cubicBezier(...points, 1);
    assert.ok(Math.abs(end.x - slot.x) < 0.001, `${name}: x가 슬롯과 다름`);
    assert.ok(Math.abs(end.y - slot.y) < 0.001, `${name}: y가 슬롯과 다름`);
  }
});

test('진입 경로는 화면 밖에서 시작한다', () => {
  const slot = P(200, 150);
  for (const [name, build] of Object.entries(ENTRY_PATHS)) {
    const start = build(slot)[0];
    const outside = start.y < 0 || start.x < 0 || start.x > 480;
    assert.ok(outside, `${name}: 시작점이 화면 안에 있음 (${start.x}, ${start.y})`);
  }
});

test('급강하 경로는 화면 아래에서 끝난다', () => {
  const end = cubicBezier(...divePath(P(100, 100), 300), 1);
  assert.ok(end.y > HEIGHT, '급강하는 화면 아래로 빠져나가야 한다');
});

test('급강하 경로는 플레이어 쪽으로 휜다', () => {
  // 플레이어가 오른쪽 끝에 있으면 경로 중간이 시작점보다 오른쪽으로 가야 한다.
  const mid = cubicBezier(...divePath(P(100, 100), 460), 0.5);
  assert.ok(mid.x > 100, `플레이어(x=460) 쪽으로 휘지 않았다: ${mid.x}`);
});

test('경로 추종기는 duration에 걸쳐 끝점에 도달한다', () => {
  const follower = createPathFollower([P(0, 0), P(0, 50), P(100, 50), P(100, 100)], 2);
  assert.equal(follower.done, false);
  follower.update(1);
  assert.equal(follower.done, false);
  follower.update(1);
  assert.equal(follower.done, true);
  const pos = follower.position();
  assert.ok(Math.abs(pos.x - 100) < 0.001);
  assert.ok(Math.abs(pos.y - 100) < 0.001);
});

test('경로 추종기는 duration을 넘겨도 끝점을 유지한다', () => {
  const follower = createPathFollower([P(0, 0), P(0, 0), P(10, 10), P(10, 10)], 1);
  follower.update(99);
  assert.equal(follower.done, true);
  assert.ok(Math.abs(follower.position().x - 10) < 0.001);
});

test('나선 진입 경로는 화면 좌우를 크게 벗어나지 않는다', () => {
  const slot = P(200, 150);
  for (const name of ['spiralLeft', 'spiralRight']) {
    const points = ENTRY_PATHS[name](slot);
    for (let t = 0; t <= 1.0001; t += 0.05) {
      const { x, y } = cubicBezier(...points, Math.min(t, 1));
      // 시작점은 화면 밖이 정상이므로 t가 조금 지난 뒤부터 본다.
      if (t < 0.15) continue;
      assert.ok(x > -60 && x < 540, `${name} t=${t.toFixed(2)}: x=${x.toFixed(1)} 화면 밖`);
      assert.ok(y < 500, `${name} t=${t.toFixed(2)}: y=${y.toFixed(1)} 플레이어 영역까지 내려옴`);
    }
  }
});

test('급강하 경로는 극단적인 대각선에서도 화면 좌우를 벗어나지 않는다', () => {
  // 오른쪽 끝 대형 슬롯의 적이 왼쪽 끝 플레이어에게 급강하하는, 가장 기울어진 경우.
  // 예전에는 이 조합에서 곡선이 화면 왼쪽(x < 0)으로 빠져나갔다.
  const points = divePath(P(408, 230), 20);
  for (let t = 0; t <= 1.0001; t += 0.05) {
    const { x } = cubicBezier(...points, Math.min(t, 1));
    assert.ok(x >= 0 && x <= WIDTH, `t=${t.toFixed(2)}에서 화면 밖: x=${x.toFixed(1)}`);
  }
});
