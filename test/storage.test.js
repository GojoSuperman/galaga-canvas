import { test } from 'node:test';
import assert from 'node:assert/strict';
import { insertScore, createHighScores } from '../js/core/storage.js';

/** localStorage를 흉내내는 가짜 저장소 */
function createFakeStore(initial = {}) {
  const data = { ...initial };
  return {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = String(v); },
    _data: data,
  };
}

test('insertScore는 내림차순으로 삽입한다', () => {
  assert.deepEqual(insertScore([300, 100], 200), [300, 200, 100]);
});

test('insertScore는 상위 limit개만 남긴다', () => {
  assert.deepEqual(insertScore([500, 400, 300, 200, 100], 250, 5), [500, 400, 300, 250, 200]);
});

test('insertScore는 원본 배열을 바꾸지 않는다', () => {
  const original = [100];
  insertScore(original, 200);
  assert.deepEqual(original, [100]);
});

test('저장소가 비어 있으면 load는 빈 배열', () => {
  const hs = createHighScores(createFakeStore());
  assert.deepEqual(hs.load(), []);
  assert.equal(hs.best(), 0);
});

test('save한 점수를 load로 다시 읽는다', () => {
  const hs = createHighScores(createFakeStore());
  hs.save(1200);
  hs.save(800);
  assert.deepEqual(hs.load(), [1200, 800]);
  assert.equal(hs.best(), 1200);
});

test('저장된 JSON이 깨져 있으면 빈 배열로 복구한다', () => {
  const hs = createHighScores(createFakeStore({ 'galaga.highscores': '{{{깨진 데이터' }));
  assert.deepEqual(hs.load(), []);
});

test('저장된 점수 중 Infinity/NaN은 걸러진다', () => {
  const hs = createHighScores(createFakeStore({ 'galaga.highscores': '[1e999, 100]' }));
  assert.deepEqual(hs.load(), [100]);
  assert.notEqual(hs.best(), Infinity);
});

test('저장소가 예외를 던져도 게임이 죽지 않는다', () => {
  const brokenStore = {
    getItem() { throw new Error('접근 거부'); },
    setItem() { throw new Error('접근 거부'); },
  };
  const hs = createHighScores(brokenStore);
  assert.deepEqual(hs.load(), []);
  assert.deepEqual(hs.save(500), [500]); // 메모리에는 남는다
  assert.equal(hs.best(), 500);
});
