# 갤러그 슈팅 게임 구현 계획

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 브라우저에서 바로 실행되는 갤러그 스타일 종스크롤 슈팅 게임(5스테이지 + 보스, 파워업 4종)을 의존성 0으로 구현한다.

**Architecture:** 엔티티(Player/Enemy/Bullet/Powerup/Boss)는 `update(dt)`/`draw(ctx)`를 가진 일반 클래스이고, 스테이지 구성·난이도 수치는 전부 `js/stages/stages.js` 데이터로 분리한다. 순수 로직(충돌·대형 좌표·베지어 경로·점수·파워업 상태·하이스코어)은 브라우저 API를 import 하지 않는 모듈로 격리해 `node:test`로 검증하고, 렌더링·오디오·입력은 브라우저에서 수동 확인한다.

**Tech Stack:** 순수 JavaScript(ES 모듈), Canvas 2D, WebAudio API, localStorage. 빌드 도구·번들러·외부 라이브러리 없음. 테스트는 Node 내장 `node:test`.

**Spec:** `docs/superpowers/specs/2026-07-14-galaga-shooter-design.md`

## Global Constraints

모든 태스크의 요구사항에 아래가 암묵적으로 포함된다.

- **의존성 0**: `package.json`의 `dependencies`/`devDependencies`는 비어 있어야 한다. npm 패키지 설치 금지.
- **이미지·오디오 파일 0개**: 스프라이트는 코드의 픽셀맵으로, 사운드는 WebAudio 합성으로만 만든다.
- **논리 해상도 480 × 640 고정.** 좌표는 전부 이 좌표계의 픽셀 단위.
- **ES 모듈만 사용** (`package.json`에 `"type": "module"`). CommonJS(`require`) 금지.
- **테스트 대상 모듈은 브라우저 API를 import 하지 않는다.** `document`, `window`, `canvas`, `AudioContext`, `localStorage`를 직접 참조하는 코드는 테스트 대상 순수 모듈에서 분리한다 (`storage.js`는 예외적으로 주입받는다).
- **테스트 실행 명령**: `npm test` (내부적으로 `node --test test/`).
- **주석·로그·UI 텍스트는 한국어**, 코드 식별자는 영어.
- **커밋은 각 태스크 끝에서 1회.** 커밋 메시지는 `feat:` / `test:` / `chore:` 접두사 사용.

## 파일 구조

| 파일 | 책임 |
|---|---|
| `index.html` | 캔버스 + 진입점 스크립트 |
| `css/style.css` | 캔버스 정수배 확대, 픽셀 렌더링 |
| `js/main.js` | 부트스트랩: 캔버스·씬 매니저·루프 기동 |
| `js/config.js` | 화면 크기 등 전역 상수 |
| `js/core/loop.js` | 고정 타임스텝 게임 루프 (순수) |
| `js/core/input.js` | 키보드 상태 추적 |
| `js/core/audio.js` | WebAudio 효과음 합성 + BGM |
| `js/core/storage.js` | 하이스코어 TOP 5 (저장소 주입) |
| `js/scenes/sceneManager.js` | 씬 전환 (순수) |
| `js/scenes/titleScene.js` | 타이틀 화면 |
| `js/scenes/playScene.js` | 본편: 엔티티 소유·충돌·스테이지 진행 |
| `js/scenes/gameOverScene.js` | 게임오버/클리어 화면 |
| `js/gfx/pixels.js` | 픽셀맵 데이터 (문자열 배열 + 팔레트) |
| `js/gfx/pixelmap.js` | 픽셀맵 파싱 (순수) |
| `js/gfx/spriteFactory.js` | 픽셀맵 → 오프스크린 캔버스 캐싱 |
| `js/gfx/starfield.js` | 3레이어 배경 별 |
| `js/game/collision.js` | AABB 판정 (순수) |
| `js/game/bullet.js` | 탄 + 오브젝트 풀 |
| `js/game/player.js` | 플레이어 이동·발사·무기 레벨·버프 |
| `js/game/formation.js` | 대형 그리드 좌표 + 흔들림 (순수) |
| `js/game/paths.js` | 베지어 진입·급강하 경로 (순수) |
| `js/game/enemy.js` | 적 4상태 FSM |
| `js/game/spawner.js` | 스테이지 데이터 → 적 생성 |
| `js/game/powerup.js` | 파워업 드롭·낙하·획득 (상태 전이는 순수) |
| `js/game/boss.js` | 보스 3페이즈 |
| `js/game/particles.js` | 폭발 파티클 풀 |
| `js/game/score.js` | 점수 규칙 (순수) |
| `js/stages/stages.js` | ★ 밸런스 데이터 전부 |
| `js/ui/hud.js` | 점수·목숨·스테이지·무기·버프 표시 |
| `test/*.test.js` | 순수 모듈 단위 테스트 |

---

## Task 0: 프로젝트 뼈대 + 검은 캔버스

빈 폴더에서 시작해 브라우저에 480×640 캔버스가 뜨는 것까지 만든다. 이후 모든 태스크가 이 위에 얹힌다.

**Files:**
- Create: `.gitignore`, `package.json`, `index.html`, `css/style.css`, `js/config.js`, `js/main.js`

**Interfaces:**
- Consumes: 없음
- Produces: `js/config.js` → `export const WIDTH = 480; export const HEIGHT = 640;`

- [ ] **Step 1: git 저장소 초기화**

```bash
cd /mnt/f/aiffel/html-game
git init
```

- [ ] **Step 2: `.gitignore` 작성**

`.superpowers/`는 검토용 뷰어 파일이 들어가는 경로라 추적하지 않는다.

```
node_modules/
.superpowers/
.DS_Store
*.log
```

- [ ] **Step 3: `package.json` 작성**

의존성은 비워 둔다. `node --test`는 Node 내장이라 설치가 필요 없다.

```json
{
  "name": "galaga-shooter",
  "version": "0.1.0",
  "private": true,
  "type": "module",
  "scripts": {
    "test": "node --test test/",
    "serve": "python3 -m http.server 8080 --bind 127.0.0.1"
  }
}
```

- [ ] **Step 4: `js/config.js` 작성**

```js
// 논리 해상도 — 모든 좌표는 이 좌표계 기준이다.
export const WIDTH = 480;
export const HEIGHT = 640;
```

- [ ] **Step 5: `index.html` 작성**

```html
<!doctype html>
<html lang="ko">
<head>
  <meta charset="utf-8">
  <title>GALAGA</title>
  <link rel="stylesheet" href="css/style.css">
</head>
<body>
  <canvas id="game" width="480" height="640"></canvas>
  <script type="module" src="js/main.js"></script>
</body>
</html>
```

- [ ] **Step 6: `css/style.css` 작성**

정수배 확대 + `pixelated`로 레트로 픽셀 느낌을 유지한다.

```css
* { margin: 0; padding: 0; box-sizing: border-box; }

body {
  min-height: 100vh;
  display: grid;
  place-items: center;
  background: #000;
}

#game {
  /* 논리 480×640을 정수배(1.2배 아님)로 확대 — 세로 기준 최대 배율 */
  width: calc(480px * 1);
  height: calc(640px * 1);
  image-rendering: pixelated;
  background: #000;
}

@media (min-height: 1300px) {
  #game { width: calc(480px * 2); height: calc(640px * 2); }
}
```

- [ ] **Step 7: `js/main.js` 작성**

```js
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
```

- [ ] **Step 8: 브라우저에서 확인**

```bash
npm run serve
```

http://127.0.0.1:8080 을 열어 검은 캔버스에 초록색 `BOOT OK` 글자가 보이는지 확인한다.
브라우저 콘솔에 에러가 없어야 한다 (ES 모듈은 `file://`에서 CORS로 막히므로 반드시 서버로 열 것).

- [ ] **Step 9: 커밋**

```bash
git add .gitignore package.json index.html css/style.css js/config.js js/main.js
git commit -m "chore: 프로젝트 뼈대와 480x640 캔버스 부팅"
```

---

## Task 1: 고정 타임스텝 게임 루프

프레임 드랍이 나도 로직이 일정한 속도로 도는 루프. `requestAnimationFrame`을 직접 부르지 않고 주입받아 테스트 가능하게 만든다.

**Files:**
- Create: `js/core/loop.js`
- Test: `test/loop.test.js`

**Interfaces:**
- Consumes: 없음
- Produces:
  - `createLoop({ update, render, step = 1/60, maxFrameTime = 0.25 })` → `{ tick(nowSeconds), reset() }`
  - `update(step)`는 누적 시간이 `step`을 넘을 때마다 반복 호출된다.
  - `render()`는 `tick` 1회당 정확히 1회 호출된다.

- [ ] **Step 1: 실패하는 테스트 작성**

`test/loop.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLoop } from '../js/core/loop.js';

test('경과 시간이 step에 못 미치면 update를 호출하지 않는다', () => {
  const updates = [];
  const loop = createLoop({ update: (dt) => updates.push(dt), render: () => {}, step: 0.1 });
  loop.tick(0);
  loop.tick(0.05);
  assert.equal(updates.length, 0);
});

test('경과 시간만큼 update를 고정 step으로 반복 호출한다', () => {
  const updates = [];
  const loop = createLoop({ update: (dt) => updates.push(dt), render: () => {}, step: 0.1 });
  loop.tick(0);
  loop.tick(0.35);
  assert.equal(updates.length, 3);
  assert.deepEqual(updates, [0.1, 0.1, 0.1]);
});

test('render는 tick 1회당 1회 호출된다', () => {
  let renders = 0;
  const loop = createLoop({ update: () => {}, render: () => { renders += 1; }, step: 0.1 });
  loop.tick(0);
  loop.tick(0.35);
  assert.equal(renders, 2);
});

test('한 프레임이 maxFrameTime을 넘으면 잘라내 죽음의 나선을 막는다', () => {
  const updates = [];
  const loop = createLoop({
    update: (dt) => updates.push(dt), render: () => {}, step: 0.1, maxFrameTime: 0.25,
  });
  loop.tick(0);
  loop.tick(10); // 탭이 백그라운드에 있다가 돌아온 상황
  assert.equal(updates.length, 2); // 0.25초 → step 0.1 두 번
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npm test`
Expected: FAIL — `Cannot find module '../js/core/loop.js'`

- [ ] **Step 3: 최소 구현 작성**

`js/core/loop.js`:

```js
/**
 * 고정 타임스텝 루프.
 * tick(now)에 현재 시각(초)을 주면, 누적 시간을 step 단위로 소비하며 update를 반복 호출한다.
 * 시간 소스를 주입받으므로 requestAnimationFrame 없이 테스트할 수 있다.
 */
export function createLoop({ update, render, step = 1 / 60, maxFrameTime = 0.25 }) {
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
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test`
Expected: PASS — 4개 테스트 통과

- [ ] **Step 5: `js/main.js`를 루프에 연결**

임시 렌더 코드를 지우고 루프를 돌린다.

```js
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
```

- [ ] **Step 6: 브라우저에서 확인**

`npm run serve` 후 http://127.0.0.1:8080 — 경과 시간이 1초에 1.0씩 증가하는지 확인한다.

- [ ] **Step 7: 커밋**

```bash
git add js/core/loop.js test/loop.test.js js/main.js
git commit -m "feat: 고정 타임스텝 게임 루프"
```

---

## Task 2: 키보드 입력

**Files:**
- Create: `js/core/input.js`
- Test: `test/input.test.js`

**Interfaces:**
- Consumes: 없음
- Produces:
  - `createInput(target)` → `{ isDown(code), wasPressed(code), endFrame(), dispose() }`
  - `target`은 `addEventListener`/`removeEventListener`를 가진 객체(브라우저에선 `window`, 테스트에선 가짜 객체).
  - `isDown('ArrowLeft')` — 키가 눌려 있는 동안 계속 `true`.
  - `wasPressed('Space')` — 눌린 그 프레임에만 `true`. 매 프레임 끝에 `endFrame()`을 불러 초기화한다.

- [ ] **Step 1: 실패하는 테스트 작성**

`test/input.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createInput } from '../js/core/input.js';

/** addEventListener를 흉내내는 가짜 타겟 — 등록된 핸들러를 직접 호출할 수 있다. */
function createFakeTarget() {
  const handlers = {};
  return {
    addEventListener(type, fn) { (handlers[type] ??= []).push(fn); },
    removeEventListener(type, fn) {
      handlers[type] = (handlers[type] ?? []).filter((h) => h !== fn);
    },
    emit(type, event) { (handlers[type] ?? []).forEach((fn) => fn(event)); },
    countFor(type) { return (handlers[type] ?? []).length; },
  };
}

test('키를 누르면 isDown이 true, 떼면 false', () => {
  const target = createFakeTarget();
  const input = createInput(target);

  assert.equal(input.isDown('ArrowLeft'), false);
  target.emit('keydown', { code: 'ArrowLeft', preventDefault() {} });
  assert.equal(input.isDown('ArrowLeft'), true);
  target.emit('keyup', { code: 'ArrowLeft', preventDefault() {} });
  assert.equal(input.isDown('ArrowLeft'), false);
});

test('wasPressed는 누른 프레임에만 true이고 endFrame 후 false', () => {
  const target = createFakeTarget();
  const input = createInput(target);

  target.emit('keydown', { code: 'Space', preventDefault() {} });
  assert.equal(input.wasPressed('Space'), true);

  input.endFrame();
  assert.equal(input.wasPressed('Space'), false);
  // 키를 떼지 않았으므로 여전히 눌린 상태다.
  assert.equal(input.isDown('Space'), true);
});

test('키를 누르고 있어도 wasPressed는 반복 발동하지 않는다', () => {
  const target = createFakeTarget();
  const input = createInput(target);

  target.emit('keydown', { code: 'Space', preventDefault() {} });
  input.endFrame();
  // OS 키 리피트로 keydown이 또 와도 눌린 상태면 무시한다.
  target.emit('keydown', { code: 'Space', preventDefault() {} });
  assert.equal(input.wasPressed('Space'), false);
});

test('dispose는 등록한 리스너를 제거한다', () => {
  const target = createFakeTarget();
  const input = createInput(target);
  assert.equal(target.countFor('keydown'), 1);
  input.dispose();
  assert.equal(target.countFor('keydown'), 0);
  assert.equal(target.countFor('keyup'), 0);
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npm test`
Expected: FAIL — `Cannot find module '../js/core/input.js'`

- [ ] **Step 3: 최소 구현 작성**

`js/core/input.js`:

```js
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
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test`
Expected: PASS — 8개 테스트 통과 (loop 4 + input 4)

- [ ] **Step 5: 커밋**

```bash
git add js/core/input.js test/input.test.js
git commit -m "feat: 키보드 입력 추적 (isDown / wasPressed)"
```

---

## Task 3: AABB 충돌 판정

**Files:**
- Create: `js/game/collision.js`
- Test: `test/collision.test.js`

**Interfaces:**
- Consumes: 없음
- Produces:
  - `aabbOverlap(a, b)` → `boolean`. `a`, `b`는 `{ x, y, w, h }` (x, y는 좌상단 모서리).
  - `forEachHit(groupA, groupB, onHit)` — 두 배열의 모든 쌍을 검사해 겹치면 `onHit(a, b)` 호출. 살아있는(`alive === true`) 엔티티만 검사한다.

- [ ] **Step 1: 실패하는 테스트 작성**

`test/collision.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { aabbOverlap, forEachHit } from '../js/game/collision.js';

const box = (x, y, w = 10, h = 10) => ({ x, y, w, h, alive: true });

test('완전히 겹치면 true', () => {
  assert.equal(aabbOverlap(box(0, 0), box(0, 0)), true);
});

test('일부만 겹쳐도 true', () => {
  assert.equal(aabbOverlap(box(0, 0), box(5, 5)), true);
});

test('떨어져 있으면 false', () => {
  assert.equal(aabbOverlap(box(0, 0), box(20, 0)), false);
  assert.equal(aabbOverlap(box(0, 0), box(0, 20)), false);
});

test('모서리가 정확히 맞닿기만 하면 겹친 것으로 보지 않는다', () => {
  // a는 x 0~10, b는 x 10~20 — 접점의 두께가 0이므로 충돌이 아니다.
  assert.equal(aabbOverlap(box(0, 0), box(10, 0)), false);
});

test('forEachHit은 겹치는 모든 쌍에 콜백을 부른다', () => {
  const bullets = [box(0, 0), box(100, 100)];
  const enemies = [box(5, 5), box(200, 200)];
  const hits = [];
  forEachHit(bullets, enemies, (a, b) => hits.push([a, b]));
  assert.equal(hits.length, 1);
  assert.equal(hits[0][0], bullets[0]);
  assert.equal(hits[0][1], enemies[0]);
});

test('forEachHit은 죽은 엔티티를 건너뛴다', () => {
  const bullets = [{ ...box(0, 0), alive: false }];
  const enemies = [box(0, 0)];
  const hits = [];
  forEachHit(bullets, enemies, (a, b) => hits.push([a, b]));
  assert.equal(hits.length, 0);
});

test('forEachHit은 콜백이 죽인 엔티티를 다시 맞히지 않는다', () => {
  // 총알 1발이 겹친 적 2기를 관통해서는 안 된다 (콜백이 총알을 죽이면 즉시 멈춘다).
  const bullet = box(0, 0);
  const enemies = [box(0, 0), box(2, 2)];
  const hits = [];
  forEachHit([bullet], enemies, (a, b) => {
    hits.push(b);
    a.alive = false; // 총알 소멸
  });
  assert.equal(hits.length, 1);
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npm test`
Expected: FAIL — `Cannot find module '../js/game/collision.js'`

- [ ] **Step 3: 최소 구현 작성**

`js/game/collision.js`:

```js
/**
 * 축 정렬 사각형(AABB) 겹침 판정.
 * a, b: { x, y, w, h } — x, y는 좌상단 모서리.
 * 모서리가 0 두께로 맞닿는 경우는 겹침으로 보지 않는다.
 */
export function aabbOverlap(a, b) {
  return a.x < b.x + b.w
    && a.x + a.w > b.x
    && a.y < b.y + b.h
    && a.y + a.h > b.y;
}

/**
 * 두 그룹의 모든 쌍을 전수 검사한다. 엔티티가 200개 미만이므로 공간 분할이 필요 없다.
 * 콜백 안에서 a.alive = false로 만들면(예: 총알 소멸) 그 a의 남은 검사는 중단된다.
 */
export function forEachHit(groupA, groupB, onHit) {
  for (const a of groupA) {
    if (!a.alive) continue;
    for (const b of groupB) {
      if (!b.alive) continue;
      if (!aabbOverlap(a, b)) continue;
      onHit(a, b);
      if (!a.alive) break; // a가 소멸했으면 더 검사할 필요가 없다.
    }
  }
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test`
Expected: PASS — 15개 테스트 통과

- [ ] **Step 5: 커밋**

