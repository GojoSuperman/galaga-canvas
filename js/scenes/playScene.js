import { WIDTH, HEIGHT } from '../config.js';
import { createStarfield } from '../gfx/starfield.js';
import { createBulletPool } from '../game/bullet.js';
import { createPlayer, applyPowerup } from '../game/player.js';
import { createPowerupPool, rollDrop } from '../game/powerup.js';
import { createFormation } from '../game/formation.js';
import { createSpawner } from '../game/spawner.js';
import { createParticlePool } from '../game/particles.js';
import { forEachHit } from '../game/collision.js';
import { scoreFor, STAGE_CLEAR_BONUS, BOSS_SCORE } from '../game/score.js';
import { getStage, STAGES } from '../stages/stages.js';
import { ENEMY_STATE, createEnemy } from '../game/enemy.js';
import { createBoss } from '../game/boss.js';
import { enemyShotVelocity } from '../game/shooting.js';
import { createHud } from '../ui/hud.js';

const INITIAL_LIVES = 3;
const RESPAWN_DELAY = 1.2;   // 초 — 사망 후 부활까지
const STAGE_CLEAR_DELAY = 2; // 초 — 클리어 문구 표시 시간

/**
 * 플레이 씬.
 * params.startStage — 시작할 스테이지 인덱스(0부터). 기본 0.
 * 보스전처럼 뒤쪽 스테이지를 바로 확인할 때 쓴다 (밸런싱·검증용).
 */
