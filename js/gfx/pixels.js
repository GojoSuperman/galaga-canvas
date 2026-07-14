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