```bash
git add js/game/collision.js test/collision.test.js
git commit -m "feat: AABB 충돌 판정"
```

---

## Task 4: 하이스코어 저장소

`localStorage`를 직접 만지지 않고 주입받아, 프라이빗 모드 등으로 접근이 막혀도 게임이 죽지 않게 한다.

**Files:**
- Create: `js/core/storage.js`
- Test: `test/storage.test.js`

**Interfaces:**
- Consumes: 없음
- Produces:
  - `insertScore(scores, newScore, limit = 5)` → 새 배열 (순수 함수, 내림차순 정렬 후 상위 `limit`개)
  - `createHighScores(store)` → `{ load(), save(score), best() }`
  - `store`는 `getItem(key)` / `setItem(key, value)`를 가진 객체 (브라우저에선 `localStorage`).
  - `load()` → `number[]` (내림차순, 최대 5개). 저장소가 없거나 깨졌으면 `[]`.
  - `save(score)` → 갱신된 `number[]`.
  - `best()` → `number` (없으면 `0`).

- [ ] **Step 1: 실패하는 테스트 작성**

`test/storage.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { insertScore, createHighScores } from '../js/core/storage.js';

/** localStorage를 흉내내는 가짜 저장소 */
function createFakeStore(initial = {}) {
  const data = { ...initial };
  return {
    getItem: (k) => (k in data ? data[k] : null),
    setItem: (k, v) => { data[k] = String(v); },
    _data: data,
  };
}

test('insertScore는 내림차순으로 삽입한다', () => {
  assert.deepEqual(insertScore([300, 100], 200), [300, 200, 100]);
});

test('insertScore는 상위 limit개만 남긴다', () => {
  assert.deepEqual(insertScore([500, 400, 300, 200, 100], 250, 5), [500, 400, 300, 250, 200]);
});

test('insertScore는 원본 배열을 바꾸지 않는다', () => {
  const original = [100];
  insertScore(original, 200);
  assert.deepEqual(original, [100]);
});

test('저장소가 비어 있으면 load는 빈 배열', () => {
  const hs = createHighScores(createFakeStore());
  assert.deepEqual(hs.load(), []);
  assert.equal(hs.best(), 0);
});

test('save한 점수를 load로 다시 읽는다', () => {
  const hs = createHighScores(createFakeStore());
  hs.save(1200);
  hs.save(800);
  assert.deepEqual(hs.load(), [1200, 800]);
  assert.equal(hs.best(), 1200);
});

test('저장된 JSON이 깨져 있으면 빈 배열로 복구한다', () => {
  const hs = createHighScores(createFakeStore({ 'galaga.highscores': '{{{깨진 데이터' }));
  assert.deepEqual(hs.load(), []);
});

test('저장소가 예외를 던져도 게임이 죽지 않는다', () => {
  const brokenStore = {
    getItem() { throw new Error('접근 거부'); },
    setItem() { throw new Error('접근 거부'); },
  };
  const hs = createHighScores(brokenStore);
  assert.deepEqual(hs.load(), []);
  assert.deepEqual(hs.save(500), [500]); // 메모리에는 남는다
  assert.equal(hs.best(), 500);
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npm test`
Expected: FAIL — `Cannot find module '../js/core/storage.js'`

- [ ] **Step 3: 최소 구현 작성**

`js/core/storage.js`:

```js
const KEY = 'galaga.highscores';
const LIMIT = 5;

/** 점수를 내림차순 목록에 끼워 넣고 상위 limit개만 남긴다. (순수 함수) */
export function insertScore(scores, newScore, limit = LIMIT) {
  return [...scores, newScore].sort((a, b) => b - a).slice(0, limit);
}

/**
 * 하이스코어 TOP 5.
 * store는 getItem/setItem을 가진 객체(브라우저에선 localStorage).
 * 저장소 접근이 실패해도(프라이빗 모드 등) 메모리 캐시로 계속 동작한다.
 */
export function createHighScores(store) {
  let cache = null;

  function load() {
    if (cache !== null) return cache;
    try {
      const raw = store.getItem(KEY);
      const parsed = raw ? JSON.parse(raw) : [];
      cache = Array.isArray(parsed) ? parsed.filter((n) => typeof n === 'number') : [];
    } catch {
      cache = []; // 저장소가 막혔거나 JSON이 깨진 경우
    }
    return cache;
  }

  function save(score) {
    cache = insertScore(load(), score);
    try {
      store.setItem(KEY, JSON.stringify(cache));
    } catch {
      // 저장 실패는 무시한다 — 이번 세션 동안은 메모리 캐시가 유지된다.
    }
    return cache;
  }

  const best = () => load()[0] ?? 0;

  return { load, save, best };
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test`
Expected: PASS — 22개 테스트 통과

- [ ] **Step 5: 커밋**

```bash
git add js/core/storage.js test/storage.test.js
git commit -m "feat: 하이스코어 TOP5 저장소 (저장소 실패 시 폴백)"
```

---

## Task 5: 픽셀맵 파싱 + 스프라이트 생성

픽셀맵 파싱(순수 로직)과 캔버스 렌더링(브라우저 전용)을 다른 파일로 나눈다. 파싱만 테스트한다.

**Files:**
- Create: `js/gfx/pixelmap.js`, `js/gfx/pixels.js`, `js/gfx/spriteFactory.js`
- Test: `test/pixelmap.test.js`

**Interfaces:**
- Consumes: 없음
- Produces:
  - `parsePixelMap(rows, palette)` → `{ width, height, pixels }` — `pixels`는 `{ x, y, color }` 배열. 팔레트 값이 `null`인 문자(`.`)는 투명으로 취급해 결과에서 빠진다.
  - `js/gfx/pixels.js` → `export const SPRITES = { player: { rows, palette }, ... }` — 스프라이트 이름별 정의.
  - `createSpriteFactory(scale = 2)` → `{ get(name) }` — `get(name)`은 캐싱된 `HTMLCanvasElement` 반환. 최초 호출 시 생성, 이후 재사용.

- [ ] **Step 1: 실패하는 테스트 작성**

`test/pixelmap.test.js`:

```js
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
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npm test`
Expected: FAIL — `Cannot find module '../js/gfx/pixelmap.js'`

- [ ] **Step 3: `js/gfx/pixelmap.js` 구현**

```js
/**
 * 픽셀맵(문자열 배열 + 팔레트)을 파싱한다.
 * rows: ['..R..', '.RWR.'] 형태. palette: { R: '#e33', '.': null } — null은 투명.
 * 반환: { width, height, pixels: [{ x, y, color }] }
 */
export function parsePixelMap(rows, palette) {
  const height = rows.length;
  const width = rows[0]?.length ?? 0;
  const pixels = [];

  rows.forEach((row, y) => {
    if (row.length !== width) {
      throw new Error(`픽셀맵의 행 길이가 일정하지 않습니다 (행 ${y}: ${row.length}, 기대: ${width})`);
    }
    [...row].forEach((char, x) => {
      if (!(char in palette)) {
        throw new Error(`팔레트에 없는 문자입니다: '${char}' (행 ${y}, 열 ${x})`);
      }
      const color = palette[char];
      if (color === null) return; // 투명
      pixels.push({ x, y, color });
    });
  });

  return { width, height, pixels };
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test`
Expected: PASS — 27개 테스트 통과

- [ ] **Step 5: `js/gfx/pixels.js`에 스프라이트 정의**

게임에 필요한 스프라이트를 전부 정의한다. 모양이 마음에 안 들면 **이 파일만** 고치면 된다.

```js
// 스프라이트 픽셀맵 정의. '.'은 투명.
// 모양·색을 바꾸려면 이 파일만 고치면 된다.

const SHIP_PALETTE = { R: '#e94040', W: '#ffffff', B: '#4aa3ff', D: '#8a1f1f', '.': null };
const BEE_PALETTE = { Y: '#f5d442', K: '#3b2f00', W: '#ffffff', '.': null };
const BUTTERFLY_PALETTE = { P: '#d94fd9', C: '#5ce1e6', W: '#ffffff', '.': null };
const CAPTAIN_PALETTE = { G: '#4fd97a', B: '#2b7de0', W: '#ffffff', '.': null };
const BOSS_PALETTE = { V: '#9b30d9', M: '#e0409b', C: '#5ce1e6', W: '#ffffff', K: '#2a0a3a', '.': null };
const SHOT_PALETTE = { W: '#ffffff', C: '#7ff0ff', '.': null };
const ENEMY_SHOT_PALETTE = { R: '#ff5a5a', Y: '#ffd24a', '.': null };

export const SPRITES = {
  player: {
    palette: SHIP_PALETTE,
    rows: [
      '..W..',
      '..W..',
      '.WRW.',
      '.RRR.',
      'RRBRR',
      'RD.DR',
    ],
  },

  // 적 A — 벌 (가장 약함)
  bee: {
    palette: BEE_PALETTE,
    rows: [
      'K...K',
      '.YYY.',
      'YKYKY',
      'YYYYY',
      '.Y.Y.',
    ],
  },

  // 적 B — 나비 (중간)
  butterfly: {
    palette: BUTTERFLY_PALETTE,
    rows: [
      'P...P',
      'PP.PP',
      'PCCCP',
      'PPCPP',
      '.P.P.',
    ],
  },

  // 적 C — 캡틴 (가장 단단함, 점수 높음)
  captain: {
    palette: CAPTAIN_PALETTE,
    rows: [
      '.G.G.',
      'GBGBG',
      'GGWGG',
      'GBBBG',
      '.G.G.',
    ],
  },

  // 보스 — 16×12
  boss: {
    palette: BOSS_PALETTE,
    rows: [
      '...VVVVVVVVVV...',
      '..VVMMMMMMMMVV..',
      '.VVMMCCCCCCMMVV.',
      'VVMMCCWWWWCCMMVV',
      'VMMCCWWKKWWCCMMV',
      'VMCCWWKKKKWWCCMV',
      'VMCCWWKKKKWWCCMV',
      'VMMCCWWWWWWCCMMV',
      'VVMMCCCCCCCCMMVV',
      '.VVMM.MMMM.MMVV.',
      '..VV..V..V..VV..',
      '...V..........V.',
    ],
  },

  playerShot: {
    palette: SHOT_PALETTE,
    rows: ['C', 'W', 'W', 'C'],
  },

  enemyShot: {
    palette: ENEMY_SHOT_PALETTE,
    rows: ['Y', 'R', 'R', 'Y'],
  },
};

/** 파워업 아이콘 — 색만 다르고 모양은 같아서 함수로 만든다. */
const POWERUP_ROWS = [
  '.LLLL.',
  'LLLLLL',
  'LL..LL',
  'LLLLLL',
  '.LLLL.',
];

const POWERUP_COLORS = {
  weapon: '#ffd24a',  // W — 무기 레벨업 (노랑)
  shield: '#5ce1e6',  // S — 실드 (하늘)
  rapid: '#ff7ad9',   // R — 연사 (분홍)
  speed: '#7dff6b',   // P — 속도 (연두)
};

for (const [type, color] of Object.entries(POWERUP_COLORS)) {
  SPRITES[`powerup_${type}`] = {
    palette: { L: color, '.': null },
    rows: POWERUP_ROWS,
  };
}
```

- [ ] **Step 6: `js/gfx/spriteFactory.js` 구현**

캔버스에 픽셀을 그려 캐싱한다. 브라우저 전용이라 테스트하지 않고 화면으로 확인한다.
나중에 실제 PNG로 바꾸고 싶으면 **이 파일 내부만** 교체하면 된다 (`get(name)` 인터페이스는 그대로).

```js
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
```

- [ ] **Step 7: `js/main.js`에서 스프라이트를 화면에 찍어 확인**

임시로 모든 스프라이트를 나열해 모양을 눈으로 검수한다.

```js
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
```

`npm run serve` → 스프라이트 11종(플레이어, 벌, 나비, 캡틴, 보스, 탄 2종, 파워업 4종)이 전부 보이고, 모양이 알아볼 만한지 확인한다. 이상하면 `js/gfx/pixels.js`만 고친다.

- [ ] **Step 8: 커밋**

```bash
git add js/gfx/ test/pixelmap.test.js js/main.js
git commit -m "feat: 픽셀맵 파싱과 코드 생성 스프라이트 11종"
```

---

## Task 6: 씬 매니저 + 배경 스타필드

씬 3개(타이틀/플레이/게임오버)의 껍데기를 만들고 전환을 붙인다. 이 태스크가 끝나면 Space로 화면이 오간다.

**Files:**
- Create: `js/scenes/sceneManager.js`, `js/scenes/titleScene.js`, `js/scenes/playScene.js`, `js/scenes/gameOverScene.js`, `js/gfx/starfield.js`
- Modify: `js/main.js` (전면 교체)
- Test: `test/sceneManager.test.js`

**Interfaces:**
- Consumes: `createLoop`, `createInput`, `createSpriteFactory`, `createHighScores`
- Produces:
  - `createSceneManager(scenes)` → `{ change(name, params), update(dt), render(ctx), current() }`
  - `scenes`는 `{ [name]: factoryFn }`. `factoryFn(ctxObj, params)` → `{ update(dt), render(renderCtx) }`.
  - 씬 팩토리에 넘어가는 `ctxObj`(게임 컨텍스트) = `{ input, sprites, highScores, audio, changeScene(name, params) }`.
  - `createStarfield(rng)` → `{ update(dt), render(ctx) }` — 3레이어 별 배경.
  - 씬 이름 상수: `'title'`, `'play'`, `'gameover'`.
  - `gameover` 씬의 params: `{ score, cleared }` (`cleared: true`면 보스 격파 클리어).

- [ ] **Step 1: 실패하는 테스트 작성**

`test/sceneManager.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSceneManager } from '../js/scenes/sceneManager.js';

test('change하면 해당 씬 팩토리를 부르고 현재 씬이 된다', () => {
  const manager = createSceneManager({
    title: () => ({ update() {}, render() {}, name: 'title' }),
  });
  manager.change('title');
  assert.equal(manager.current().name, 'title');
});

test('씬 팩토리는 params를 전달받는다', () => {
  let received = null;
  const manager = createSceneManager({
    gameover: (_ctx, params) => { received = params; return { update() {}, render() {} }; },
  });
  manager.change('gameover', { score: 1200, cleared: true });
  assert.deepEqual(received, { score: 1200, cleared: true });
});

test('update/render는 현재 씬에 위임된다', () => {
  let updated = 0;
  let rendered = 0;
  const manager = createSceneManager({
    play: () => ({ update() { updated += 1; }, render() { rendered += 1; } }),
  });
  manager.change('play');
  manager.update(0.016);
  manager.render({});
  assert.equal(updated, 1);
  assert.equal(rendered, 1);
});

test('씬 전환 시 이전 씬은 더 이상 update되지 않는다', () => {
  let titleUpdates = 0;
  const manager = createSceneManager({
    title: () => ({ update() { titleUpdates += 1; }, render() {} }),
    play: () => ({ update() {}, render() {} }),
  });
  manager.change('title');
  manager.update(0.016);
  manager.change('play');
  manager.update(0.016);
  assert.equal(titleUpdates, 1);
});

test('없는 씬으로 change하면 에러를 던진다', () => {
  const manager = createSceneManager({});
  assert.throws(() => manager.change('없는씬'), /등록되지 않은 씬/);
});

test('씬이 없을 때 update/render는 조용히 넘어간다', () => {
  const manager = createSceneManager({});
  assert.doesNotThrow(() => { manager.update(0.016); manager.render({}); });
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npm test`
Expected: FAIL — `Cannot find module '../js/scenes/sceneManager.js'`

- [ ] **Step 3: `js/scenes/sceneManager.js` 구현**

```js
/**
 * 씬 전환기.
 * scenes: { [이름]: (gameCtx, params) => ({ update(dt), render(ctx) }) }
 * gameCtx는 setContext로 주입한다 (씬이 input/sprites/audio 등에 접근하는 통로).
 */
export function createSceneManager(scenes) {
  let active = null;
  let gameCtx = {};

  function change(name, params = {}) {
    const factory = scenes[name];
    if (!factory) throw new Error(`등록되지 않은 씬입니다: ${name}`);
    active = factory(gameCtx, params);
  }

  return {
    setContext(ctx) { gameCtx = ctx; },
    change,
    update(dt) { active?.update(dt); },
    render(ctx) { active?.render(ctx); },
    current() { return active; },
  };
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test`
Expected: PASS — 33개 테스트 통과

- [ ] **Step 5: `js/gfx/starfield.js` 구현**

```js
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
```

- [ ] **Step 6: 세 씬의 껍데기 작성**

`js/scenes/titleScene.js`:

```js
import { WIDTH, HEIGHT } from '../config.js';
import { createStarfield } from '../gfx/starfield.js';

export function createTitleScene(game) {
  const stars = createStarfield();

  return {
    update(dt) {
      stars.update(dt);
      if (game.input.wasPressed('Space')) game.changeScene('play');
    },
    render(ctx) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      stars.render(ctx);

      ctx.textAlign = 'center';
      ctx.fillStyle = '#ffd24a';
      ctx.font = 'bold 48px monospace';
      ctx.fillText('GALAGA', WIDTH / 2, 200);

      ctx.fillStyle = '#fff';
      ctx.font = '14px monospace';
      ctx.fillText('SPACE 키로 시작', WIDTH / 2, 300);

      ctx.fillStyle = '#8080a0';
      ctx.font = '12px monospace';
      ctx.fillText('← → 이동   SPACE 발사   P 일시정지   M 음소거', WIDTH / 2, 340);

      const scores = game.highScores.load();
      ctx.fillStyle = '#5ce1e6';
      ctx.fillText('- HIGH SCORES -', WIDTH / 2, 420);
      ctx.fillStyle = '#fff';
      scores.forEach((score, i) => {
        ctx.fillText(`${i + 1}.  ${String(score).padStart(6, '0')}`, WIDTH / 2, 450 + i * 22);
      });
      if (scores.length === 0) ctx.fillText('아직 기록이 없습니다', WIDTH / 2, 450);

      ctx.textAlign = 'left';
    },
  };
}
```

`js/scenes/playScene.js` — 지금은 껍데기. Task 8·13에서 채운다.

```js
import { WIDTH, HEIGHT } from '../config.js';
import { createStarfield } from '../gfx/starfield.js';

export function createPlayScene(game) {
  const stars = createStarfield();

  return {
    update(dt) {
      stars.update(dt);
      // 임시: Space로 게임오버 화면 확인 — Task 13에서 실제 게임 로직으로 대체된다.
      if (game.input.wasPressed('Space')) {
        game.changeScene('gameover', { score: 0, cleared: false });
      }
    },
    render(ctx) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      stars.render(ctx);
      ctx.fillStyle = '#fff';
      ctx.font = '14px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('PLAY (구현 예정)', WIDTH / 2, HEIGHT / 2);
      ctx.textAlign = 'left';
    },
  };
}
```

`js/scenes/gameOverScene.js`:

