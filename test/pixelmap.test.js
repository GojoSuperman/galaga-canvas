import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parsePixelMap } from '../js/gfx/pixelmap.js';

const palette = { R: '#ff0000', W: '#ffffff', '.': null };

test('행/열 수로 폭과 높이를 계산한다', () => {
  const result = parsePixelMap(['RR', 'RR', 'RR'], palette);
  assert.equal(result.width, 2);
  assert.equal(result.height, 3);
});

test('각 픽셀의 좌표와 색을 뽑아낸다', () => {
  const result = parsePixelMap(['RW'], palette);
  assert.deepEqual(result.pixels, [
    { x: 0, y: 0, color: '#ff0000' },
    { x: 1, y: 0, color: '#ffffff' },
  ]);
});

test('팔레트 값이 null인 문자는 투명이라 결과에서 빠진다', () => {
  const result = parsePixelMap(['.R.'], palette);
  assert.equal(result.width, 3);
  assert.deepEqual(result.pixels, [{ x: 1, y: 0, color: '#ff0000' }]);
});

test('팔레트에 없는 문자를 만나면 에러를 던진다', () => {
  // 오타를 조용히 투명 픽셀로 넘기면 스프라이트가 이유 없이 비어 보인다.
  assert.throws(
    () => parsePixelMap(['RZ'], palette),
    /팔레트에 없는 문자/,
  );
});

test('행 길이가 서로 다르면 에러를 던진다', () => {
  assert.throws(
    () => parsePixelMap(['RR', 'R'], palette),
    /행 길이가 일정하지 않습니다/,
  );
});
