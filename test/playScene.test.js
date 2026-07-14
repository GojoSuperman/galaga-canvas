import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPlayScene } from '../js/scenes/playScene.js';
import { STAGES } from '../js/stages/stages.js';

/**
 * "고스트 플레이어" 회귀 테스트.
 *
 * 버그: playerDies()가 phase를 'respawning'으로 세팅해도, 같은 프레임에 스테이지의
 * 마지막 적도 죽었으면 그 뒤에 실행되는 checkStageClear()가 phase를 'stageClear'로
 * 덮어써 버린다. 그러면 player.respawn()이 영영 호출되지 않아 player.alive === false인
 * 채로 다음 스테이지에 들어간다 — 화면엔 안 보이고(render 조기 return), 총알도
 * 통과하고(forEachHit이 alive를 거르므로), 그런데도 계속 움직이고 쏜다(update는
 * alive 여부와 무관하게 항상 호출됨).
 *
 * playScene.js는 브라우저 API를 전혀 쓰지 않는다(render()만 canvas를 쓴다) — 리뷰어가
 * 확인한 사실이며, 아래에서도 render()는 한 번도 호출하지 않는다. 그래서 실제
 * createPlayScene을 스텁 game으로 Node에서 그대로 구동할 수 있다.
 *
 * 결정론적 재현 기법:
 * - STAGES[0], STAGES[1]을 "적이 정확히 1마리뿐인" 미니 스테이지로 바꿔치기한다.
 *   (STAGES는 stages.js가 내보내는 배열 참조 — playScene.js가 getStage()로 읽는
 *   바로 그 배열이다. 로직은 손대지 않고 데이터만 스텁으로 교체하는 것이므로
 *   "playScene의 로직을 다시 구현하지 말라"는 제약과 배치되지 않는다.)
 * - 플레이어는 한 번도 움직이거나 쏘지 않는다(input이 항상 false) — 그래서 유일한
 *   상호작용은 "급강하한 적이 정지해 있는 플레이어와 몸통 박치기"뿐이고, 이는
 *   startDive가 플레이어의 (고정된) 현재 위치를 목표로 베지어 곡선을 그리므로 매번
 *   같은 지점에서 같은 결과로 재현된다.
 * - dropRate: 0이라 rollDrop은 Math.random 값과 무관하게 항상 null을 반환하고,
 *   급강하 후보가 항상 1마리뿐이라 Math.floor(Math.random() * 1) === 0으로 고정된다.
 *   즉 Math.random을 모킹하지 않고도 전체 시뮬레이션이 완전히 결정론적이다.
 *
 * 실제로 이 스텁 스테이지로 돌려보면 (수정 전 코드 기준) t=3.417s에 'explosion'
 * (마지막 적 사망) · 'playerDeath' · 'stageClear'가 정확히 같은 프레임에 함께
 * 기록되고, 그 뒤로는 어떤 이벤트도 다시 기록되지 않는다 — 리뷰어가 관찰한
 * "0프레임 렌더, 0피해, 그런데도 계속 발사"와 정확히 같은 증상이다.
 * 수정 후에는 같은 시각에 'stageClear'가 함께 오지 않고, RESPAWN_DELAY(1.2초) 뒤에
 * 따로 온다 — 그리고 부활한 플레이어가 두 번째 미니 스테이지의 적에게도 정상적으로
 * 맞아 죽는다(고스트가 아니라는 직접 증거).
 */
test('같은 프레임에 스테이지 마지막 적이 죽어도 부활하지 못한 채 고스트가 되지 않는다', () => {
  const originalStage0 = STAGES[0];
  const originalStage1 = STAGES[1];

  const miniStage = () => ({
    waves: [{ type: 'bee', entryPath: 'topDive', row: 0, cols: [4], delay: 0 }],
    diveInterval: 0.5,
    diveCount: 1,
    diveDuration: 1.0,
    enemyBulletSpeed: 200,
    enemyShootInterval: 5, // 이 재현에는 적 사격이 필요 없다 — 몸통 박치기만으로 충분하다.
    dropRate: 0,
    isBoss: false,
  });

  const events = []; // { t, name }
  let simTime = 0;
  const audio = { play: (name) => events.push({ t: simTime, name }) };
  const input = { isDown: () => false, wasPressed: () => false };
  const game = {
    sprites: { get: () => null },
    audio,
    input,
    changeScene: (name, params) => events.push({ t: simTime, name: `changeScene:${name}`, params }),
  };

  try {
    STAGES[0] = miniStage();
    STAGES[1] = miniStage();

    const scene = createPlayScene(game, { startStage: 0 });
    const dt = 1 / 60;
    for (let i = 0; i < 60 * 20; i += 1) {
      simTime = i * dt;
      scene.update(dt); // render()는 호출하지 않는다 — 브라우저 API가 전혀 필요 없다.
    }
  } finally {
    // 다른 테스트 파일과 같은 프로세스에서 STAGES 배열을 공유하므로 반드시 원상복구한다.
    STAGES[0] = originalStage0;
    STAGES[1] = originalStage1;
  }

  const deaths = events.filter((e) => e.name === 'playerDeath');
  const clears = events.filter((e) => e.name === 'stageClear');

  assert.ok(deaths.length >= 2,
    `이 재현이 성립하려면 최소 2번의 playerDeath가 필요하다 (실제 ${deaths.length}번) — `
    + '재현 시나리오 자체가 성립하지 않았다는 뜻이다.');

  // 첫 번째 죽음이 "스테이지의 마지막 적이 죽는 바로 그 프레임"에 일어났는지 확인한다
  // (그렇지 않으면 애초에 버그를 유발하는 조건을 재현하지 못한 것이다).
  const firstDeath = deaths[0];
  const explosionSameFrame = events.some((e) => e.name === 'explosion' && e.t === firstDeath.t);
  assert.ok(explosionSameFrame,
    '재현 실패: 첫 playerDeath가 마지막 적의 explosion과 같은 프레임에서 일어나지 않았다.');

  // 핵심 회귀 지점: 플레이어가 죽은 바로 그 프레임에 stageClear가 함께 오면 안 된다.
  // (수정 전에는 checkStageClear가 그 프레임에 phase를 덮어써 버려서 같은 t에 찍힌다.)
  const clearSameFrameAsDeath = clears.some((c) => c.t === firstDeath.t);
  assert.equal(clearSameFrameAsDeath, false,
    'stageClear가 playerDeath와 같은 프레임에 발생했다 — phase가 respawning에서 '
    + 'stageClear로 덮어써져 플레이어가 부활하지 못하는 고스트 버그가 재현됐다.');

  // stageClear는 사라지지 않고, 부활 지연(RESPAWN_DELAY) 이후에 정상적으로 온다.
  const laterClear = clears.find((c) => c.t > firstDeath.t);
  assert.ok(laterClear, 'stageClear가 부활 이후에도 끝내 발생하지 않았다.');
  assert.ok(laterClear.t - firstDeath.t >= 1.0,
    `stageClear가 부활 지연(1.2초)보다 너무 빨리 왔다: ${(laterClear.t - firstDeath.t).toFixed(3)}초`);

  // 결정적 증거: 부활한 플레이어가 두 번째 미니 스테이지의 적에게도 다시 맞아 죽는다.
  // 고스트였다면(플레이어가 계속 alive === false) forEachHit이 플레이어를 걸러내므로
  // 이 두 번째 playerDeath는 절대 기록되지 않는다.
  assert.ok(deaths[1].t > laterClear.t,
    '부활 후 두 번째 충돌이 stageClear보다 먼저(또는 동시에) 기록됐다 — 시나리오 가정이 깨졌다.');
});