```js
import { WIDTH, HEIGHT } from '../config.js';
import { createStarfield } from '../gfx/starfield.js';

export function createGameOverScene(game, { score = 0, cleared = false } = {}) {
  const stars = createStarfield();
  const ranked = game.highScores.save(score);
  const isNewBest = ranked[0] === score && score > 0;

  return {
    update(dt) {
      stars.update(dt);
      if (game.input.wasPressed('Space')) game.changeScene('title');
    },
    render(ctx) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      stars.render(ctx);

      ctx.textAlign = 'center';
      ctx.fillStyle = cleared ? '#7dff6b' : '#e94040';
      ctx.font = 'bold 32px monospace';
      ctx.fillText(cleared ? 'STAGE CLEAR!' : 'GAME OVER', WIDTH / 2, 220);

      ctx.fillStyle = '#fff';
      ctx.font = '16px monospace';
      ctx.fillText(`SCORE  ${String(score).padStart(6, '0')}`, WIDTH / 2, 290);

      if (isNewBest) {
        ctx.fillStyle = '#ffd24a';
        ctx.fillText('★ 신기록! ★', WIDTH / 2, 325);
      }

      ctx.fillStyle = '#8080a0';
      ctx.font = '12px monospace';
      ctx.fillText('SPACE 키로 타이틀로', WIDTH / 2, 400);
      ctx.textAlign = 'left';
    },
  };
}
```

- [ ] **Step 7: `js/main.js` 전면 교체**

```js
import { WIDTH, HEIGHT } from './config.js';
import { createLoop } from './core/loop.js';
import { createInput } from './core/input.js';
import { createHighScores } from './core/storage.js';
import { createSpriteFactory } from './gfx/spriteFactory.js';
import { createSceneManager } from './scenes/sceneManager.js';
import { createTitleScene } from './scenes/titleScene.js';
import { createPlayScene } from './scenes/playScene.js';
import { createGameOverScene } from './scenes/gameOverScene.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

const input = createInput(window);
const sprites = createSpriteFactory(3);
const highScores = createHighScores(window.localStorage);

const scenes = createSceneManager({
  title: createTitleScene,
  play: createPlayScene,
  gameover: createGameOverScene,
});

scenes.setContext({
  input,
  sprites,
  highScores,
  changeScene: (name, params) => scenes.change(name, params),
});

scenes.change('title');

const loop = createLoop({
  update(dt) {
    scenes.update(dt);
    input.endFrame(); // wasPressed는 한 프레임만 살아 있다.
  },
  render() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    scenes.render(ctx);
  },
});

function frame(nowMs) {
  loop.tick(nowMs / 1000);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
```

- [ ] **Step 8: 브라우저에서 확인**

`npm run serve` → 별이 흐르는 타이틀 화면 → Space → PLAY 화면 → Space → GAME OVER 화면 → Space → 타이틀. 순환하는지 확인한다.

- [ ] **Step 9: 커밋**

```bash
git add js/scenes/ js/gfx/starfield.js test/sceneManager.test.js js/main.js
git commit -m "feat: 씬 매니저와 타이틀/플레이/게임오버 화면, 스타필드 배경"
```

---

## Task 7: 탄 오브젝트 풀

탄은 초당 수십 개가 생기고 사라진다. 매번 새 객체를 만들면 GC가 튀므로 풀에서 재사용한다.

**Files:**
- Create: `js/game/bullet.js`
- Test: `test/bullet.test.js`

**Interfaces:**
- Consumes: 없음
- Produces:
  - `createBulletPool(size = 64)` → `{ spawn(opts), update(dt, bounds), items, aliveCount() }`
  - `spawn({ x, y, vx = 0, vy, w, h, sprite })` → 활성화된 탄 객체 또는 풀이 꽉 찼으면 `null`.
  - 탄 객체: `{ x, y, vx, vy, w, h, sprite, alive }`.
  - `update(dt, { width, height })` — 위치 갱신 후 화면 밖으로 나가면 `alive = false`.
  - `items` — 풀 배열 전체(죽은 것 포함). 충돌 검사는 `forEachHit`이 `alive`를 걸러 준다.

- [ ] **Step 1: 실패하는 테스트 작성**

`test/bullet.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBulletPool } from '../js/game/bullet.js';

const BOUNDS = { width: 480, height: 640 };

test('spawn하면 살아있는 탄이 하나 생긴다', () => {
  const pool = createBulletPool(4);
  const bullet = pool.spawn({ x: 10, y: 20, vy: -400, w: 3, h: 8, sprite: 'playerShot' });
  assert.equal(bullet.alive, true);
  assert.equal(bullet.x, 10);
  assert.equal(bullet.vy, -400);
  assert.equal(pool.aliveCount(), 1);
});

test('update는 속도만큼 위치를 옮긴다', () => {
  const pool = createBulletPool(4);
  const bullet = pool.spawn({ x: 100, y: 100, vx: 10, vy: -200, w: 3, h: 8, sprite: 's' });
  pool.update(0.5, BOUNDS);
  assert.equal(bullet.x, 105);
  assert.equal(bullet.y, 0);
});

test('화면 위로 나가면 죽는다', () => {
  const pool = createBulletPool(4);
  pool.spawn({ x: 100, y: 5, vy: -400, w: 3, h: 8, sprite: 's' });
  pool.update(0.1, BOUNDS);
  assert.equal(pool.aliveCount(), 0);
});

test('화면 아래로 나가면 죽는다', () => {
  const pool = createBulletPool(4);
  pool.spawn({ x: 100, y: 630, vy: 400, w: 3, h: 8, sprite: 's' });
  pool.update(0.1, BOUNDS);
  assert.equal(pool.aliveCount(), 0);
});

test('죽은 탄의 슬롯을 재사용한다 (새 객체를 만들지 않는다)', () => {
  const pool = createBulletPool(1);
  const first = pool.spawn({ x: 0, y: 5, vy: -400, w: 3, h: 8, sprite: 's' });
  pool.update(0.1, BOUNDS); // 화면 밖 → 사망
  const second = pool.spawn({ x: 50, y: 300, vy: -400, w: 3, h: 8, sprite: 's' });
  assert.equal(first, second); // 같은 객체가 재사용됐다
  assert.equal(second.x, 50);
  assert.equal(second.alive, true);
});

test('풀이 꽉 차면 null을 반환한다', () => {
  const pool = createBulletPool(1);
  pool.spawn({ x: 0, y: 300, vy: -400, w: 3, h: 8, sprite: 's' });
  const overflow = pool.spawn({ x: 0, y: 300, vy: -400, w: 3, h: 8, sprite: 's' });
  assert.equal(overflow, null);
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npm test`
Expected: FAIL — `Cannot find module '../js/game/bullet.js'`

- [ ] **Step 3: 최소 구현 작성**

`js/game/bullet.js`:

```js
const MARGIN = 20; // 화면 밖 여유 — 이만큼 벗어나야 회수한다.

/**
 * 탄 오브젝트 풀. 죽은 슬롯을 재사용해 GC 스파이크를 막는다.
 * items에는 죽은 탄도 들어 있다 — 순회하는 쪽이 alive를 확인해야 한다.
 */
export function createBulletPool(size = 64) {
  const items = Array.from({ length: size }, () => ({
    x: 0, y: 0, vx: 0, vy: 0, w: 0, h: 0, sprite: null, alive: false,
  }));

  function spawn({ x, y, vx = 0, vy, w, h, sprite }) {
    const bullet = items.find((b) => !b.alive);
    if (!bullet) return null; // 풀이 꽉 참 — 조용히 무시한다.
    Object.assign(bullet, { x, y, vx, vy, w, h, sprite, alive: true });
    return bullet;
  }

  function update(dt, { width, height }) {
    for (const b of items) {
      if (!b.alive) continue;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      const outside = b.y < -MARGIN || b.y > height + MARGIN
        || b.x < -MARGIN || b.x > width + MARGIN;
      if (outside) b.alive = false;
    }
  }

  return {
    items,
    spawn,
    update,
    aliveCount: () => items.filter((b) => b.alive).length,
  };
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test`
Expected: PASS — 39개 테스트 통과

- [ ] **Step 5: 커밋**

```bash
git add js/game/bullet.js test/bullet.test.js
git commit -m "feat: 탄 오브젝트 풀"
```

---

## Task 8: 플레이어 (이동 · 발사 · 무기 레벨 · 버프)

파워업 상태 전이는 순수 함수로 빼서 테스트한다. 이 태스크가 끝나면 화면에서 기체를 움직이고 쏠 수 있다.

**Files:**
- Create: `js/game/player.js`
- Modify: `js/scenes/playScene.js`
- Test: `test/player.test.js`

**Interfaces:**
- Consumes: `createBulletPool`, `createInput`
- Produces:
  - `PLAYER_BASE_SPEED = 220`, `PLAYER_SHOT_COOLDOWN = 0.28`, `MAX_WEAPON_LEVEL = 3`, `BUFF_DURATION = 10`
  - `createPlayerState()` → `{ weaponLevel: 1, shield: false, rapidTimer: 0, speedTimer: 0 }`
  - `applyPowerup(state, type)` → **새 상태 객체** (`type`: `'weapon' | 'shield' | 'rapid' | 'speed'`)
  - `tickBuffs(state, dt)` → 새 상태 (타이머 감소, 0 이하면 0으로 고정)
  - `onPlayerHit(state)` → `{ state, died }` — 실드가 있으면 실드만 소모하고 `died: false`. 없으면 무기 레벨 1 감소 + 버프 해제 + `died: true`.
  - `shotOffsets(weaponLevel)` → `[{ dx, vx }]` — 레벨별 탄 발사 위치·수평 속도.
  - `createPlayer(game, bulletPool)` → `{ x, y, w, h, alive, state, update(dt, input), render(ctx), hit(), respawn() }`

- [ ] **Step 1: 실패하는 테스트 작성**

`test/player.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  createPlayerState, applyPowerup, tickBuffs, onPlayerHit, shotOffsets,
  MAX_WEAPON_LEVEL, BUFF_DURATION,
} from '../js/game/player.js';

test('초기 상태는 무기 1레벨, 실드 없음, 버프 없음', () => {
  assert.deepEqual(createPlayerState(), {
    weaponLevel: 1, shield: false, rapidTimer: 0, speedTimer: 0,
  });
});

test('weapon 파워업은 무기 레벨을 올린다', () => {
  const s = applyPowerup(createPlayerState(), 'weapon');
  assert.equal(s.weaponLevel, 2);
});

test('무기 레벨은 최대치를 넘지 않는다', () => {
  let s = createPlayerState();
  for (let i = 0; i < 10; i += 1) s = applyPowerup(s, 'weapon');
  assert.equal(s.weaponLevel, MAX_WEAPON_LEVEL);
});

test('shield 파워업은 실드를 켠다', () => {
  assert.equal(applyPowerup(createPlayerState(), 'shield').shield, true);
});

test('rapid / speed 파워업은 타이머를 지속시간으로 채운다', () => {
  const s = applyPowerup(applyPowerup(createPlayerState(), 'rapid'), 'speed');
  assert.equal(s.rapidTimer, BUFF_DURATION);
  assert.equal(s.speedTimer, BUFF_DURATION);
});

test('같은 버프를 다시 먹으면 타이머가 갱신된다 (누적되지 않는다)', () => {
  let s = applyPowerup(createPlayerState(), 'rapid');
  s = tickBuffs(s, 6);              // 4초 남음
  s = applyPowerup(s, 'rapid');     // 다시 획득
  assert.equal(s.rapidTimer, BUFF_DURATION);
});

test('applyPowerup은 원본 상태를 바꾸지 않는다', () => {
  const original = createPlayerState();
  applyPowerup(original, 'weapon');
  assert.equal(original.weaponLevel, 1);
});

test('tickBuffs는 타이머를 줄이고 0 아래로 내리지 않는다', () => {
  let s = applyPowerup(createPlayerState(), 'rapid');
  s = tickBuffs(s, 3);
  assert.equal(s.rapidTimer, BUFF_DURATION - 3);
  s = tickBuffs(s, 100);
  assert.equal(s.rapidTimer, 0);
});

test('실드가 있으면 피격을 막고 죽지 않는다', () => {
  const shielded = applyPowerup(createPlayerState(), 'shield');
  const { state, died } = onPlayerHit(shielded);
  assert.equal(died, false);
  assert.equal(state.shield, false);      // 실드는 1회 소모
  assert.equal(state.weaponLevel, 1);     // 무기 레벨은 그대로
});

test('실드가 없으면 죽고 무기 레벨이 1 내려간다', () => {
  let s = applyPowerup(applyPowerup(createPlayerState(), 'weapon'), 'weapon'); // 3레벨
  const { state, died } = onPlayerHit(s);
  assert.equal(died, true);
  assert.equal(state.weaponLevel, 2);
});

test('무기 레벨은 사망해도 1 아래로 내려가지 않는다', () => {
  const { state } = onPlayerHit(createPlayerState());
  assert.equal(state.weaponLevel, 1);
});

test('사망하면 시한 버프가 전부 해제된다', () => {
  let s = applyPowerup(applyPowerup(createPlayerState(), 'rapid'), 'speed');
  const { state } = onPlayerHit(s);
  assert.equal(state.rapidTimer, 0);
  assert.equal(state.speedTimer, 0);
});

test('무기 레벨별 발사 수: 1발 / 2발 / 3발', () => {
  assert.equal(shotOffsets(1).length, 1);
  assert.equal(shotOffsets(2).length, 2);
  assert.equal(shotOffsets(3).length, 3);
});

test('1레벨은 정중앙으로 수직 발사', () => {
  const [shot] = shotOffsets(1);
  assert.equal(shot.dx, 0);
  assert.equal(shot.vx, 0);
});

test('3레벨은 좌우로 퍼지는 탄이 있다', () => {
  const shots = shotOffsets(3);
  assert.ok(shots.some((s) => s.vx < 0), '왼쪽으로 퍼지는 탄이 있어야 한다');
  assert.ok(shots.some((s) => s.vx > 0), '오른쪽으로 퍼지는 탄이 있어야 한다');
  assert.ok(shots.some((s) => s.vx === 0), '가운데 수직 탄이 있어야 한다');
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npm test`
Expected: FAIL — `Cannot find module '../js/game/player.js'`

- [ ] **Step 3: 최소 구현 작성**

`js/game/player.js`:

```js
import { WIDTH, HEIGHT } from '../config.js';

export const PLAYER_BASE_SPEED = 220;   // px/s
export const PLAYER_SHOT_COOLDOWN = 0.28; // 초
export const PLAYER_SHOT_SPEED = 480;   // px/s (위로)
export const MAX_WEAPON_LEVEL = 3;
export const BUFF_DURATION = 10;        // 초
export const RAPID_MULTIPLIER = 0.5;    // 연사 시 쿨다운 배율
export const SPEED_MULTIPLIER = 1.4;    // 속도 버프 시 이동속도 배율
export const RESPAWN_INVULN = 2;        // 초 — 부활 후 무적

const PLAYER_W = 15; // 스프라이트 5px × scale 3
const PLAYER_H = 18; // 6px × 3
const PLAYER_Y = HEIGHT - 60;

// ── 순수 상태 함수 ─────────────────────────────────────────────

export function createPlayerState() {
  return { weaponLevel: 1, shield: false, rapidTimer: 0, speedTimer: 0 };
}

/** 파워업 획득. 새 상태를 반환한다 (원본 불변). */
export function applyPowerup(state, type) {
  switch (type) {
    case 'weapon':
      return { ...state, weaponLevel: Math.min(state.weaponLevel + 1, MAX_WEAPON_LEVEL) };
    case 'shield':
      return { ...state, shield: true };
    case 'rapid':
      return { ...state, rapidTimer: BUFF_DURATION }; // 갱신 — 누적하지 않는다
    case 'speed':
      return { ...state, speedTimer: BUFF_DURATION };
    default:
      throw new Error(`알 수 없는 파워업입니다: ${type}`);
  }
}

/** 시한 버프 타이머를 dt만큼 줄인다. */
export function tickBuffs(state, dt) {
  return {
    ...state,
    rapidTimer: Math.max(0, state.rapidTimer - dt),
    speedTimer: Math.max(0, state.speedTimer - dt),
  };
}

/**
 * 피격 처리.
 * 실드가 있으면 실드만 깎고 살아남는다. 없으면 죽고 무기 레벨이 1 내려가며 버프가 사라진다.
 */
export function onPlayerHit(state) {
  if (state.shield) {
    return { state: { ...state, shield: false }, died: false };
  }
  return {
    state: {
      weaponLevel: Math.max(1, state.weaponLevel - 1),
      shield: false,
      rapidTimer: 0,
      speedTimer: 0,
    },
    died: true,
  };
}

/** 무기 레벨별 탄 발사 오프셋. dx는 기체 중심 기준 수평 위치, vx는 수평 속도. */
export function shotOffsets(weaponLevel) {
  switch (weaponLevel) {
    case 1: return [{ dx: 0, vx: 0 }];
    case 2: return [{ dx: -5, vx: 0 }, { dx: 5, vx: 0 }];
    default: return [{ dx: -6, vx: -120 }, { dx: 0, vx: 0 }, { dx: 6, vx: 120 }];
  }
}

// ── 엔티티 ────────────────────────────────────────────────────

export function createPlayer(game, bulletPool) {
  const player = {
    x: WIDTH / 2 - PLAYER_W / 2,
    y: PLAYER_Y,
    w: PLAYER_W,
    h: PLAYER_H,
    alive: true,
    state: createPlayerState(),
    invulnTimer: 0,
    cooldown: 0,
    elapsed: 0, // 무적 깜빡임용

    update(dt, input) {
      this.elapsed += dt;
      this.state = tickBuffs(this.state, dt);
      this.invulnTimer = Math.max(0, this.invulnTimer - dt);
      this.cooldown = Math.max(0, this.cooldown - dt);

      const speed = PLAYER_BASE_SPEED * (this.state.speedTimer > 0 ? SPEED_MULTIPLIER : 1);
      if (input.isDown('ArrowLeft')) this.x -= speed * dt;
      if (input.isDown('ArrowRight')) this.x += speed * dt;
      this.x = Math.max(0, Math.min(WIDTH - this.w, this.x)); // 화면 밖으로 못 나간다

      if (input.isDown('Space') && this.cooldown === 0) this.shoot();
    },

    shoot() {
      const cooldown = PLAYER_SHOT_COOLDOWN
        * (this.state.rapidTimer > 0 ? RAPID_MULTIPLIER : 1);
      this.cooldown = cooldown;

      const centerX = this.x + this.w / 2;
      for (const { dx, vx } of shotOffsets(this.state.weaponLevel)) {
        bulletPool.spawn({
          x: centerX + dx - 1.5,
          y: this.y - 8,
          vx,
          vy: -PLAYER_SHOT_SPEED,
          w: 3,
          h: 12,
          sprite: 'playerShot',
        });
      }
      game.audio?.play('shoot');
    },

    /** 피격. 죽었으면 true를 반환한다 (목숨 차감은 호출한 쪽이 한다). */
    hit() {
      if (this.invulnTimer > 0) return false;
      const { state, died } = onPlayerHit(this.state);
      this.state = state;
      if (died) {
        game.audio?.play('playerDeath');
        this.alive = false;
      } else {
        game.audio?.play('shieldBreak');
        this.invulnTimer = 0.5; // 실드가 깨진 직후 연속 피격 방지
      }
      return died;
    },

    respawn() {
      this.alive = true;
      this.x = WIDTH / 2 - PLAYER_W / 2;
      this.invulnTimer = RESPAWN_INVULN;
      this.cooldown = 0;
    },

    render(ctx) {
      if (!this.alive) return;
      // 무적 중에는 깜빡인다 (2초 동안 초당 10번).
      const blinking = this.invulnTimer > 0 && Math.floor(this.elapsed * 10) % 2 === 0;
      if (blinking) return;

      ctx.drawImage(game.sprites.get('player'), Math.round(this.x), Math.round(this.y));

      if (this.state.shield) {
        ctx.strokeStyle = '#5ce1e6';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(this.x + this.w / 2, this.y + this.h / 2, 16, 0, Math.PI * 2);
        ctx.stroke();
      }
    },
  };

  return player;
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test`
Expected: PASS — 54개 테스트 통과

