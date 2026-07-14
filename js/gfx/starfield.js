import { WIDTH, HEIGHT } from '../config.js';

// 레이어별 [별 개수, 낙하 속도(px/s), 색]
const LAYERS = [
  [40, 20, '#404050'],
  [25, 45, '#8080a0'],
  [12, 90, '#ffffff'],
];

/** 3레이어 스타필드 배경. 레이어마다 속도가 달라 깊이감이 생긴다. */
export function createStarfield() {
  const layers = LAYERS.map(([count, speed, color]) => ({
    speed,
    color,
    stars: Array.from({ length: count }, () => ({
      x: Math.random() * WIDTH,
      y: Math.random() * HEIGHT,
    })),
  }));

  return {
    update(dt) {
      for (const layer of layers) {
        for (const star of layer.stars) {
          star.y += layer.speed * dt;
          if (star.y > HEIGHT) {           // 아래로 나가면 위에서 다시 등장
            star.y = 0;
            star.x = Math.random() * WIDTH;
          }
        }
      }
    },
    render(ctx) {
      for (const layer of layers) {
        ctx.fillStyle = layer.color;
        for (const star of layer.stars) {
          ctx.fillRect(Math.floor(star.x), Math.floor(star.y), 2, 2);
        }
      }
    },
  };
}
