import { createEnemy } from './enemy.js';

/**
 * 스테이지 데이터를 시간에 따라 적으로 풀어놓는다.
 * enemies에는 죽은 적도 남아 있다 — 순회하는 쪽이 alive를 확인해야 한다.
 */
export function createSpawner(stage, { formation, game }) {
  const enemies = [];
  // delay 순으로 정렬해 두면 앞에서부터 하나씩 꺼내 쓸 수 있다.
  const pending = [...stage.waves].sort((a, b) => a.delay - b.delay);
  let elapsed = 0;

  function update(dt) {
    elapsed += dt;
    while (pending.length > 0 && pending[0].delay <= elapsed) {
      const wave = pending.shift();
      for (const col of wave.cols) {
        enemies.push(createEnemy({
          type: wave.type,
          col,
          row: wave.row,
          entryPath: wave.entryPath,
          entryDuration: 2.5,
          formation,
          game,
        }));
      }
    }
  }

  return {
    enemies,
    update,
    get done() { return pending.length === 0; },
  };
}
