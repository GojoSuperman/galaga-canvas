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
