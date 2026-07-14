import { parsePixelMap } from './pixelmap.js';
import { SPRITES } from './pixels.js';

/**
 * 픽셀맵을 오프스크린 캔버스로 굽고 캐싱한다.
 * get(name)은 drawImage에 바로 넣을 수 있는 캔버스를 돌려준다.
 */
export function createSpriteFactory(scale = 2) {
  const cache = new Map();

  function bake(name) {
    const def = SPRITES[name];
    if (!def) throw new Error(`정의되지 않은 스프라이트입니다: ${name}`);

    const { width, height, pixels } = parsePixelMap(def.rows, def.palette);
    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;

    const ctx = canvas.getContext('2d');
    ctx.imageSmoothingEnabled = false;
    for (const { x, y, color } of pixels) {
      ctx.fillStyle = color;
      ctx.fillRect(x * scale, y * scale, scale, scale);
    }
    return canvas;
  }

  return {
    get(name) {
      if (!cache.has(name)) cache.set(name, bake(name));
      return cache.get(name);
    },
  };
}