- [ ] **Step 5: `js/scenes/playScene.js`에 플레이어 붙이기**

```js
import { WIDTH, HEIGHT } from '../config.js';
import { createStarfield } from '../gfx/starfield.js';
import { createBulletPool } from '../game/bullet.js';
import { createPlayer } from '../game/player.js';

export function createPlayScene(game) {
  const stars = createStarfield();
  const playerBullets = createBulletPool(48);
  const player = createPlayer(game, playerBullets);

  return {
    update(dt) {
      stars.update(dt);
      player.update(dt, game.input);
      playerBullets.update(dt, { width: WIDTH, height: HEIGHT });
    },
    render(ctx) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      stars.render(ctx);

      for (const b of playerBullets.items) {
        if (!b.alive) continue;
        ctx.drawImage(game.sprites.get(b.sprite), Math.round(b.x), Math.round(b.y));
      }
      player.render(ctx);
    },
  };
}
```

- [ ] **Step 6: 브라우저에서 확인**

`npm run serve` → 타이틀에서 Space → 기체가 ← → 로 움직이고, Space를 누르면 탄이 위로 나가는지 확인한다. 화면 밖으로 안 나가는지도 확인한다.

- [ ] **Step 7: 커밋**

```bash
git add js/game/player.js test/player.test.js js/scenes/playScene.js
git commit -m "feat: 플레이어 이동·발사·무기 레벨·버프 상태"
```

---

## Task 9: 대형(Formation) 좌표

적이 정렬할 그리드와, 대형 전체를 좌우로 흔드는 로직. 순수 함수라 전부 테스트한다.

**Files:**
- Create: `js/game/formation.js`
- Test: `test/formation.test.js`

**Interfaces:**
- Consumes: `WIDTH`
- Produces:
  - `FORMATION_COLS = 8`, `FORMATION_ROWS = 5`, `SLOT_W = 44`, `SLOT_H = 40`, `SWAY_AMPLITUDE = 24`, `SWAY_PERIOD = 4`
  - `swayOffset(time)` → `number` — 사인파 좌우 오프셋 (px)
  - `slotPosition(col, row)` → `{ x, y }` — 흔들림을 뺀 기준 좌표 (대형 중앙 정렬)
  - `formationSlot(col, row, time)` → `{ x, y }` — 흔들림을 더한 실제 좌표
  - `createFormation()` → `{ update(dt), slotAt(col, row), time }`

- [ ] **Step 1: 실패하는 테스트 작성**

`test/formation.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  slotPosition, swayOffset, formationSlot, createFormation,
  FORMATION_COLS, SLOT_W, SWAY_AMPLITUDE, SWAY_PERIOD,
} from '../js/game/formation.js';
import { WIDTH } from '../js/config.js';

test('대형은 화면 가로 중앙에 정렬된다', () => {
  const left = slotPosition(0, 0);
  const right = slotPosition(FORMATION_COLS - 1, 0);
  const leftGap = left.x;
  const rightGap = WIDTH - (right.x + SLOT_W);
  // 좌우 여백이 같아야 중앙 정렬이다 (반올림 오차 1px 허용).
  assert.ok(Math.abs(leftGap - rightGap) <= 1, `좌우 여백 불일치: ${leftGap} vs ${rightGap}`);
});

test('열이 커지면 x가 SLOT_W만큼 커진다', () => {
  assert.equal(slotPosition(1, 0).x - slotPosition(0, 0).x, SLOT_W);
});

test('행이 커지면 y가 아래로 내려간다', () => {
  assert.ok(slotPosition(0, 1).y > slotPosition(0, 0).y);
});

test('흔들림은 t=0에서 0, 주기의 1/4에서 최대', () => {
  assert.equal(swayOffset(0), 0);
  assert.ok(Math.abs(swayOffset(SWAY_PERIOD / 4) - SWAY_AMPLITUDE) < 0.001);
});

test('흔들림은 진폭을 넘지 않는다', () => {
  for (let t = 0; t < SWAY_PERIOD * 2; t += 0.05) {
    assert.ok(Math.abs(swayOffset(t)) <= SWAY_AMPLITUDE + 0.001, `t=${t}에서 진폭 초과`);
  }
});

test('흔들림은 주기마다 반복된다', () => {
  assert.ok(Math.abs(swayOffset(1.3) - swayOffset(1.3 + SWAY_PERIOD)) < 0.001);
});

test('formationSlot은 기준 좌표에 흔들림을 더한 값', () => {
  const t = 0.7;
  const base = slotPosition(2, 1);
  const actual = formationSlot(2, 1, t);
  assert.ok(Math.abs(actual.x - (base.x + swayOffset(t))) < 0.001);
  assert.equal(actual.y, base.y); // y는 흔들리지 않는다
});

test('createFormation은 update로 시간을 누적한다', () => {
  const formation = createFormation();
  const before = formation.slotAt(0, 0).x;
  formation.update(SWAY_PERIOD / 4);
  const after = formation.slotAt(0, 0).x;
  assert.ok(Math.abs(after - before - SWAY_AMPLITUDE) < 0.001);
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npm test`
Expected: FAIL — `Cannot find module '../js/game/formation.js'`

- [ ] **Step 3: 최소 구현 작성**

`js/game/formation.js`:

```js
import { WIDTH } from '../config.js';

export const FORMATION_COLS = 8;
export const FORMATION_ROWS = 5;
export const SLOT_W = 44;
export const SLOT_H = 40;
export const FORMATION_TOP = 70;   // 첫 행의 y
export const SWAY_AMPLITUDE = 24;  // px — 좌우 흔들림 폭
export const SWAY_PERIOD = 4;      // 초 — 한 번 왕복하는 데 걸리는 시간

// 대형 전체 폭을 화면 중앙에 맞추기 위한 좌측 여백
const ORIGIN_X = (WIDTH - FORMATION_COLS * SLOT_W) / 2;

/** 흔들림을 뺀 슬롯 기준 좌표. */
export function slotPosition(col, row) {
  return {
    x: ORIGIN_X + col * SLOT_W,
    y: FORMATION_TOP + row * SLOT_H,
  };
}

/** 대형 전체의 좌우 흔들림 오프셋. 사인파라 끝에서 부드럽게 되돌아온다. */
export function swayOffset(time) {
  return Math.sin((time / SWAY_PERIOD) * Math.PI * 2) * SWAY_AMPLITUDE;
}

/** 흔들림이 반영된 실제 슬롯 좌표. 적은 매 프레임 이 값을 조회한다. */
export function formationSlot(col, row, time) {
  const base = slotPosition(col, row);
  return { x: base.x + swayOffset(time), y: base.y };
}

/**
 * 대형. 시간만 들고 있으면 되므로 상태가 거의 없다.
 * 적 개체는 자기 슬롯을 조회만 하므로, 대형 이동과 적 로직이 분리된다.
 */
export function createFormation() {
  let time = 0;
  return {
    update(dt) { time += dt; },
    slotAt(col, row) { return formationSlot(col, row, time); },
    get time() { return time; },
  };
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test`
Expected: PASS — 62개 테스트 통과

- [ ] **Step 5: 커밋**

```bash
git add js/game/formation.js test/formation.test.js
git commit -m "feat: 적 대형 그리드 좌표와 좌우 흔들림"
```

---

## Task 10: 베지어 경로

적의 진입·급강하 곡선. 3차 베지어 곡선을 시간에 따라 따라간다.

**Files:**
- Create: `js/game/paths.js`
- Test: `test/paths.test.js`

**Interfaces:**
- Consumes: `WIDTH`, `HEIGHT`
- Produces:
  - `cubicBezier(p0, p1, p2, p3, t)` → `{ x, y }` — `t`는 0~1
  - `ENTRY_PATHS` → `{ [name]: (slot) => [p0, p1, p2, p3] }` — 진입 경로. `slot`은 목표 슬롯 좌표 `{ x, y }`. 경로의 마지막 점은 반드시 슬롯 좌표다.
  - 진입 경로 이름: `'leftLoop'`, `'rightLoop'`, `'topDive'`
  - `divePath(from, playerX)` → `[p0, p1, p2, p3]` — 급강하 경로. 화면 아래(`y = HEIGHT + 40`)에서 끝난다.
  - `createPathFollower(points, duration)` → `{ update(dt), position(), done }` — 경로를 `duration`초에 걸쳐 따라간다.

- [ ] **Step 1: 실패하는 테스트 작성**

`test/paths.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { cubicBezier, ENTRY_PATHS, divePath, createPathFollower } from '../js/game/paths.js';
import { HEIGHT } from '../js/config.js';

const P = (x, y) => ({ x, y });

test('t=0이면 시작점, t=1이면 끝점', () => {
  const pts = [P(0, 0), P(10, 50), P(90, 50), P(100, 100)];
  assert.deepEqual(cubicBezier(...pts, 0), { x: 0, y: 0 });
  const end = cubicBezier(...pts, 1);
  assert.ok(Math.abs(end.x - 100) < 0.001);
  assert.ok(Math.abs(end.y - 100) < 0.001);
});

test('t=0.5는 시작점과 끝점 사이에 있다', () => {
  const mid = cubicBezier(P(0, 0), P(0, 100), P(100, 100), P(100, 0), 0.5);
  assert.ok(mid.x > 0 && mid.x < 100);
  assert.ok(mid.y > 0);
});

test('모든 진입 경로는 목표 슬롯에서 끝난다', () => {
  const slot = P(200, 150);
  for (const [name, build] of Object.entries(ENTRY_PATHS)) {
    const points = build(slot);
    const end = cubicBezier(...points, 1);
    assert.ok(Math.abs(end.x - slot.x) < 0.001, `${name}: x가 슬롯과 다름`);
    assert.ok(Math.abs(end.y - slot.y) < 0.001, `${name}: y가 슬롯과 다름`);
  }
});

test('진입 경로는 화면 밖에서 시작한다', () => {
  const slot = P(200, 150);
  for (const [name, build] of Object.entries(ENTRY_PATHS)) {
    const start = build(slot)[0];
    const outside = start.y < 0 || start.x < 0 || start.x > 480;
    assert.ok(outside, `${name}: 시작점이 화면 안에 있음 (${start.x}, ${start.y})`);
  }
});

test('급강하 경로는 화면 아래에서 끝난다', () => {
  const end = cubicBezier(...divePath(P(100, 100), 300), 1);
  assert.ok(end.y > HEIGHT, '급강하는 화면 아래로 빠져나가야 한다');
});

test('급강하 경로는 플레이어 쪽으로 휜다', () => {
  // 플레이어가 오른쪽 끝에 있으면 경로 중간이 시작점보다 오른쪽으로 가야 한다.
  const mid = cubicBezier(...divePath(P(100, 100), 460), 0.5);
  assert.ok(mid.x > 100, `플레이어(x=460) 쪽으로 휘지 않았다: ${mid.x}`);
});

test('경로 추종기는 duration에 걸쳐 끝점에 도달한다', () => {
  const follower = createPathFollower([P(0, 0), P(0, 50), P(100, 50), P(100, 100)], 2);
  assert.equal(follower.done, false);
  follower.update(1);
  assert.equal(follower.done, false);
  follower.update(1);
  assert.equal(follower.done, true);
  const pos = follower.position();
  assert.ok(Math.abs(pos.x - 100) < 0.001);
  assert.ok(Math.abs(pos.y - 100) < 0.001);
});

test('경로 추종기는 duration을 넘겨도 끝점을 유지한다', () => {
  const follower = createPathFollower([P(0, 0), P(0, 0), P(10, 10), P(10, 10)], 1);
  follower.update(99);
  assert.equal(follower.done, true);
  assert.ok(Math.abs(follower.position().x - 10) < 0.001);
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npm test`
Expected: FAIL — `Cannot find module '../js/game/paths.js'`

- [ ] **Step 3: 최소 구현 작성**

`js/game/paths.js`:

```js
import { WIDTH, HEIGHT } from '../config.js';

const P = (x, y) => ({ x, y });

/** 3차 베지어 곡선 위의 점. t는 0~1. */
export function cubicBezier(p0, p1, p2, p3, t) {
  const u = 1 - t;
  const a = u * u * u;
  const b = 3 * u * u * t;
  const c = 3 * u * t * t;
  const d = t * t * t;
  return {
    x: a * p0.x + b * p1.x + c * p2.x + d * p3.x,
    y: a * p0.y + b * p1.y + c * p2.y + d * p3.y,
  };
}

/**
 * 진입 경로. 화면 밖에서 출발해 목표 슬롯에서 끝난다.
 * 모양을 바꾸고 싶으면 중간 제어점(p1, p2)을 조정한다.
 */
export const ENTRY_PATHS = {
  // 왼쪽 아래에서 크게 원을 그리며 올라온다.
  leftLoop: (slot) => [
    P(-40, HEIGHT * 0.55),
    P(WIDTH * 0.15, HEIGHT * 0.15),
    P(WIDTH * 0.55, HEIGHT * 0.05),
    P(slot.x, slot.y),
  ],
  // 오른쪽 아래에서 크게 원을 그리며 올라온다.
  rightLoop: (slot) => [
    P(WIDTH + 40, HEIGHT * 0.55),
    P(WIDTH * 0.85, HEIGHT * 0.15),
    P(WIDTH * 0.45, HEIGHT * 0.05),
    P(slot.x, slot.y),
  ],
  // 위에서 S자로 흔들리며 내려온다.
  topDive: (slot) => [
    P(slot.x, -60),
    P(slot.x - 120, 60),
    P(slot.x + 120, 140),
    P(slot.x, slot.y),
  ],
};

/**
 * 급강하 경로. 대형의 자기 자리(from)에서 출발해 플레이어 쪽으로 휘며 화면 아래로 빠진다.
 */
export function divePath(from, playerX) {
  return [
    P(from.x, from.y),
    P(from.x + (playerX - from.x) * 0.2, from.y + 140), // 살짝 플레이어 쪽으로
    P(playerX, HEIGHT * 0.7),                            // 플레이어 바로 위를 지난다
    P(playerX + (playerX - from.x) * 0.3, HEIGHT + 40),  // 관성을 유지하며 이탈
  ];
}

/** 경로를 duration초에 걸쳐 따라간다. */
export function createPathFollower(points, duration) {
  let elapsed = 0;

  return {
    update(dt) { elapsed = Math.min(elapsed + dt, duration); },
    position() {
      const t = duration === 0 ? 1 : elapsed / duration;
      return cubicBezier(points[0], points[1], points[2], points[3], t);
    },
    get done() { return elapsed >= duration; },
    get progress() { return duration === 0 ? 1 : elapsed / duration; },
  };
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test`
Expected: PASS — 70개 테스트 통과

- [ ] **Step 5: 커밋**

```bash
git add js/game/paths.js test/paths.test.js
git commit -m "feat: 베지어 진입/급강하 경로"
```

---

## Task 11: 적 4상태 FSM

갤러그의 핵심. 진입 → 대형 → 급강하 → 복귀를 순환한다.

**Files:**
- Create: `js/game/enemy.js`, `js/game/score.js`
- Test: `test/enemy.test.js`, `test/score.test.js`

**Interfaces:**
- Consumes: `createPathFollower`, `ENTRY_PATHS`, `divePath`, `formation`
- Produces:
  - `ENEMY_STATE = { ENTERING, IN_FORMATION, DIVING, RETURNING }` (문자열 상수)
  - `ENEMY_TYPES = { bee: { hp, score, sprite, w, h }, butterfly: {...}, captain: {...} }`
  - `createEnemy({ type, col, row, entryPath, formation, game })` → 적 객체
  - 적 객체: `{ x, y, w, h, alive, type, col, row, state, hp, startDive(playerX, duration), update(dt), render(ctx), hit(damage) }`
  - `hit(damage)` → `boolean` (죽었으면 `true`)
  - `scoreFor(enemy)` (in `score.js`) → `number` — 급강하/복귀 중이면 2배.

- [ ] **Step 1: 실패하는 테스트 작성**

`test/score.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { scoreFor, ENEMY_BASE_SCORE, STAGE_CLEAR_BONUS } from '../js/game/score.js';
import { ENEMY_STATE } from '../js/game/enemy.js';

test('대형 안의 적은 기본 점수', () => {
  const enemy = { type: 'bee', state: ENEMY_STATE.IN_FORMATION };
  assert.equal(scoreFor(enemy), ENEMY_BASE_SCORE.bee);
});

test('급강하 중인 적은 2배 점수', () => {
  const enemy = { type: 'bee', state: ENEMY_STATE.DIVING };
  assert.equal(scoreFor(enemy), ENEMY_BASE_SCORE.bee * 2);
});

test('복귀 중인 적도 2배 점수 (아직 대형 밖이다)', () => {
  const enemy = { type: 'butterfly', state: ENEMY_STATE.RETURNING };
  assert.equal(scoreFor(enemy), ENEMY_BASE_SCORE.butterfly * 2);
});

test('진입 중인 적은 기본 점수', () => {
  const enemy = { type: 'captain', state: ENEMY_STATE.ENTERING };
  assert.equal(scoreFor(enemy), ENEMY_BASE_SCORE.captain);
});

test('적 종류별 점수는 벌 < 나비 < 캡틴', () => {
  assert.ok(ENEMY_BASE_SCORE.bee < ENEMY_BASE_SCORE.butterfly);
  assert.ok(ENEMY_BASE_SCORE.butterfly < ENEMY_BASE_SCORE.captain);
});

test('스테이지 클리어 보너스는 스테이지 번호에 비례한다', () => {
  assert.ok(STAGE_CLEAR_BONUS(2) > STAGE_CLEAR_BONUS(1));
});
```

