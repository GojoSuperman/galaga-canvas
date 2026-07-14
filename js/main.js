import { WIDTH, HEIGHT } from './config.js';
import { createLoop } from './core/loop.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

let elapsed = 0;

function update(dt) {
  elapsed += dt;
}

function render() {
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = '#0f0';
  ctx.font = '16px monospace';
  ctx.fillText(`T ${elapsed.toFixed(1)}s`, 20, 40);
}

const loop = createLoop({ update, render });

function frame(nowMs) {
  loop.tick(nowMs / 1000); // rAF는 밀리초, 루프는 초 단위
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
