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
