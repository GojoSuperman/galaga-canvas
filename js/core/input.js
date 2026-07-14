// 브라우저 기본 동작(스크롤 등)을 막을 키들
const PREVENT_DEFAULT = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space']);

/**
 * 키보드 상태 추적기.
 * target은 addEventListener를 가진 객체(브라우저에선 window). 주입받아 테스트 가능하게 한다.
 */
export function createInput(target) {
  const down = new Set();     // 현재 눌려 있는 키
  const pressed = new Set();  // 이번 프레임에 새로 눌린 키

  function onKeyDown(event) {
    if (PREVENT_DEFAULT.has(event.code)) event.preventDefault();
    // 키 리피트로 keydown이 반복돼도 pressed는 최초 1회만 기록한다.
    if (!down.has(event.code)) pressed.add(event.code);
    down.add(event.code);
  }

  function onKeyUp(event) {
    if (PREVENT_DEFAULT.has(event.code)) event.preventDefault();
    down.delete(event.code);
  }

  target.addEventListener('keydown', onKeyDown);
  target.addEventListener('keyup', onKeyUp);

  return {
    isDown: (code) => down.has(code),
    wasPressed: (code) => pressed.has(code),
    endFrame: () => pressed.clear(),
    dispose() {
      target.removeEventListener('keydown', onKeyDown);
      target.removeEventListener('keyup', onKeyUp);
    },
  };
}
