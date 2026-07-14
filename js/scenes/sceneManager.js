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