`test/enemy.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createEnemy, ENEMY_STATE, ENEMY_TYPES } from '../js/game/enemy.js';
import { createFormation } from '../js/game/formation.js';

/** 적 생성에 필요한 최소 게임 컨텍스트 (렌더·오디오는 쓰지 않는다) */
const fakeGame = { audio: { play() {} }, sprites: { get: () => null } };

function makeEnemy(overrides = {}) {
  return createEnemy({
    type: 'bee',
    col: 3,
    row: 1,
    entryPath: 'leftLoop',
    entryDuration: 2,
    formation: createFormation(),
    game: fakeGame,
    ...overrides,
  });
}

test('적은 ENTERING 상태로 시작한다', () => {
  assert.equal(makeEnemy().state, ENEMY_STATE.ENTERING);
});

test('진입이 끝나면 IN_FORMATION으로 전이한다', () => {
  const enemy = makeEnemy({ entryDuration: 2 });
  enemy.update(1);
  assert.equal(enemy.state, ENEMY_STATE.ENTERING);
  enemy.update(1.1);
  assert.equal(enemy.state, ENEMY_STATE.IN_FORMATION);
});

test('진입이 끝나면 자기 슬롯 좌표에 있다', () => {
  const formation = createFormation();
  const enemy = makeEnemy({ formation, col: 2, row: 1, entryDuration: 1 });
  enemy.update(1.5);
  const slot = formation.slotAt(2, 1);
  assert.ok(Math.abs(enemy.x - slot.x) < 1, `x가 슬롯과 다름: ${enemy.x} vs ${slot.x}`);
  assert.ok(Math.abs(enemy.y - slot.y) < 1);
});

test('대형에 있는 적은 슬롯을 따라 좌우로 흔들린다', () => {
  const formation = createFormation();
  const enemy = makeEnemy({ formation, entryDuration: 0.1 });
  enemy.update(0.2); // 대형 합류
  const x1 = enemy.x;
  formation.update(1); // 대형이 흔들린다
  enemy.update(0.016);
  assert.notEqual(enemy.x, x1, '대형이 흔들리면 적도 따라 움직여야 한다');
});

test('startDive는 DIVING으로 전이시킨다', () => {
  const enemy = makeEnemy({ entryDuration: 0.1 });
  enemy.update(0.2);
  enemy.startDive(240, 2.5);
  assert.equal(enemy.state, ENEMY_STATE.DIVING);
});

test('대형에 있지 않은 적은 급강하하지 않는다', () => {
  const enemy = makeEnemy(); // 아직 ENTERING
  enemy.startDive(240, 2.5);
  assert.equal(enemy.state, ENEMY_STATE.ENTERING);
});

test('급강하가 끝나면 RETURNING으로 전이한다', () => {
  const enemy = makeEnemy({ entryDuration: 0.1 });
  enemy.update(0.2);
  enemy.startDive(240, 2);
  enemy.update(2.1);
  assert.equal(enemy.state, ENEMY_STATE.RETURNING);
});

test('복귀가 끝나면 다시 IN_FORMATION이 된다', () => {
  const enemy = makeEnemy({ entryDuration: 0.1 });
  enemy.update(0.2);
  enemy.startDive(240, 1);
  enemy.update(1.1);   // 급강하 종료 → RETURNING
  enemy.update(3);     // 복귀 완료
  assert.equal(enemy.state, ENEMY_STATE.IN_FORMATION);
});

test('hp가 남으면 hit은 false, 0이 되면 true', () => {
  const enemy = makeEnemy({ type: 'captain' });
  const hp = ENEMY_TYPES.captain.hp;
  for (let i = 1; i < hp; i += 1) {
    assert.equal(enemy.hit(1), false, `${i}번째 피격에 죽으면 안 된다`);
  }
  assert.equal(enemy.hit(1), true);
  assert.equal(enemy.alive, false);
});

test('적 타입마다 체력이 다르다 (벌 1, 나비 1, 캡틴 2)', () => {
  assert.equal(ENEMY_TYPES.bee.hp, 1);
  assert.equal(ENEMY_TYPES.butterfly.hp, 1);
  assert.equal(ENEMY_TYPES.captain.hp, 2);
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npm test`
Expected: FAIL — `Cannot find module '../js/game/enemy.js'`

- [ ] **Step 3: `js/game/score.js` 구현**

```js
import { ENEMY_STATE } from './enemy.js';

/** 적 종류별 기본 점수. */
export const ENEMY_BASE_SCORE = {
  bee: 50,
  butterfly: 80,
  captain: 150,
};

export const BOSS_SCORE = 5000;

/** 스테이지 클리어 보너스 — 뒤로 갈수록 커진다. */
export const STAGE_CLEAR_BONUS = (stageNumber) => stageNumber * 500;

// 대형 밖으로 나온 적을 잡는 게 더 어렵다 → 갤러그의 리스크-리워드 규칙.
const RISK_STATES = new Set([ENEMY_STATE.DIVING, ENEMY_STATE.RETURNING]);

/** 적 격파 점수. 급강하/복귀 중이면 2배. */
export function scoreFor(enemy) {
  const base = ENEMY_BASE_SCORE[enemy.type] ?? 0;
  return RISK_STATES.has(enemy.state) ? base * 2 : base;
}
```

- [ ] **Step 4: `js/game/enemy.js` 구현**

```js
import { createPathFollower, ENTRY_PATHS, divePath } from './paths.js';

export const ENEMY_STATE = {
  ENTERING: 'ENTERING',
  IN_FORMATION: 'IN_FORMATION',
  DIVING: 'DIVING',
  RETURNING: 'RETURNING',
};

// 적 종류별 능력치. 스프라이트는 5×5px × scale 3 = 15px.
export const ENEMY_TYPES = {
  bee: { hp: 1, sprite: 'bee', w: 15, h: 15 },
  butterfly: { hp: 1, sprite: 'butterfly', w: 15, h: 15 },
  captain: { hp: 2, sprite: 'captain', w: 15, h: 15 },
};

const RETURN_DURATION = 2.5; // 초 — 화면 위에서 슬롯까지 복귀하는 시간

export function createEnemy({ type, col, row, entryPath, entryDuration = 2.5, formation, game }) {
  const spec = ENEMY_TYPES[type];
  if (!spec) throw new Error(`알 수 없는 적 타입입니다: ${type}`);

  const slot = formation.slotAt(col, row);
  const buildEntry = ENTRY_PATHS[entryPath];
  if (!buildEntry) throw new Error(`알 수 없는 진입 경로입니다: ${entryPath}`);

  const enemy = {
    type,
    col,
    row,
    w: spec.w,
    h: spec.h,
    hp: spec.hp,
    alive: true,
    state: ENEMY_STATE.ENTERING,
    x: slot.x,
    y: slot.y,
    follower: createPathFollower(buildEntry(slot), entryDuration),
    shootTimer: 0, // 급강하 중 사격 쿨다운 (playScene이 관리)

    /** 대형에 있는 적만 급강하할 수 있다. */
    startDive(playerX, duration = 2.5) {
      if (this.state !== ENEMY_STATE.IN_FORMATION) return;
      this.state = ENEMY_STATE.DIVING;
      this.follower = createPathFollower(divePath({ x: this.x, y: this.y }, playerX), duration);
      this.shootTimer = 0.4; // 급강하 시작 직후 첫 발
    },

    update(dt) {
      switch (this.state) {
        case ENEMY_STATE.ENTERING: {
          this.follower.update(dt);
          const pos = this.follower.position();
          this.x = pos.x;
          this.y = pos.y;
          if (this.follower.done) this.state = ENEMY_STATE.IN_FORMATION;
          break;
        }

        case ENEMY_STATE.IN_FORMATION: {
          // 대형 전체의 흔들림을 따라간다.
          const target = formation.slotAt(this.col, this.row);
          this.x = target.x;
          this.y = target.y;
          break;
        }

        case ENEMY_STATE.DIVING: {
          this.follower.update(dt);
          const pos = this.follower.position();
          this.x = pos.x;
          this.y = pos.y;
          this.shootTimer = Math.max(0, this.shootTimer - dt);
          if (this.follower.done) this.startReturn();
          break;
        }

        case ENEMY_STATE.RETURNING: {
          this.follower.update(dt);
          const pos = this.follower.position();
          this.x = pos.x;
          this.y = pos.y;
          if (this.follower.done) this.state = ENEMY_STATE.IN_FORMATION;
          break;
        }
      }
    },

    /** 화면 아래로 빠진 뒤 위에서 재진입해 슬롯으로 돌아온다. */
    startReturn() {
      this.state = ENEMY_STATE.RETURNING;
      const target = formation.slotAt(this.col, this.row);
      const entryX = target.x;
      this.follower = createPathFollower([
        { x: entryX, y: -50 },
        { x: entryX - 60, y: 40 },
        { x: entryX + 40, y: target.y - 60 },
        { x: target.x, y: target.y },
      ], RETURN_DURATION);
      this.x = entryX;
      this.y = -50;
    },

    /** 피격. 죽었으면 true. */
    hit(damage = 1) {
      this.hp -= damage;
      if (this.hp > 0) return false;
      this.alive = false;
      return true;
    },

    render(ctx) {
      if (!this.alive) return;
      ctx.drawImage(game.sprites.get(spec.sprite), Math.round(this.x), Math.round(this.y));
    },
  };

  return enemy;
}
```

`RETURNING` 상태에서 `formation.slotAt`을 다시 조회하지 않는 이유: 복귀 경로는 출발 시점에 한 번만 계산한다. 대형이 흔들리는 동안 목표가 미세하게 어긋나지만, 복귀 완료 후 `IN_FORMATION`으로 바뀌면 곧바로 슬롯에 스냅되므로 눈에 띄지 않는다.

- [ ] **Step 5: 테스트 통과 확인**

Run: `npm test`
Expected: PASS — 86개 테스트 통과

- [ ] **Step 6: 커밋**

```bash
git add js/game/enemy.js js/game/score.js test/enemy.test.js test/score.test.js
git commit -m "feat: 적 4상태 FSM과 점수 규칙 (급강하 2배)"
```

---

## Task 12: 스테이지 데이터 + 스포너

밸런스 수치를 전부 한 파일(`stages.js`)에 모은다. 이후 난이도 조정은 이 파일만 고친다.

**Files:**
- Create: `js/stages/stages.js`, `js/game/spawner.js`
- Test: `test/stages.test.js`, `test/spawner.test.js`

**Interfaces:**
- Consumes: `createEnemy`, `FORMATION_COLS`, `FORMATION_ROWS`, `ENEMY_TYPES`, `ENTRY_PATHS`
- Produces:
  - `STAGES` → 배열 (길이 5). 각 원소:
    ```js
    {
      waves: [{ type, entryPath, row, cols, delay }],  // delay: 웨이브 시작까지 대기(초)
      diveInterval: number,      // 급강하 지명 간격(초)
      diveCount: number,         // 한 번에 급강하할 적 수
      diveDuration: number,      // 급강하 1회에 걸리는 시간(초)
      enemyBulletSpeed: number,  // px/s
      enemyShootInterval: number,// 급강하 적의 사격 간격(초)
      dropRate: number,          // 파워업 드롭 확률 0~1
      isBoss: boolean,
    }
    ```
  - `getStage(index)` → 스테이지 데이터 (범위를 넘으면 마지막 스테이지)
  - `createSpawner(stage, { formation, game })` → `{ update(dt), enemies, done }`
    - `update(dt)`가 시간에 맞춰 웨이브를 순차 투입한다. 모든 웨이브를 내보내면 `done === true`.
    - `enemies` — 지금까지 생성된 적 배열 (죽은 적 포함; 순회 시 `alive` 확인).

- [ ] **Step 1: 실패하는 테스트 작성**

`test/stages.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { STAGES, getStage } from '../js/stages/stages.js';
import { ENEMY_TYPES } from '../js/game/enemy.js';
import { ENTRY_PATHS } from '../js/game/paths.js';
import { FORMATION_COLS, FORMATION_ROWS } from '../js/game/formation.js';

test('스테이지는 5개다', () => {
  assert.equal(STAGES.length, 5);
});

test('마지막 스테이지만 보스전이다', () => {
  STAGES.slice(0, 4).forEach((s, i) => assert.equal(s.isBoss, false, `스테이지 ${i + 1}`));
  assert.equal(STAGES[4].isBoss, true);
});

test('모든 웨이브가 유효한 적 타입과 진입 경로를 쓴다', () => {
  for (const [i, stage] of STAGES.entries()) {
    for (const wave of stage.waves) {
      assert.ok(wave.type in ENEMY_TYPES, `스테이지 ${i + 1}: 알 수 없는 적 ${wave.type}`);
      assert.ok(wave.entryPath in ENTRY_PATHS, `스테이지 ${i + 1}: 알 수 없는 경로 ${wave.entryPath}`);
    }
  }
});

test('모든 웨이브의 행·열이 대형 범위 안이다', () => {
  for (const [i, stage] of STAGES.entries()) {
    for (const wave of stage.waves) {
      assert.ok(wave.row >= 0 && wave.row < FORMATION_ROWS, `스테이지 ${i + 1}: 행 범위 초과`);
      for (const col of wave.cols) {
        assert.ok(col >= 0 && col < FORMATION_COLS, `스테이지 ${i + 1}: 열 범위 초과 (${col})`);
      }
    }
  }
});

test('한 슬롯(행,열)에 적이 둘 이상 배정되지 않는다', () => {
  for (const [i, stage] of STAGES.entries()) {
    const used = new Set();
    for (const wave of stage.waves) {
      for (const col of wave.cols) {
        const key = `${wave.row},${col}`;
        assert.ok(!used.has(key), `스테이지 ${i + 1}: 슬롯 ${key} 중복 배정`);
        used.add(key);
      }
    }
  }
});

test('난이도는 스테이지가 올라갈수록 높아진다', () => {
  const normal = STAGES.slice(0, 4);
  for (let i = 1; i < normal.length; i += 1) {
    assert.ok(
      normal[i].diveInterval <= normal[i - 1].diveInterval,
      `스테이지 ${i + 1}: 급강하 간격이 더 짧아져야 한다`,
    );
    assert.ok(
      normal[i].enemyBulletSpeed >= normal[i - 1].enemyBulletSpeed,
      `스테이지 ${i + 1}: 탄속이 느려지면 안 된다`,
    );
  }
});

test('getStage는 범위를 넘으면 마지막 스테이지를 준다', () => {
  assert.equal(getStage(0), STAGES[0]);
  assert.equal(getStage(99), STAGES[4]);
});
```

`test/spawner.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSpawner } from '../js/game/spawner.js';
import { createFormation } from '../js/game/formation.js';
import { ENEMY_STATE } from '../js/game/enemy.js';

const fakeGame = { audio: { play() {} }, sprites: { get: () => null } };

const stage = {
  waves: [
    { type: 'bee', entryPath: 'leftLoop', row: 0, cols: [0, 1], delay: 0 },
    { type: 'butterfly', entryPath: 'rightLoop', row: 1, cols: [2], delay: 1 },
  ],
  diveInterval: 2, diveCount: 1, diveDuration: 2.5,
  enemyBulletSpeed: 180, enemyShootInterval: 0.8, dropRate: 0.1, isBoss: false,
};

function makeSpawner() {
  return createSpawner(stage, { formation: createFormation(), game: fakeGame });
}

test('delay가 0인 웨이브는 즉시 투입된다', () => {
  const spawner = makeSpawner();
  spawner.update(0);
  assert.equal(spawner.enemies.length, 2); // bee × 2
});

test('delay가 지나야 다음 웨이브가 나온다', () => {
  const spawner = makeSpawner();
  spawner.update(0);
  assert.equal(spawner.enemies.length, 2);
  spawner.update(0.5);
  assert.equal(spawner.enemies.length, 2, '아직 1초가 안 지났다');
  spawner.update(0.6);
  assert.equal(spawner.enemies.length, 3);
});

test('모든 웨이브를 내보내면 done이 된다', () => {
  const spawner = makeSpawner();
  assert.equal(spawner.done, false);
  spawner.update(0);
  spawner.update(1.1);
  assert.equal(spawner.done, true);
});

test('생성된 적은 웨이브에 지정된 타입과 슬롯을 갖는다', () => {
  const spawner = makeSpawner();
  spawner.update(0);
  const [first, second] = spawner.enemies;
  assert.equal(first.type, 'bee');
  assert.equal(first.row, 0);
  assert.equal(first.col, 0);
  assert.equal(second.col, 1);
  assert.equal(first.state, ENEMY_STATE.ENTERING);
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npm test`
Expected: FAIL — `Cannot find module '../js/stages/stages.js'`

- [ ] **Step 3: `js/stages/stages.js` 작성**

