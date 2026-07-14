// 브라우저 기본 동작(스크롤 등)을 막을 키들
const PREVENT_DEFAULT = new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', 'Space']);

/**
 * 키보드 + 터치 상태 추적기.
 * target은 addEventListener를 가진 객체(브라우저에선 window). 주입받아 테스트 가능하게 한다.
 * canvas는 선택 — 넘기면 터치 입력을 추가로 설치한다(테스트는 canvas 없이 키보드만 검증 가능).
 * canvas의 getBoundingClientRect()로 CSS 스케일을 계산해, 터치 드래그를
 * 논리 좌표계(480 폭) 픽셀로 환산한다.
 */
export function createInput(target, canvas) {
  const down = new Set();     // 현재 눌려 있는 키
  const pressed = new Set();  // 이번 프레임에 새로 눌린 키
  let dragDelta = 0;          // 이번 프레임 터치 드래그량 (논리 픽셀)

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

  // ── 터치 ──────────────────────────────────────────────────────
  // 캔버스는 CSS로 확대/축소되어 표시되므로, clientX 델타를 그대로 쓰면
  // 스케일 배율만큼 어긋난다. getBoundingClientRect()의 실제 표시 폭 대비
  // 논리 폭(480)의 비율로 환산해야 한다.
  let touchId = null;   // 추적 중인 단일 터치의 identifier
  let lastClientX = 0;

  function scaleFactor() {
    const rect = canvas.getBoundingClientRect();
    return rect.width > 0 ? 480 / rect.width : 1;
  }

  function findTouch(touchList) {
    for (const t of touchList) {
      if (t.identifier === touchId) return t;
    }
    return null;
  }

  function onTouchStart(event) {
    event.preventDefault();
    if (touchId !== null) return; // 이미 추적 중이면 추가 손가락은 무시
    const touch = event.touches[0];
    if (!touch) return;
    touchId = touch.identifier;
    lastClientX = touch.clientX;

    if (!down.has('Space')) pressed.add('Space');
    down.add('Space');
    pressed.add('Enter');
  }

  function onTouchMove(event) {
    event.preventDefault();
    const touch = findTouch(event.touches);
    if (!touch) return;
    const clientDelta = touch.clientX - lastClientX;
    lastClientX = touch.clientX;
    dragDelta += clientDelta * scaleFactor();
  }

  function endTouch(event) {
    event.preventDefault();
    const touch = findTouch(event.changedTouches ?? []);
    // changedTouches에 추적 중인 터치가 없으면(=다른 손가락이 뗀 경우) 무시.
    if (event.changedTouches && !touch) return;
    touchId = null;
    down.delete('Space');
  }

  if (canvas) {
    canvas.addEventListener('touchstart', onTouchStart);
    canvas.addEventListener('touchmove', onTouchMove);
    canvas.addEventListener('touchend', endTouch);
    canvas.addEventListener('touchcancel', endTouch);
  }

  return {
    isDown: (code) => down.has(code),
    wasPressed: (code) => pressed.has(code),
    get dragDelta() { return dragDelta; },
    endFrame() {
      pressed.clear();
      dragDelta = 0;
    },
    dispose() {
      target.removeEventListener('keydown', onKeyDown);
      target.removeEventListener('keyup', onKeyUp);
      if (canvas) {
        canvas.removeEventListener('touchstart', onTouchStart);
        canvas.removeEventListener('touchmove', onTouchMove);
        canvas.removeEventListener('touchend', endTouch);
        canvas.removeEventListener('touchcancel', endTouch);
      }
    },
  };
}
