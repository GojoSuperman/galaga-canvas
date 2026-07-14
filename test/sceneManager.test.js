import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSceneManager } from '../js/scenes/sceneManager.js';

test('change하면 해당 씬 팩토리를 부르고 현재 씬이 된다', () => {
  const manager = createSceneManager({
    title: () => ({ update() {}, render() {}, name: 'title' }),
  });
  manager.change('title');
  assert.equal(manager.current().name, 'title');
});

test('씬 팩토리는 params를 전달받는다', () => {
  let received = null;
  const manager = createSceneManager({
    gameover: (_ctx, params) => { received = params; return { update() {}, render() {} }; },
  });
  manager.change('gameover', { score: 1200, cleared: true });
  assert.deepEqual(received, { score: 1200, cleared: true });
});

test('update/render는 현재 씬에 위임된다', () => {
  let updated = 0;
  let rendered = 0;
  const manager = createSceneManager({
    play: () => ({ update() { updated += 1; }, render() { rendered += 1; } }),
  });
  manager.change('play');
  manager.update(0.016);
  manager.render({});
  assert.equal(updated, 1);
  assert.equal(rendered, 1);
});

test('씬 전환 시 이전 씬은 더 이상 update되지 않는다', () => {
  let titleUpdates = 0;
  const manager = createSceneManager({
    title: () => ({ update() { titleUpdates += 1; }, render() {} }),
    play: () => ({ update() {}, render() {} }),
  });
  manager.change('title');
  manager.update(0.016);
  manager.change('play');
  manager.update(0.016);
  assert.equal(titleUpdates, 1);
});

test('없는 씬으로 change하면 에러를 던진다', () => {
  const manager = createSceneManager({});
  assert.throws(() => manager.change('없는씬'), /등록되지 않은 씬/);
});

test('씬이 없을 때 update/render는 조용히 넘어간다', () => {
  const manager = createSceneManager({});
  assert.doesNotThrow(() => { manager.update(0.016); manager.render({}); });
});