```js
// ★ 게임 밸런스 데이터 전부. 난이도를 조정하려면 이 파일만 고치면 된다.
//
// waves[].delay — 스테이지 시작 후 이 웨이브가 투입되기까지의 대기 시간(초)
// diveInterval  — 대형에서 적을 급강하로 뽑아내는 간격(초). 작을수록 어렵다.
// diveCount     — 한 번에 뽑는 적 수
// diveDuration  — 급강하 곡선을 다 도는 데 걸리는 시간(초). 작을수록 빠르다.

export const STAGES = [
  // ── 스테이지 1 — 벌 8기, 급강하 드묾 ────────────────────────
  {
    waves: [
      { type: 'bee', entryPath: 'leftLoop', row: 2, cols: [0, 1, 2, 3], delay: 0 },
      { type: 'bee', entryPath: 'rightLoop', row: 2, cols: [4, 5, 6, 7], delay: 1.2 },
    ],
    diveInterval: 3.0,
    diveCount: 1,
    diveDuration: 3.0,
    enemyBulletSpeed: 170,
    enemyShootInterval: 1.0,
    dropRate: 0.12,
    isBoss: false,
  },

  // ── 스테이지 2 — 나비 추가 ─────────────────────────────────
  {
    waves: [
      { type: 'butterfly', entryPath: 'topDive', row: 1, cols: [2, 3, 4, 5], delay: 0 },
      { type: 'bee', entryPath: 'leftLoop', row: 2, cols: [0, 1, 2, 3], delay: 1.2 },
      { type: 'bee', entryPath: 'rightLoop', row: 2, cols: [4, 5, 6, 7], delay: 2.4 },
    ],
    diveInterval: 2.5,
    diveCount: 1,
    diveDuration: 2.8,
    enemyBulletSpeed: 190,
    enemyShootInterval: 0.9,
    dropRate: 0.12,
    isBoss: false,
  },

  // ── 스테이지 3 — 캡틴 등장, 동시 급강하 2기 ─────────────────
  {
    waves: [
      { type: 'captain', entryPath: 'topDive', row: 0, cols: [3, 4], delay: 0 },
      { type: 'butterfly', entryPath: 'leftLoop', row: 1, cols: [1, 2, 3, 4, 5, 6], delay: 1.0 },
      { type: 'bee', entryPath: 'rightLoop', row: 2, cols: [0, 1, 2, 3, 4, 5, 6, 7], delay: 2.2 },
    ],
    diveInterval: 2.0,
    diveCount: 2,
    diveDuration: 2.6,
    enemyBulletSpeed: 210,
    enemyShootInterval: 0.8,
    dropRate: 0.10,
    isBoss: false,
  },

  // ── 스테이지 4 — 대형 가득, 급강하 빈번 ─────────────────────
  {
    waves: [
      { type: 'captain', entryPath: 'topDive', row: 0, cols: [2, 3, 4, 5], delay: 0 },
      { type: 'butterfly', entryPath: 'leftLoop', row: 1, cols: [0, 1, 2, 3, 4, 5, 6, 7], delay: 1.0 },
      { type: 'butterfly', entryPath: 'rightLoop', row: 2, cols: [0, 1, 2, 3, 4, 5, 6, 7], delay: 2.2 },
      { type: 'bee', entryPath: 'leftLoop', row: 3, cols: [0, 1, 2, 3, 4, 5, 6, 7], delay: 3.4 },
    ],
    diveInterval: 1.5,
    diveCount: 2,
    diveDuration: 2.3,
    enemyBulletSpeed: 230,
    enemyShootInterval: 0.7,
    dropRate: 0.10,
    isBoss: false,
  },

  // ── 스테이지 5 — 보스전. 보스 + 호위 나비 ────────────────────
  {
    waves: [
      { type: 'butterfly', entryPath: 'leftLoop', row: 2, cols: [0, 1, 2], delay: 1.5 },
      { type: 'butterfly', entryPath: 'rightLoop', row: 2, cols: [5, 6, 7], delay: 1.5 },
    ],
    diveInterval: 2.5,
    diveCount: 1,
    diveDuration: 2.5,
    enemyBulletSpeed: 240,
    enemyShootInterval: 0.8,
    dropRate: 0.20, // 보스전은 드롭을 후하게
    isBoss: true,
  },
];

/** 범위를 넘어가면 마지막 스테이지를 돌려준다. */
export function getStage(index) {
  return STAGES[Math.min(index, STAGES.length - 1)];
}
```

- [ ] **Step 4: `js/game/spawner.js` 구현**

```js
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
```

- [ ] **Step 5: 테스트 통과 확인**

Run: `npm test`
Expected: PASS — 97개 테스트 통과

- [ ] **Step 6: 커밋**

```bash
git add js/stages/stages.js js/game/spawner.js test/stages.test.js test/spawner.test.js
git commit -m "feat: 5스테이지 밸런스 데이터와 웨이브 스포너"
```

---

## Task 13: 플레이 씬 통합 — 충돌 · 점수 · 목숨 · 파티클

여기서 처음으로 "게임"이 된다. 적이 나오고, 쏘면 죽고, 맞으면 목숨이 준다.

**Files:**
- Create: `js/game/particles.js`
- Modify: `js/scenes/playScene.js` (전면 교체)
- Test: `test/particles.test.js`

**Interfaces:**
- Consumes: 거의 전부 (`createSpawner`, `createFormation`, `createBulletPool`, `createPlayer`, `forEachHit`, `scoreFor`, `getStage`)
- Produces:
  - `createParticlePool(size = 120)` → `{ burst(x, y, color, count), update(dt), render(ctx), aliveCount() }`
  - playScene 내부 상태: `score`, `lives`(초기 3), `stageIndex`(0부터), `phase`(`'playing' | 'stageClear' | 'respawning'`)

- [ ] **Step 1: 실패하는 테스트 작성**

`test/particles.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createParticlePool } from '../js/game/particles.js';

test('burst는 요청한 개수만큼 파티클을 켠다', () => {
  const pool = createParticlePool(50);
  pool.burst(100, 100, '#fff', 12);
  assert.equal(pool.aliveCount(), 12);
});

test('수명이 다하면 죽는다', () => {
  const pool = createParticlePool(50);
  pool.burst(100, 100, '#fff', 5);
  pool.update(10); // 수명(최대 0.6초)을 훌쩍 넘긴다
  assert.equal(pool.aliveCount(), 0);
});

test('풀 크기를 넘는 요청은 있는 만큼만 켠다 (터지지 않는다)', () => {
  const pool = createParticlePool(4);
  pool.burst(0, 0, '#fff', 100);
  assert.equal(pool.aliveCount(), 4);
});

test('죽은 파티클의 슬롯을 재사용한다', () => {
  const pool = createParticlePool(4);
  pool.burst(0, 0, '#fff', 4);
  pool.update(10);
  pool.burst(0, 0, '#fff', 4);
  assert.equal(pool.aliveCount(), 4);
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npm test`
Expected: FAIL — `Cannot find module '../js/game/particles.js'`

- [ ] **Step 3: `js/game/particles.js` 구현**

```js
const MIN_LIFE = 0.25;
const MAX_LIFE = 0.6;
const SPEED = 140; // px/s

/** 폭발 파티클 풀. 사방으로 튀며 서서히 사라진다. */
export function createParticlePool(size = 120) {
  const items = Array.from({ length: size }, () => ({
    x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 1, color: '#fff', alive: false,
  }));

  function burst(x, y, color, count = 10) {
    let spawned = 0;
    for (const p of items) {
      if (spawned >= count) break;
      if (p.alive) continue;
      const angle = Math.random() * Math.PI * 2;
      const speed = SPEED * (0.4 + Math.random() * 0.6);
      const maxLife = MIN_LIFE + Math.random() * (MAX_LIFE - MIN_LIFE);
      Object.assign(p, {
        x, y, color, alive: true, maxLife, life: maxLife,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
      });
      spawned += 1;
    }
    // 풀이 모자라면 있는 만큼만 켠다 — 예외를 던지지 않는다.
  }

  function update(dt) {
    for (const p of items) {
      if (!p.alive) continue;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.life -= dt;
      if (p.life <= 0) p.alive = false;
    }
  }

  function render(ctx) {
    for (const p of items) {
      if (!p.alive) continue;
      ctx.globalAlpha = Math.max(0, p.life / p.maxLife); // 서서히 투명해진다
      ctx.fillStyle = p.color;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), 3, 3);
    }
    ctx.globalAlpha = 1;
  }

  return {
    items,
    burst,
    update,
    render,
    aliveCount: () => items.filter((p) => p.alive).length,
  };
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test`
Expected: PASS — 101개 테스트 통과

- [ ] **Step 5: `js/scenes/playScene.js` 전면 교체**

```js
import { WIDTH, HEIGHT } from '../config.js';
import { createStarfield } from '../gfx/starfield.js';
import { createBulletPool } from '../game/bullet.js';
import { createPlayer } from '../game/player.js';
import { createFormation } from '../game/formation.js';
import { createSpawner } from '../game/spawner.js';
import { createParticlePool } from '../game/particles.js';
import { forEachHit } from '../game/collision.js';
import { scoreFor, STAGE_CLEAR_BONUS } from '../game/score.js';
import { getStage, STAGES } from '../stages/stages.js';
import { ENEMY_STATE } from '../game/enemy.js';

const INITIAL_LIVES = 3;
const RESPAWN_DELAY = 1.2;   // 초 — 사망 후 부활까지
const STAGE_CLEAR_DELAY = 2; // 초 — 클리어 문구 표시 시간

export function createPlayScene(game) {
  const stars = createStarfield();
  const playerBullets = createBulletPool(48);
  const enemyBullets = createBulletPool(64);
  const particles = createParticlePool(140);
  const player = createPlayer(game, playerBullets);

  let score = 0;
  let lives = INITIAL_LIVES;
  let stageIndex = 0;
  let phase = 'playing'; // 'playing' | 'respawning' | 'stageClear'
  let phaseTimer = 0;
  let paused = false;

  let formation = createFormation();
  let spawner = createSpawner(getStage(stageIndex), { formation, game });
  let diveTimer = getStage(stageIndex).diveInterval;

  function stage() { return getStage(stageIndex); }

  function livingEnemies() {
    return spawner.enemies.filter((e) => e.alive);
  }

  /** 대형에 있는 적 중 diveCount기를 무작위로 골라 급강하시킨다. */
  function triggerDives() {
    const candidates = livingEnemies().filter((e) => e.state === ENEMY_STATE.IN_FORMATION);
    if (candidates.length === 0) return;

    const count = Math.min(stage().diveCount, candidates.length);
    for (let i = 0; i < count; i += 1) {
      const pick = candidates.splice(Math.floor(Math.random() * candidates.length), 1)[0];
      pick.startDive(player.x + player.w / 2, stage().diveDuration);
    }
  }

  /** 급강하 중인 적이 주기적으로 사격한다. */
  function enemyShooting(dt) {
    for (const enemy of livingEnemies()) {
      if (enemy.state !== ENEMY_STATE.DIVING) continue;
      enemy.shootTimer -= dt;
      if (enemy.shootTimer > 0) continue;
      enemy.shootTimer = stage().enemyShootInterval;
      enemyBullets.spawn({
        x: enemy.x + enemy.w / 2 - 1.5,
        y: enemy.y + enemy.h,
        vy: stage().enemyBulletSpeed,
        w: 3,
        h: 12,
        sprite: 'enemyShot',
      });
    }
  }

  function killEnemy(enemy) {
    score += scoreFor(enemy);
    particles.burst(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, '#ffd24a', 10);
    game.audio?.play('explosion');
    // 파워업 드롭은 Task 14에서 여기에 추가된다.
  }

  function playerDies() {
    particles.burst(player.x + player.w / 2, player.y + player.h / 2, '#e94040', 20);
    lives -= 1;
    if (lives <= 0) {
      game.changeScene('gameover', { score, cleared: false });
      return;
    }
    phase = 'respawning';
    phaseTimer = RESPAWN_DELAY;
  }

  function nextStage() {
    score += STAGE_CLEAR_BONUS(stageIndex + 1);
    stageIndex += 1;
    if (stageIndex >= STAGES.length) {
      game.changeScene('gameover', { score, cleared: true });
      return;
    }
    formation = createFormation();
    spawner = createSpawner(getStage(stageIndex), { formation, game });
    diveTimer = getStage(stageIndex).diveInterval;
    playerBullets.items.forEach((b) => { b.alive = false; });
    enemyBullets.items.forEach((b) => { b.alive = false; });
    phase = 'playing';
  }

  function checkStageClear() {
    // 스포너가 모든 웨이브를 내보냈고, 남은 적이 없으면 클리어.
    if (!spawner.done || livingEnemies().length > 0) return;
    game.audio?.play('stageClear');
    phase = 'stageClear';
    phaseTimer = STAGE_CLEAR_DELAY;
  }

  return {
    update(dt) {
      if (game.input.wasPressed('KeyP')) paused = !paused;
      if (paused) return;

      stars.update(dt);
      particles.update(dt);

      if (phase === 'respawning') {
        phaseTimer -= dt;
        if (phaseTimer <= 0) {
          player.respawn();
          phase = 'playing';
        }
        // 부활 대기 중에도 적과 탄은 계속 움직인다.
        formation.update(dt);
        spawner.update(dt);
        for (const e of livingEnemies()) e.update(dt);
        enemyBullets.update(dt, { width: WIDTH, height: HEIGHT });
        return;
      }

      if (phase === 'stageClear') {
        phaseTimer -= dt;
        if (phaseTimer <= 0) nextStage();
        return;
      }

      // ── phase === 'playing' ──
      formation.update(dt);
      spawner.update(dt);
      player.update(dt, game.input);

      for (const enemy of livingEnemies()) enemy.update(dt);

      diveTimer -= dt;
      if (diveTimer <= 0) {
        diveTimer = stage().diveInterval;
        triggerDives();
      }
      enemyShooting(dt);

      playerBullets.update(dt, { width: WIDTH, height: HEIGHT });
      enemyBullets.update(dt, { width: WIDTH, height: HEIGHT });

      // 충돌 1: 플레이어 탄 → 적
      forEachHit(playerBullets.items, spawner.enemies, (bullet, enemy) => {
        bullet.alive = false;
        if (enemy.hit(1)) killEnemy(enemy);
      });

      // 충돌 2: 적 탄 → 플레이어
      forEachHit(enemyBullets.items, [player], (bullet) => {
        bullet.alive = false;
        if (player.hit()) playerDies();
      });

      // 충돌 3: 급강하 중인 적 → 플레이어 (몸통 박치기)
      if (player.alive && player.invulnTimer === 0) {
        forEachHit(livingEnemies().filter((e) => e.state === ENEMY_STATE.DIVING), [player],
          (enemy) => {
            enemy.hit(999);
            killEnemy(enemy);
            if (player.hit()) playerDies();
          });
      }

      checkStageClear();
    },

    render(ctx) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      stars.render(ctx);

      for (const b of enemyBullets.items) {
        if (b.alive) ctx.drawImage(game.sprites.get(b.sprite), Math.round(b.x), Math.round(b.y));
      }
      for (const enemy of livingEnemies()) enemy.render(ctx);
      for (const b of playerBullets.items) {
        if (b.alive) ctx.drawImage(game.sprites.get(b.sprite), Math.round(b.x), Math.round(b.y));
      }
      player.render(ctx);
      particles.render(ctx);

      // 임시 HUD — Task 16에서 hud.js로 대체된다.
      ctx.fillStyle = '#fff';
      ctx.font = '12px monospace';
      ctx.fillText(`SCORE ${score}`, 10, 20);
      ctx.fillText(`LIVES ${lives}`, 10, 36);
      ctx.fillText(`STAGE ${stageIndex + 1}`, WIDTH - 90, 20);

      if (phase === 'stageClear') {
        ctx.textAlign = 'center';
        ctx.fillStyle = '#7dff6b';
        ctx.font = 'bold 24px monospace';
        ctx.fillText(`STAGE ${stageIndex + 1} CLEAR`, WIDTH / 2, HEIGHT / 2);
        ctx.textAlign = 'left';
      }

      if (paused) {
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 24px monospace';
        ctx.fillText('PAUSED', WIDTH / 2, HEIGHT / 2);
        ctx.textAlign = 'left';
      }
    },
  };
}
```

- [ ] **Step 6: 브라우저에서 플레이 확인**

`npm run serve` → 다음을 눈으로 확인한다.

1. 적이 곡선을 그리며 진입해 대형을 이룬다.
2. 대형이 좌우로 흔들린다.
3. 주기적으로 적이 급강하하며 총을 쏜다.
4. 적을 쏘면 폭발 파티클이 튀고 점수가 오른다.
5. 적 탄에 맞으면 목숨이 줄고, 잠시 후 깜빡이며 부활한다.
6. 적을 전멸시키면 STAGE CLEAR가 뜨고 다음 스테이지로 넘어간다.
7. P로 일시정지된다.
8. 목숨이 0이 되면 게임오버 화면으로 간다.

- [ ] **Step 7: 커밋**

```bash
git add js/game/particles.js test/particles.test.js js/scenes/playScene.js
git commit -m "feat: 플레이 씬 통합 - 충돌/점수/목숨/스테이지 진행"
```

---

## Task 14: 파워업 드롭 · 낙하 · 획득

**Files:**
- Create: `js/game/powerup.js`
- Modify: `js/scenes/playScene.js` (드롭 연결)
- Test: `test/powerup.test.js`

**Interfaces:**
- Consumes: `applyPowerup` (player.js), `forEachHit`
- Produces:
  - `POWERUP_TYPES = ['weapon', 'shield', 'rapid', 'speed']`
  - `rollDrop(dropRate, random = Math.random)` → `string | null` — 드롭 확률에 걸리면 타입 하나를 고른다.
  - `createPowerupPool(size = 8)` → `{ spawn(x, y, type), update(dt, height), items, render(ctx, sprites) }`
  - 파워업 객체: `{ x, y, w, h, type, alive }`. 낙하 속도 `POWERUP_FALL_SPEED = 90`.

- [ ] **Step 1: 실패하는 테스트 작성**

`test/powerup.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rollDrop, createPowerupPool, POWERUP_TYPES } from '../js/game/powerup.js';

test('드롭 확률이 0이면 절대 나오지 않는다', () => {
  assert.equal(rollDrop(0, () => 0), null);
});

test('드롭 확률이 1이면 항상 나온다', () => {
  assert.ok(POWERUP_TYPES.includes(rollDrop(1, () => 0.5)));
});

test('난수가 확률보다 크면 드롭하지 않는다', () => {
  // random()이 0.5 → dropRate 0.1보다 크므로 드롭 실패
  assert.equal(rollDrop(0.1, () => 0.5), null);
});

test('드롭되면 항상 유효한 타입이다', () => {
  for (let i = 0; i < 100; i += 1) {
    const type = rollDrop(1);
    assert.ok(POWERUP_TYPES.includes(type), `알 수 없는 타입: ${type}`);
  }
});

test('spawn한 파워업은 아래로 떨어진다', () => {
  const pool = createPowerupPool(4);
  const item = pool.spawn(100, 100, 'shield');
  pool.update(1, 640);
  assert.ok(item.y > 100, '아래로 내려가야 한다');
  assert.equal(item.type, 'shield');
});

test('화면 아래로 나가면 사라진다', () => {
  const pool = createPowerupPool(4);
  pool.spawn(100, 630, 'weapon');
  pool.update(1, 640);
  assert.equal(pool.items.filter((p) => p.alive).length, 0);
});

test('풀이 꽉 차면 null을 반환한다', () => {
  const pool = createPowerupPool(1);
  pool.spawn(0, 0, 'weapon');
  assert.equal(pool.spawn(0, 0, 'shield'), null);
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npm test`
Expected: FAIL — `Cannot find module '../js/game/powerup.js'`

- [ ] **Step 3: `js/game/powerup.js` 구현**

```js
export const POWERUP_TYPES = ['weapon', 'shield', 'rapid', 'speed'];
export const POWERUP_FALL_SPEED = 90; // px/s
const POWERUP_SIZE = 18;              // 6px 스프라이트 × scale 3

/**
 * 드롭 판정. 확률에 걸리면 타입 하나를 균등하게 고른다.
 * random을 주입받아 테스트할 수 있게 한다.
 */
export function rollDrop(dropRate, random = Math.random) {
  if (random() >= dropRate) return null;
  return POWERUP_TYPES[Math.floor(random() * POWERUP_TYPES.length)];
}

export function createPowerupPool(size = 8) {
  const items = Array.from({ length: size }, () => ({
    x: 0, y: 0, w: POWERUP_SIZE, h: POWERUP_SIZE, type: null, alive: false,
  }));

  function spawn(x, y, type) {
    const item = items.find((p) => !p.alive);
    if (!item) return null;
    Object.assign(item, { x, y, type, alive: true });
    return item;
  }

  function update(dt, height) {
    for (const p of items) {
      if (!p.alive) continue;
      p.y += POWERUP_FALL_SPEED * dt;
      if (p.y > height) p.alive = false; // 놓치면 사라진다
    }
  }

  function render(ctx, sprites) {
    for (const p of items) {
      if (!p.alive) continue;
      ctx.drawImage(sprites.get(`powerup_${p.type}`), Math.round(p.x), Math.round(p.y));
    }
  }

  return { items, spawn, update, render };
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test`
Expected: PASS — 108개 테스트 통과

