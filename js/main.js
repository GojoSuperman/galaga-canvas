import { WIDTH, HEIGHT } from './config.js';
import { createLoop } from './core/loop.js';
import { createInput } from './core/input.js';
import { createHighScores } from './core/storage.js';
import { createAudio } from './core/audio.js';
import { createSpriteFactory } from './gfx/spriteFactory.js';
import { createSceneManager } from './scenes/sceneManager.js';
import { createTitleScene } from './scenes/titleScene.js';
import { createPlayScene } from './scenes/playScene.js';
import { createGameOverScene } from './scenes/gameOverScene.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
ctx.imageSmoothingEnabled = false;

/** localStorage 접근 자체가 막힌 브라우저(쿠키 전면 차단, 샌드박스 iframe)에서도 게임은 떠야 한다. */
function safeLocalStorage() {
  try {
    return window.localStorage;
  } catch {
    // 접근 자체가 SecurityError를 던지는 경우 — 저장 안 되는 더미로 대체한다.
    return { getItem: () => null, setItem: () => {} };
  }
}

const input = createInput(window);
const sprites = createSpriteFactory(3);
const highScores = createHighScores(safeLocalStorage());
const audio = createAudio(window.AudioContext ?? window.webkitAudioContext);

const scenes = createSceneManager({
  title: createTitleScene,
  play: createPlayScene,
  gameover: createGameOverScene,
});

scenes.setContext({
  input,
  sprites,
  highScores,
  audio,
  changeScene: (name, params) => scenes.change(name, params),
});

scenes.change('title');

const loop = createLoop({
  update(dt) {
    // 브라우저 자동재생 정책: 최초 사용자 입력이 있어야 소리를 낼 수 있다.
    if (input.wasPressed('Space') || input.wasPressed('ArrowLeft') || input.wasPressed('ArrowRight')) {
      audio.resume();
      audio.startBgm();
    }
    if (input.wasPressed('KeyM')) audio.toggleMute();

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
