import { WIDTH, HEIGHT } from './config.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

// 부팅 확인용 임시 렌더 — Task 1에서 게임 루프로 대체된다.
ctx.fillStyle = '#000';
ctx.fillRect(0, 0, WIDTH, HEIGHT);
ctx.fillStyle = '#0f0';
ctx.font = '16px monospace';
ctx.fillText('BOOT OK', 20, 40);