- [ ] **Step 5: playScene에 파워업 연결**

`js/scenes/playScene.js`에 4곳을 고친다.

(1) import 추가:

```js
import { createPowerupPool, rollDrop } from '../game/powerup.js';
import { applyPowerup } from '../game/player.js';
```

(2) 풀 생성 — `const particles = createParticlePool(140);` 아래에:

```js
  const powerups = createPowerupPool(8);
```

(3) `killEnemy`에서 드롭 — 함수 끝의 주석을 실제 코드로 교체:

```js
  function killEnemy(enemy) {
    score += scoreFor(enemy);
    particles.burst(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, '#ffd24a', 10);
    game.audio?.play('explosion');

    const drop = rollDrop(stage().dropRate);
    if (drop) powerups.spawn(enemy.x, enemy.y, drop);
  }
```

(4) `update`의 `phase === 'playing'` 구간, 충돌 검사 뒤에 추가:

```js
      powerups.update(dt, HEIGHT);

      // 충돌 4: 파워업 → 플레이어
      if (player.alive) {
        forEachHit(powerups.items, [player], (item) => {
          item.alive = false;
          player.state = applyPowerup(player.state, item.type);
          game.audio?.play('powerup');
        });
      }
```

(5) `render`에서 파워업 그리기 — 적을 그리기 전에:

```js
      powerups.render(ctx, game.sprites);
```

- [ ] **Step 6: 브라우저에서 확인**

적을 잡다 보면 색색의 아이콘이 떨어지고, 먹으면 다음이 보이는지 확인한다.
- 노랑(weapon): 탄이 1발 → 2발 → 3발 확산으로 늘어난다
- 하늘(shield): 기체 주위에 링이 생기고, 한 번 맞으면 링만 사라진다
- 분홍(rapid): 10초간 연사가 빨라진다
- 연두(speed): 10초간 이동이 빨라진다

- [ ] **Step 7: 커밋**

```bash
git add js/game/powerup.js test/powerup.test.js js/scenes/playScene.js
git commit -m "feat: 파워업 4종 드롭/낙하/획득"
```

---

## Task 15: 보스 3페이즈

**Files:**
- Create: `js/game/boss.js`
- Modify: `js/scenes/playScene.js` (보스 스테이지 분기)
- Test: `test/boss.test.js`

**Interfaces:**
- Consumes: `createBulletPool`, `createEnemy`
- Produces:
  - `BOSS_MAX_HP = 120`, `BOSS_W = 48`, `BOSS_H = 36` (16×12 스프라이트 × scale 3)
  - `bossPhase(hpRatio)` → `1 | 2 | 3` — `> 0.66` → 1, `> 0.33` → 2, 그 외 3
  - `BOSS_PHASE_CONFIG = { 1: {...}, 2: {...}, 3: {...} }` — 페이즈별 이동 속도·사격 간격·패턴
  - `createBoss(game, enemyBullets)` → `{ x, y, w, h, hp, alive, phase, update(dt, playerX), render(ctx), hit(damage) }`
  - `spreadShot(originX, originY, count, speed)` → `[{ vx, vy }]` — 부채꼴 확산탄 속도 벡터
  - `aimedShot(originX, originY, targetX, targetY, speed)` → `{ vx, vy }` — 조준탄

- [ ] **Step 1: 실패하는 테스트 작성**

`test/boss.test.js`:

```js
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  bossPhase, spreadShot, aimedShot, createBoss, BOSS_MAX_HP,
} from '../js/game/boss.js';

const fakeGame = { audio: { play() {} }, sprites: { get: () => null } };
const fakeBullets = { spawn: () => ({}), items: [] };

test('HP 비율로 페이즈가 결정된다', () => {
  assert.equal(bossPhase(1.0), 1);
  assert.equal(bossPhase(0.7), 1);
  assert.equal(bossPhase(0.66), 2);  // 경계는 아래 페이즈에 속한다
  assert.equal(bossPhase(0.5), 2);
  assert.equal(bossPhase(0.33), 3);
  assert.equal(bossPhase(0.1), 3);
  assert.equal(bossPhase(0), 3);
});

test('확산탄은 요청한 개수만큼 나온다', () => {
  assert.equal(spreadShot(100, 100, 5, 200).length, 5);
});

test('확산탄은 전부 아래를 향한다', () => {
  for (const shot of spreadShot(100, 100, 5, 200)) {
    assert.ok(shot.vy > 0, `아래로 안 간다: vy=${shot.vy}`);
  }
});

test('확산탄은 좌우 대칭으로 퍼진다', () => {
  const shots = spreadShot(100, 100, 5, 200);
  assert.ok(shots.some((s) => s.vx < -1), '왼쪽으로 퍼지는 탄이 있어야 한다');
  assert.ok(shots.some((s) => s.vx > 1), '오른쪽으로 퍼지는 탄이 있어야 한다');
  // 가운데 탄은 거의 수직이다
  assert.ok(shots.some((s) => Math.abs(s.vx) < 1));
});

test('확산탄의 속력은 일정하다', () => {
  for (const shot of spreadShot(100, 100, 5, 200)) {
    const speed = Math.hypot(shot.vx, shot.vy);
    assert.ok(Math.abs(speed - 200) < 0.001, `속력이 다르다: ${speed}`);
  }
});

test('조준탄은 목표를 향한다', () => {
  // 목표가 정확히 아래에 있으면 수직으로 내려간다.
  const straight = aimedShot(100, 100, 100, 500, 200);
  assert.ok(Math.abs(straight.vx) < 0.001);
  assert.ok(straight.vy > 0);

  // 목표가 오른쪽 아래면 오른쪽으로 기운다.
  const right = aimedShot(100, 100, 400, 500, 200);
  assert.ok(right.vx > 0);
  assert.ok(right.vy > 0);
});

test('보스는 최대 체력으로 시작하고 1페이즈다', () => {
  const boss = createBoss(fakeGame, fakeBullets);
  assert.equal(boss.hp, BOSS_MAX_HP);
  assert.equal(boss.phase, 1);
  assert.equal(boss.alive, true);
});

test('체력이 줄면 페이즈가 올라간다', () => {
  const boss = createBoss(fakeGame, fakeBullets);
  boss.hit(BOSS_MAX_HP * 0.4); // 60% 남음
  boss.update(0, 240);
  assert.equal(boss.phase, 2);

  boss.hit(BOSS_MAX_HP * 0.4); // 20% 남음
  boss.update(0, 240);
  assert.equal(boss.phase, 3);
});

test('체력이 0이 되면 죽는다', () => {
  const boss = createBoss(fakeGame, fakeBullets);
  assert.equal(boss.hit(BOSS_MAX_HP - 1), false);
  assert.equal(boss.hit(1), true);
  assert.equal(boss.alive, false);
});

test('보스는 좌우로 움직이며 화면 밖으로 나가지 않는다', () => {
  const boss = createBoss(fakeGame, fakeBullets);
  for (let i = 0; i < 600; i += 1) {
    boss.update(0.05, 240);
    assert.ok(boss.x >= 0, `왼쪽 이탈: ${boss.x}`);
    assert.ok(boss.x + boss.w <= 480, `오른쪽 이탈: ${boss.x + boss.w}`);
  }
});
```

- [ ] **Step 2: 테스트가 실패하는지 확인**

Run: `npm test`
Expected: FAIL — `Cannot find module '../js/game/boss.js'`

- [ ] **Step 3: `js/game/boss.js` 구현**

```js
import { WIDTH } from '../config.js';

export const BOSS_MAX_HP = 120;
export const BOSS_W = 48;  // 16px × scale 3
export const BOSS_H = 36;  // 12px × scale 3
export const BOSS_Y = 60;

const SPREAD_ARC = Math.PI / 3; // 확산탄이 퍼지는 각도(60°)

/** 페이즈별 행동 설정. 뒤로 갈수록 빨라지고 거세진다. */
export const BOSS_PHASE_CONFIG = {
  1: { moveSpeed: 60, shootInterval: 1.6, spreadCount: 5, bulletSpeed: 200, summon: false, aimed: false },
  2: { moveSpeed: 90, shootInterval: 1.3, spreadCount: 5, bulletSpeed: 220, summon: true, aimed: false },
  3: { moveSpeed: 140, shootInterval: 0.7, spreadCount: 7, bulletSpeed: 260, summon: true, aimed: true },
};

export const SUMMON_INTERVAL = 6; // 초 — 졸개 소환 간격

/** HP 비율(0~1)로 페이즈를 정한다. */
export function bossPhase(hpRatio) {
  if (hpRatio > 0.66) return 1;
  if (hpRatio > 0.33) return 2;
  return 3;
}

/** 부채꼴 확산탄의 속도 벡터들. 아래(+y)를 중심으로 좌우 대칭. */
export function spreadShot(originX, originY, count, speed) {
  const shots = [];
  const step = count > 1 ? SPREAD_ARC / (count - 1) : 0;
  const start = -SPREAD_ARC / 2;
  for (let i = 0; i < count; i += 1) {
    const angle = start + step * i; // 0이 정중앙(수직 아래)
    shots.push({
      vx: Math.sin(angle) * speed,
      vy: Math.cos(angle) * speed,
    });
  }
  return shots;
}

/** 목표 지점을 향하는 조준탄 속도 벡터. */
export function aimedShot(originX, originY, targetX, targetY, speed) {
  const dx = targetX - originX;
  const dy = targetY - originY;
  const dist = Math.hypot(dx, dy) || 1; // 0으로 나누기 방지
  return { vx: (dx / dist) * speed, vy: (dy / dist) * speed };
}

export function createBoss(game, enemyBullets) {
  const boss = {
    x: WIDTH / 2 - BOSS_W / 2,
    y: BOSS_Y,
    w: BOSS_W,
    h: BOSS_H,
    hp: BOSS_MAX_HP,
    alive: true,
    phase: 1,
    direction: 1,       // 1 = 오른쪽, -1 = 왼쪽
    shootTimer: 1.5,    // 등장 직후 잠깐의 유예
    summonTimer: SUMMON_INTERVAL,
    hitFlash: 0,        // 피격 시 흰색 점멸
    wantsSummon: false, // playScene이 읽고 졸개를 소환한 뒤 false로 되돌린다

    get hpRatio() { return this.hp / BOSS_MAX_HP; },

    update(dt, playerX, playerY = 580) {
      if (!this.alive) return;
      this.phase = bossPhase(this.hpRatio);
      const config = BOSS_PHASE_CONFIG[this.phase];

      this.hitFlash = Math.max(0, this.hitFlash - dt);

      // 좌우 왕복 이동 — 벽에 닿으면 방향을 뒤집는다.
      this.x += config.moveSpeed * this.direction * dt;
      if (this.x <= 0) { this.x = 0; this.direction = 1; }
      if (this.x + this.w >= WIDTH) { this.x = WIDTH - this.w; this.direction = -1; }

      // 사격
      this.shootTimer -= dt;
      if (this.shootTimer <= 0) {
        this.shootTimer = config.shootInterval;
        this.shoot(config, playerX, playerY);
      }

      // 졸개 소환 (2페이즈부터)
      if (config.summon) {
        this.summonTimer -= dt;
        if (this.summonTimer <= 0) {
          this.summonTimer = SUMMON_INTERVAL;
          this.wantsSummon = true; // 실제 소환은 playScene이 한다
        }
      }
    },

    shoot(config, playerX, playerY) {
      const originX = this.x + this.w / 2;
      const originY = this.y + this.h;

      for (const { vx, vy } of spreadShot(originX, originY, config.spreadCount, config.bulletSpeed)) {
        enemyBullets.spawn({ x: originX - 1.5, y: originY, vx, vy, w: 3, h: 12, sprite: 'enemyShot' });
      }

      if (config.aimed) {
        const { vx, vy } = aimedShot(originX, originY, playerX, playerY, config.bulletSpeed);
        enemyBullets.spawn({ x: originX - 1.5, y: originY, vx, vy, w: 3, h: 12, sprite: 'enemyShot' });
      }

      game.audio?.play('bossShoot');
    },

    /** 피격. 죽었으면 true. */
    hit(damage = 1) {
      this.hp -= damage;
      this.hitFlash = 0.08;
      if (this.hp > 0) {
        game.audio?.play('bossHit');
        return false;
      }
      this.hp = 0;
      this.alive = false;
      return true;
    },

    render(ctx) {
      if (!this.alive) return;

      const sprite = game.sprites.get('boss');
      ctx.drawImage(sprite, Math.round(this.x), Math.round(this.y));

      // 피격 점멸 — 스프라이트 위에 흰색을 덧씌운다.
      if (this.hitFlash > 0) {
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = '#fff';
        ctx.fillRect(Math.round(this.x), Math.round(this.y), this.w, this.h);
        ctx.globalAlpha = 1;
      }

      this.renderHpBar(ctx);
    },

    renderHpBar(ctx) {
      const barW = WIDTH - 80;
      const barH = 8;
      const barX = 40;
      const barY = 24;

      ctx.fillStyle = '#3a1020';
      ctx.fillRect(barX, barY, barW, barH);

      // 페이즈가 오를수록 게이지 색이 붉어진다.
      const colors = { 1: '#7dff6b', 2: '#ffd24a', 3: '#e94040' };
      ctx.fillStyle = colors[this.phase];
      ctx.fillRect(barX, barY, barW * this.hpRatio, barH);

      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 1;
      ctx.strokeRect(barX + 0.5, barY + 0.5, barW - 1, barH - 1);

      ctx.fillStyle = '#fff';
      ctx.font = '10px monospace';
      ctx.fillText(`BOSS  PHASE ${this.phase}`, barX, barY - 4);
    },
  };

  return boss;
}
```

- [ ] **Step 4: 테스트 통과 확인**

Run: `npm test`
Expected: PASS — 119개 테스트 통과

- [ ] **Step 5: playScene에 보스 연결**

`js/scenes/playScene.js`를 고친다.

(1) import 추가. 보스 격파 점수는 `boss.js`가 아니라 `score.js`에 있다 (점수 규칙은 한곳에 모은다):

```js
import { createBoss } from '../game/boss.js';
import { createEnemy } from '../game/enemy.js';
```

그리고 기존의 `score.js` import 줄에 `BOSS_SCORE`를 추가한다:

```js
import { scoreFor, STAGE_CLEAR_BONUS, BOSS_SCORE } from '../game/score.js';
```

(2) 보스 상태 변수 — `let diveTimer = ...` 아래에:

```js
  let boss = null;
```

(3) 스테이지 시작 시 보스 생성 — `nextStage()` 안, `phase = 'playing';` 위에:

```js
    boss = getStage(stageIndex).isBoss ? createBoss(game, enemyBullets) : null;
```

그리고 씬 최초 생성 시에도 보스가 필요할 수 있으므로, `let boss = null;` 아래에 초기화 한 줄:

```js
  if (stage().isBoss) boss = createBoss(game, enemyBullets);
```

(4) `update`의 `phase === 'playing'` 구간, `enemyShooting(dt);` 아래에 보스 갱신:

```js
      if (boss?.alive) {
        boss.update(dt, player.x + player.w / 2, player.y);

        // 보스가 요청하면 졸개를 소환한다 (2페이즈부터).
        if (boss.wantsSummon) {
          boss.wantsSummon = false;
          const freeCols = [1, 3, 5, 7];
          const col = freeCols[Math.floor(Math.random() * freeCols.length)];
          spawner.enemies.push(createEnemy({
            type: 'bee',
            col,
            row: 3,
            entryPath: 'topDive',
            entryDuration: 2,
            formation,
            game,
          }));
        }
      }
```

(5) 충돌 검사에 보스 추가 — 충돌 1(플레이어 탄 → 적) 바로 아래에:

```js
      // 충돌 1-B: 플레이어 탄 → 보스
      if (boss?.alive) {
        forEachHit(playerBullets.items, [boss], (bullet) => {
          bullet.alive = false;
          particles.burst(bullet.x, bullet.y, '#5ce1e6', 3);
          if (boss.hit(1)) {
            score += BOSS_SCORE;
            particles.burst(boss.x + boss.w / 2, boss.y + boss.h / 2, '#e0409b', 40);
            game.audio?.play('explosion');
          }
        });
      }
```

(6) `checkStageClear()` 수정 — 보스 스테이지는 보스를 잡아야 클리어다:

```js
  function checkStageClear() {
    if (!spawner.done || livingEnemies().length > 0) return;
    if (stage().isBoss && boss?.alive) return; // 보스가 살아 있으면 아직이다
    game.audio?.play('stageClear');
    phase = 'stageClear';
    phaseTimer = STAGE_CLEAR_DELAY;
  }
```

(7) `render`에 보스 그리기 — 적을 그린 뒤:

```js
      if (boss?.alive) boss.render(ctx);
```

- [ ] **Step 6: 브라우저에서 보스전 확인**

빨리 확인하려면 `js/scenes/playScene.js`의 `let stageIndex = 0;`을 일시적으로 `= 4`로 바꿔 보스전부터 시작한다. **확인이 끝나면 반드시 0으로 되돌린다.**

1. 보스가 상단에 뜨고 HP 게이지가 보인다.
2. 좌우로 왕복하며 부채꼴 확산탄을 쏜다.
3. 맞히면 흰색으로 점멸하고 게이지가 준다.
4. HP 66% 아래에서 PHASE 2가 되고 졸개가 소환된다.
5. HP 33% 아래에서 PHASE 3이 되어 빨라지고 조준탄이 추가된다.
6. 격파하면 큰 폭발과 함께 STAGE CLEAR → 엔딩 화면.

- [ ] **Step 7: `stageIndex`를 0으로 되돌렸는지 확인하고 커밋**

```bash
git add js/game/boss.js test/boss.test.js js/scenes/playScene.js
git commit -m "feat: 보스 3페이즈 (확산탄/졸개소환/조준탄막)"
```

---

## Task 16: HUD

임시 HUD를 제대로 된 모듈로 바꾼다.

**Files:**
- Create: `js/ui/hud.js`
- Modify: `js/scenes/playScene.js` (HUD 호출)

**Interfaces:**
- Consumes: `game.sprites`, `game.highScores`
- Produces:
  - `createHud(game)` → `{ render(ctx, { score, lives, stageNumber, playerState }) }`
  - `playerState`는 `player.state` (`{ weaponLevel, shield, rapidTimer, speedTimer }`)

- [ ] **Step 1: `js/ui/hud.js` 작성**

순수 렌더링이라 단위 테스트하지 않고 화면으로 확인한다.

