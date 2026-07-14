import { WIDTH, HEIGHT } from './config.js';
import { createLoop } from './core/loop.js';
import { createSpriteFactory } from './gfx/spriteFactory.js';
import { SPRITES } from './gfx/pixels.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const sprites = createSpriteFactory(3);

function update() {}

function render() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);

  // 임시 스프라이트 검수 화면 — Task 6에서 씬으로 대체된다.
  let x = 20;
  let y = 40;
  ctx.fillStyle = '#888';
  ctx.font = '10px monospace';
  for (const name of Object.keys(SPRITES)) {
    const img = sprites.get(name);
    ctx.drawImage(img, x, y);
    ctx.fillText(name, x, y + img.height + 12);
    x += 90;
    if (x > WIDTH - 90) { x = 20; y += 100; }
  }
}

const loop = createLoop({ update, render });
function frame(nowMs) {
  loop.tick(nowMs / 1000);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
