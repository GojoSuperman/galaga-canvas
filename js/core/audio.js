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
