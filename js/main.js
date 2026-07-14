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