export function createPlayScene(game, { startStage = 0 } = {}) {
  const stars = createStarfield();
  const playerBullets = createBulletPool(48);
  const enemyBullets = createBulletPool(64);
  const particles = createParticlePool(140);
  const powerups = createPowerupPool(8);
  const player = createPlayer(game, playerBullets);
  const hud = createHud(game);

  let score = 0;
  let lives = INITIAL_LIVES;
  let stageIndex = startStage;
  let phase = 'playing'; // 'playing' | 'respawning' | 'stageClear'
  let phaseTimer = 0;
  let paused = false;

  let formation = createFormation();
  let spawner = createSpawner(getStage(stageIndex), { formation, game });
  let diveTimer = getStage(stageIndex).diveInterval;
  let boss = null;

  function stage() { return getStage(stageIndex); }

  if (stage().isBoss) boss = createBoss(game, enemyBullets, stage().bossTier);

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

  /** 급강하 중인 적이 주기적으로 사격한다. elite는 플레이어를 조준한다. */
  function enemyShooting(dt) {
    for (const enemy of livingEnemies()) {
      if (enemy.state !== ENEMY_STATE.DIVING) continue;
      enemy.shootTimer -= dt;
      if (enemy.shootTimer > 0) continue;
      enemy.shootTimer = stage().enemyShootInterval;

      const originX = enemy.x + enemy.w / 2;
      const originY = enemy.y + enemy.h;
      const speed = stage().enemyBulletSpeed;

      // 엘리트는 플레이어를 향해 쏜다. 나머지는 그대로 아래로 쏜다.
      const target = player.alive
        ? { x: player.x + player.w / 2, y: player.y + player.h / 2 }
        : null;
      const { vx, vy } = enemyShotVelocity(enemy.type, { x: originX, y: originY }, target, speed);

      enemyBullets.spawn({
        x: originX - 1.5, y: originY, vx, vy, w: 3, h: 12, sprite: 'enemyShot',
      });
    }
  }

  function killEnemy(enemy) {
    score += scoreFor(enemy);
    particles.burst(enemy.x + enemy.w / 2, enemy.y + enemy.h / 2, '#ffd24a', 10);
    game.audio?.play('explosion');

    const drop = rollDrop(stage().dropRate);
    if (drop) powerups.spawn(enemy.x, enemy.y, drop);
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
    spawner = createSpawner(stage(), { formation, game });
    diveTimer = stage().diveInterval;
    playerBullets.items.forEach((b) => { b.alive = false; });
    enemyBullets.items.forEach((b) => { b.alive = false; });
    boss = stage().isBoss ? createBoss(game, enemyBullets, stage().bossTier) : null;
    // 어떤 경로로든 죽은 채로 스테이지를 넘어오면 안 된다.
    if (!player.alive) player.respawn();
    phase = 'playing';
  }

  function checkStageClear() {
    // 스포너가 모든 웨이브를 내보냈고, 남은 적이 없으면 클리어.
    if (!spawner.done || livingEnemies().length > 0) return;
    if (stage().isBoss && boss?.alive) return; // 보스가 살아 있으면 아직이다
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
        // 보스도 계속 움직이고 쏴야 한다 (안 그러면 죽을수록 보스전이 쉬워진다).
        // 단, 졸개 소환(wantsSummon)은 'playing' 분기에서만 처리한다 — 부활하자마자
        // 화면이 졸개로 가득 차는 상황을 막기 위해서다.
        if (boss?.alive) boss.update(dt, player.x + player.w / 2, player.y);
        playerBullets.update(dt, { width: WIDTH, height: HEIGHT });
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

      if (boss?.alive) {
        boss.update(dt, player.x + player.w / 2, player.y);

        // 보스가 요청하면 졸개를 여러 마리 소환한다 (2페이즈부터).
        // 서로 다른 열(col)에 소환해야 한다 — 같은 (col, row) 슬롯에 두 마리가
        // 겹치면 한 마리가 다른 한 마리 위에 그대로 포개져 보이지 않게 되는
        // 버그가 생기기 때문이다. 이미 살아있는 적이 차지한 열도 제외해서,
        // 이전 웨이브의 졸개가 아직 안 죽었는데 그 자리에 또 소환되는 것도 막는다.
        if (boss.wantsSummon) {
          boss.wantsSummon = false;
          const occupiedCols = new Set(
            livingEnemies().filter((e) => e.row === 3).map((e) => e.col),
          );
          const freeCols = [0, 1, 2, 3, 4, 5, 6, 7].filter((c) => !occupiedCols.has(c));
          // Fisher–Yates 셔플로 겹치지 않는 열을 무작위 순서로 뽑는다.
          for (let i = freeCols.length - 1; i > 0; i -= 1) {
            const j = Math.floor(Math.random() * (i + 1));
            [freeCols[i], freeCols[j]] = [freeCols[j], freeCols[i]];
          }
          const cols = freeCols.slice(0, boss.summonCount);
          for (const col of cols) {
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
      }

      playerBullets.update(dt, { width: WIDTH, height: HEIGHT });
      enemyBullets.update(dt, { width: WIDTH, height: HEIGHT });

      // 충돌 1: 플레이어 탄 → 적
      forEachHit(playerBullets.items, spawner.enemies, (bullet, enemy) => {
        bullet.alive = false;
        if (enemy.hit(1)) killEnemy(enemy);
      });

      // 충돌 1-B: 플레이어 탄 → 보스
      if (boss?.alive) {
        forEachHit(playerBullets.items, [boss], (bullet) => {
          bullet.alive = false;
          particles.burst(bullet.x, bullet.y, '#5ce1e6', 3);
          if (boss.hit(1)) {
            score += BOSS_SCORE[stage().bossTier];
            particles.burst(boss.x + boss.w / 2, boss.y + boss.h / 2, '#e0409b', 40);
            game.audio?.play('explosion');
          }
        });
      }

      // 충돌 2: 적 탄 → 플레이어
      forEachHit(enemyBullets.items, [player], (bullet) => {
        bullet.alive = false;
        if (player.hit()) playerDies();
      });

      // 충돌 3: 급강하 중인 적 → 플레이어 (몸통 박치기)
      if (player.alive && player.invulnTimer === 0) {
        forEachHit(livingEnemies().filter((e) => e.state === ENEMY_STATE.DIVING), [player],
          (enemy) => {
            if (enemy.hit(999)) killEnemy(enemy);
            if (player.hit()) playerDies();
          });
      }

      powerups.update(dt, HEIGHT);

      // 충돌 4: 파워업 → 플레이어
      if (player.alive) {
        forEachHit(powerups.items, [player], (item) => {
          item.alive = false;
          player.state = applyPowerup(player.state, item.type);
          game.audio?.play('powerup');
        });
      }

      // 충돌 처리 중 사망/게임오버가 일어났으면 이번 프레임의 나머지는 건너뛴다.
      // (그러지 않으면 같은 프레임에 마지막 적도 죽었을 때 checkStageClear가
      //  'respawning'을 'stageClear'로 덮어써서, 부활하지 못한 채 다음 스테이지로 넘어간다.)
      if (phase !== 'playing') return;

      checkStageClear();
    },

    render(ctx) {
      ctx.fillStyle = '#000';
      ctx.fillRect(0, 0, WIDTH, HEIGHT);
      stars.render(ctx);

      for (const b of enemyBullets.items) {
        if (b.alive) ctx.drawImage(game.sprites.get(b.sprite), Math.round(b.x), Math.round(b.y));
      }
      powerups.render(ctx, game.sprites);
      for (const enemy of livingEnemies()) enemy.render(ctx);
      if (boss?.alive) boss.render(ctx);
      for (const b of playerBullets.items) {
        if (b.alive) ctx.drawImage(game.sprites.get(b.sprite), Math.round(b.x), Math.round(b.y));
      }
      player.render(ctx);
      particles.render(ctx);

      hud.render(ctx, {
        score,
        lives,
        stageNumber: stageIndex + 1,
        playerState: player.state,
      });

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
