/**
 * 고정 타임스텝 루프.
 * tick(now)에 현재 시각(초)을 주면, 누적 시간을 step 단위로 소비하며 update를 반복 호출한다.
 * 시간 소스를 주입받으므로 requestAnimationFrame 없이 테스트할 수 있다.
 */
export function createLoop({ update, render, step = 1 / 60, maxFrameTime = 1.0 }) {
  let lastTime = null;
  let accumulator = 0;

  function tick(now) {
    if (lastTime === null) {
      lastTime = now;
      render();
      return;
    }
    // 프레임이 너무 길면 잘라낸다 (탭 복귀 시 update 폭주 방지).
    const frameTime = Math.min(now - lastTime, maxFrameTime);
    lastTime = now;
    accumulator += frameTime;

    while (accumulator >= step) {
      update(step);
      accumulator -= step;
    }
    render();
  }

  function reset() {
    lastTime = null;
    accumulator = 0;
  }

  return { tick, reset };
}