```js
import { WIDTH, HEIGHT } from '../config.js';
import { BUFF_DURATION } from '../game/player.js';

const LIFE_ICON_W = 15;
const LIFE_ICON_GAP = 4;

export function createHud(game) {
  return {
    render(ctx, { score, lives, stageNumber, playerState }) {
      ctx.font = '12px monospace';
      ctx.textAlign = 'left';

      // 좌상단 — 점수
      ctx.fillStyle = '#fff';
      ctx.fillText('SCORE', 10, 16);
      ctx.fillStyle = '#ffd24a';
      ctx.fillText(String(score).padStart(6, '0'), 10, 32);

      // 우상단 — 최고 점수
      ctx.textAlign = 'right';
      ctx.fillStyle = '#fff';
      ctx.fillText('HI-SCORE', WIDTH - 10, 16);
      ctx.fillStyle = '#5ce1e6';
      ctx.fillText(String(Math.max(game.highScores.best(), score)).padStart(6, '0'), WIDTH - 10, 32);

      // 우하단 — 스테이지 + 무기 레벨
      ctx.fillStyle = '#fff';
      ctx.fillText(`STAGE ${stageNumber}`, WIDTH - 10, HEIGHT - 26);
      ctx.fillStyle = '#ffd24a';
      ctx.fillText(`WEAPON Lv.${playerState.weaponLevel}`, WIDTH - 10, HEIGHT - 10);

      // 좌하단 — 남은 목숨 (미니 기체 아이콘)
      ctx.textAlign = 'left';
      const shipSprite = game.sprites.get('player');
      for (let i = 0; i < lives; i += 1) {
        ctx.drawImage(shipSprite, 10 + i * (LIFE_ICON_W + LIFE_ICON_GAP), HEIGHT - 26);
      }

      this.renderBuffs(ctx, playerState);
    },

    /** 활성 버프의 남은 시간을 게이지 바로 보여준다. */
    renderBuffs(ctx, state) {
      const buffs = [];
      if (state.shield) buffs.push({ label: 'S', ratio: 1, color: '#5ce1e6' });
      if (state.rapidTimer > 0) {
        buffs.push({ label: 'R', ratio: state.rapidTimer / BUFF_DURATION, color: '#ff7ad9' });
      }
      if (state.speedTimer > 0) {
        buffs.push({ label: 'P', ratio: state.speedTimer / BUFF_DURATION, color: '#7dff6b' });
      }

      const barW = 40;
      const barH = 5;
      let x = 10;
      const y = HEIGHT - 42;

      for (const buff of buffs) {
        ctx.fillStyle = '#333';
        ctx.fillRect(x, y, barW, barH);
        ctx.fillStyle = buff.color;
        ctx.fillRect(x, y, barW * buff.ratio, barH);
        ctx.font = '9px monospace';
        ctx.fillText(buff.label, x + barW + 3, y + barH);
        x += barW + 16;
      }
    },
  };
}
```

- [ ] **Step 2: playScene에서 임시 HUD를 교체**

(1) import 추가:

```js
import { createHud } from '../ui/hud.js';
```

(2) 생성 — `const player = createPlayer(...)` 아래에:

```js
  const hud = createHud(game);
```

(3) `render` 안의 임시 HUD 블록(`ctx.fillText('SCORE ...')` 3줄)을 지우고 다음으로 바꾼다:

```js
      hud.render(ctx, {
        score,
        lives,
        stageNumber: stageIndex + 1,
        playerState: player.state,
      });
```

- [ ] **Step 3: 브라우저에서 확인**

점수·최고점수·목숨 아이콘·스테이지·무기 레벨이 보이고, 파워업을 먹으면 좌하단에 버프 게이지가 줄어드는지 확인한다.

- [ ] **Step 4: 커밋**

```bash
git add js/ui/hud.js js/scenes/playScene.js
git commit -m "feat: HUD - 점수/최고점수/목숨/스테이지/무기레벨/버프 게이지"
```

---

## Task 17: WebAudio 효과음 + BGM

오디오 파일 없이 전부 합성한다. `game.audio?.play(...)` 호출은 앞선 태스크에서 이미 심어 뒀다.

**Files:**
- Create: `js/core/audio.js`
- Modify: `js/main.js` (audio를 게임 컨텍스트에 주입, M 키 음소거)

**Interfaces:**
- Consumes: 없음
- Produces:
  - `createAudio(AudioContextClass = window.AudioContext)` → `{ play(name), resume(), toggleMute(), startBgm(), stopBgm(), get muted() }`
  - 효과음 이름: `'shoot'`, `'explosion'`, `'playerDeath'`, `'powerup'`, `'shieldBreak'`, `'bossHit'`, `'bossShoot'`, `'stageClear'`
  - 알 수 없는 이름을 넣으면 조용히 무시한다 (게임이 죽으면 안 된다).

- [ ] **Step 1: `js/core/audio.js` 작성**

브라우저 전용이라 단위 테스트하지 않는다. 귀로 확인한다.

```js
const SFX_VOLUME = 0.25;
const BGM_VOLUME = 0.12; // BGM은 효과음보다 확실히 작게

// BGM 멜로디 — 반음 단위 MIDI 노트 번호. null은 쉼표.
const BGM_LEAD = [69, null, 72, 74, 76, null, 74, 72, 69, null, 67, 69, 71, null, null, null];
const BGM_BASS = [45, 45, 45, 45, 41, 41, 41, 41, 43, 43, 43, 43, 45, 45, 45, 45];
const BGM_STEP = 0.16;         // 1스텝 길이(초)
const SCHEDULE_AHEAD = 0.1;    // 앞당겨 예약할 시간(초)
const SCHEDULER_INTERVAL = 25; // 스케줄러 실행 간격(ms)

/** MIDI 노트 번호 → 주파수(Hz) */
const noteToFreq = (note) => 440 * (2 ** ((note - 69) / 12));

export function createAudio(AudioContextClass = globalThis.AudioContext) {
  if (!AudioContextClass) {
    // 오디오를 못 쓰는 환경이면 아무것도 안 하는 더미를 준다.
    return {
      play() {}, resume() {}, toggleMute() {}, startBgm() {}, stopBgm() {}, get muted() { return true; },
    };
  }

  const ctx = new AudioContextClass();
  const master = ctx.createGain();
  master.gain.value = 1;
  master.connect(ctx.destination);

  let muted = false;
  let bgmTimer = null;
  let bgmStep = 0;
  let nextNoteTime = 0;

  /** 한 음을 특정 시각에 예약한다. */
  function tone({ freq, start, duration, type = 'square', volume = SFX_VOLUME, sweepTo = null }) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, start);
    if (sweepTo !== null) {
      osc.frequency.exponentialRampToValueAtTime(Math.max(1, sweepTo), start + duration);
    }
    // 짧은 어택 + 지수 감쇠 — 8비트 느낌의 핵심이다.
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(volume, start + 0.005);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    osc.connect(gain);
    gain.connect(master);
    osc.start(start);
    osc.stop(start + duration + 0.02);
  }

  /** 화이트 노이즈 버스트 — 폭발음에 쓴다. */
  function noise({ start, duration, volume = SFX_VOLUME, cutoff = 1200 }) {
    const frameCount = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, frameCount, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < frameCount; i += 1) data[i] = Math.random() * 2 - 1;

    const source = ctx.createBufferSource();
    source.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(cutoff, start);
    filter.frequency.exponentialRampToValueAtTime(200, start + duration);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(volume, start);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    source.start(start);
  }

  const SFX = {
    shoot: (t) => tone({ freq: 880, start: t, duration: 0.08, type: 'square', sweepTo: 220, volume: 0.15 }),
    explosion: (t) => noise({ start: t, duration: 0.3, volume: 0.3, cutoff: 1400 }),
    playerDeath: (t) => {
      tone({ freq: 440, start: t, duration: 0.7, type: 'sawtooth', sweepTo: 40, volume: 0.3 });
      noise({ start: t, duration: 0.5, volume: 0.2 });
    },
    powerup: (t) => {
      // 상승 아르페지오 — 도-미-솔-도
      [523, 659, 784, 1047].forEach((freq, i) => {
        tone({ freq, start: t + i * 0.06, duration: 0.1, type: 'square', volume: 0.2 });
      });
    },
    shieldBreak: (t) => tone({ freq: 300, start: t, duration: 0.15, type: 'triangle', sweepTo: 900, volume: 0.25 }),
    bossHit: (t) => noise({ start: t, duration: 0.06, volume: 0.15, cutoff: 3000 }),
    bossShoot: (t) => tone({ freq: 180, start: t, duration: 0.14, type: 'sawtooth', sweepTo: 90, volume: 0.18 }),
    stageClear: (t) => {
      [523, 659, 784].forEach((freq, i) => {
        tone({ freq, start: t + i * 0.14, duration: 0.25, type: 'square', volume: 0.25 });
      });
    },
  };

  /** BGM 스케줄러 — 조금 앞의 음을 미리 예약해 타이밍 흔들림을 막는다. */
  function scheduleBgm() {
    while (nextNoteTime < ctx.currentTime + SCHEDULE_AHEAD) {
      const lead = BGM_LEAD[bgmStep % BGM_LEAD.length];
      const bass = BGM_BASS[bgmStep % BGM_BASS.length];

      if (lead !== null) {
        tone({
          freq: noteToFreq(lead), start: nextNoteTime, duration: BGM_STEP * 0.9,
          type: 'square', volume: BGM_VOLUME,
        });
      }
      if (bass !== null) {
        tone({
          freq: noteToFreq(bass), start: nextNoteTime, duration: BGM_STEP * 0.9,
          type: 'triangle', volume: BGM_VOLUME * 1.4,
        });
      }

      nextNoteTime += BGM_STEP;
      bgmStep += 1;
    }
  }

  return {
    /** 최초 키 입력 시 호출한다 — 브라우저 자동재생 정책 때문에 필요하다. */
    resume() {
      if (ctx.state === 'suspended') ctx.resume();
    },

    play(name) {
      if (muted || ctx.state !== 'running') return;
      const sfx = SFX[name];
      if (!sfx) return; // 없는 효과음은 조용히 무시한다
      sfx(ctx.currentTime);
    },

    startBgm() {
      if (bgmTimer !== null) return;
      nextNoteTime = ctx.currentTime + 0.1;
      bgmStep = 0;
      bgmTimer = setInterval(() => {
        if (!muted && ctx.state === 'running') scheduleBgm();
        else nextNoteTime = ctx.currentTime + 0.1; // 음소거 중엔 시각만 따라간다
      }, SCHEDULER_INTERVAL);
    },

    stopBgm() {
      if (bgmTimer === null) return;
      clearInterval(bgmTimer);
      bgmTimer = null;
    },

    toggleMute() {
      muted = !muted;
      master.gain.value = muted ? 0 : 1;
      return muted;
    },

    get muted() { return muted; },
  };
}
```

- [ ] **Step 2: `js/main.js`에 오디오 주입**

(1) import 추가:

```js
import { createAudio } from './core/audio.js';
```

(2) `const highScores = ...` 아래에:

```js
const audio = createAudio(window.AudioContext ?? window.webkitAudioContext);
```

(3) `scenes.setContext({...})`에 `audio`를 넣는다:

```js
scenes.setContext({
  input,
  sprites,
  highScores,
  audio,
  changeScene: (name, params) => scenes.change(name, params),
});
```

(4) 루프의 `update`에 오디오 기동과 음소거 토글을 추가한다:

```js
const loop = createLoop({
  update(dt) {
    // 브라우저 자동재생 정책: 최초 사용자 입력이 있어야 소리를 낼 수 있다.
    if (input.wasPressed('Space') || input.wasPressed('ArrowLeft') || input.wasPressed('ArrowRight')) {
      audio.resume();
      audio.startBgm();
    }
    if (input.wasPressed('KeyM')) audio.toggleMute();

    scenes.update(dt);
    input.endFrame();
  },
  render() {
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    scenes.render(ctx);
  },
});
```

- [ ] **Step 3: 브라우저에서 소리 확인**

`npm run serve` → 타이틀에서 Space를 누르면 BGM이 시작되는지, 발사·폭발·파워업·사망 소리가 나는지 듣는다. `M`으로 음소거가 되는지도 확인한다.

BGM이 거슬리면 `BGM_VOLUME`(현재 0.12)을 낮추거나 `BGM_LEAD` 멜로디를 고친다.

- [ ] **Step 4: 커밋**

```bash
git add js/core/audio.js js/main.js
git commit -m "feat: WebAudio 합성 효과음 8종과 8비트 BGM"
```

---

## Task 18: 최종 통합 검증 · 밸런싱 · 문서

전체를 처음부터 끝까지 플레이해 확인하고, 이상한 수치를 다듬는다.

**Files:**
- Create: `README.md`
- Modify: `js/stages/stages.js` (플레이 결과에 따른 밸런스 조정)

- [ ] **Step 1: 전체 테스트 통과 확인**

Run: `npm test`
Expected: PASS — 119개 테스트 전부 통과. 하나라도 실패하면 여기서 멈추고 고친다.

- [ ] **Step 2: 처음부터 끝까지 플레이 (수동 검증 체크리스트)**

`npm run serve` 후 타이틀부터 엔딩까지 실제로 클리어하며 아래를 전부 확인한다. **실패한 항목은 고치고 다시 처음부터 확인한다.**

화면 흐름
- [ ] 타이틀 → Space → 플레이 → 목숨 0 → 게임오버 → Space → 타이틀 순환
- [ ] 게임오버 화면에 점수가 뜨고, 신기록이면 `★ 신기록! ★`이 뜬다
- [ ] 타이틀에 하이스코어 TOP 5가 표시되고, 브라우저를 새로고침해도 남아 있다
- [ ] P로 일시정지되고, 다시 P로 풀린다
- [ ] M으로 음소거가 되고 다시 켜진다

게임플레이
- [ ] 적이 곡선을 그리며 진입한다 (5스테이지 전부 다른 패턴)
- [ ] 대형이 좌우로 흔들리고, 적이 대형을 따라 움직인다
- [ ] 적이 주기적으로 급강하하며 사격하고, 다시 대형으로 복귀한다
- [ ] 급강하 중인 적을 잡으면 점수가 2배로 오른다 (대형 벌 50 vs 급강하 벌 100)
- [ ] 적 탄에 맞으면 목숨이 줄고 2초간 깜빡이며 부활한다
- [ ] 급강하하는 적과 부딪혀도 죽는다

파워업
- [ ] 무기(노랑)를 먹으면 탄이 1 → 2 → 3발로 늘고, 3발에서 더 안 늘어난다
- [ ] 실드(하늘)를 먹으면 링이 생기고, 한 번 맞으면 링만 사라진다 (안 죽는다)
- [ ] 연사(분홍)를 먹으면 확실히 빨리 쏘고, 10초 뒤 원래대로 돌아온다
- [ ] 속도(연두)를 먹으면 빨리 움직이고, 10초 뒤 원래대로 돌아온다
- [ ] 죽으면 무기 레벨이 1 내려가고 버프가 전부 사라진다
- [ ] 좌하단 버프 게이지가 남은 시간에 따라 줄어든다

보스 (스테이지 5)
- [ ] 보스가 등장하고 HP 게이지가 보인다
- [ ] PHASE 1: 부채꼴 확산탄
- [ ] PHASE 2 (HP 66% 이하): 졸개가 소환된다
- [ ] PHASE 3 (HP 33% 이하): 빨라지고 조준탄이 추가된다
- [ ] 격파하면 `STAGE CLEAR!` 엔딩 화면으로 간다

성능
- [ ] 적이 가장 많은 스테이지 4에서도 끊김 없이 부드럽다 (브라우저 개발자도구 Performance 탭에서 60fps 확인)
- [ ] 브라우저 콘솔에 에러·경고가 없다

- [ ] **Step 3: 밸런스 조정**

Step 2를 플레이하며 느낀 문제를 `js/stages/stages.js`에서만 고친다. 흔한 증상과 손댈 값:

| 증상 | 고칠 값 |
|---|---|
| 너무 쉽다 | `diveInterval` ↓, `diveCount` ↑, `enemyBulletSpeed` ↑ |
| 너무 어렵다 | 위의 반대. 또는 `dropRate` ↑ |
| 적 탄을 피할 수 없다 | `enemyBulletSpeed` ↓ (플레이어 속도 220보다 너무 빠르면 안 된다) |
| 스테이지가 지루하게 길다 | 웨이브의 `cols` 개수 ↓ |
| 파워업이 안 나온다 | `dropRate` ↑ |
| 보스가 너무 질기다 | `js/game/boss.js`의 `BOSS_MAX_HP` ↓ |

수치를 바꿨으면 `npm test`를 다시 돌린다 (`stages.test.js`가 난이도 단조 증가를 검사한다).

- [ ] **Step 4: `README.md` 작성**

```markdown
# GALAGA — HTML 슈팅 게임

브라우저에서 바로 돌아가는 갤러그 스타일 종스크롤 슈팅 게임.
외부 라이브러리 · 이미지 파일 · 오디오 파일이 **하나도 없다**.
스프라이트는 코드의 픽셀맵으로 그리고, 사운드는 WebAudio로 합성한다.

## 실행

ES 모듈을 쓰기 때문에 `file://`로 열면 CORS에 막힌다. 반드시 로컬 서버로 띄운다.

```bash
npm run serve      # http://127.0.0.1:8080
```

## 조작

| 키 | 동작 |
|---|---|
| ← → | 이동 |
| Space | 발사 / 화면 전환 |
| P | 일시정지 |
| M | 음소거 |

## 게임 규칙

- 5스테이지. 마지막은 3페이즈 보스전.
- **급강하 중인 적을 잡으면 점수가 2배.**
- 파워업 4종이 확률로 드롭한다.
  - 노랑 = 무기 레벨업 (1발 → 2발 → 3발 확산). 영구지만 죽으면 1레벨 내려간다.
  - 하늘 = 실드. 피격 1회를 막는다.
  - 분홍 = 연사. 10초간 발사 속도 2배.
  - 연두 = 속도. 10초간 이동 속도 1.4배.

## 개발

```bash
npm test           # 순수 로직 단위 테스트 (node:test, 의존성 0)
```

**밸런스를 조정하려면 `js/stages/stages.js`만 고치면 된다.**
적 모양·색을 바꾸려면 `js/gfx/pixels.js`만 고치면 된다.

설계 문서: `docs/superpowers/specs/2026-07-14-galaga-shooter-design.md`
```

- [ ] **Step 5: 최종 커밋**

```bash
git add README.md js/stages/stages.js
git commit -m "docs: README 추가 및 플레이테스트 기반 밸런스 조정"
```

---

## 완료 조건

- `npm test` 전부 통과 (119개)
- Task 18의 수동 검증 체크리스트 전 항목 통과
- 저장소에 이미지·오디오 파일 0개, npm 의존성 0개
- 타이틀부터 보스 격파 엔딩까지 끊김 없이 플레이 가능
