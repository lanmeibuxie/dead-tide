/* =========================================================================
   DEAD TIDE — a small dock-side survival horror
   Pure canvas, procedural pixel art, no external assets.
   ========================================================================= */
(() => {
  "use strict";

  const W = 480;
  const H = 270;
  const GROUND_Y = 221;
  const WORLD_W = 2400;
  const TAU = Math.PI * 2;

  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d", { alpha: false });
  ctx.imageSmoothingEnabled = false;
  const stage = document.getElementById("stage");

  const dom = {
    hud: document.getElementById("hud"),
    title: document.getElementById("titleScreen"),
    help: document.getElementById("helpScreen"),
    pause: document.getElementById("pauseScreen"),
    upgrade: document.getElementById("upgradeScreen"),
    upgradeGrid: document.getElementById("upgradeGrid"),
    upgradeWave: document.getElementById("upgradeWave"),
    upgradeCountInline: document.getElementById("upgradeCountInline"),
    upgradeEvolutionInline: document.getElementById("upgradeEvolutionInline"),
    upgradeRerollBtn: document.getElementById("upgradeRerollBtn"),
    gameover: document.getElementById("gameoverScreen"),
    waveBanner: document.getElementById("waveBanner"),
    bannerKicker: document.getElementById("bannerKicker"),
    bannerTitle: document.getElementById("bannerTitle"),
    bannerSub: document.getElementById("bannerSub"),
    toast: document.getElementById("toast"),
    toastIcon: document.getElementById("toastIcon"),
    toastText: document.getElementById("toastText"),
    healthFill: document.getElementById("healthFill"),
    healthNum: document.getElementById("healthNum"),
    healthMeter: document.querySelector(".health-meter"),
    staminaFill: document.getElementById("staminaFill"),
    staminaMeter: document.querySelector(".stamina-meter"),
    weaponName: document.getElementById("weaponName"),
    weaponTag: document.getElementById("weaponTag"),
    ammoMag: document.getElementById("ammoMag"),
    ammoReserve: document.getElementById("ammoReserve"),
    reloadFill: document.getElementById("reloadFill"),
    reloadTrack: document.getElementById("reloadTrack"),
    loadout: document.querySelector(".loadout"),
    spinTrack: document.getElementById("spinTrack"),
    spinFill: document.getElementById("spinFill"),
    spinLabel: document.getElementById("spinLabel"),
    weaponSlots: document.getElementById("weaponSlots"),
    upgradeCount: document.getElementById("upgradeCount"),
    mutationStrip: document.getElementById("mutationStrip"),
    mutationChips: document.getElementById("mutationChips"),
    relicStrip: document.getElementById("relicStrip"),
    relicChips: document.getElementById("relicChips"),
    bossBar: document.getElementById("bossBar"),
    bossName: document.getElementById("bossName"),
    bossHpText: document.getElementById("bossHpText"),
    bossFill: document.getElementById("bossFill"),
    upgradeEyebrow: document.getElementById("upgradeEyebrow"),
    upgradeTitle: document.getElementById("upgradeTitle"),
    upgradeSubtitle: document.getElementById("upgradeSubtitle"),
    waveNum: document.getElementById("waveNum"),
    waveStateLabel: document.getElementById("waveStateLabel"),
    threatDot: document.getElementById("threatDot"),
    scoreNum: document.getElementById("scoreNum"),
    killNum: document.getElementById("killNum"),
    fieldTip: document.getElementById("fieldTip"),
    phaseLabel: document.getElementById("phaseLabel"),
    fuelFill: document.getElementById("fuelFill"),
    fuelMeter: document.getElementById("fuelMeter"),
    grenadeCount: document.getElementById("grenadeCount"),
    titleHighScore: document.getElementById("titleHighScore"),
    titleBestWave: document.getElementById("titleBestWave"),
    bestWave: document.getElementById("bestWave"),
    finalBosses: document.getElementById("finalBosses"),
    finalRelics: document.getElementById("finalRelics"),
    finalWave: document.getElementById("finalWave"),
    finalKills: document.getElementById("finalKills"),
    finalHeads: document.getElementById("finalHeads"),
    finalScore: document.getElementById("finalScore"),
    bestScore: document.getElementById("bestScore"),
    newBest: document.getElementById("newBest"),
    epitaph: document.getElementById("epitaph"),
    resumeBtn: document.getElementById("resumeBtn"),
    restartBtn: document.getElementById("restartBtn"),
    againBtn: document.getElementById("againBtn"),
    startBtn: document.getElementById("startBtn"),
    howBtn: document.getElementById("howBtn"),
    helpCloseBtn: document.getElementById("helpCloseBtn"),
    pauseBtn: document.getElementById("pauseBtn")
  };

  /* --------------------------------------------------------------------- */
  /* tiny utilities                                                        */
  /* --------------------------------------------------------------------- */

  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const rand = (a = 1, b) => (b === undefined ? Math.random() * a : a + Math.random() * (b - a));
  const randInt = (a, b) => Math.floor(rand(a, b + 1));
  const pick = (arr) => arr[(Math.random() * arr.length) | 0];
  const sign = (v) => (v < 0 ? -1 : 1);
  const dist2 = (ax, ay, bx, by) => {
    const dx = ax - bx;
    const dy = ay - by;
    return dx * dx + dy * dy;
  };
  const pad = (n, len = 2) => String(n).padStart(len, "0");
  const expDamp = (v, rate, dt) => v * Math.exp(-rate * dt);

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hash(n) {
    n = Math.sin(n * 127.1 + 311.7) * 43758.5453;
    return n - Math.floor(n);
  }

  function safeStorage(key, value) {
    try {
      if (value === undefined) return localStorage.getItem(key);
      localStorage.setItem(key, value);
    } catch (e) {
      return null;
    }
  }

  const HS_KEY = "deadtide.highscore.v1";
  const HS_WAVE_KEY = "deadtide.bestwave.v1";

  /* --------------------------------------------------------------------- */
  /* 3x5 pixel font                                                        */
  /* --------------------------------------------------------------------- */

  const FONT = {
    "0": ["111", "101", "101", "101", "111"],
    "1": ["010", "110", "010", "010", "111"],
    "2": ["111", "001", "111", "100", "111"],
    "3": ["111", "001", "111", "001", "111"],
    "4": ["101", "101", "111", "001", "001"],
    "5": ["111", "100", "111", "001", "111"],
    "6": ["111", "100", "111", "101", "111"],
    "7": ["111", "001", "010", "010", "010"],
    "8": ["111", "101", "111", "101", "111"],
    "9": ["111", "101", "111", "001", "111"],
    A: ["010", "101", "111", "101", "101"],
    B: ["110", "101", "110", "101", "110"],
    C: ["011", "100", "100", "100", "011"],
    D: ["110", "101", "101", "101", "110"],
    E: ["111", "100", "110", "100", "111"],
    F: ["111", "100", "110", "100", "100"],
    G: ["011", "100", "101", "101", "011"],
    H: ["101", "101", "111", "101", "101"],
    I: ["111", "010", "010", "010", "111"],
    J: ["001", "001", "001", "101", "010"],
    K: ["101", "101", "110", "101", "101"],
    L: ["100", "100", "100", "100", "111"],
    M: ["101", "111", "111", "101", "101"],
    N: ["110", "101", "101", "101", "101"],
    O: ["111", "101", "101", "101", "111"],
    P: ["110", "101", "110", "100", "100"],
    Q: ["111", "101", "101", "111", "001"],
    R: ["110", "101", "110", "101", "101"],
    S: ["011", "100", "010", "001", "110"],
    T: ["111", "010", "010", "010", "010"],
    U: ["101", "101", "101", "101", "111"],
    V: ["101", "101", "101", "101", "010"],
    W: ["101", "101", "111", "111", "101"],
    X: ["101", "101", "010", "101", "101"],
    Y: ["101", "101", "010", "010", "010"],
    Z: ["111", "001", "010", "100", "111"],
    "+": ["000", "010", "111", "010", "000"],
    "-": ["000", "000", "111", "000", "000"],
    ".": ["000", "000", "000", "000", "010"],
    "/": ["001", "001", "010", "100", "100"],
    "!": ["010", "010", "010", "000", "010"],
    ":": ["000", "010", "000", "010", "000"],
    " ": ["00", "00", "00", "00", "00"]
  };

  function textWidth(str, scale = 1) {
    let w = 0;
    for (let i = 0; i < str.length; i++) {
      const g = FONT[str[i]] || FONT[" "];
      w += g[0].length * scale + scale;
    }
    return Math.max(0, w - scale);
  }

  function drawText(str, x, y, color, scale = 1, align = "left", alpha = 1) {
    str = String(str).toUpperCase();
    const total = textWidth(str, scale);
    let cx = Math.round(align === "center" ? x - total / 2 : align === "right" ? x - total : x);
    const cy = Math.round(y);
    ctx.save();
    ctx.fillStyle = color;
    ctx.globalAlpha = alpha;
    for (let i = 0; i < str.length; i++) {
      const g = FONT[str[i]] || FONT[" "];
      for (let row = 0; row < 5; row++) {
        for (let col = 0; col < g[row].length; col++) {
          if (g[row][col] === "1") {
            ctx.fillRect(cx + col * scale, cy + row * scale, scale, scale);
          }
        }
      }
      cx += g[0].length * scale + scale;
    }
    ctx.restore();
  }

  /* --------------------------------------------------------------------- */
  /* procedural audio                                                      */
  /* --------------------------------------------------------------------- */

  class AudioEngine {
    constructor() {
      this.ctx = null;
      this.ready = false;
      this.muted = false;
      this.noiseBuffer = null;
      this.ambientNodes = [];
      this._lastGroan = 0;
    }

    init() {
      if (this.ready) {
        this.resume();
        return;
      }
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      try {
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.gain.value = this.muted ? 0 : 0.55;
        this.comp = this.ctx.createDynamicsCompressor();
        this.comp.threshold.value = -16;
        this.comp.knee.value = 16;
        this.comp.ratio.value = 5;
        this.comp.attack.value = 0.003;
        this.comp.release.value = 0.25;
        this.master.connect(this.comp);
        this.comp.connect(this.ctx.destination);
        this.noiseBuffer = this.makeNoise(2.8);
        this.startAmbience();
        this.ready = true;
        this.resume();
      } catch (e) {
        this.ready = false;
      }
    }

    resume() {
      if (this.ctx && this.ctx.state === "suspended") this.ctx.resume().catch(() => {});
    }

    setMuted(muted) {
      this.muted = muted;
      if (this.master) {
        const now = this.ctx.currentTime;
        this.master.gain.cancelScheduledValues(now);
        this.master.gain.setTargetAtTime(muted ? 0 : 0.55, now, 0.05);
      }
    }

    makeNoise(seconds) {
      const len = Math.floor(this.ctx.sampleRate * seconds);
      const buffer = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
      return buffer;
    }

    tone(freq, endFreq, type, dur, gain, when = 0) {
      if (!this.ready) return;
      const t = this.ctx.currentTime + when;
      const o = this.ctx.createOscillator();
      const g = this.ctx.createGain();
      o.type = type || "sine";
      o.frequency.setValueAtTime(Math.max(1, freq), t);
      if (endFreq !== undefined && endFreq !== null) {
        o.frequency.exponentialRampToValueAtTime(Math.max(1, endFreq), t + dur);
      }
      g.gain.setValueAtTime(0.0001, t);
      g.gain.linearRampToValueAtTime(Math.max(0.0001, gain), t + Math.min(0.012, dur * 0.2));
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g);
      g.connect(this.master);
      o.start(t);
      o.stop(t + dur + 0.03);
    }

    noiseHit(dur, filterType, freq, q, gain, when = 0) {
      if (!this.ready) return;
      const t = this.ctx.currentTime + when;
      const src = this.ctx.createBufferSource();
      src.buffer = this.noiseBuffer;
      src.loop = true;
      const f = this.ctx.createBiquadFilter();
      f.type = filterType || "lowpass";
      f.frequency.setValueAtTime(freq, t);
      f.Q.value = q || 0.7;
      const g = this.ctx.createGain();
      g.gain.setValueAtTime(Math.max(0.0001, gain), t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      src.connect(f);
      f.connect(g);
      g.connect(this.master);
      src.start(t);
      src.stop(t + dur + 0.02);
    }

    startAmbience() {
      const ctxA = this.ctx;
      const t = ctxA.currentTime;

      const makeLoop = (filterType, freq, q, gain, kind) => {
        const src = ctxA.createBufferSource();
        src.buffer = this.noiseBuffer;
        src.loop = true;
        const f = ctxA.createBiquadFilter();
        f.type = filterType;
        f.frequency.value = freq;
        f.Q.value = q;
        const g = ctxA.createGain();
        g.gain.value = gain;
        src.connect(f);
        f.connect(g);
        g.connect(this.master);
        src.start(t + Math.random() * 0.2);
        this.ambientNodes.push({ src, gain: g, kind });
        return g;
      };

      makeLoop("highpass", 1600, 0.5, 0.014, "rain");
      makeLoop("lowpass", 260, 0.8, 0.024, "sea");
      makeLoop("bandpass", 620, 0.6, 0.006, "wind");

      const droneGain = ctxA.createGain();
      droneGain.gain.value = 0.012;
      const droneFilter = ctxA.createBiquadFilter();
      droneFilter.type = "lowpass";
      droneFilter.frequency.value = 220;
      droneGain.connect(droneFilter);
      droneFilter.connect(this.master);

      [43.65, 65.4, 87.3].forEach((freq, i) => {
        const o = ctxA.createOscillator();
        o.type = i === 2 ? "triangle" : "sine";
        o.frequency.value = freq;
        const g = ctxA.createGain();
        g.gain.value = i === 2 ? 0.05 : 0.1;
        o.connect(g);
        g.connect(droneGain);
        o.start(t);
        this.ambientNodes.push({ src: o, gain: g, kind: "drone" });
      });

      const lfo = ctxA.createOscillator();
      lfo.frequency.value = 0.075;
      const lfoGain = ctxA.createGain();
      lfoGain.gain.value = 0.007;
      lfo.connect(lfoGain);
      lfoGain.connect(droneGain.gain);
      lfo.start(t + 0.3);
      this.ambientNodes.push({ src: lfo, gain: null, kind: "lfo" });
    }

    shot(kind) {
      if (!this.ready) return;
      if (kind === "shotgun" || kind === "autoshotgun") {
        const weight = kind === "shotgun" ? 1 : 0.72;
        this.noiseHit(0.3 * weight, "lowpass", 1250, 0.8, 0.55 * weight);
        this.noiseHit(0.08, "highpass", 2100, 0.7, 0.14 * weight);
        this.tone(92, 32, "sine", 0.28 * weight, 0.45 * weight);
        this.tone(180, 70, "square", 0.08, 0.03);
        this.noiseHit(0.48 * weight, "lowpass", 560, 0.8, 0.09, 0.02);
      } else if (kind === "minigun") {
        this.noiseHit(0.055, "bandpass", 1500, 0.8, 0.15);
        this.noiseHit(0.025, "highpass", 2900, 0.8, 0.05);
        this.tone(128, 76, "square", 0.045, 0.045);
        this.tone(68, 44, "sine", 0.055, 0.05);
      } else if (kind === "smg") {
        this.noiseHit(0.07, "bandpass", 1700, 0.7, 0.23);
        this.noiseHit(0.03, "highpass", 2800, 0.8, 0.07);
        this.tone(165, 65, "square", 0.07, 0.11);
        this.tone(80, 42, "sine", 0.09, 0.14);
      } else if (kind === "rifle") {
        this.noiseHit(0.2, "bandpass", 1050, 0.8, 0.46);
        this.noiseHit(0.07, "highpass", 2300, 0.7, 0.18);
        this.tone(112, 34, "sawtooth", 0.22, 0.28);
        this.tone(58, 30, "sine", 0.26, 0.28);
        this.noiseHit(0.34, "lowpass", 700, 0.7, 0.08, 0.03);
      } else if (kind === "launcher") {
        this.noiseHit(0.18, "lowpass", 520, 0.9, 0.38);
        this.tone(82, 38, "sine", 0.22, 0.3);
        this.noiseHit(0.1, "highpass", 1800, 0.7, 0.1);
      } else if (kind === "rail") {
        this.tone(1800, 120, "sawtooth", 0.28, 0.16);
        this.tone(640, 1200, "sine", 0.18, 0.1);
        this.noiseHit(0.22, "highpass", 2600, 0.9, 0.13);
        this.noiseHit(0.3, "lowpass", 280, 0.8, 0.12, 0.03);
      } else {
        this.noiseHit(0.11, "bandpass", 1400, 0.7, 0.36);
        this.noiseHit(0.045, "highpass", 2600, 0.8, 0.12);
        this.tone(150, 55, "square", 0.1, 0.18);
        this.tone(72, 38, "sine", 0.14, 0.22);
        this.noiseHit(0.17, "lowpass", 900, 0.6, 0.05, 0.015);
      }
    }

    spinTick(spin) {
      if (!this.ready) return;
      const pitch = 900 + spin * 900;
      this.tone(pitch, pitch * 1.08, "square", 0.022, 0.011);
      this.noiseHit(0.018, "highpass", 2600, 1.2, 0.008);
    }

    jetTick() {
      if (!this.ready) return;
      this.noiseHit(0.035, "lowpass", 620, 0.7, 0.022);
      this.tone(125, 85, "sawtooth", 0.05, 0.012);
    }

    grenadeThrow() {
      if (!this.ready) return;
      this.noiseHit(0.13, "highpass", 1100, 0.8, 0.055);
      this.tone(330, 170, "triangle", 0.12, 0.025);
    }

    weaponUnlock() {
      if (!this.ready) return;
      this.tone(196, 196, "triangle", 0.4, 0.035);
      this.tone(293.7, 293.7, "triangle", 0.5, 0.032, 0.08);
      this.tone(392, 392, "sine", 0.7, 0.026, 0.16);
      this.noiseHit(0.18, "highpass", 1200, 0.8, 0.04);
    }

    upgradeOpen() {
      if (!this.ready) return;
      this.noiseHit(0.35, "lowpass", 500, 0.7, 0.045);
      this.tone(65.4, 98, "sine", 0.8, 0.055);
      this.tone(130.8, 196, "triangle", 0.9, 0.028, 0.12);
    }

    upgradePick() {
      if (!this.ready) return;
      this.tone(261.6, 261.6, "square", 0.08, 0.03);
      this.tone(392, 392, "square", 0.12, 0.026, 0.07);
      this.tone(523.3, 523.3, "triangle", 0.4, 0.022, 0.15);
    }

    reroll() {
      if (!this.ready) return;
      this.noiseHit(0.08, "bandpass", 2100, 2, 0.05);
      this.tone(440, 260, "square", 0.06, 0.03);
    }

    evolution() {
      if (!this.ready) return;
      this.tone(55, 36, "sawtooth", 1.7, 0.07);
      this.tone(77.8, 58, "sawtooth", 1.4, 0.035, 0.1);
      this.noiseHit(1.3, "lowpass", 280, 0.7, 0.07);
    }

    spark() {
      if (!this.ready) return;
      this.noiseHit(0.1, "highpass", 2800, 0.9, 0.06);
      this.tone(1400, 520, "square", 0.08, 0.035);
    }

    spit() {
      if (!this.ready) return;
      this.noiseHit(0.18, "bandpass", 900, 1.1, 0.08);
      this.tone(240, 90, "sawtooth", 0.22, 0.035);
    }

    acidBurst() {
      if (!this.ready) return;
      this.noiseHit(0.3, "lowpass", 620, 0.8, 0.16);
      this.noiseHit(0.2, "bandpass", 1300, 0.7, 0.06);
      this.tone(110, 42, "sawtooth", 0.28, 0.08);
    }

    birdScreech() {
      if (!this.ready) return;
      this.tone(rand(1050, 1350), rand(520, 760), "sawtooth", 0.2, 0.024);
      this.noiseHit(0.14, "bandpass", 2300, 1.3, 0.04);
    }

    screamer() {
      if (!this.ready) return;
      this.tone(980, 210, "sawtooth", 0.6, 0.05);
      this.tone(1460, 320, "square", 0.38, 0.03, 0.04);
      this.noiseHit(0.45, "bandpass", 2200, 1.2, 0.05);
    }

    burrowRumble() {
      if (!this.ready) return;
      this.noiseHit(1.4, "lowpass", 120, 0.8, 0.14);
      this.tone(39, 26, "sine", 1.1, 0.1);
    }

    burrowEmerge() {
      if (!this.ready) return;
      this.noiseHit(0.35, "lowpass", 330, 0.7, 0.08);
      this.tone(74, 42, "sawtooth", 0.24, 0.045);
    }

    bossRoar() {
      if (!this.ready) return;
      this.tone(92, 31, "sawtooth", 0.75, 0.11);
      this.tone(58, 24, "sine", 0.95, 0.1);
      this.noiseHit(0.8, "lowpass", 420, 0.7, 0.07);
      this.noiseHit(0.35, "bandpass", 1100, 0.8, 0.04, 0.08);
    }

    empty() {
      if (!this.ready) return;
      this.tone(320, 180, "square", 0.035, 0.05);
      this.noiseHit(0.025, "highpass", 3000, 1, 0.03, 0.01);
    }

    reloadStart() {
      if (!this.ready) return;
      this.tone(440, 260, "square", 0.035, 0.045);
      this.noiseHit(0.04, "bandpass", 1800, 2, 0.05, 0.02);
      this.noiseHit(0.05, "bandpass", 1100, 2, 0.04, 0.48);
    }

    reloadEnd() {
      if (!this.ready) return;
      this.tone(220, 420, "square", 0.035, 0.04);
      this.noiseHit(0.045, "bandpass", 2600, 2.5, 0.055, 0.02);
    }

    reloadMagOut() {
      if (!this.ready) return;
      this.tone(150, 82, "square", 0.06, 0.05);
      this.noiseHit(0.07, "bandpass", 900, 1.8, 0.055, 0.02);
    }

    reloadMagIn() {
      if (!this.ready) return;
      this.tone(175, 115, "square", 0.05, 0.06);
      this.noiseHit(0.055, "bandpass", 1500, 2.2, 0.07, 0.03);
      this.noiseHit(0.035, "highpass", 3200, 1.4, 0.04, 0.02);
    }

    reloadRack() {
      if (!this.ready) return;
      this.noiseHit(0.06, "highpass", 2500, 2.3, 0.07, 0.02);
      this.tone(260, 150, "square", 0.045, 0.06);
      this.noiseHit(0.04, "bandpass", 1200, 2, 0.06, 0.05);
    }

    reloadShell() {
      if (!this.ready) return;
      this.tone(320, 210, "triangle", 0.035, 0.04);
      this.noiseHit(0.045, "bandpass", 1800, 2.4, 0.05, 0.02);
    }

    switchWeapon() {
      if (!this.ready) return;
      this.noiseHit(0.05, "bandpass", 1500, 2.5, 0.04);
      this.tone(280, 190, "square", 0.04, 0.035, 0.05);
    }

    step() {
      if (!this.ready) return;
      this.noiseHit(0.045, "lowpass", 480, 1, 0.035);
      this.tone(80, 55, "sine", 0.055, 0.035);
    }

    dodge() {
      if (!this.ready) return;
      this.noiseHit(0.22, "highpass", 900, 0.8, 0.055);
      this.tone(280, 900, "sine", 0.16, 0.018);
    }

    flesh(head) {
      if (!this.ready) return;
      if (head) {
        this.noiseHit(0.08, "lowpass", 700, 1, 0.13);
        this.noiseHit(0.05, "highpass", 1700, 0.8, 0.07);
        this.tone(100, 34, "sine", 0.1, 0.12);
      } else {
        this.noiseHit(0.07, "bandpass", 360, 0.8, 0.1);
        this.tone(85, 45, "sine", 0.08, 0.06);
      }
    }

    groan() {
      if (!this.ready) return;
      const now = this.ctx.currentTime;
      if (now - this._lastGroan < 2.3) return;
      this._lastGroan = now;
      const f = rand(62, 98);
      this.tone(f, f * rand(0.68, 0.86), "sawtooth", rand(0.55, 0.9), 0.028);
      this.noiseHit(rand(0.35, 0.7), "bandpass", rand(300, 600), 0.9, 0.018);
    }

    swipe() {
      if (!this.ready) return;
      this.noiseHit(0.12, "highpass", 800, 1.2, 0.055);
    }

    hurt() {
      if (!this.ready) return;
      this.noiseHit(0.2, "lowpass", 900, 0.7, 0.18);
      this.tone(210, 70, "sawtooth", 0.22, 0.09);
      this.tone(660, 240, "sine", 0.4, 0.035);
    }

    heartbeat() {
      if (!this.ready) return;
      this.tone(62, 38, "sine", 0.16, 0.09);
      this.tone(48, 31, "sine", 0.2, 0.065, 0.19);
      this.noiseHit(0.06, "lowpass", 180, 0.8, 0.02);
    }

    death() {
      if (!this.ready) return;
      this.tone(96, 28, "sawtooth", 1.4, 0.08);
      this.noiseHit(1.2, "lowpass", 420, 0.6, 0.12);
      this.tone(54, 30, "sine", 1.8, 0.1);
    }

    explosion() {
      if (!this.ready) return;
      this.noiseHit(0.7, "lowpass", 520, 0.7, 0.55);
      this.noiseHit(0.25, "highpass", 900, 0.6, 0.18);
      this.tone(72, 24, "sine", 0.7, 0.5);
      this.noiseHit(1.1, "lowpass", 300, 0.5, 0.16, 0.08);
    }

    pickup() {
      if (!this.ready) return;
      this.tone(520, 520, "square", 0.05, 0.035);
      this.tone(780, 780, "square", 0.08, 0.028, 0.06);
    }

    wave() {
      if (!this.ready) return;
      this.tone(55, 55, "sawtooth", 1.2, 0.055);
      this.tone(82.4, 82.4, "triangle", 0.9, 0.03, 0.12);
      this.noiseHit(1.2, "bandpass", 240, 0.7, 0.025);
    }

    waveClear() {
      if (!this.ready) return;
      this.tone(196, 196, "triangle", 0.55, 0.03);
      this.tone(293.7, 293.7, "triangle", 0.65, 0.025, 0.18);
      this.tone(392, 392, "sine", 0.9, 0.022, 0.36);
    }

    thunder(distance = 1) {
      if (!this.ready) return;
      this.noiseHit(2 + distance, "lowpass", 180, 0.5, 0.12 / distance);
      this.tone(38, 22, "sine", 2.4, 0.16 / distance);
    }
  }

  const audio = new AudioEngine();

  /* --------------------------------------------------------------------- */
  /* static world data                                                     */
  /* --------------------------------------------------------------------- */

  const rng = mulberry32(0xdead71de);

  const stars = Array.from({ length: 68 }, () => ({
    x: rng() * W,
    y: 7 + rng() * 122,
    s: rng() > 0.86 ? 2 : 1,
    a: 0.16 + rng() * 0.52,
    p: rng() * TAU,
    v: 0.5 + rng() * 1.7
  }));

  const clouds = Array.from({ length: 7 }, (_, i) => ({
    x: rng() * W * 1.4,
    y: 26 + rng() * 84,
    w: 50 + rng() * 115,
    h: 5 + rng() * 10,
    a: 0.026 + rng() * 0.05,
    v: 0.7 + rng() * 1.4,
    seed: i
  }));

  const lamps = [
    { x: 292, height: 94, broken: false, phase: 0.3 },
    { x: 1125, height: 102, broken: true, phase: 2.2 },
    { x: 1518, height: 96, broken: false, phase: 4.7 },
    { x: 2116, height: 100, broken: false, phase: 1.6 }
  ].map((l) => ({ ...l, flick: 1 }));

  const puddles = [
    { x: 392, w: 58, y: GROUND_Y + 8, a: 0.13 },
    { x: 714, w: 34, y: GROUND_Y + 15, a: 0.1 },
    { x: 1042, w: 72, y: GROUND_Y + 7, a: 0.16 },
    { x: 1364, w: 44, y: GROUND_Y + 16, a: 0.11 },
    { x: 1668, w: 84, y: GROUND_Y + 9, a: 0.14 },
    { x: 2038, w: 46, y: GROUND_Y + 18, a: 0.1 }
  ];

  const crates = [
    { x: 512, y: GROUND_Y, s: 1, kind: 0 },
    { x: 541, y: GROUND_Y, s: 0.8, kind: 1 },
    { x: 529, y: GROUND_Y - 16, s: 0.65, kind: 2 },
    { x: 1008, y: GROUND_Y, s: 0.9, kind: 1 },
    { x: 1468, y: GROUND_Y, s: 1.15, kind: 0 },
    { x: 1498, y: GROUND_Y, s: 0.75, kind: 2 },
    { x: 1892, y: GROUND_Y, s: 1, kind: 1 },
    { x: 2212, y: GROUND_Y, s: 0.9, kind: 0 }
  ];

  const bollards = [176, 642, 1136, 1778, 2268];
  const backgroundContainers = [
    { x: 92, y: 149, w: 92, h: 34, color: "#2a3538", accent: "#3a4a4b", mark: 1 },
    { x: 438, y: 145, w: 74, h: 38, color: "#343333", accent: "#493d35", mark: 2 },
    { x: 806, y: 152, w: 104, h: 31, color: "#283438", accent: "#39555b", mark: 3 },
    { x: 1188, y: 143, w: 82, h: 40, color: "#33302e", accent: "#4e4038", mark: 1 },
    { x: 1556, y: 151, w: 118, h: 32, color: "#293236", accent: "#33474b", mark: 4 },
    { x: 1952, y: 146, w: 90, h: 37, color: "#34322f", accent: "#4b3b33", mark: 2 }
  ];

  const barrelSpawns = [
    { x: 652, y: GROUND_Y },
    { x: 1248, y: GROUND_Y },
    { x: 1724, y: GROUND_Y },
    { x: 2088, y: GROUND_Y }
  ];

  const rain = Array.from({ length: 105 }, () => ({
    x: Math.random() * W,
    y: Math.random() * H,
    len: 3 + Math.random() * 7,
    speed: 150 + Math.random() * 210,
    a: 0.08 + Math.random() * 0.2
  }));

  const fogBanks = Array.from({ length: 5 }, (_, i) => ({
    x: Math.random() * W,
    y: 160 + Math.random() * 55,
    w: 100 + Math.random() * 170,
    h: 14 + Math.random() * 10,
    v: 2 + Math.random() * 5,
    a: 0.02 + Math.random() * 0.035,
    phase: i * 1.9
  }));

  const titleZombies = [
    { x: 1378, scale: 1, variant: 2, phase: 0.4, dead: false },
    { x: 1436, scale: 0.96, variant: 1, phase: 2.2, dead: false },
    { x: 1494, scale: 1.05, variant: 0, phase: 4.6, dead: false }
  ];

  const PHASES = [
    {
      id: "night",
      label: "夜色",
      en: "NIGHT",
      sky: ["#03070c", "#071218", "#0e1d23", "#16272c"],
      water: ["#0b1b22", "#0a181e", "#071116", "#050b0f"],
      stars: 1,
      celestial: { kind: "moon", x: 330, y: 45, r: 13, color: "#c8c2a5", light: "#d7d0b1", glow: "214,203,169", alpha: 0.2 },
      cloudColor: "#9a9f96",
      cloudAlpha: 1,
      horizon: "84,104,100",
      waterGlints: ["#7e9aa0", "#58787e"],
      pathColor: "#d4cba6",
      ambientDark: [0.08, 0.13, 0.34],
      lamp: 1,
      flashlight: 1,
      rainColor: "173,196,201",
      rainAlpha: 0.5,
      vignette: 0.62,
      grade: null,
      bgTint: null
    },
    {
      id: "dawn",
      label: "黎明",
      en: "DAWN",
      sky: ["#161925", "#302a34", "#775348", "#c27c5c"],
      water: ["#24333a", "#2a3a3e", "#222c2f", "#182124"],
      stars: 0.28,
      celestial: { kind: "sun", x: 408, y: 116, r: 15, color: "#e4a973", light: "#f0bf8b", glow: "226,148,99", alpha: 0.22 },
      cloudColor: "#a89388",
      cloudAlpha: 0.9,
      horizon: "196,126,91",
      waterGlints: ["#9b9c91", "#6c7e7c"],
      pathColor: "#e0aa7d",
      ambientDark: [0.025, 0.055, 0.16],
      lamp: 0.45,
      flashlight: 0.58,
      rainColor: "216,181,158",
      rainAlpha: 0.38,
      vignette: 0.44,
      grade: "rgba(141, 82, 69, 0.055)",
      bgTint: "rgba(201, 127, 88, 0.08)"
    },
    {
      id: "day",
      label: "白昼",
      en: "DAY",
      sky: ["#59696d", "#7a8988", "#96a29c", "#b0b8aa"],
      water: ["#33484c", "#3e5658", "#344b4d", "#283d40"],
      stars: 0.02,
      celestial: { kind: "sun", x: 378, y: 38, r: 16, color: "#e6e4c9", light: "#f2efd4", glow: "224,226,207", alpha: 0.13 },
      cloudColor: "#c3c8bc",
      cloudAlpha: 0.85,
      horizon: "172,188,176",
      waterGlints: ["#aebfb8", "#7d9692"],
      pathColor: "#dfe1c8",
      ambientDark: [0.005, 0.015, 0.07],
      lamp: 0.06,
      flashlight: 0.24,
      rainColor: "194,209,209",
      rainAlpha: 0.44,
      vignette: 0.3,
      grade: "rgba(190, 203, 194, 0.055)",
      bgTint: "rgba(174, 190, 180, 0.16)"
    },
    {
      id: "dusk",
      label: "黄昏",
      en: "DUSK",
      sky: ["#100c15", "#25151f", "#512d2f", "#9e5741"],
      water: ["#251c23", "#2d1e24", "#22161b", "#180f13"],
      stars: 0.22,
      celestial: { kind: "sun", x: 92, y: 116, r: 14, color: "#dd8259", light: "#f0a070", glow: "214,111,76", alpha: 0.2 },
      cloudColor: "#85645e",
      cloudAlpha: 0.95,
      horizon: "164,87,67",
      waterGlints: ["#9a7c75", "#6e5c5d"],
      pathColor: "#da8f6e",
      ambientDark: [0.05, 0.09, 0.25],
      lamp: 0.8,
      flashlight: 0.75,
      rainColor: "210,160,145",
      rainAlpha: 0.42,
      vignette: 0.56,
      grade: "rgba(121, 62, 61, 0.06)",
      bgTint: "rgba(178, 91, 65, 0.07)"
    }
  ];

  function phaseForWave(wave) {
    return Math.floor((Math.max(1, wave) - 1) / 3) % PHASES.length;
  }

  /* --------------------------------------------------------------------- */
  /* roguelike content: weapons, upgrades, mutations                       */
  /* --------------------------------------------------------------------- */

  const MAX_WEAPONS = 4;

  const WEAPON_DEFS = {
    pistol: {
      id: "pistol",
      name: "M1911",
      short: "M1911",
      tag: "制式手枪",
      code: "PSTL",
      baseMag: 12,
      reserve: 60,
      damage: 24,
      pellets: 1,
      spread: 0.014,
      fireDelay: 0.23,
      reloadTime: 1.05,
      bulletSpeed: 650,
      range: 340,
      recoil: 2.2,
      shake: 2.5,
      kick: 1.7,
      muzzleReach: 18,
      pierce: 0,
      sound: "pistol",
      tracer: "#ffe3a3",
      ammoColor: "#d9bd75",
      reloadStyle: "mag",
      rarity: "common",
      infinite: true
    },
    shotgun: {
      id: "shotgun",
      name: "短管霰弹枪",
      short: "短管霰弹",
      tag: "近距清场",
      code: "SHOT",
      baseMag: 6,
      reserve: 14,
      damage: 15,
      pellets: 7,
      spread: 0.13,
      fireDelay: 0.8,
      reloadTime: 1.55,
      bulletSpeed: 540,
      range: 175,
      recoil: 5.2,
      shake: 7.4,
      kick: 5.2,
      muzzleReach: 21,
      pierce: 0,
      sound: "shotgun",
      tracer: "#ffd27c",
      ammoColor: "#d58c5a",
      reloadStyle: "shell",
      rarity: "common"
    },
    smg: {
      id: "smg",
      name: "MP5 冲锋枪",
      short: "MP5",
      tag: "高射速 / 压制",
      code: "SMG",
      baseMag: 30,
      reserve: 72,
      damage: 10,
      pellets: 1,
      spread: 0.047,
      fireDelay: 0.075,
      reloadTime: 1.4,
      bulletSpeed: 620,
      range: 300,
      recoil: 1.1,
      shake: 1.8,
      kick: 0.65,
      muzzleReach: 19,
      pierce: 0,
      sound: "smg",
      tracer: "#ffdca0",
      ammoColor: "#9bbcc4",
      reloadStyle: "mag",
      rarity: "rare"
    },
    rifle: {
      id: "rifle",
      name: "M14 战斗步枪",
      short: "M14",
      tag: "穿透 / 重击",
      code: "RIFL",
      baseMag: 8,
      reserve: 32,
      damage: 42,
      pellets: 1,
      spread: 0.006,
      fireDelay: 0.36,
      reloadTime: 1.45,
      bulletSpeed: 840,
      range: 440,
      recoil: 3.4,
      shake: 4.2,
      kick: 3,
      muzzleReach: 24,
      pierce: 2,
      sound: "rifle",
      tracer: "#fff0ba",
      ammoColor: "#c7b48b",
      reloadStyle: "bolt",
      rarity: "rare"
    },
    autoshotgun: {
      id: "autoshotgun",
      name: "AA-12 自动霰弹枪",
      short: "AA-12",
      tag: "全自动 / 近距",
      code: "AA12",
      baseMag: 8,
      reserve: 24,
      damage: 10,
      pellets: 4,
      spread: 0.115,
      fireDelay: 0.34,
      reloadTime: 1.7,
      bulletSpeed: 560,
      range: 190,
      recoil: 3.5,
      shake: 5.4,
      kick: 3.6,
      muzzleReach: 22,
      pierce: 0,
      sound: "autoshotgun",
      tracer: "#ffc47b",
      ammoColor: "#c98260",
      reloadStyle: "mag",
      rarity: "epic"
    },
    minigun: {
      id: "minigun",
      name: "M134 转轮机枪",
      short: "M134",
      tag: "重型 / 自旋",
      code: "M134",
      baseMag: 100,
      reserve: 180,
      damage: 9,
      pellets: 1,
      spread: 0.04,
      fireDelay: 0.115,
      reloadTime: 3.2,
      bulletSpeed: 700,
      range: 360,
      recoil: 2.4,
      shake: 1.5,
      kick: 0.45,
      muzzleReach: 26,
      pierce: 0,
      sound: "minigun",
      tracer: "#ffd178",
      ammoColor: "#e2a35e",
      reloadStyle: "belt",
      rarity: "epic",
      spinUp: true
    },
    launcher: {
      id: "launcher",
      name: "M32 榴弹发射器",
      short: "M32",
      tag: "爆炸 / 清群",
      code: "M32",
      baseMag: 4,
      reserve: 12,
      damage: 32,
      pellets: 1,
      spread: 0.012,
      fireDelay: 0.92,
      reloadTime: 2.45,
      bulletSpeed: 430,
      range: 280,
      recoil: 4.8,
      shake: 4.2,
      kick: 4.2,
      muzzleReach: 22,
      pierce: 0,
      sound: "launcher",
      tracer: "#ffb366",
      ammoColor: "#d98545",
      reloadStyle: "cyl",
      rarity: "epic",
      explosive: true,
      explosionRadius: 58,
      explosionDamage: 90,
      minWave: 6
    },
    railgun: {
      id: "railgun",
      name: "磁轨炮",
      short: "磁轨",
      tag: "穿透 / 重击",
      code: "RAIL",
      baseMag: 3,
      reserve: 9,
      damage: 138,
      pellets: 1,
      spread: 0.001,
      fireDelay: 1.18,
      reloadTime: 2.65,
      bulletSpeed: 1500,
      range: 820,
      recoil: 7,
      shake: 6.2,
      kick: 5.2,
      muzzleReach: 27,
      pierce: 6,
      sound: "rail",
      tracer: "#b9f0ff",
      ammoColor: "#9adfe0",
      reloadStyle: "cell",
      rarity: "epic",
      minWave: 9,
      rail: true
    }
  };

  const WEAPON_UNLOCK_POOL = ["smg", "rifle", "autoshotgun", "minigun", "launcher", "railgun"];

  function makeWeapon(id, stats) {
    const d = WEAPON_DEFS[id];
    const magSize = Math.ceil(d.baseMag * (stats ? stats.magMul : 1));
    return {
      ...d,
      magSize,
      mag: magSize,
      reserve: Math.round(d.reserve * (stats ? stats.ammoMul : 1)),
      spin: 0
    };
  }

  function defaultStats() {
    return {
      damage: 1,
      fireRate: 1,
      reloadMul: 1,
      move: 1,
      maxHp: 0,
      critChance: 0.05,
      critMul: 2,
      headshot: 1,
      lifesteal: 0,
      pierce: 0,
      ammoMul: 1,
      magMul: 1,
      luck: 0,
      armor: 0,
      regen: 0,
      pickupMul: 1,
      pickupRadius: 17,
      dodgeCost: 24,
      fury: false,
      jetCapacity: 100,
      jetThrust: 1,
      jetRecharge: 1,
      airDamage: 1,
      grenadeMax: 3,
      grenadeDamage: 1,
      grenadeRadius: 1
    };
  }

  const UPGRADE_POOL = [
    {
      id: "damage",
      name: "高压弹头",
      glyph: "DMG",
      category: "火力 / 通用",
      rarity: "common",
      weight: 9,
      desc: "所有武器伤害 +16%。",
      apply() {
        game.player.stats.damage *= 1.16;
      }
    },
    {
      id: "firerate",
      name: "枪机超频",
      glyph: "ROF",
      category: "火力 / 射速",
      rarity: "rare",
      weight: 5,
      desc: "所有武器射速 +13%。",
      apply() {
        game.player.stats.fireRate *= 1.13;
      }
    },
    {
      id: "reload",
      name: "快速装填",
      glyph: "RLD",
      category: "火力 / 装填",
      rarity: "common",
      weight: 7,
      desc: "换弹时间 -15%。",
      apply() {
        game.player.stats.reloadMul *= 0.85;
      }
    },
    {
      id: "maxhp",
      name: "强化纤维",
      glyph: "HP",
      category: "生存 / 体质",
      rarity: "common",
      weight: 8,
      desc: "最大生命 +22，并立即恢复 22 点生命。",
      apply() {
        game.player.stats.maxHp += 22;
        game.player.maxHealth += 22;
        game.player.health = Math.min(game.player.maxHealth, game.player.health + 22);
      }
    },
    {
      id: "move",
      name: "轻量战术靴",
      glyph: "MOV",
      category: "生存 / 机动",
      rarity: "common",
      weight: 7,
      desc: "移动与冲刺速度 +8%。",
      apply() {
        game.player.stats.move *= 1.08;
      }
    },
    {
      id: "crit",
      name: "致命准星",
      glyph: "CRT",
      category: "火力 / 暴击",
      rarity: "rare",
      weight: 5,
      desc: "暴击率 +8%。",
      apply() {
        game.player.stats.critChance = Math.min(0.75, game.player.stats.critChance + 0.08);
      }
    },
    {
      id: "critdamage",
      name: "空尖弹",
      glyph: "CRT+",
      category: "火力 / 暴击",
      rarity: "rare",
      weight: 4,
      desc: "暴击伤害 +30%。",
      apply() {
        game.player.stats.critMul += 0.3;
      }
    },
    {
      id: "headshot",
      name: "颅骨标记",
      glyph: "HEAD",
      category: "火力 / 精准",
      rarity: "rare",
      weight: 4,
      desc: "爆头伤害 +28%。",
      apply() {
        game.player.stats.headshot *= 1.28;
      }
    },
    {
      id: "lifesteal",
      name: "血债",
      glyph: "SIP",
      category: "生存 / 吸血",
      rarity: "epic",
      weight: 2,
      desc: "造成伤害的 3% 转化为生命。",
      apply() {
        game.player.stats.lifesteal += 0.03;
      }
    },
    {
      id: "pierce",
      name: "穿甲弹芯",
      glyph: "PEN",
      category: "火力 / 穿透",
      rarity: "epic",
      weight: 2,
      desc: "子弹额外穿透 1 个感染体。",
      apply() {
        game.player.stats.pierce += 1;
      }
    },
    {
      id: "mag",
      name: "扩容弹匣",
      glyph: "MAG",
      category: "火力 / 弹匣",
      rarity: "rare",
      weight: 5,
      desc: "所有武器弹匣容量 +25%，并补满增加的部分。",
      apply() {
        game.player.stats.magMul *= 1.25;
        applyMagazineUpgrade();
      }
    },
    {
      id: "ammo",
      name: "军械配给",
      glyph: "AMMO",
      category: "资源 / 弹药",
      rarity: "common",
      weight: 7,
      desc: "弹药拾取与波次补给 +30%，并立即补充少量备弹。",
      apply() {
        game.player.stats.ammoMul *= 1.3;
        for (const w of game.player.weapons) {
          if (w.infinite) continue;
          w.reserve += Math.ceil(w.magSize * 0.24 * game.player.stats.ammoMul);
        }
      }
    },
    {
      id: "armor",
      name: "防弹插板",
      glyph: "ARM",
      category: "生存 / 护甲",
      rarity: "rare",
      weight: 4,
      desc: "受到的伤害 -8%（最多 55%）。",
      apply() {
        game.player.stats.armor = Math.min(0.55, game.player.stats.armor + 0.08);
      }
    },
    {
      id: "regen",
      name: "应急缝合",
      glyph: "REG",
      category: "生存 / 再生",
      rarity: "rare",
      weight: 4,
      desc: "每秒恢复 1.2 点生命。",
      apply() {
        game.player.stats.regen += 1.2;
      }
    },
    {
      id: "pickup",
      name: "拾荒者手套",
      glyph: "LUCK",
      category: "资源 / 拾取",
      rarity: "rare",
      weight: 4,
      desc: "拾取范围 +40%，物资效果 +30%。",
      apply() {
        game.player.stats.pickupRadius += 7;
        game.player.stats.pickupMul += 0.3;
      }
    },
    {
      id: "fury",
      name: "背水一战",
      glyph: "FURY",
      category: "火力 / 极限",
      rarity: "epic",
      weight: 2,
      desc: "生命低于 45% 时，伤害 +30%。",
      apply() {
        game.player.stats.fury = true;
      }
    },
    {
      id: "glasscannon",
      name: "超载核心",
      glyph: "RISK",
      category: "火力 / 危险",
      rarity: "epic",
      weight: 2,
      desc: "伤害 +30%，但最大生命 -15。",
      apply() {
        game.player.stats.damage *= 1.3;
        game.player.stats.maxHp = Math.max(-60, game.player.stats.maxHp - 15);
        game.player.maxHealth = Math.max(40, 100 + game.player.stats.maxHp);
        game.player.health = Math.min(game.player.health, game.player.maxHealth);
      }
    },
    {
      id: "dodge",
      name: "战术翻滚",
      glyph: "DGE",
      category: "生存 / 机动",
      rarity: "common",
      weight: 5,
      desc: "闪避消耗的体力 -30%。",
      apply() {
        game.player.stats.dodgeCost *= 0.7;
      }
    },
    {
      id: "jet_capacity",
      name: "高压气瓶",
      glyph: "JET",
      category: "生存 / 喷气背包",
      rarity: "rare",
      weight: 4,
      desc: "喷气背包燃料 +35，并立即加满。",
      apply() {
        game.player.stats.jetCapacity += 35;
        game.player.jetMax += 35;
        game.player.jetFuel = game.player.jetMax;
      }
    },
    {
      id: "jet_thrust",
      name: "矢量喷口",
      glyph: "THR",
      category: "生存 / 喷气背包",
      rarity: "rare",
      weight: 4,
      desc: "喷气背包推力 +18%，地面燃料恢复 +12%。",
      apply() {
        game.player.stats.jetThrust *= 1.18;
        game.player.stats.jetRecharge *= 1.12;
      }
    },
    {
      id: "air_damage",
      name: "空中猎手",
      glyph: "AIR",
      category: "火力 / 空战",
      rarity: "rare",
      weight: 4,
      desc: "身处空中时，所有伤害 +25%。",
      apply() {
        game.player.stats.airDamage *= 1.25;
      }
    },
    {
      id: "grenade_capacity",
      name: "战术弹药袋",
      glyph: "GRN",
      category: "军械 / 手雷",
      rarity: "common",
      weight: 5,
      desc: "手雷携带上限 +1，并立即补充 2 枚。",
      apply() {
        game.player.stats.grenadeMax += 1;
        game.player.maxGrenades = game.player.stats.grenadeMax;
        game.player.grenades = Math.min(game.player.maxGrenades, game.player.grenades + 2);
      }
    },
    {
      id: "grenade_power",
      name: "高爆装药",
      glyph: "BOOM",
      category: "军械 / 手雷",
      rarity: "epic",
      weight: 2,
      desc: "手雷伤害 +25%，爆炸半径 +15%。",
      apply() {
        game.player.stats.grenadeDamage *= 1.25;
        game.player.stats.grenadeRadius *= 1.15;
      }
    },
    {
      id: "luck",
      name: "锈蚀幸运币",
      glyph: "LCK",
      category: "资源 / 幸运",
      rarity: "common",
      weight: 4,
      desc: "感染体掉落物资的概率提高。",
      apply() {
        game.player.stats.luck += 0.12;
      }
    },
    {
      id: "weapon_smg",
      name: "MP5 冲锋枪",
      glyph: "SMG",
      category: "军械 / 新武器",
      rarity: "rare",
      weight: 5,
      weapon: "smg",
      desc: "高射速、低后坐力。30 发弹匣，适合持续压制。",
      available: () => canUnlockWeapon("smg"),
      apply() {
        unlockWeapon("smg", true);
      }
    },
    {
      id: "weapon_rifle",
      name: "M14 战斗步枪",
      glyph: "M14",
      category: "军械 / 新武器",
      rarity: "rare",
      weight: 5,
      weapon: "rifle",
      desc: "高伤害、可穿透 2 个目标。适合点杀进化体。",
      available: () => canUnlockWeapon("rifle"),
      apply() {
        unlockWeapon("rifle", true);
      }
    },
    {
      id: "weapon_autoshotgun",
      name: "AA-12 自动霰弹枪",
      glyph: "AA12",
      category: "军械 / 新武器",
      rarity: "epic",
      weight: 3,
      weapon: "autoshotgun",
      desc: "全自动霰弹，四颗弹丸。近距离能把尸群轰回去。",
      available: () => canUnlockWeapon("autoshotgun"),
      apply() {
        unlockWeapon("autoshotgun", true);
      }
    },
    {
      id: "weapon_minigun",
      name: "M134 转轮机枪",
      glyph: "M134",
      category: "军械 / 新武器",
      rarity: "epic",
      weight: 3,
      weapon: "minigun",
      desc: "按住扳机预热转轮，射速会不断攀升。重型火力。",
      available: () => canUnlockWeapon("minigun"),
      apply() {
        unlockWeapon("minigun", true);
      }
    },
    {
      id: "weapon_launcher",
      name: "M32 榴弹发射器",
      glyph: "M32",
      category: "军械 / 新武器",
      rarity: "epic",
      weight: 3,
      weapon: "launcher",
      desc: "四发榴弹，命中后范围爆炸。备弹极少，留给尸群最密的时候。",
      available: () => game.wave >= 6 && canUnlockWeapon("launcher"),
      apply() {
        unlockWeapon("launcher", true);
      }
    },
    {
      id: "weapon_railgun",
      name: "磁轨炮",
      glyph: "RAIL",
      category: "军械 / 新武器",
      rarity: "epic",
      weight: 2,
      weapon: "railgun",
      desc: "超高伤害与穿透，但弹容和备弹都很少。用来拆开精英和 Boss。",
      available: () => game.wave >= 9 && canUnlockWeapon("railgun"),
      apply() {
        unlockWeapon("railgun", true);
      }
    }
  ];

  const MUTATION_POOL = [
    {
      id: "carapace",
      name: "甲壳硬化",
      short: "甲壳",
      desc: "感染体长出骨质甲壳，受到的伤害 -18%。",
      color: "#c6b88a"
    },
    {
      id: "feral",
      name: "狂化",
      short: "狂化",
      desc: "感染体移动更快、攻击更凶狠，并更频繁地扑咬。",
      color: "#d15a4e"
    },
    {
      id: "regen",
      name: "腐生再生",
      short: "再生",
      desc: "感染体每秒恢复生命，必须在它恢复前打碎它。",
      color: "#9db66e"
    },
    {
      id: "volatile",
      name: "酸爆囊",
      short: "酸爆",
      desc: "感染体死亡时会爆出腐蚀性酸液，靠近就会被灼伤。",
      color: "#b6d158"
    },
    {
      id: "spitter",
      name: "喷吐者",
      short: "喷吐",
      desc: "部分感染体会从远处吐出酸液，逼迫你不断移动。",
      color: "#8fd071"
    }
  ];

  const BOSS_DEFS = [
    {
      id: "tyrant",
      name: "潮汐暴君",
      en: "TIDE TYRANT",
      style: "brute",
      baseType: "brute",
      hp: 1250,
      damage: 26,
      speed: 21,
      scale: 1.95,
      score: 2600,
      color: "#b64a38"
    },
    {
      id: "brood",
      name: "腐翼母巢",
      en: "BROOD MOTHER",
      style: "air",
      baseType: "bird",
      hp: 1050,
      damage: 20,
      speed: 62,
      scale: 2.35,
      score: 3000,
      color: "#9f5b76"
    },
    {
      id: "oracle",
      name: "溺亡主教",
      en: "DROWNED ORACLE",
      style: "caster",
      baseType: "brute",
      hp: 1100,
      damage: 22,
      speed: 13,
      scale: 1.62,
      score: 3400,
      color: "#5b927d"
    }
  ];

  const RELIC_POOL = [
    {
      id: "relic_boom",
      name: "爆裂弹头",
      glyph: "BOOM",
      category: "Boss 遗物 / 火力",
      rarity: "relic",
      weight: 1,
      desc: "每第 8 次命中触发一次小型爆炸。弹链越密，回响越响。",
      apply() {
        game.relicFlags.explosiveRounds = true;
      }
    },
    {
      id: "relic_bloom",
      name: "尸花",
      glyph: "BLM",
      category: "Boss 遗物 / 火力",
      rarity: "relic",
      weight: 1,
      desc: "感染的尸体在死亡时炸开，对周围造成范围伤害。",
      apply() {
        game.relicFlags.corpseBloom = true;
      }
    },
    {
      id: "relic_arc",
      name: "电弧导体",
      glyph: "ARC",
      category: "Boss 遗物 / 火力",
      rarity: "relic",
      weight: 1,
      desc: "每第 6 次命中会向附近两个目标释放连锁闪电。",
      apply() {
        game.relicFlags.chainLightning = true;
      }
    },
    {
      id: "relic_ammo",
      name: "弹链之心",
      glyph: "AMMO",
      category: "Boss 遗物 / 资源",
      rarity: "relic",
      weight: 1,
      desc: "弹药补给 +60%；击杀有概率额外掉落弹药。",
      apply() {
        game.player.stats.ammoMul *= 1.6;
        game.relicFlags.ammoDrops = true;
      }
    },
    {
      id: "relic_blood",
      name: "血泵",
      glyph: "SANG",
      category: "Boss 遗物 / 生存",
      rarity: "relic",
      weight: 1,
      desc: "造成伤害的 6% 转化为生命；最大生命 +20。",
      apply() {
        game.player.stats.lifesteal += 0.06;
        game.player.stats.maxHp += 20;
        game.player.maxHealth += 20;
        game.player.health = Math.min(game.player.maxHealth, game.player.health + 20);
      }
    },
    {
      id: "relic_lung",
      name: "铁肺",
      glyph: "LUNG",
      category: "Boss 遗物 / 机动",
      rarity: "relic",
      weight: 1,
      desc: "喷气燃料上限 +50，地面燃料恢复 +50%。",
      apply() {
        game.player.stats.jetCapacity += 50;
        game.player.jetMax += 50;
        game.player.jetFuel = game.player.jetMax;
        game.player.stats.jetRecharge *= 1.5;
      }
    },
    {
      id: "relic_reload",
      name: "战术拆装",
      glyph: "TAC",
      category: "Boss 遗物 / 火力",
      rarity: "relic",
      weight: 1,
      desc: "换弹时间 -20%；完成换弹后 4 秒内射速 +25%。",
      apply() {
        game.player.stats.reloadMul *= 0.8;
        game.relicFlags.tacticalReload = true;
      }
    },
    {
      id: "relic_head",
      name: "猎头协议",
      glyph: "HEAD",
      category: "Boss 遗物 / 精准",
      rarity: "relic",
      weight: 1,
      desc: "爆头伤害 +35%；爆头击杀为当前武器回填 1 发。",
      apply() {
        game.player.stats.headshot *= 1.35;
        game.relicFlags.headhunter = true;
      }
    }
  ];

  /* --------------------------------------------------------------------- */
  /* game state                                                            */
  /* --------------------------------------------------------------------- */

  const game = {
    state: "title",
    time: 0,
    ambientTime: 0,
    playTime: 0,
    last: 0,
    camera: { x: 1040, y: 0 },
    shake: 0,
    shakeX: 0,
    shakeY: 0,
    camKickX: 0,
    hitstop: 0,
    whiteFlash: 0,
    redFlash: 0,
    lightning: 0,
    lightningTimer: 14,
    thunderQueue: 0,
    hitMarker: 0,
    hitMarkerHead: false,
    reticleKick: 0,
    bannerTimer: 0,
    toastTimer: 0,
    deathTimer: 0,
    fieldTipTimer: 0,
    player: null,
    zombies: [],
    bullets: [],
    enemyShots: [],
    grenades: [],
    burrowWarnings: [],
    particles: [],
    decals: [],
    casings: [],
    popups: [],
    pickups: [],
    barrels: [],
    lights: [],
    pendingBooms: [],
    wave: 0,
    waveState: "idle",
    waveTimer: 0,
    spawnTimer: 0,
    spawnQueue: [],
    waveTotal: 0,
    waveKilled: 0,
    waveClearDelay: 0,
    burrowTimer: 0,
    enemyGrid: null,
    hudTimer: 0,
    phaseIndex: 0,
    score: 0,
    kills: 0,
    heads: 0,
    shots: 0,
    hits: 0,
    best: parseInt(safeStorage(HS_KEY) || "0", 10) || 0,
    bestWave: parseInt(safeStorage(HS_WAVE_KEY) || "0", 10) || 0,
    muted: false,
    titleHigh: 0,
    flash: 0,
    mutations: [],
    evolutionLevel: 0,
    upgradesTaken: 0,
    currentChoices: [],
    rerollsLeft: 0,
    pendingWeaponNotice: "",
    pendingSupplyNotice: "",
    draftMode: "upgrade",
    boss: null,
    bossPending: null,
    bossesKilled: 0,
    relics: [],
    relicFlags: {},
    relicHitCount: 0,
    chainHitCount: 0,
    relicBurstDepth: 0,
    arcs: [],
    runSeed: 0
  };

  /* --------------------------------------------------------------------- */
  /* audio toggle                                                          */
  /* --------------------------------------------------------------------- */

  function toggleMute() {
    game.muted = !game.muted;
    audio.setMuted(game.muted);
    showToast(game.muted ? "×" : "♪", game.muted ? "声音已静音" : "声音已恢复", game.muted ? "blood" : "");
  }

  /* --------------------------------------------------------------------- */
  /* UI helpers                                                            */
  /* --------------------------------------------------------------------- */

  let bannerHideTimer = 0;
  let toastHideTimer = 0;

  function showBanner(kicker, title, sub, breach = false, hold = 2.7) {
    dom.bannerKicker.textContent = kicker;
    dom.bannerTitle.textContent = title;
    dom.bannerSub.textContent = sub;
    dom.waveBanner.classList.toggle("breach", breach);
    dom.waveBanner.classList.add("show");
    clearTimeout(bannerHideTimer);
    bannerHideTimer = setTimeout(() => {
      dom.waveBanner.classList.remove("show");
    }, hold * 1000);
  }

  function hideBanner() {
    clearTimeout(bannerHideTimer);
    dom.waveBanner.classList.remove("show");
  }

  function showToast(icon, text, className = "", hold = 2.1) {
    dom.toastIcon.textContent = icon;
    dom.toastText.textContent = text;
    dom.toast.className = "toast " + className;
    void dom.toast.offsetWidth;
    dom.toast.classList.add("show");
    clearTimeout(toastHideTimer);
    toastHideTimer = setTimeout(() => dom.toast.classList.remove("show"), hold * 1000);
  }

  function setOverlay(el, hidden) {
    el.classList.toggle("is-hidden", hidden);
  }

  function updateHUD() {
    const p = game.player;
    if (!p) return;
    const hpPct = clamp((p.health / p.maxHealth) * 100, 0, 100);
    dom.healthFill.style.width = hpPct + "%";
    dom.healthNum.textContent = String(Math.ceil(p.health));
    dom.healthMeter.classList.toggle("low", hpPct <= 30);
    dom.staminaFill.style.width = clamp(p.stamina, 0, 100) + "%";
    dom.staminaMeter.classList.toggle("exhausted", p.stamina < 10);
    const fuelPct = clamp((p.jetFuel / Math.max(1, p.jetMax)) * 100, 0, 100);
    dom.fuelFill.style.width = fuelPct + "%";
    dom.fuelMeter.classList.toggle("low", fuelPct < 24);
    dom.grenadeCount.textContent = String(p.grenades);

    const w = p.weapons[p.weapon] || p.weapons[0];
    const reloadPct = p.reload > 0 ? (1 - p.reload / p.reloadTotal) * 100 : 0;
    dom.weaponName.textContent = w.name;
    dom.weaponTag.textContent = p.reload > 0 ? "RELOADING · " + Math.round(reloadPct) + "%" : w.tag;
    dom.ammoMag.textContent = String(w.mag);
    dom.ammoMag.classList.toggle("empty", w.mag <= 0);
    dom.ammoReserve.textContent = w.infinite ? "∞" : String(w.reserve);
    dom.ammoReserve.classList.toggle("low", !w.infinite && w.reserve <= Math.max(2, Math.ceil(w.magSize * 0.35)));
    syncWeaponSlotActive();
    dom.reloadFill.style.width = clamp(reloadPct, 0, 100) + "%";
    dom.reloadTrack.classList.toggle("is-reloading", p.reload > 0);
    dom.loadout.classList.toggle("is-reloading", p.reload > 0);

    if (w.spinUp) {
      dom.spinTrack.classList.remove("is-hidden");
      dom.spinFill.style.width = clamp(w.spin * 100, 0, 100) + "%";
      dom.spinLabel.textContent = "SPIN " + Math.round(w.spin * 100) + "%";
    } else {
      dom.spinTrack.classList.add("is-hidden");
    }

    if (game.boss && !game.boss.dead) {
      const bpct = clamp((game.boss.hp / game.boss.maxHp) * 100, 0, 100);
      dom.bossBar.classList.remove("is-hidden");
      dom.bossName.textContent = game.boss.bossName || "BOSS";
      dom.bossHpText.textContent = Math.ceil(bpct) + "%";
      dom.bossFill.style.width = bpct + "%";
      dom.bossBar.classList.toggle("enraged", !!game.boss.bossRage);
    } else {
      dom.bossBar.classList.add("is-hidden");
    }

    dom.upgradeCount.textContent = String(game.upgradesTaken);
    dom.phaseLabel.textContent = (PHASES[game.phaseIndex] || PHASES[0]).label;
    dom.waveNum.textContent = pad(game.wave);
    dom.scoreNum.textContent = pad(game.score, 6);
    dom.killNum.textContent = String(game.kills);

    if (game.waveState === "dawn") {
      dom.waveStateLabel.textContent = "天光将至";
      dom.threatDot.style.background = "#e2b269";
      dom.threatDot.style.boxShadow = "0 0 7px #e2b269";
    } else if (game.waveState === "break") {
      dom.waveStateLabel.textContent = "补给间隙 " + Math.ceil(game.waveTimer);
      dom.threatDot.style.background = "#d6a35e";
      dom.threatDot.style.boxShadow = "0 0 7px #d6a35e";
    } else if (game.waveState === "pre") {
      dom.waveStateLabel.textContent = "尸潮接近 " + Math.ceil(game.waveTimer);
      dom.threatDot.style.background = "#d7353f";
      dom.threatDot.style.boxShadow = "0 0 7px #d7353f";
    } else {
      const alive = game.zombies.reduce((n, z) => n + (z.dead ? 0 : 1), 0);
      dom.waveStateLabel.textContent = alive > 0 ? "交战中 · " + alive : "搜寻中";
      dom.threatDot.style.background = alive > 0 ? "#d7353f" : "#a9bb83";
      dom.threatDot.style.boxShadow = "0 0 7px " + (alive > 0 ? "#d7353f" : "#a9bb83");
    }

    if (game.fieldTipTimer > 10) dom.fieldTip.classList.add("faded");
  }

  function updateWeaponSlots() {
    const p = game.player;
    if (!p) return;
    dom.weaponSlots.innerHTML = p.weapons
      .map(
        (w, i) =>
          '<span data-slot="' +
          i +
          '" class="' +
          (i === p.weapon ? "active" : "") +
          '"><b>' +
          (i + 1) +
          "</b>" +
          w.short +
          "</span>"
      )
      .join("");
  }

  function syncWeaponSlotActive() {
    const kids = dom.weaponSlots.children;
    const active = game.player ? game.player.weapon : 0;
    for (let i = 0; i < kids.length; i++) {
      kids[i].classList.toggle("active", i === active);
    }
  }

  function updateMutationStrip() {
    const active = game.mutations
      .map((id) => MUTATION_POOL.find((m) => m.id === id))
      .filter(Boolean);
    dom.mutationStrip.classList.toggle("is-hidden", active.length === 0);
    dom.mutationChips.innerHTML = active
      .map(
        (m) =>
          '<span class="mutation-chip" style="--mut:' +
          m.color +
          '" title="' +
          m.desc +
          '">' +
          m.short +
          "</span>"
      )
      .join("");
    dom.upgradeEvolutionInline.textContent = active.length
      ? active.map((m) => m.short).join(" / ")
      : "尚未开始";
  }

  function updateRelicStrip() {
    const active = game.relics
      .map((id) => RELIC_POOL.find((r) => r.id === id))
      .filter(Boolean);
    dom.relicStrip.classList.toggle("is-hidden", active.length === 0);
    dom.relicChips.innerHTML = active
      .map(
        (r) =>
          '<span class="mutation-chip relic-chip" title="' +
          r.desc +
          '">' +
          r.name +
          "</span>"
      )
      .join("");
  }

  /* --------------------------------------------------------------------- */
  /* player / run setup                                                    */
  /* --------------------------------------------------------------------- */

  function makePlayer() {
    const stats = defaultStats();
    return {
      x: 1180,
      y: GROUND_Y,
      vx: 0,
      vy: 0,
      health: 100,
      maxHealth: 100,
      stamina: 100,
      jetFuel: stats.jetCapacity,
      jetMax: stats.jetCapacity,
      jetting: false,
      jetSoundCd: 0,
      grenades: stats.grenadeMax,
      maxGrenades: stats.grenadeMax,
      throwCd: 0,
      jetFxCd: 0,
      aim: 0.02,
      facing: 1,
      weapon: 0,
      weapons: [makeWeapon("pistol", stats), makeWeapon("shotgun", stats)],
      stats,
      fireCd: 0,
      reload: 0,
      reloadTotal: 0,
      reloadFlash: 0,
      reloadEjected: false,
      reloadInserted: false,
      reloadRacked: false,
      reloadShells: 0,
      tacticalTimer: 0,
      autoReload: 0,
      muzzleTimer: 0,
      muzzleLight: 0,
      recoil: 0,
      invuln: 0,
      dodge: 0,
      dodgeDir: 1,
      afterimage: 0,
      walk: 0,
      breath: 0,
      footstep: 0,
      dead: false,
      deathTime: 0,
      deathAngle: 0,
      hurtFlash: 0,
      triggerHeld: false,
      heartbeatCd: 0,
      spinSoundCd: 0
    };
  }

  function resetRun() {
    keys.clear();
    mouse.down = false;
    mouse.lastDown = false;
    const p = makePlayer();
    game.player = p;
    game.zombies = [];
    game.bullets = [];
    game.enemyShots = [];
    game.grenades = [];
    game.burrowWarnings = [];
    game.burrowTimer = 0;
    game.enemyGrid = null;
    game.hudTimer = 0;
    game.particles = [];
    game.decals = [];
    game.casings = [];
    game.popups = [];
    game.pickups = [];
    game.lights = [];
    game.pendingBooms = [];
    game.barrels = barrelSpawns.map((b, i) => ({
      x: b.x,
      y: b.y,
      exploded: false,
      id: i,
      flicker: Math.random() * 10
    }));
    game.camera.x = clamp(p.x - W / 2, 0, WORLD_W - W);
    game.camera.y = 0;
    game.shake = 0;
    game.shakeX = 0;
    game.shakeY = 0;
    game.camKickX = 0;
    game.hitstop = 0;
    game.whiteFlash = 0;
    game.redFlash = 0;
    game.hitMarker = 0;
    game.reticleKick = 0;
    game.phaseIndex = 0;
    stage.dataset.phase = PHASES[0].id;
    game.wave = 0;
    game.waveState = "idle";
    game.waveTimer = 0;
    game.spawnTimer = 0;
    game.spawnQueue = [];
    game.waveTotal = 0;
    game.waveKilled = 0;
    game.waveClearDelay = 0;
    game.score = 0;
    game.kills = 0;
    game.heads = 0;
    game.shots = 0;
    game.hits = 0;
    game.playTime = 0;
    game.fieldTipTimer = 0;
    game.deathTimer = 0;
    game.lastDryFireNotice = -10;
    game.titleHigh = game.best;
    game.mutations = [];
    game.evolutionLevel = 0;
    game.upgradesTaken = 0;
    game.currentChoices = [];
    game.rerollsLeft = 0;
    game.pendingWeaponNotice = "";
    game.pendingSupplyNotice = "";
    game.draftMode = "upgrade";
    game.boss = null;
    game.bossPending = null;
    game.bossesKilled = 0;
    game.relics = [];
    game.relicFlags = {};
    game.relicHitCount = 0;
    game.chainHitCount = 0;
    game.relicBurstDepth = 0;
    game.arcs = [];
    game.runSeed = (Math.random() * 1e9) | 0;
    dom.fieldTip.classList.remove("faded");
    dom.mutationStrip.classList.add("is-hidden");
    dom.mutationChips.innerHTML = "";
    setOverlay(dom.upgrade, true);
    game.volleySeq = 0;
    updateWeaponSlots();
    updateMutationStrip();
    updateRelicStrip();
    updateHUD();
  }

  function hasWeapon(id) {
    return !!game.player && game.player.weapons.some((w) => w.id === id);
  }

  function canUnlockWeapon(id) {
    return !!game.player && game.player.weapons.length < MAX_WEAPONS && !hasWeapon(id);
  }

  function unlockWeapon(id, select = true, quiet = false) {
    const p = game.player;
    if (!p) return false;
    const existing = p.weapons.findIndex((w) => w.id === id);
    if (existing >= 0) {
      if (select) switchWeapon(existing);
      return false;
    }
    if (p.weapons.length >= MAX_WEAPONS) {
      const w = WEAPON_DEFS[id];
      if (w) {
        showToast("!", "武器槽已满 · " + w.name + " 未拾取", "blood", 2.2);
      }
      return false;
    }
    const w = makeWeapon(id, p.stats);
    p.weapons.push(w);
    if (select) {
      p.weapon = p.weapons.length - 1;
      p.reload = 0;
      p.reloadTotal = 0;
      p.fireCd = 0.3;
      p.autoReload = 0;
    }
    updateWeaponSlots();
    updateHUD();
    audio.weaponUnlock();
    if (!quiet) {
      if (game.state === "upgrade") {
        game.pendingWeaponNotice = game.pendingWeaponNotice
          ? game.pendingWeaponNotice + " · " + w.name + " 已装备"
          : w.name + " 已装备";
      } else {
        showToast("★", w.name + " 已装备 · 按 " + p.weapons.length + " 切换", "", 2.6);
      }
    }
    return true;
  }

  function applyMagazineUpgrade() {
    const p = game.player;
    if (!p) return;
    for (const w of p.weapons) {
      const newSize = Math.ceil(w.baseMag * p.stats.magMul);
      if (newSize > w.magSize) w.mag += newSize - w.magSize;
      w.magSize = newSize;
      w.mag = Math.min(w.mag, w.magSize);
    }
    updateHUD();
  }

  function weightedChoices(pool, count, used) {
    const result = [];
    const usedIds = used || new Set();
    let guard = 0;
    while (result.length < count && guard++ < 240) {
      const available = pool.filter(
        (c) => !usedIds.has(c.id) && (!c.available || c.available())
      );
      if (!available.length) break;
      let total = 0;
      for (const c of available) total += c.weight || 1;
      let roll = Math.random() * total;
      let chosen = available[available.length - 1];
      for (const c of available) {
        roll -= c.weight || 1;
        if (roll <= 0) {
          chosen = c;
          break;
        }
      }
      result.push(chosen);
      usedIds.add(chosen.id);
    }
    return result;
  }

  function rollUpgradeChoices() {
    const pool = UPGRADE_POOL.slice();
    const used = new Set();
    let choices = weightedChoices(pool, 3, used);
    if (choices.length < 3) {
      const filler = pool.filter((c) => !used.has(c.id));
      while (choices.length < 3 && filler.length) {
        choices.push(filler.shift());
      }
    }
    if (choices.length && choices.every((c) => c.weapon)) {
      const stat = weightedChoices(
        pool.filter((c) => !c.weapon && (!c.available || c.available())),
        1
      )[0];
      if (stat) choices[choices.length - 1] = stat;
    }
    return choices;
  }

  function rollRelicChoices() {
    const pool = RELIC_POOL.filter((r) => !game.relics.includes(r.id));
    for (let i = pool.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    return pool.slice(0, 3);
  }

  function updateUpgradeHeader() {
    dom.upgradeWave.textContent = pad(game.wave);
    dom.upgradeCountInline.textContent = String(game.upgradesTaken);
    const active = game.mutations
      .map((id) => MUTATION_POOL.find((m) => m.id === id))
      .filter(Boolean);
    dom.upgradeEvolutionInline.textContent = active.length
      ? active.map((m) => m.short).join(" / ")
      : "尚未开始";
  }

  function renderUpgradeChoices() {
    updateUpgradeHeader();
    const isRelic = game.draftMode === "relic";
    dom.upgradeTitle.textContent = isRelic ? "选择一件遗物" : "选择一项强化";
    dom.upgradeSubtitle.textContent = isRelic
      ? "Boss 身上的禁忌改装。它会改变这一整局的打法。"
      : "每一次选择，都会改变这一局的死法。";
    dom.upgradeGrid.innerHTML = game.currentChoices
      .map(
        (card, i) =>
          '<button type="button" class="upgrade-card rarity-' +
          card.rarity +
          '" data-index="' +
          i +
          '">' +
          '<span class="upgrade-top"><span class="upgrade-rarity">' +
          (card.rarity === "relic" ? "RELIC" : card.rarity.toUpperCase()) +
          '</span><span class="upgrade-index">0' +
          (i + 1) +
          "</span></span>" +
          '<span class="upgrade-glyph">' +
          card.glyph +
          "</span>" +
          '<strong class="upgrade-name">' +
          card.name +
          "</strong>" +
          '<span class="upgrade-cat">' +
          card.category +
          "</span>" +
          '<p class="upgrade-desc">' +
          card.desc +
          "</p>" +
          '<span class="upgrade-pick">' +
          (isRelic ? "选择遗物" : "选择强化") +
          " <b>" +
          (i + 1) +
          "</b></span></button>"
      )
      .join("");
    const buttons = dom.upgradeGrid.querySelectorAll(".upgrade-card");
    buttons.forEach((btn) => {
      btn.addEventListener("click", () => chooseUpgrade(Number(btn.dataset.index)));
    });
    dom.upgradeRerollBtn.disabled = game.rerollsLeft <= 0;
    const em = dom.upgradeRerollBtn.querySelector("em");
    if (em) em.textContent = game.rerollsLeft > 0 ? "REROLL · R" : "USED";
  }

  function openUpgradeDraft() {
    if (game.state !== "playing") return;
    game.state = "upgrade";
    game.draftMode = "upgrade";
    game.currentChoices = rollUpgradeChoices();
    game.rerollsLeft = 1;
    mouse.down = false;
    keys.clear();
    hideBanner();
    stage.classList.remove("is-playing");
    renderUpgradeChoices();
    setOverlay(dom.upgrade, false);
    audio.upgradeOpen();
  }

  function openRelicDraft() {
    if (game.state !== "playing") return;
    const choices = rollRelicChoices();
    if (!choices.length) {
      openUpgradeDraft();
      return;
    }
    game.state = "upgrade";
    game.draftMode = "relic";
    game.currentChoices = choices;
    game.rerollsLeft = 1;
    mouse.down = false;
    keys.clear();
    hideBanner();
    stage.classList.remove("is-playing");
    renderUpgradeChoices();
    setOverlay(dom.upgrade, false);
    audio.upgradeOpen();
  }

  function closeUpgradeDraft(card) {
    const wasRelic = game.draftMode === "relic";
    setOverlay(dom.upgrade, true);
    game.currentChoices = [];
    game.state = "playing";
    stage.classList.add("is-playing");
    game.waveState = "break";
    game.waveTimer = Math.max(game.waveTimer, 7);
    game.last = performance.now();
    mouse.down = false;
    updateHUD();
    if (game.pendingWeaponNotice) {
      showToast("★", game.pendingWeaponNotice, "", 2.7);
      game.pendingWeaponNotice = "";
    } else if (card) {
      showToast(wasRelic ? "☠" : "↑", (wasRelic ? "Boss 遗物：" : "强化已获得：") + card.name, "", 2.8);
    } else {
      showToast("+", "补给已投放 · 下一波即将到来", "", 2.2);
    }
    game.draftMode = "upgrade";
    if (game.pendingSupplyNotice) {
      const notice = game.pendingSupplyNotice;
      game.pendingSupplyNotice = "";
      setTimeout(() => {
        if (game.state === "playing" || game.state === "paused") {
          showToast("▣", notice, "", 3);
        }
      }, 2400);
    }
  }

  function chooseUpgrade(index) {
    if (game.state !== "upgrade") return;
    const card = game.currentChoices[index];
    if (!card) return;
    card.apply();
    if (game.draftMode === "relic") {
      if (!game.relics.includes(card.id)) game.relics.push(card.id);
      updateRelicStrip();
    } else {
      game.upgradesTaken++;
    }
    audio.upgradePick();
    updateHUD();
    closeUpgradeDraft(card);
  }

  function rerollUpgrades() {
    if (game.state !== "upgrade" || game.rerollsLeft <= 0) return;
    game.rerollsLeft--;
    game.currentChoices = game.draftMode === "relic" ? rollRelicChoices() : rollUpgradeChoices();
    if (!game.currentChoices.length && game.draftMode === "relic") {
      game.currentChoices = rollUpgradeChoices();
      game.draftMode = "upgrade";
    }
    renderUpgradeChoices();
    audio.reroll();
  }

  function evolveZombies(wave) {
    if (wave !== 3 && wave !== 5 && wave !== 7) return null;
    const available = MUTATION_POOL.filter((m) => !game.mutations.includes(m.id));
    if (!available.length) return null;
    const mutation = available[(Math.random() * available.length) | 0];
    game.mutations.push(mutation.id);
    game.evolutionLevel++;
    game.redFlash = Math.max(game.redFlash, 0.28);
    game.shake = Math.max(game.shake, 3.5);
    updateMutationStrip();
    audio.evolution();
    return mutation;
  }

  function dropWeaponCrate(atX) {
    const p = game.player;
    if (!p || p.weapons.length >= MAX_WEAPONS) return null;
    const candidates = WEAPON_UNLOCK_POOL.filter(
      (id) => canUnlockWeapon(id) && game.wave >= (WEAPON_DEFS[id].minWave || 0)
    );
    if (!candidates.length) return null;
    const id = candidates[(Math.random() * candidates.length) | 0];
    spawnPickup("weapon", atX === undefined ? p.x + rand(-58, 58) : atX, { weaponId: id });
    return WEAPON_DEFS[id].name;
  }

  function startRun() {
    audio.init();
    audio.resume();
    resetRun();
    setOverlay(dom.title, true);
    setOverlay(dom.help, true);
    setOverlay(dom.pause, true);
    setOverlay(dom.upgrade, true);
    setOverlay(dom.gameover, true);
    dom.hud.classList.remove("is-hidden");
    stage.classList.add("is-playing");
    game.state = "playing";
    game.playTime = 0;
    hideBanner();
    startWave(1);
  }

  function restartRun() {
    audio.init();
    audio.resume();
    resetRun();
    setOverlay(dom.pause, true);
    setOverlay(dom.upgrade, true);
    setOverlay(dom.gameover, true);
    setOverlay(dom.title, true);
    dom.hud.classList.remove("is-hidden");
    stage.classList.add("is-playing");
    game.state = "playing";
    hideBanner();
    startWave(1);
  }

  function pauseGame() {
    if (game.state !== "playing") return;
    game.state = "paused";
    mouse.down = false;
    keys.clear();
    stage.classList.remove("is-playing");
    setOverlay(dom.pause, false);
    dom.pause.querySelector("h2").textContent = "暂停";
  }

  function resumeGame() {
    if (game.state !== "paused") return;
    audio.init();
    audio.resume();
    game.state = "playing";
    setOverlay(dom.pause, true);
    stage.classList.add("is-playing");
    game.last = performance.now();
  }

  function finishGameOver() {
    game.state = "gameover";
    stage.classList.remove("is-playing");
    dom.hud.classList.add("is-hidden");
    hideBanner();

    const prevBest = game.best;
    if (game.score > prevBest) {
      game.best = game.score;
      safeStorage(HS_KEY, String(game.score));
    }
    if (game.wave > game.bestWave) {
      game.bestWave = game.wave;
      safeStorage(HS_WAVE_KEY, String(game.wave));
    }
    game.titleHigh = game.best;

    dom.finalWave.textContent = String(game.wave);
    dom.finalKills.textContent = String(game.kills);
    dom.finalHeads.textContent = String(game.heads);
    dom.finalScore.textContent = pad(game.score, 6);
    dom.bestScore.textContent = pad(game.best, 6);
    dom.bestWave.textContent = pad(game.bestWave);
    dom.finalBosses.textContent = String(game.bossesKilled);
    dom.finalRelics.textContent = String(game.relics.length);
    dom.newBest.classList.toggle("show", game.score > prevBest);
    dom.epitaph.textContent =
      game.wave >= 12
        ? "它们记住了你的枪声。潮水还会回来，而且会更多。"
        : game.kills >= 30
          ? "码头短暂地安静了下来。远处的海面，还有东西在移动。"
          : "7 号码头，再次归于死寂。";
    setOverlay(dom.gameover, false);
  }

  function die() {
    if (game.state !== "playing") return;
    const p = game.player;
    p.health = 0;
    p.dead = true;
    p.deathTime = 0;
    p.deathAngle = -0.6 * p.facing;
    p.jetting = false;
    game.state = "dying";
    game.deathTimer = 1.8;
    game.redFlash = 0.9;
    game.whiteFlash = 0.15;
    game.shake = 11;
    game.hitstop = 0.08;
    stage.classList.remove("is-playing");
    mouse.down = false;
    audio.death();
    spawnBlood(p.x, p.y - 16, rand(-2, 2), -2, 28, 220);
    addDecal(p.x + rand(-14, 14), GROUND_Y + rand(0, 5), rand(8, 24), rand(2, 5), "#3d0c12", 0.55);
  }

  /* --------------------------------------------------------------------- */
  /* waves / spawning                                                      */
  /* --------------------------------------------------------------------- */

  const WAVE_SUBS = [
    "它们从潮水里爬出来了",
    "不止一个方向",
    "别让它们靠近",
    "重型感染体正在登岸",
    "潮水涨了。它们也多了。",
    "弹药有限。命也只有一条。",
    "灯灭之前，别停下。"
  ];

  function bossForWave(n) {
    if (n < 6 || n % 6 !== 0) return null;
    return BOSS_DEFS[(Math.floor(n / 6) - 1) % BOSS_DEFS.length];
  }

  function buildWave(n) {
    const total = Math.min(90, 6 + Math.floor(n * 2.4) + Math.floor(Math.pow(n, 1.25) * 0.55));
    const units = [];
    const brutes = n >= 4 ? Math.min(12, 1 + Math.floor((n - 4) / 2)) : 0;
    const runners = n >= 2 ? Math.min(26, Math.floor(total * 0.2) + Math.floor(n / 3)) : 0;
    const birds = n >= 4 ? Math.min(16, 1 + Math.floor((n - 4) * 0.72)) : 0;
    const screamers = n >= 7 ? Math.min(4, 1 + Math.floor((n - 7) / 5)) : 0;
    const bulwarks = n >= 9 ? Math.min(5, 1 + Math.floor((n - 9) / 4)) : 0;
    const walkers = Math.max(1, total - brutes - runners - birds - screamers - bulwarks);
    for (let i = 0; i < walkers; i++) units.push("walker");
    for (let i = 0; i < runners; i++) units.push("runner");
    for (let i = 0; i < brutes; i++) units.push("brute");
    for (let i = 0; i < birds; i++) units.push("bird");
    for (let i = 0; i < screamers; i++) units.push("screamer");
    for (let i = 0; i < bulwarks; i++) units.push("bulwark");

    for (let i = units.length - 1; i > 0; i--) {
      if (units[i] === "brute" && i < 5) {
        const j = randInt(5, units.length - 1);
        [units[i], units[j]] = [units[j], units[i]];
      }
    }
    for (let i = units.length - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      [units[i], units[j]] = [units[j], units[i]];
    }
    return units;
  }

  function startWave(n) {
    game.wave = n;
    game.waveState = "pre";
    game.waveTimer = n === 1 ? 2.3 : 3.1;
    game.spawnTimer = 0.2;
    game.waveClearDelay = 0;
    game.waveKilled = 0;
    game.burrowTimer = n >= 4 ? rand(9, 16) : 0;
    game.boss = null;
    const boss = bossForWave(n);
    game.bossPending = boss;
    const nextPhase = phaseForWave(n);
    const phaseChanged = nextPhase !== game.phaseIndex;
    game.phaseIndex = nextPhase;
    stage.dataset.phase = PHASES[game.phaseIndex].id;
    game.spawnQueue = buildWave(n);
    game.waveTotal = game.spawnQueue.length;
    const mutation = evolveZombies(n);
    let sub = WAVE_SUBS[Math.min(WAVE_SUBS.length - 1, n - 1)];
    if (boss) sub = boss.name + " 正在登岸 · " + boss.en;
    if (mutation) sub += " // 异变：" + mutation.name;
    if (phaseChanged) sub += " // 天色：" + PHASES[game.phaseIndex].label;
    showBanner(
      boss ? "BOSS WAVE" : "WAVE " + pad(n),
      boss ? "第 " + n + " 波 · BOSS" : "第 " + n + " 波",
      sub,
      !!boss || n % 5 === 0 || !!mutation,
      3.2
    );
    if (mutation) {
      setTimeout(() => {
        if (game.state === "playing" || game.state === "paused") {
          showToast("☣", "感染进化 · " + mutation.name + "：" + mutation.desc, "blood", 3.6);
        }
      }, 1200);
    } else if (phaseChanged) {
      const phaseLabel = PHASES[game.phaseIndex].label;
      setTimeout(() => {
        if (game.state === "playing" || game.state === "paused") {
          showToast("◐", "天色轮换 · " + phaseLabel, "", 2.8);
        }
      }, 1200);
    }
    if (n > 1) audio.wave();
  }

  function completeWave() {
    game.waveClearDelay = 0;
    const clearedWave = game.wave;
    const bonus = 240 * clearedWave + game.heads * 3;
    game.score += bonus;
    const p = game.player;
    for (const w of p.weapons) {
      if (w.infinite) continue;
      w.reserve += Math.ceil(w.magSize * 0.14 * p.stats.ammoMul) + 1;
    }
    audio.waveClear();

    game.waveState = "break";
    game.waveTimer = 7;
    game.enemyShots = [];
    game.burrowWarnings = [];
    game.burrowTimer = 0;
    p.health = Math.min(p.maxHealth, p.health + 7 + Math.min(11, clearedWave * 0.45));
    spawnPickup("medkit", p.x + rand(-60, 60));
    if (clearedWave % 3 === 0) {
      spawnPickup("ammo", p.x + rand(-90, 90));
    }

    if (clearedWave === 1 && canUnlockWeapon("minigun")) {
      unlockWeapon("minigun", true, true);
      game.pendingWeaponNotice = "M134 转轮机枪已装备 · 按 3 切换";
    }
    if (clearedWave >= 3 && clearedWave % 3 === 0 && p.weapons.length < MAX_WEAPONS) {
      const crateName = dropWeaponCrate();
      if (crateName) game.pendingSupplyNotice = "武器空投：" + crateName + " · 靠近拾取";
    }
    if (clearedWave % 2 === 0) {
      p.grenades = Math.min(p.maxGrenades, p.grenades + 1);
    }

    showBanner("WAVE CLEARED", "第 " + clearedWave + " 波肃清", "有限弹药补给 · 选择强化后进入下一波", false, 3.4);
    showToast("+", "补给：急救包" + (clearedWave % 3 === 0 ? " / 弹药箱" : ""), "");
    updateHUD();
    if (bossForWave(clearedWave) && RELIC_POOL.some((r) => !game.relics.includes(r.id))) {
      openRelicDraft();
    } else {
      openUpgradeDraft();
    }
  }

  function makeZombie(type, x) {
    const n = Math.max(1, game.wave);
    const defs = {
      walker: {
        hp: 44,
        speed: 22,
        damage: 9,
        score: 100,
        scale: 1,
        reach: 17,
        windup: 0.26,
        attackTime: 0.52,
        cooldown: 0.8
      },
      runner: {
        hp: 27,
        speed: 53,
        damage: 7,
        score: 160,
        scale: 0.94,
        reach: 16,
        windup: 0.2,
        attackTime: 0.42,
        cooldown: 0.62
      },
      brute: {
        hp: 190,
        speed: 16.5,
        damage: 22,
        score: 420,
        scale: 1.38,
        reach: 24,
        windup: 0.38,
        attackTime: 0.78,
        cooldown: 1.15
      },
      bird: {
        hp: 26,
        speed: 86,
        damage: 7,
        score: 150,
        scale: 0.9,
        reach: 14,
        windup: 0.12,
        attackTime: 0.3,
        cooldown: 1.2
      },
      screamer: {
        hp: 64,
        speed: 28,
        damage: 7,
        score: 280,
        scale: 1.08,
        reach: 16,
        windup: 0.28,
        attackTime: 0.5,
        cooldown: 1.1
      },
      bulwark: {
        hp: 225,
        speed: 14,
        damage: 18,
        score: 520,
        scale: 1.24,
        reach: 24,
        windup: 0.36,
        attackTime: 0.72,
        cooldown: 1.2
      }
    };
    const d = defs[type];
    const hpScale = 1 + (n - 1) * 0.115;
    const speedScale = 1 + (n - 1) * 0.032;
    const z = {
      type,
      x,
      y: type === "bird" ? rand(46, 132) : GROUND_Y,
      air: type === "bird",
      dir: x > game.player.x ? -1 : 1,
      deathVy: 0,
      swoop: 0,
      swoopCd: rand(1.4, 3.2),
      screamCd: rand(3.5, 6),
      screamAnim: 0,
      rageTime: 0,
      hp: Math.round(d.hp * hpScale),
      maxHp: Math.round(d.hp * hpScale),
      speed: d.speed * speedScale * rand(0.9, 1.1),
      damage: Math.round(d.damage * (1 + (n - 1) * 0.045)),
      score: d.score,
      scale: d.scale * (type === "brute" ? rand(0.96, 1.05) : rand(0.96, 1.05)),
      reach: d.reach * d.scale,
      windup: d.windup,
      attackTime: d.attackTime,
      cooldown: d.cooldown * rand(0.85, 1.15),
      attackTimer: -1,
      attackCd: rand(0.15, 0.6),
      hitDone: false,
      vx: 0,
      walk: rand(TAU * 4),
      phase: rand(0, 10),
      variant: randInt(0, 2),
      flash: 0,
      stun: 0,
      lungeCd: rand(1.5, 4),
      lunge: 0,
      dead: false,
      deathTime: 0,
      deathDir: Math.random() < 0.5 ? -1 : 1,
      fade: 1,
      headPulse: rand(0, TAU),
      soundCd: rand(2, 7),
      mutations: game.mutations.slice(),
      armor: 0,
      regen: 0,
      volatile: false,
      spitter: false,
      spitCd: rand(1.6, 3.8),
      spitAnim: 0
    };
    z.width = (type === "brute" || type === "bulwark" ? 20 : type === "bird" ? 14 : 11) * z.scale;
    z.height = (type === "brute" ? 35 : type === "bulwark" ? 34 : type === "bird" ? 11 : 29) * z.scale;

    if (game.mutations.includes("carapace")) {
      z.armor = 0.18;
      z.maxHp = Math.round(z.maxHp * 1.2);
      z.speed *= 0.94;
    }
    if (game.mutations.includes("feral")) {
      z.speed *= 1.24;
      z.damage = Math.round(z.damage * 1.12);
      z.lungeCd *= 0.55;
      z.cooldown *= 0.86;
    }
    if (game.mutations.includes("regen")) {
      z.regen = 1.3 + game.evolutionLevel * 0.55;
      z.maxHp = Math.round(z.maxHp * 1.08);
    }
    if (game.mutations.includes("volatile")) {
      z.volatile = true;
    }
    if (game.mutations.includes("spitter") && type !== "brute" && type !== "bird") {
      z.spitter = Math.random() < Math.min(0.68, 0.36 + game.evolutionLevel * 0.1);
    }
    z.hp = z.maxHp;
    return z;
  }

  function spawnZombie(type, atX) {
    const cam = game.camera.x;
    const options = [];
    const padX = 26;
    if (cam - padX > 34) options.push(cam - padX);
    if (cam + W + padX < WORLD_W - 34) options.push(cam + W + padX);
    if (!options.length) {
      options.push(cam > WORLD_W / 2 ? 40 : WORLD_W - 40);
    }
    let x = atX === undefined ? options[(Math.random() * options.length) | 0] : atX;
    x = clamp(x, 34, WORLD_W - 34);
    const z = makeZombie(type, x);
    game.zombies.push(z);
    if (z.air) {
      z.y = rand(44, 138);
      z.vy = rand(-8, 8);
      z.vx = z.dir * z.speed * 0.35;
      if (Math.random() < 0.65) audio.birdScreech();
      for (let i = 0; i < 6; i++) {
        spawnParticle({
          kind: "feather",
          x: z.x + rand(-5, 5),
          y: z.y - rand(2, 8),
          vx: rand(-20, 20),
          vy: rand(-8, 30),
          life: rand(0.35, 0.9),
          size: rand(1, 2),
          color: i % 3 ? "#7a7c67" : "#a8a78e",
          gravity: 30
        });
      }
      return;
    }
    if (Math.random() < 0.45) audio.groan();
    // Wet arrival smear.
    for (let i = 0; i < 7; i++) {
      spawnParticle({
        kind: "dust",
        x: x + rand(-8, 8),
        y: GROUND_Y + rand(-3, 2),
        vx: rand(-8, 8),
        vy: rand(-24, -5),
        life: rand(0.3, 0.7),
        size: rand(1, 2),
        color: "#83928a"
      });
    }
  }

  function bossSummon(z, count, type) {
    for (let i = 0; i < count; i++) {
      spawnZombie(type || (i % 3 === 0 ? "runner" : "walker"), z.x + rand(-90, 90));
      const add = game.zombies[game.zombies.length - 1];
      if (add) {
        add.stun = rand(0.2, 0.55);
        add.vx = rand(-40, 40);
      }
    }
    for (let i = 0; i < 16; i++) {
      spawnParticle({
        kind: "smoke",
        x: z.x + rand(-20, 20),
        y: (z.air ? z.y : GROUND_Y) - rand(0, 30),
        vx: rand(-30, 30),
        vy: rand(-50, -8),
        life: rand(0.3, 0.85),
        size: rand(1, 2.5),
        color: "#6f6a57",
        gravity: -18
      });
    }
    addLight(z.x, z.air ? z.y : GROUND_Y - 20, 90, 0.24, "#b06a4d");
  }

  function bossShockwave(z, radius, damage) {
    const groundY = GROUND_Y - 3;
    game.shake = Math.max(game.shake, 11);
    game.hitstop = Math.max(game.hitstop, 0.035);
    audio.explosion();
    addLight(z.x, groundY, radius * 1.5, 0.3, "#d4774d");
    spawnParticle({
      kind: "ring",
      x: z.x,
      y: groundY,
      vx: 0,
      vy: 0,
      life: 0.45,
      maxLife: 0.45,
      size: 1,
      color: "#e69862",
      r0: 8,
      r1: radius
    });
    for (let i = 0; i < 22; i++) {
      const a = rand(0, TAU);
      spawnParticle({
        kind: i % 3 === 0 ? "ember" : "dust",
        x: z.x + Math.cos(a) * rand(4, 20),
        y: groundY,
        vx: Math.cos(a) * rand(35, 170),
        vy: rand(-100, -15),
        life: rand(0.3, 0.8),
        size: rand(1, 2),
        color: i % 3 === 0 ? "#ffc47b" : "#8b7059",
        gravity: 250
      });
    }
    addDecal(z.x + rand(-10, 10), GROUND_Y + 2, radius * 0.7, 4, "#20140f", 0.4);
    const p = game.player;
    if (p && !p.dead && p.y > GROUND_Y - 28 && Math.abs(p.x - z.x) < radius) {
      hurtPlayer(damage, z);
      p.x += sign(p.x - z.x) * 22;
      p.x = clamp(p.x, 30, WORLD_W - 30);
    }
  }

  function bossAcidFan(z, count) {
    const p = game.player;
    const sx = z.x + z.dir * 10;
    const sy = z.y - z.height * 0.78;
    const base = Math.atan2(p.y - 17 - sy, p.x - sx);
    for (let i = 0; i < count; i++) {
      const angle = base + (i - (count - 1) / 2) * 0.16 + rand(-0.035, 0.035);
      const speed = rand(150, 185);
      game.enemyShots.push({
        x: sx,
        y: sy,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 2.6,
        trail: 0,
        wobble: rand(0, TAU),
        damage: Math.round(z.damage * 0.55),
        boss: true
      });
    }
    for (let i = 0; i < 10; i++) {
      spawnParticle({
        kind: "acid",
        x: sx + rand(-4, 4),
        y: sy + rand(-5, 5),
        vx: z.dir * rand(10, 50),
        vy: rand(-45, 10),
        life: rand(0.2, 0.55),
        size: rand(1, 2),
        color: "#b7db70",
        gravity: 160
      });
    }
    audio.spit();
  }

  function spawnBoss(def) {
    const p = game.player;
    let x = game.camera.x + W - 88;
    if (x < p.x + 95) x = p.x + 95;
    if (x > WORLD_W - 80) x = p.x - 175;
    x = clamp(x, 80, WORLD_W - 80);
    const z = makeZombie(def.baseType, x);
    const tier = Math.floor((game.wave - 6) / 6);
    z.boss = true;
    z.bossId = def.id;
    z.bossName = def.name;
    z.bossStyle = def.style;
    z.bossColor = def.color;
    z.scale = def.scale;
    z.width = (def.baseType === "bird" ? 14 : 20) * def.scale;
    z.height = (def.baseType === "bird" ? 11 : 35) * def.scale;
    z.maxHp = Math.round(def.hp * (1 + tier * 0.62));
    z.hp = z.maxHp;
    z.damage = Math.round(def.damage * (1 + tier * 0.22));
    z.speed = def.speed;
    z.reach = def.baseType === "bird" ? 26 : 36;
    z.score = def.score;
    z.armor = Math.min(0.3, 0.12 + tier * 0.03);
    z.spitter = false;
    z.volatile = false;
    z.regen = 0;
    z.attackTimer = -1;
    z.attackCd = 1.2;
    z.bossAbilityCd = 2.4;
    z.bossAction = "";
    z.bossActionT = 0;
    z.bossSummons = 0;
    z.bossRage = false;
    z.contactCd = 0;
    z.stun = 0;
    z.air = def.style === "air";
    z.y = z.air ? 96 : GROUND_Y;
    z.vx = 0;
    z.vy = 0;
    z.dir = x > p.x ? -1 : 1;
    z.walk = 0;
    game.zombies.push(z);
    game.boss = z;
    game.shake = Math.max(game.shake, 13);
    game.whiteFlash = Math.max(game.whiteFlash, 0.12);
    addLight(z.x, z.air ? z.y : GROUND_Y - 20, 120, 0.35, def.color);
    audio.bossRoar();
    for (let i = 0; i < 28; i++) {
      spawnParticle({
        kind: i % 4 === 0 ? "ember" : "smoke",
        x: z.x + rand(-24, 24),
        y: (z.air ? z.y : GROUND_Y - 8) + rand(-20, 8),
        vx: rand(-80, 80),
        vy: rand(-120, -8),
        life: rand(0.35, 1.1),
        size: rand(1, 3),
        color: i % 4 === 0 ? def.color : "#6b5c4e",
        gravity: i % 4 === 0 ? 80 : -20
      });
    }
  }

  function updateBoss(z, dt, p) {
    z.contactCd = Math.max(0, z.contactCd - dt);
    z.bossAbilityCd = Math.max(0, z.bossAbilityCd - dt);
    z.walk += dt * (2.2 + z.speed * 0.02);
    const dx = p.x - z.x;
    const dist = Math.abs(dx);
    z.dir = dx < 0 ? -1 : 1;
    const playerLow = p.y > GROUND_Y - 30;

    if (!z.bossRage && z.hp < z.maxHp * 0.32) {
      z.bossRage = true;
      z.speed *= 1.22;
      z.damage = Math.round(z.damage * 1.15);
      showToast("☠", z.bossName + " 进入狂暴", "blood", 2.6);
      game.shake = Math.max(game.shake, 8);
    }

    const summonAt = z.bossSummons === 0 ? 0.72 : z.bossSummons === 1 ? 0.4 : 0;
    if (summonAt && z.hp / z.maxHp <= summonAt) {
      z.bossSummons++;
      bossSummon(z, z.bossStyle === "air" ? 3 : 4, z.bossStyle === "air" ? "bird" : "runner");
      showToast("!", z.bossName + " 正在召唤尸群", "blood", 2.2);
    }

    if (z.bossStyle === "air") {
      if (z.bossAction === "dive") {
        z.bossActionT -= dt;
        const ty = p.y - 17;
        const len = Math.max(1, Math.hypot(p.x - z.x, ty - z.y));
        z.vx = lerp(z.vx, ((p.x - z.x) / len) * 300, Math.min(1, dt * 4.5));
        z.vy = lerp(z.vy, ((ty - z.y) / len) * 300, Math.min(1, dt * 4.5));
        z.x += z.vx * dt;
        z.y += z.vy * dt;
        if (dist2(z.x, z.y, p.x, p.y - 17) < (z.width * 0.62) ** 2 && z.contactCd <= 0 && !p.dead) {
          hurtPlayer(z.damage, z);
          z.contactCd = 1.1;
          z.bossAction = "";
          z.bossActionT = 0;
          z.bossAbilityCd = 1.7;
          z.vy = -100;
          z.vx = -z.dir * 80;
          audio.birdScreech();
        }
        if (z.bossActionT <= 0) {
          z.bossAction = "";
          z.bossAbilityCd = 2.4;
        }
      } else {
        const hoverX = p.x + Math.sin(game.playTime * 0.55 + 1.3) * 58;
        const hoverY = Math.max(38, p.y - 90);
        z.vx = lerp(z.vx, clamp((hoverX - z.x) * 1.5, -1, 1) * z.speed, Math.min(1, dt * 1.5));
        z.vy = lerp(z.vy, clamp((hoverY - z.y) * 1.5, -1, 1) * z.speed * 0.9, Math.min(1, dt * 1.5));
        z.x += z.vx * dt;
        z.y += z.vy * dt;
        if (z.bossAbilityCd <= 0) {
          z.bossAction = "dive";
          z.bossActionT = 0.8;
          z.bossAbilityCd = 3.2;
          audio.birdScreech();
        }
      }
      z.x = clamp(z.x, 30, WORLD_W - 30);
      z.y = clamp(z.y, 20, GROUND_Y - 18);
      return;
    }

    if (z.bossStyle === "caster") {
      if (dist < 125) z.x -= z.dir * z.speed * dt;
      else if (dist > 245) z.x += z.dir * z.speed * dt;
      if (z.bossAbilityCd <= 0) {
        bossAcidFan(z, 5);
        z.bossAbilityCd = z.bossRage ? 2.3 : 3.1;
      }
      if (dist < z.width * 0.55 && playerLow && z.contactCd <= 0 && !p.dead) {
        hurtPlayer(z.damage, z);
        z.contactCd = 1.2;
        p.x += z.dir * 16;
      }
      z.x = clamp(z.x, 30, WORLD_W - 30);
      return;
    }

    if (z.bossAction === "chargeWind") {
      z.bossActionT -= dt;
      if (z.bossActionT <= 0) {
        z.bossAction = "charge";
        z.bossActionT = 0.55;
        z.vx = z.dir * 390;
        audio.bossRoar();
      }
      return;
    }
    if (z.bossAction === "charge") {
      z.bossActionT -= dt;
      z.x += z.vx * dt;
      z.vx *= Math.exp(-0.7 * dt);
      if (playerLow && Math.abs(p.x - z.x) < z.width * 0.7 && z.contactCd <= 0 && !p.dead) {
        hurtPlayer(z.damage * 1.2, z);
        p.x += z.dir * 24;
        p.x = clamp(p.x, 30, WORLD_W - 30);
        z.contactCd = 0.7;
        game.shake = Math.max(game.shake, 10);
      }
      if (z.bossActionT <= 0) {
        z.bossAction = "";
        z.bossAbilityCd = z.bossRage ? 2.4 : 3.4;
      }
      z.x = clamp(z.x, 30, WORLD_W - 30);
      return;
    }
    if (z.bossAction === "slamWind") {
      z.bossActionT -= dt;
      if (z.bossActionT <= 0) {
        z.bossAction = "";
        z.bossAbilityCd = z.bossRage ? 2.3 : 3.2;
        bossShockwave(z, z.bossRage ? 112 : 96, Math.round(z.damage * 1.25));
      }
      return;
    }

    if (z.bossAbilityCd <= 0) {
      if (dist > 98) {
        z.bossAction = "chargeWind";
        z.bossActionT = 0.72;
      } else {
        z.bossAction = "slamWind";
        z.bossActionT = 0.68;
      }
      return;
    }

    if (dist > z.reach) {
      z.x += z.dir * z.speed * dt;
    } else if (playerLow && z.contactCd <= 0 && !p.dead) {
      hurtPlayer(z.damage, z);
      z.contactCd = 1.05;
      p.x += z.dir * 18;
      p.x = clamp(p.x, 30, WORLD_W - 30);
    }
    z.x = clamp(z.x, 30, WORLD_W - 30);
  }

  function triggerBurrowSurge() {
    const p = game.player;
    const count = Math.min(11, 3 + Math.floor(game.wave * 0.45));
    const center = p.x + rand(-35, 35);
    for (let i = 0; i < count; i++) {
      let x = center + rand(-118, 118);
      if (Math.abs(x - p.x) < 24) x += sign(x - p.x || 1) * 28;
      game.burrowWarnings.push({
        x: clamp(x, 40, WORLD_W - 40),
        timer: rand(0.85, 1.55),
        maxTimer: 1.55,
        phase: rand(0, TAU)
      });
      for (let j = 0; j < 2; j++) {
        spawnParticle({
          kind: "dust",
          x,
          y: GROUND_Y - 1,
          vx: rand(-16, 16),
          vy: rand(-24, -6),
          life: rand(0.2, 0.55),
          size: rand(1, 2),
          color: "#7d705c"
        });
      }
    }
    game.shake = Math.max(game.shake, 4.5);
    game.redFlash = Math.max(game.redFlash, 0.1);
    audio.burrowRumble();
    showToast("⚠", "地底尸群正在涌出 — 升空或投雷！", "blood", 2.4);
  }

  function updateBurrow(dt) {
    if (game.waveState !== "combat" || game.wave < 4) return;
    game.burrowTimer -= dt;
    if (game.burrowTimer <= 0) {
      triggerBurrowSurge();
      game.burrowTimer = rand(15, 23) * (game.wave >= 12 ? 0.8 : 1);
    }
    for (const w of game.burrowWarnings) {
      w.timer -= dt;
      if (w.timer <= 0 && !w.spawned) {
        w.spawned = true;
        const r = Math.random();
        const type = r < 0.12 && game.wave >= 8 ? "brute" : r < 0.4 ? "runner" : "walker";
        spawnZombie(type, w.x);
        const z = game.zombies[game.zombies.length - 1];
        if (z) {
          z.stun = Math.max(z.stun, 0.45);
          z.flash = 0.12;
        }
        for (let j = 0; j < 12; j++) {
          spawnParticle({
            kind: j % 4 === 0 ? "spark" : "dust",
            x: w.x + rand(-8, 8),
            y: GROUND_Y - rand(0, 4),
            vx: rand(-55, 55),
            vy: rand(-70, -8),
            life: rand(0.25, 0.7),
            size: rand(1, 2),
            color: j % 4 === 0 ? "#d08a50" : "#75634e",
            gravity: 260
          });
        }
        addLight(w.x, GROUND_Y - 4, 45, 0.16, "#d08a50");
        game.shake = Math.max(game.shake, 3.2);
        audio.burrowEmerge();
      }
    }
    game.burrowWarnings = game.burrowWarnings.filter((w) => w.timer > -0.35);
  }

  function updateWave(dt) {
    if (game.waveState === "pre") {
      game.waveTimer -= dt;
      if (game.waveTimer <= 0) {
        game.waveState = "combat";
        game.spawnTimer = 0.1;
        game.waveTimer = 0;
        if (game.bossPending) {
          spawnBoss(game.bossPending);
          showToast("☠", "BOSS · " + game.bossPending.name, "blood", 2.8);
          game.bossPending = null;
        } else {
          showToast("!", "尸潮已进入码头", "blood", 1.5);
        }
      }
      return;
    }

    if (game.waveState === "combat") {
      const alive = game.zombies.reduce((n, z) => n + (z.dead ? 0 : 1), 0);
      const flow = clamp(game.playTime, 0, 9999);
      const maxAlive = Math.min(48, 10 + game.wave * 2 + Math.floor(flow / 240));
      game.spawnTimer -= dt;
      if (game.spawnQueue.length && game.spawnTimer <= 0 && alive < maxAlive) {
        spawnZombie(game.spawnQueue.shift());
        const interval = Math.max(0.14, 1.0 - game.wave * 0.045) * rand(0.82, 1.2);
        game.spawnTimer = interval;
        if (game.spawnQueue.length && alive + 1 < maxAlive - 4 && game.wave >= 8 && Math.random() < 0.34) {
          spawnZombie(game.spawnQueue.shift());
        }
      }
      if (!game.spawnQueue.length && alive === 0 && game.burrowWarnings.length === 0) {
        game.waveClearDelay += dt;
        if (game.waveClearDelay > 0.65) completeWave();
      } else {
        game.waveClearDelay = 0;
      }
      return;
    }

    if (game.waveState === "break") {
      game.waveTimer -= dt;
      if (game.waveTimer <= 0) startWave(game.wave + 1);
    }
  }

  /* --------------------------------------------------------------------- */
  /* input                                                                 */
  /* --------------------------------------------------------------------- */

  const keys = new Set();
  const mouse = { x: W / 2, y: H / 2, down: false, inside: true, lastDown: false };

  function getMousePos(e) {
    const r = canvas.getBoundingClientRect();
    return {
      x: ((e.clientX - r.left) / Math.max(1, r.width)) * W,
      y: ((e.clientY - r.top) / Math.max(1, r.height)) * H
    };
  }

  canvas.addEventListener("mousemove", (e) => {
    const p = getMousePos(e);
    mouse.x = clamp(p.x, 0, W);
    mouse.y = clamp(p.y, 0, H);
    mouse.inside = true;
  });

  canvas.addEventListener("mouseenter", () => {
    mouse.inside = true;
  });

  canvas.addEventListener("mouseleave", () => {
    mouse.inside = false;
    mouse.down = false;
  });

  canvas.addEventListener("mousedown", (e) => {
    if (e.button !== 0) return;
    const p = getMousePos(e);
    mouse.x = clamp(p.x, 0, W);
    mouse.y = clamp(p.y, 0, H);
    if (game.state === "playing") {
      mouse.down = true;
      mouse.lastDown = true;
      audio.init();
      audio.resume();
    }
  });

  window.addEventListener("mouseup", (e) => {
    if (e.button === 0) mouse.down = false;
  });

  canvas.addEventListener("contextmenu", (e) => e.preventDefault());

  window.addEventListener("keydown", (e) => {
    const code = e.code;
    if (["Space", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Tab"].includes(code)) {
      if (game.state !== "title" && game.state !== "gameover") e.preventDefault();
    }

    if (e.repeat) {
      keys.add(code);
      return;
    }
    keys.add(code);

    if (code === "KeyM") {
      toggleMute();
      return;
    }

    if (dom.help && !dom.help.classList.contains("is-hidden")) {
      if (code === "Escape" || code === "Enter") setOverlay(dom.help, true);
      return;
    }

    if (game.state === "title") {
      if (code === "Enter") startRun();
      return;
    }

    if (game.state === "gameover") {
      if (code === "Enter") restartRun();
      return;
    }

    if (game.state === "upgrade") {
      if (code === "Digit1") {
        chooseUpgrade(0);
      } else if (code === "Digit2") {
        chooseUpgrade(1);
      } else if (code === "Digit3") {
        chooseUpgrade(2);
      } else if (code === "KeyR") {
        rerollUpgrades();
      }
      return;
    }

    if (game.state === "paused") {
      if (code === "Escape" || code === "KeyP" || code === "Enter") resumeGame();
      return;
    }

    if (game.state === "playing") {
      if (code === "Escape" || code === "KeyP") {
        pauseGame();
        return;
      }
      if (code === "KeyQ" || code === "Space") {
        playerDodge();
        return;
      }
      if (code === "KeyG") {
        throwGrenade();
        return;
      }
      if (code === "KeyR") {
        startReload();
        return;
      }
      const digit = /^Digit([1-4])$/.exec(code);
      if (digit) {
        switchWeapon(Number(digit[1]) - 1);
        return;
      }
    }
  });

  canvas.addEventListener(
    "wheel",
    (e) => {
      if (game.state !== "playing" || !game.player) return;
      e.preventDefault();
      const p = game.player;
      const len = p.weapons.length;
      if (len < 2) return;
      const dir = e.deltaY > 0 ? 1 : -1;
      switchWeapon((p.weapon + dir + len) % len);
    },
    { passive: false }
  );

  window.addEventListener("keyup", (e) => {
    keys.delete(e.code);
  });

  window.addEventListener("blur", () => {
    keys.clear();
    mouse.down = false;
    if (game.state === "playing") pauseGame();
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden && game.state === "playing") pauseGame();
  });

  /* --------------------------------------------------------------------- */
  /* player mechanics                                                      */
  /* --------------------------------------------------------------------- */

  function getShoulder(p = game.player) {
    return {
      x: p.x + p.facing * 2,
      y: p.y - 19
    };
  }

  function getMuzzle(p = game.player) {
    const s = getShoulder(p);
    const w = p.weapons[p.weapon];
    const reach = (w && w.muzzleReach ? w.muzzleReach : 18) - Math.min(2.2, p.recoil * 0.32);
    return {
      x: s.x + Math.cos(p.aim) * reach,
      y: s.y + Math.sin(p.aim) * reach
    };
  }

  function aimPlayer() {
    const p = game.player;
    const s = getShoulder(p);
    const wx = mouse.x + game.camera.x;
    const wy = mouse.y;
    p.aim = Math.atan2(wy - s.y, wx - s.x);
    p.facing = Math.cos(p.aim) >= 0 ? 1 : -1;
  }

  function switchWeapon(index) {
    const p = game.player;
    if (!p || p.dead || index < 0 || index >= p.weapons.length || index === p.weapon) return;
    p.weapon = index;
    p.reload = 0;
    p.reloadTotal = 0;
    p.reloadFlash = 0;
    p.reloadEjected = false;
    p.reloadInserted = false;
    p.reloadRacked = false;
    p.reloadShells = 0;
    p.fireCd = Math.max(p.fireCd, 0.24);
    p.autoReload = 0;
    game.reticleKick = Math.max(game.reticleKick, 2.5);
    audio.switchWeapon();
    updateWeaponSlots();
    updateHUD();
  }

  function throwGrenade() {
    const p = game.player;
    if (!p || p.dead || game.state !== "playing") return;
    if (p.throwCd > 0) return;
    if (p.grenades <= 0) {
      showToast("!", "没有手雷了", "blood", 1.4);
      return;
    }
    p.grenades--;
    p.throwCd = 0.48;
    const a = p.aim;
    const sx = p.x + Math.cos(a) * 13;
    const sy = p.y - 17 + Math.sin(a) * 13;
    game.grenades.push({
      x: sx,
      y: sy,
      vx: Math.cos(a) * 285 + p.vx * 0.25,
      vy: Math.sin(a) * 285 - 78,
      life: 1.18,
      age: 0,
      spin: rand(0, TAU),
      dead: false
    });
    audio.grenadeThrow();
    updateHUD();
  }

  function updateGrenades(dt) {
    for (const g of game.grenades) {
      g.life -= dt;
      g.age += dt;
      g.spin += dt * 12;
      g.x += g.vx * dt;
      g.y += g.vy * dt;
      g.vy += 380 * dt;
      g.vx *= Math.exp(-0.35 * dt);

      for (const z of game.zombies) {
        if (z.dead) continue;
        const cy = z.y - z.height * 0.5;
        const hitR = z.width * 0.65 + 5;
        if (dist2(g.x, g.y, z.x, cy) < hitR * hitR) {
          explodeGrenade(g.x, g.y);
          g.dead = true;
          break;
        }
      }
      if (g.dead) continue;

      if (g.y >= GROUND_Y - 2) {
        g.y = GROUND_Y - 2;
        if (g.age > 0.12) {
          explodeGrenade(g.x, g.y);
          g.dead = true;
          continue;
        }
        if (g.vy > 45) {
          g.vy *= -0.3;
          g.vx *= 0.72;
        } else {
          g.vy = 0;
          g.vx *= 0.82;
        }
      }
      if (g.life <= 0 || g.y < -30 || g.x < 0 || g.x > WORLD_W) {
        if (g.life <= 0 || g.x > 0) explodeGrenade(g.x, Math.min(g.y, GROUND_Y - 2));
        g.dead = true;
      }
    }
    game.grenades = game.grenades.filter((g) => !g.dead);
  }

  function explodeGrenade(x, y) {
    const p = game.player;
    const radius = 58 * p.stats.grenadeRadius;
    const baseDamage = 72 * p.stats.grenadeDamage * (1 + (p.stats.damage - 1) * 0.35);
    game.shake = Math.max(game.shake, 9);
    game.hitstop = Math.max(game.hitstop, 0.035);
    game.whiteFlash = Math.max(game.whiteFlash, 0.16);
    addLight(x, y, radius * 2.1, 0.3, "#ffae58");
    addLight(x, y, radius * 0.8, 0.42, "#fff0b5");
    audio.explosion();
    for (let i = 0; i < 30; i++) {
      const a = rand(0, TAU);
      const s = rand(25, 165);
      spawnParticle({
        kind: i % 4 === 0 ? "ember" : i % 4 === 1 ? "smoke" : "fire",
        x: x + rand(-4, 4),
        y: y + rand(-5, 5),
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - rand(10, 60),
        life: rand(0.3, 0.95),
        size: rand(1, 3.5),
        color: i % 4 === 0 ? "#ffd277" : "#c95829",
        gravity: i % 4 === 0 ? 140 : -20
      });
    }
    for (let i = 0; i < 2; i++) {
      spawnParticle({
        kind: "ring",
        x,
        y,
        vx: 0,
        vy: 0,
        life: 0.26 + i * 0.08,
        maxLife: 0.34 + i * 0.08,
        size: 1,
        color: i ? "#ffbd6b" : "#fff0c7",
        r0: 3,
        r1: radius * (0.9 + i * 0.3)
      });
    }
    addDecal(x + rand(-12, 12), GROUND_Y + rand(0, 6), rand(20, 36), rand(3, 7), "#1c120c", 0.48);

    for (const z of game.zombies) {
      if (z.dead) continue;
      const d = Math.hypot(z.x - x, z.y - z.height * 0.5 - y);
      if (d >= radius) continue;
      const falloff = 1 - (d / radius) * 0.5;
      const dmg = baseDamage * falloff * (1 - (z.armor || 0) * 0.6);
      z.hp -= dmg;
      z.flash = 0.2;
      z.stun = Math.max(z.stun, 0.42);
      if (!z.air) z.vx += sign(z.x - x) * 110 * falloff;
      spawnBlood(z.x, z.y - z.height * 0.5, rand(0, TAU), 1, 10, 220);
      if (z.hp <= 0) killZombie(z, false, z.x, z.y - z.height * 0.5, rand(0, TAU));
    }

    for (const barrel of game.barrels) {
      if (!barrel.exploded && dist2(barrel.x, barrel.y, x, y) < (radius * 1.1) * (radius * 1.1)) {
        if (!game.pendingBooms.some((b) => b.barrel === barrel)) {
          game.pendingBooms.push({ barrel, timer: rand(0.06, 0.16) });
        }
      }
    }
    if (p && !p.dead && dist2(x, y, p.x, p.y - 16) < (radius * 0.7) * (radius * 0.7)) {
      hurtPlayer(7, { x });
    }
  }

  function playerDodge() {
    const p = game.player;
    if (!p || p.dead || p.dodge > 0 || p.reload > 0) return;
    const dodgeCost = p.stats.dodgeCost;
    if (p.stamina < dodgeCost) return;
    const left = keys.has("KeyA") || keys.has("ArrowLeft");
    const right = keys.has("KeyD") || keys.has("ArrowRight");
    p.dodgeDir = left && !right ? -1 : right && !left ? 1 : p.facing;
    p.dodge = 0.23;
    p.invuln = Math.max(p.invuln, 0.42);
    p.stamina = Math.max(0, p.stamina - dodgeCost);
    p.afterimage = 0.23;
    audio.dodge();
    for (let i = 0; i < 5; i++) {
      spawnParticle({
        kind: "dust",
        x: p.x + rand(-4, 4),
        y: GROUND_Y - rand(2, 12),
        vx: -p.dodgeDir * rand(10, 44),
        vy: rand(-20, -2),
        life: rand(0.22, 0.5),
        size: rand(1, 2),
        color: "#9b9d88"
      });
    }
  }

  function startReload() {
    const p = game.player;
    if (!p || p.dead) return;
    const w = p.weapons[p.weapon];
    if (p.reload > 0 || w.mag >= w.magSize) return;
    if (!w.infinite && w.reserve <= 0) return;
    const reloadTime = w.reloadTime * p.stats.reloadMul;
    p.reload = reloadTime;
    p.reloadTotal = reloadTime;
    p.reloadEjected = false;
    p.reloadInserted = false;
    p.reloadRacked = false;
    p.reloadShells = 0;
    p.reloadFlash = 0;
    p.autoReload = 0;
    game.shake = Math.max(game.shake, 0.9);
    audio.reloadStart();
    updateHUD();
  }

  function spawnReloadDebris(p, w, stage) {
    const s = getShoulder(p);
    const a = p.aim;
    if (stage === "mag") {
      spawnParticle({
        kind: "mag",
        x: s.x + Math.cos(a) * 4,
        y: s.y + Math.sin(a) * 4 + 1,
        vx: -Math.cos(a) * rand(18, 36) + rand(-8, 8),
        vy: -rand(22, 52),
        life: rand(0.45, 0.8),
        size: 2,
        color: "#4b3b2b",
        gravity: 400
      });
      return;
    }
    if (stage === "shell") {
      for (let i = 0; i < 2; i++) {
        spawnParticle({
          kind: "casing",
          x: s.x + Math.cos(a) * 8,
          y: s.y + Math.sin(a) * 8,
          vx: -Math.cos(a) * rand(20, 40) + rand(-20, 20),
          vy: -rand(20, 65),
          life: rand(0.35, 0.75),
          size: 2,
          color: i ? "#a94235" : "#d8b165",
          gravity: 420
        });
      }
      return;
    }
    for (let i = 0; i < 9; i++) {
      spawnParticle({
        kind: "spark",
        x: s.x + Math.cos(a) * rand(4, 11),
        y: s.y + Math.sin(a) * rand(4, 11),
        vx: rand(-70, 70) + Math.cos(a) * 30,
        vy: rand(-80, 20),
        life: rand(0.12, 0.4),
        size: rand(1, 2),
        color: i % 3 ? "#ffd27a" : "#fff2c1",
        gravity: 240
      });
    }
    addLight(s.x, s.y, 22, 0.12, "#ffd27a");
  }

  function finishReload() {
    const p = game.player;
    const w = p.weapons[p.weapon];
    const need = w.magSize - w.mag;
    if (w.infinite) {
      w.mag = w.magSize;
    } else {
      const take = Math.min(need, w.reserve);
      w.mag += take;
      w.reserve -= take;
    }
    p.reload = 0;
    p.reloadTotal = 0;
    p.reloadFlash = 0.34;
    if (game.relicFlags.tacticalReload) p.tacticalTimer = 4;
    p.recoil = Math.min(5, p.recoil + 1.2);
    game.shake = Math.max(game.shake, 2.2);
    game.whiteFlash = Math.max(game.whiteFlash, 0.025);
    game.camKickX += rand(-1.2, 1.2);
    spawnReloadDebris(p, w, "sparks");
    const s = getShoulder(p);
    spawnParticle({
      kind: "ring",
      x: s.x,
      y: s.y,
      vx: 0,
      vy: 0,
      life: 0.22,
      maxLife: 0.22,
      size: 1,
      color: "#f2c078",
      r0: 2,
      r1: 18
    });
    audio.reloadEnd();
    updateHUD();
  }

  function fireWeapon() {
    const p = game.player;
    const w = p.weapons[p.weapon];
    if (p.reload > 0 || p.dead) return;

    if (w.mag <= 0) {
      if (w.infinite || w.reserve > 0) {
        startReload();
      } else {
        audio.empty();
        p.fireCd = 0.32;
        if (game.time - (game.lastDryFireNotice || -10) > 2.4) {
          showToast("!", "弹药耗尽 — 按 1 切回无限弹药的手枪", "blood", 1.8);
          game.lastDryFireNotice = game.time;
        }
        updateHUD();
      }
      return;
    }

    const muzzle = getMuzzle(p);
    game.volleySeq = (game.volleySeq || 0) + 1;
    const volley = game.volleySeq;
    for (let i = 0; i < w.pellets; i++) {
      let offset = 0;
      if (w.pellets > 1) {
        offset = ((i / (w.pellets - 1)) - 0.5) * w.spread * 2;
        offset += rand(-0.012, 0.012);
      } else {
        offset = rand(-w.spread, w.spread);
      }
      const angle = p.aim + offset;
      const speed = w.bulletSpeed * rand(0.94, 1.06);
      const range = w.range * rand(0.9, 1.08);
      game.bullets.push({
        x: muzzle.x,
        y: muzzle.y,
        px: muzzle.x,
        py: muzzle.y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        damage: w.damage,
        range,
        travelled: 0,
        dead: false,
        angle,
        tracer: w.tracer,
        volley,
        weaponId: w.id,
        pierce: w.pierce + p.stats.pierce,
        explosive: !!w.explosive,
        explosionRadius: w.explosionRadius || 0,
        explosionDamage: w.explosionDamage || 0,
        rail: !!w.rail,
        hitZombies: []
      });
    }

    w.mag--;
    game.shots++;
    const spinFactor = w.spinUp ? 1 - w.spin * 0.68 : 1;
    const tacticalBoost = p.tacticalTimer > 0 ? 1.25 : 1;
    p.fireCd = (w.fireDelay * spinFactor) / Math.max(0.35, p.stats.fireRate * tacticalBoost);
    p.muzzleTimer = w.spinUp ? 0.032 : 0.055;
    p.muzzleLight = w.spinUp ? 0.05 : 0.075;
    p.recoil = Math.min(6, p.recoil + w.recoil);
    p.vx -= Math.cos(p.aim) * (w.id === "shotgun" ? 22 : w.id === "minigun" ? 2.2 : 7);
    p.triggerHeld = true;
    game.shake = Math.max(game.shake, w.shake);
    game.camKickX -= Math.cos(p.aim) * w.kick;
    game.reticleKick = Math.min(12, game.reticleKick + (w.id === "shotgun" ? 8 : w.id === "minigun" ? 1.2 : 3.8));
    game.hitMarker = Math.max(0, game.hitMarker - 0.02);
    p.autoReload = w.mag === 0 ? 0.24 : 0;

    spawnMuzzleFx(muzzle.x, muzzle.y, p.aim, w.id === "shotgun", w.id);
    audio.shot(w.sound);

    if (w.mag === 0) updateHUD();
  }

  function updatePlayer(dt) {
    const p = game.player;
    if (!p || p.dead) return;

    p.breath += dt;
    p.hurtFlash = Math.max(0, p.hurtFlash - dt * 4);
    p.fireCd = Math.max(0, p.fireCd - dt);
    if (p.autoReload > 0) {
      p.autoReload -= dt;
      if (p.autoReload <= 0) {
        p.autoReload = 0;
        const autoW = p.weapons[p.weapon];
        if (autoW.mag === 0 && autoW.reserve > 0 && p.reload <= 0) startReload();
      }
    }
    p.muzzleTimer = Math.max(0, p.muzzleTimer - dt);
    p.muzzleLight = Math.max(0, p.muzzleLight - dt);
    p.recoil = expDamp(p.recoil, 13, dt);
    p.invuln = Math.max(0, p.invuln - dt);
    p.dodge = Math.max(0, p.dodge - dt);
    p.afterimage = Math.max(0, p.afterimage - dt);
    p.hurtFlash = Math.max(0, p.hurtFlash - dt * 3);
    p.throwCd = Math.max(0, p.throwCd - dt);
    p.jetFxCd = Math.max(0, p.jetFxCd - dt);
    p.jetSoundCd = Math.max(0, p.jetSoundCd - dt);
    p.reloadFlash = Math.max(0, p.reloadFlash - dt * 4);
    p.tacticalTimer = Math.max(0, p.tacticalTimer - dt);

    const wasGrounded = p.y >= GROUND_Y - 0.5;
    const jetHeld = keys.has("KeyW") && p.jetFuel > 0.15 && !p.dead;
    p.jetting = false;
    if (jetHeld) {
      p.jetting = true;
      p.vy -= 760 * p.stats.jetThrust * dt;
      p.vy = Math.max(p.vy, -165);
      p.jetFuel = Math.max(0, p.jetFuel - 27 * dt);
      if (p.jetSoundCd <= 0) {
        p.jetSoundCd = 0.11;
        audio.jetTick();
      }
      if (p.jetFxCd <= 0) {
        p.jetFxCd = 0.035;
        const side = Math.random() < 0.5 ? -1 : 1;
        spawnParticle({
          kind: "spark",
          x: p.x + side * rand(1, 3),
          y: p.y - 2,
          vx: -p.vx * 0.15 + rand(-14, 14),
          vy: rand(35, 110),
          life: rand(0.08, 0.2),
          size: rand(1, 2),
          color: Math.random() < 0.5 ? "#ffd27a" : "#d97a38"
        });
        if (Math.random() < 0.55) {
          spawnParticle({
            kind: "smoke",
            x: p.x + rand(-4, 4),
            y: p.y - rand(2, 6),
            vx: rand(-12, 12),
            vy: rand(15, 48),
            life: rand(0.25, 0.55),
            size: rand(1.2, 2.4),
            color: "#8b8a7d",
            gravity: -12
          });
        }
      }
      game.shake = Math.max(game.shake, 0.8);
    }
    p.vy += 590 * dt;
    p.y += p.vy * dt;
    if (p.y >= GROUND_Y) {
      if (!wasGrounded && p.vy > 55) {
        game.shake = Math.max(game.shake, 2.4);
        for (let i = 0; i < 7; i++) {
          spawnParticle({
            kind: "dust",
            x: p.x + rand(-8, 8),
            y: GROUND_Y - 1,
            vx: rand(-38, 38),
            vy: rand(-24, -3),
            life: rand(0.2, 0.5),
            size: rand(1, 2),
            color: "#7f8274"
          });
        }
      }
      p.y = GROUND_Y;
      p.vy = 0;
      p.jetting = false;
      p.jetFuel = Math.min(p.jetMax, p.jetFuel + 28 * p.stats.jetRecharge * dt);
    } else {
      if (p.y < GROUND_Y - 118) {
        p.y = GROUND_Y - 118;
        p.vy = Math.max(0, p.vy);
      }
    }

    if (p.reload > 0) {
      const rw = p.weapons[p.weapon];
      const total = p.reloadTotal || 0.001;
      p.reload -= dt;
      const prog = clamp(1 - p.reload / total, 0, 1);
      const style = rw.reloadStyle || "mag";
      if (style === "shell") {
        const stages = [0.18, 0.38, 0.58];
        while (p.reloadShells < stages.length && prog >= stages[p.reloadShells]) {
          p.reloadShells++;
          spawnReloadDebris(p, rw, "shell");
          audio.reloadShell();
          game.shake = Math.max(game.shake, 0.7);
        }
        if (!p.reloadRacked && prog >= 0.8) {
          p.reloadRacked = true;
          spawnReloadDebris(p, rw, "sparks");
          audio.reloadRack();
          game.camKickX += rand(-1, 1);
        }
      } else if (style === "belt") {
        if (!p.reloadEjected && prog >= 0.22) {
          p.reloadEjected = true;
          spawnReloadDebris(p, rw, "sparks");
          audio.reloadMagOut();
        }
        if (!p.reloadInserted && prog >= 0.52) {
          p.reloadInserted = true;
          spawnReloadDebris(p, rw, "sparks");
          audio.reloadMagIn();
          game.shake = Math.max(game.shake, 1.4);
        }
        if (!p.reloadRacked && prog >= 0.8) {
          p.reloadRacked = true;
          spawnReloadDebris(p, rw, "shell");
          audio.reloadRack();
        }
      } else {
        if (!p.reloadEjected && prog >= 0.2) {
          p.reloadEjected = true;
          spawnReloadDebris(p, rw, "mag");
          audio.reloadMagOut();
        }
        if (!p.reloadInserted && prog >= 0.55) {
          p.reloadInserted = true;
          spawnReloadDebris(p, rw, "sparks");
          audio.reloadMagIn();
          game.shake = Math.max(game.shake, 1.2);
        }
        if (!p.reloadRacked && prog >= 0.8) {
          p.reloadRacked = true;
          spawnReloadDebris(p, rw, "shell");
          audio.reloadRack();
          game.camKickX += rand(-0.8, 0.8);
        }
      }
      if (p.reload <= 0) finishReload();
    }

    const currentWeapon = p.weapons[p.weapon];
    for (const w of p.weapons) {
      if (!w.spinUp) continue;
      const wantSpin = w === currentWeapon && mouse.down && p.reload <= 0 && !p.dead;
      w.spin = clamp(w.spin + dt * (wantSpin ? 1.75 : -1.45), 0, 1);
    }
    if (currentWeapon && currentWeapon.spinUp && currentWeapon.spin > 0.2) {
      p.spinSoundCd -= dt;
      if (p.spinSoundCd <= 0) {
        p.spinSoundCd = 0.14;
        audio.spinTick(currentWeapon.spin);
      }
    } else {
      p.spinSoundCd = 0;
    }

    aimPlayer();
    if (mouse.down && !p.dead && p.reload <= 0 && p.fireCd <= 0 && game.state === "playing") {
      fireWeapon();
    }

    const left = keys.has("KeyA") || keys.has("ArrowLeft");
    const right = keys.has("KeyD") || keys.has("ArrowRight");
    const sprinting = (keys.has("ShiftLeft") || keys.has("ShiftRight")) && (left || right) && p.stamina > 1;
    let move = 0;
    if (left && !right) move = -1;
    else if (right && !left) move = 1;
    const spinPenalty = currentWeapon && currentWeapon.spinUp ? 1 - currentWeapon.spin * 0.34 : 1;

    if (p.dodge > 0) {
      p.x += p.dodgeDir * 250 * p.stats.move * dt;
      p.vx = 0;
      if (p.afterimage > 0) {
        spawnParticle({
          kind: "ghost",
          x: p.x,
          y: p.y,
          vx: 0,
          vy: 0,
          life: 0.16,
          size: 1,
          color: "#a9bb83"
        });
        p.afterimage = Math.max(0, p.afterimage - dt * 0.4);
      }
    } else {
      const airCtrl = p.y < GROUND_Y - 4 ? 0.84 : 1;
      const speed = (sprinting ? 103 : 62) * p.stats.move * spinPenalty * airCtrl;
      if (move !== 0) {
        p.x += move * speed * dt;
        p.walk += dt * (sprinting ? 13.5 : 8.2);
        p.footstep -= dt * (sprinting ? 2.3 : 1.35);
        if (p.footstep <= 0) {
          p.footstep = 0.44;
          if (p.y > GROUND_Y - 4) {
            audio.step();
            spawnParticle({
              kind: "dust",
              x: p.x - move * 4 + rand(-2, 2),
              y: GROUND_Y - 1,
              vx: -move * rand(4, 14),
              vy: rand(-12, -2),
              life: rand(0.18, 0.4),
              size: 1,
              color: "#777a6a"
            });
          }
        }
      } else {
        p.walk += dt * 1.6;
      }
    }

    if (sprinting) {
      p.stamina = Math.max(0, p.stamina - 29 * dt);
    } else {
      const regen = p.dodge > 0 ? 0 : p.reload > 0 ? 15 : 24;
      p.stamina = Math.min(100, p.stamina + regen * dt);
    }

    p.x += p.vx * dt;
    p.vx = expDamp(p.vx, 9, dt);
    p.x = clamp(p.x, 30, WORLD_W - 30);

    if (p.stats.regen > 0 && p.health > 0) {
      p.health = Math.min(p.maxHealth, p.health + p.stats.regen * dt);
    }

    if (p.health <= 30 && !p.dead) {
      p.heartbeatCd -= dt;
      if (p.heartbeatCd <= 0) {
        p.heartbeatCd = p.health <= 15 ? 0.82 : 1.15;
        audio.heartbeat();
        game.redFlash = Math.max(game.redFlash, 0.08);
      }
    } else {
      p.heartbeatCd = 0.4;
    }

    if (p.health <= 0 && !p.dead) die();
  }

  function updatePlayerDying(dt) {
    const p = game.player;
    p.deathTime += dt;
    p.deathAngle = lerp(p.deathAngle, -1.35 * p.facing, Math.min(1, dt * 3.6));
    if (p.y < GROUND_Y) {
      p.vy += 720 * dt;
      p.y = Math.min(GROUND_Y, p.y + p.vy * dt);
    } else {
      p.y = GROUND_Y;
      p.vy = 0;
    }
    game.deathTimer -= dt;
    if (game.deathTimer <= 0) finishGameOver();
  }

  /* --------------------------------------------------------------------- */
  /* zombies                                                               */
  /* --------------------------------------------------------------------- */

  function updateZombies(dt) {
    const p = game.player;
    const alive = [];
    for (const z of game.zombies) {
      if (z.dead) {
        z.deathTime += dt;
        z.flash = Math.max(0, z.flash - dt);
        if (z.air && z.y < GROUND_Y - 4) {
          z.deathVy += 560 * dt;
          z.y = Math.min(GROUND_Y - 3, z.y + z.deathVy * dt);
        }
        z.fade = clamp(1 - (z.deathTime - 1.7) / 1.3, 0, 1);
        continue;
      }
      alive.push(z);
      z.flash = Math.max(0, z.flash - dt);
      z.stun = Math.max(0, z.stun - dt);
      z.attackCd = Math.max(0, z.attackCd - dt);
      z.lungeCd = Math.max(0, z.lungeCd - dt);
      z.lunge = Math.max(0, z.lunge - dt);
      z.spitCd = Math.max(0, z.spitCd - dt);
      z.spitAnim = Math.max(0, z.spitAnim - dt);
      z.rageTime = Math.max(0, z.rageTime - dt);
      z.screamCd = Math.max(0, z.screamCd - dt);
      z.screamAnim = Math.max(0, z.screamAnim - dt);
      z.soundCd -= dt;
      if (z.regen > 0 && z.hp < z.maxHp) {
        z.hp = Math.min(z.maxHp, z.hp + z.regen * dt);
      }

      if (z.boss) {
        if (z.soundCd <= 0) {
          z.soundCd = rand(6, 10);
          audio.bossRoar();
        }
        updateBoss(z, dt, p);
        continue;
      }

      if (z.type === "screamer" && z.screamCd <= 0 && z.stun <= 0) {
        z.screamCd = rand(5.8, 8.5);
        z.screamAnim = 0.65;
        z.stun = Math.max(z.stun, 0.2);
        audio.screamer();
        game.shake = Math.max(game.shake, 2.2);
        addLight(z.x, z.y - z.height * 0.72, 95, 0.25, "#d35a55");
        for (const other of game.zombies) {
          if (other.dead || other === z) continue;
          if (Math.abs(other.x - z.x) < 220) other.rageTime = Math.max(other.rageTime, 4.2);
        }
        for (let i = 0; i < 18; i++) {
          const a = rand(0, TAU);
          spawnParticle({
            kind: "spark",
            x: z.x + Math.cos(a) * rand(4, 14),
            y: z.y - z.height * 0.72 + Math.sin(a) * rand(4, 14),
            vx: Math.cos(a) * rand(30, 105),
            vy: Math.sin(a) * rand(30, 105),
            life: rand(0.2, 0.5),
            size: 1,
            color: i % 3 ? "#d35a55" : "#ffc0a0",
            gravity: 30
          });
        }
      }

      if (z.soundCd <= 0 && Math.abs(z.x - p.x) < 260) {
        z.soundCd = z.air ? rand(3, 7) : rand(4, 9);
        if (z.air) audio.birdScreech();
        else audio.groan();
      }

      const dx = p.x - z.x;
      const adx = Math.abs(dx);
      const dist = Math.hypot(dx, 0);
      const playerLow = p.y > GROUND_Y - 22;
      z.dir = dx < 0 ? -1 : 1;

      if (z.air) {
        z.walk += dt * (7 + z.speed * 0.1);
        z.swoop = Math.max(0, z.swoop - dt);
        z.swoopCd = Math.max(0, z.swoopCd - dt);
        const targetY = p.y - 17;
        const orbit = z.phase + game.playTime * 0.8;
        const hoverX = p.x + Math.sin(orbit * 1.4) * 46;
        const hoverY = Math.max(28, targetY - 48 + Math.cos(orbit * 1.1) * 20);
        if (z.swoop > 0 && z.stun <= 0) {
          const len = Math.max(1, Math.hypot(p.x - z.x, targetY - z.y));
          z.vx = lerp(z.vx, ((p.x - z.x) / len) * z.speed * 1.55, Math.min(1, dt * 4));
          z.vy = lerp(z.vy, ((targetY - z.y) / len) * z.speed * 1.55, Math.min(1, dt * 4));
        } else if (z.stun <= 0) {
          z.vx = lerp(z.vx, clamp((hoverX - z.x) * 1.5, -1, 1) * z.speed, Math.min(1, dt * 1.9));
          z.vy = lerp(z.vy, clamp((hoverY - z.y) * 1.5, -1, 1) * z.speed * 0.72, Math.min(1, dt * 1.9));
          if (z.swoopCd <= 0 && Math.hypot(p.x - z.x, targetY - z.y) < 150) {
            z.swoop = rand(0.42, 0.65);
            z.swoopCd = rand(2.2, 4);
            audio.birdScreech();
          }
        } else {
          z.vx = expDamp(z.vx, 2.5, dt);
          z.vy = expDamp(z.vy, 2.5, dt) + 28 * dt;
        }
        z.x += z.vx * dt;
        z.y += z.vy * dt;
        z.x = clamp(z.x, 24, WORLD_W - 24);
        z.y = clamp(z.y, 24, GROUND_Y - 18);
        z.dir = z.vx < -2 ? -1 : 1;
        if (z.attackCd <= 0 && dist2(z.x, z.y, p.x, p.y - 17) < 22 * 22 && !p.dead) {
          hurtPlayer(z.damage, z);
          z.attackCd = 1.25;
          z.swoop = 0;
          z.swoopCd = rand(1.8, 2.8);
          z.vy = -85;
          z.vx = -z.dir * 45;
          audio.birdScreech();
        }
        continue;
      }

      if (
        z.spitter &&
        z.spitCd <= 0 &&
        z.stun <= 0 &&
        z.attackTimer < 0 &&
        adx > 42 &&
        adx < 175
      ) {
        z.spitCd = rand(2.4, 4.2);
        z.spitAnim = 0.42;
        z.stun = Math.max(z.stun, 0.24);
        spawnAcidShot(z);
        audio.spit();
      }

      if (z.attackTimer >= 0) {
        z.attackTimer += dt;
        const impactAt = z.windup;
        if (!z.hitDone && z.attackTimer >= impactAt) {
          z.hitDone = true;
          const reach = z.reach + 9;
          if (Math.abs(p.x - z.x) < reach && playerLow && !p.dead) {
            hurtPlayer(z.damage, z);
            p.x += z.dir * 8;
            p.x = clamp(p.x, 30, WORLD_W - 30);
          } else if (!p.dead && p.dodge > 0) {
            spawnPopup(p.x, p.y - 32, "MISS", "#a9bb83", 0.75);
          }
        }
        if (z.attackTimer >= z.attackTime) {
          z.attackTimer = -1;
          z.attackCd = z.cooldown;
        }
        z.x += z.vx * dt;
        z.vx = expDamp(z.vx, 6, dt);
      } else {
        let move = 0;
        if (z.stun <= 0) {
          if (adx > z.reach - 2) move = z.speed * (z.rageTime > 0 ? 1.28 : 1);
          else if (z.attackCd <= 0 && playerLow) {
            z.attackTimer = 0;
            z.hitDone = false;
            z.attackCd = z.cooldown;
            if (Math.hypot(p.x - z.x, p.y - z.y) < 100) audio.swipe();
          }

          if (z.type === "runner" && z.lungeCd <= 0 && adx > 45 && adx < 125) {
            z.vx += z.dir * 145;
            z.lungeCd = rand(2.8, 4.4);
            z.lunge = 0.28;
            z.stun = 0.12;
            audio.swipe();
            for (let i = 0; i < 4; i++) {
              spawnParticle({
                kind: "dust",
                x: z.x,
                y: GROUND_Y - 2,
                vx: -z.dir * rand(8, 26),
                vy: rand(-14, -2),
                life: rand(0.2, 0.45),
                size: 1,
                color: "#7f8776"
              });
            }
          }
        }

        z.x += z.dir * move * dt;
        z.x += z.vx * dt;
        z.vx = expDamp(z.vx, z.type === "brute" ? 9 : 6, dt);
        z.walk += dt * (1.4 + move * 0.12 + z.speed * 0.02);
      }

      // Keep the horde from stacking into a single pixel column.
      z.x = clamp(z.x, 20, WORLD_W - 20);
    }

    // soft separation
    for (let i = 0; i < alive.length; i++) {
      const a = alive[i];
      for (let j = i + 1; j < alive.length; j++) {
        const b = alive[j];
        if (a.air || b.air || a.boss || b.boss) continue;
        const dx = b.x - a.x;
        const min = (a.width + b.width) * 0.52;
        if (Math.abs(dx) < min) {
          const push = (min - Math.abs(dx)) * 0.5;
          const dir = dx === 0 ? (a.x < b.x ? -1 : 1) : sign(dx);
          a.x -= dir * push;
          b.x += dir * push;
        }
      }
    }

    // remove the long-dead
    game.zombies = game.zombies.filter((z) => !z.dead || z.deathTime < 3.2);
  }

  function spawnAcidShot(z) {
    const p = game.player;
    const sx = z.x + z.dir * 5;
    const sy = z.y - z.height * 0.82;
    const tx = p.x;
    const ty = p.y - 17;
    const angle = Math.atan2(ty - sy, tx - sx);
    const speed = 138 + game.evolutionLevel * 9;
    game.enemyShots.push({
      x: sx,
      y: sy,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      life: 2.4,
      trail: 0,
      wobble: rand(0, TAU),
      damage: 9 + game.evolutionLevel * 2
    });
    for (let i = 0; i < 5; i++) {
      spawnParticle({
        kind: "acid",
        x: sx,
        y: sy,
        vx: z.dir * rand(10, 45) + rand(-12, 12),
        vy: rand(-32, 8),
        life: rand(0.2, 0.5),
        size: rand(1, 2),
        color: "#a8d15b",
        gravity: 150
      });
    }
  }

  function updateEnemyShots(dt) {
    const p = game.player;
    for (const s of game.enemyShots) {
      s.life -= dt;
      s.wobble += dt * 12;
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.trail -= dt;
      if (s.trail <= 0) {
        s.trail = 0.055;
        spawnParticle({
          kind: "acid",
          x: s.x + rand(-1, 1),
          y: s.y + rand(-1, 1),
          vx: -s.vx * 0.06 + rand(-7, 7),
          vy: rand(-6, 8),
          life: rand(0.16, 0.34),
          size: rand(1, 2),
          color: "#8fbb4d",
          gravity: 70
        });
      }
      if (!p.dead && dist2(s.x, s.y, p.x, p.y - 17) < 100) {
        s.life = 0;
        if (p.invuln <= 0) hurtPlayer(s.damage, { x: s.x });
        spawnAcidSplash(s.x, s.y, false);
        continue;
      }
      if (s.y >= GROUND_Y - 1 || s.life <= 0 || s.x < 0 || s.x > WORLD_W) {
        if (s.life > 0) spawnAcidSplash(s.x, GROUND_Y - 1, true);
        s.life = 0;
      }
    }
    game.enemyShots = game.enemyShots.filter((s) => s.life > 0);
  }

  function spawnAcidSplash(x, y, ground) {
    for (let i = 0; i < 10; i++) {
      spawnParticle({
        kind: "acid",
        x,
        y,
        vx: rand(-70, 70),
        vy: rand(-70, -8),
        life: rand(0.25, 0.75),
        size: rand(1, 2),
        color: i % 3 ? "#a8d15b" : "#d7f08d",
        gravity: 300
      });
    }
    addLight(x, y - 2, 26, 0.14, "#a8d15b");
    if (ground) {
      addDecal(x + rand(-5, 5), GROUND_Y + rand(0, 4), rand(5, 12), rand(1, 3), "#52652d", 0.34);
    }
  }

  function hurtPlayer(amount, source) {
    const p = game.player;
    if (!p || p.dead || game.state !== "playing" || p.invuln > 0) return;
    const reduced = Math.max(1, amount * (1 - p.stats.armor));
    p.health -= reduced;
    p.invuln = 0.92;
    p.hurtFlash = 1;
    game.redFlash = Math.max(game.redFlash, 0.58);
    game.shake = Math.max(game.shake, 8.5);
    game.hitstop = Math.max(game.hitstop, 0.045);
    game.camKickX += sign(p.x - (source ? source.x : p.x)) * 2.2;
    audio.hurt();
    spawnBlood(p.x + rand(-4, 4), p.y - 18, sign(source ? source.x - p.x : -1) * 1.5, -1, 15, 170);
    addDecal(p.x + rand(-8, 8), GROUND_Y + rand(0, 4), rand(4, 12), rand(1, 3), "#65121b", 0.54);
    if (p.health <= 0) {
      p.health = 0;
      die();
    }
    updateHUD();
  }

  /* --------------------------------------------------------------------- */
  /* weapons, bullets, hit feel                                            */
  /* --------------------------------------------------------------------- */

  const ENEMY_CELL = 64;
  const enemyCandidateScratch = [];
  let enemyQueryMark = 0;

  function buildEnemyGrid() {
    const grid = new Map();
    for (const z of game.zombies) {
      if (z.dead) continue;
      const minX = Math.floor((z.x - z.width * 0.6) / ENEMY_CELL);
      const maxX = Math.floor((z.x + z.width * 0.6) / ENEMY_CELL);
      const minY = Math.floor((z.y - z.height - 2) / ENEMY_CELL);
      const maxY = Math.floor((z.y + 2) / ENEMY_CELL);
      for (let cx = minX; cx <= maxX; cx++) {
        for (let cy = minY; cy <= maxY; cy++) {
          const key = cx + ":" + cy;
          let bucket = grid.get(key);
          if (!bucket) {
            bucket = [];
            grid.set(key, bucket);
          }
          bucket.push(z);
        }
      }
    }
    return grid;
  }

  function segmentEnemyCandidates(px, py, x, y, grid) {
    const pad = 6;
    const minX = Math.floor((Math.min(px, x) - pad) / ENEMY_CELL);
    const maxX = Math.floor((Math.max(px, x) + pad) / ENEMY_CELL);
    const minY = Math.floor((Math.min(py, y) - pad) / ENEMY_CELL);
    const maxY = Math.floor((Math.max(py, y) + pad) / ENEMY_CELL);
    enemyCandidateScratch.length = 0;
    const mark = ++enemyQueryMark;
    for (let cx = minX; cx <= maxX; cx++) {
      for (let cy = minY; cy <= maxY; cy++) {
        const bucket = grid.get(cx + ":" + cy);
        if (!bucket) continue;
        for (const z of bucket) {
          if (z._queryMark === mark) continue;
          z._queryMark = mark;
          enemyCandidateScratch.push(z);
        }
      }
    }
    return enemyCandidateScratch;
  }

  function segmentAABB(x1, y1, x2, y2, minx, miny, maxx, maxy) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    let tmin = 0;
    let tmax = 1;
    for (let axis = 0; axis < 2; axis++) {
      const p = axis === 0 ? x1 : y1;
      const d = axis === 0 ? dx : dy;
      const min = axis === 0 ? minx : miny;
      const max = axis === 0 ? maxx : maxy;
      if (Math.abs(d) < 0.00001) {
        if (p < min || p > max) return null;
      } else {
        let t1 = (min - p) / d;
        let t2 = (max - p) / d;
        if (t1 > t2) {
          const tmp = t1;
          t1 = t2;
          t2 = tmp;
        }
        tmin = Math.max(tmin, t1);
        tmax = Math.min(tmax, t2);
        if (tmin > tmax) return null;
      }
    }
    return tmin;
  }

  function updateBullets(dt) {
    const grid = game.bullets.length ? buildEnemyGrid() : null;
    game.enemyGrid = grid;
    for (const b of game.bullets) {
      if (b.dead) continue;
      b.px = b.x;
      b.py = b.y;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.travelled += Math.hypot(b.vx, b.vy) * dt;
      b.life = b.range - b.travelled;

      let bestT = 1.1;
      let hitZ = null;
      let hitHead = false;
      let hitBarrel = null;
      let hitGround = false;

      const candidates = grid ? segmentEnemyCandidates(b.px, b.py, b.x, b.y, grid) : game.zombies;
      for (const z of candidates) {
        if (z.dead || (b.hitZombies && b.hitZombies.includes(z))) continue;
        const hw = z.width * 0.55;
        const bodyT = segmentAABB(
          b.px,
          b.py,
          b.x,
          b.y,
          z.x - hw,
          z.y - z.height + 3,
          z.x + hw,
          z.y - 2
        );
        const headW = z.width * 0.5;
        const headH = z.height * 0.32;
        const headT = segmentAABB(
          b.px,
          b.py,
          b.x,
          b.y,
          z.x - headW,
          z.y - z.height - 2,
          z.x + headW,
          z.y - z.height + headH
        );
        let t = bodyT;
        let head = false;
        if (headT !== null && (bodyT === null || headT <= bodyT + 0.06)) {
          t = headT;
          head = true;
        }
        if (t !== null && t < bestT) {
          bestT = t;
          hitZ = z;
          hitHead = head;
          hitBarrel = null;
        }
      }

      for (const barrel of game.barrels) {
        if (barrel.exploded) continue;
        const t = segmentAABB(
          b.px,
          b.py,
          b.x,
          b.y,
          barrel.x - 7,
          barrel.y - 16,
          barrel.x + 7,
          barrel.y - 1
        );
        if (t !== null && t < bestT) {
          bestT = t;
          hitBarrel = barrel;
          hitZ = null;
        }
      }

      // Dock surface stops low shots.
      if (b.vy > 0 && b.y > GROUND_Y && b.py <= GROUND_Y + 2) {
        const t = (GROUND_Y - b.py) / (b.y - b.py);
        if (t >= 0 && t < bestT) {
          bestT = t;
          hitGround = true;
          hitZ = null;
          hitBarrel = null;
        }
      }

      if (hitZ) {
        const hx = b.px + (b.x - b.px) * bestT;
        const hy = b.py + (b.y - b.py) * bestT;
        if (b.explosive) {
          explodeWeaponRound(hx, hy, b);
          b.dead = true;
        } else {
          damageZombie(hitZ, b, hx, hy, hitHead);
          if (b.pierce > 0) {
            b.pierce--;
            if (!b.hitZombies) b.hitZombies = [];
            b.hitZombies.push(hitZ);
            b.damage *= 0.82;
          } else {
            b.dead = true;
          }
        }
      } else if (hitBarrel) {
        const hx = b.px + (b.x - b.px) * bestT;
        const hy = b.py + (b.y - b.py) * bestT;
        if (b.explosive) {
          explodeWeaponRound(hx, hy, b);
        } else {
          spawnSpark(hx, hy, b.angle, 4, "#ffca72");
          explodeBarrel(hitBarrel);
        }
        b.dead = true;
      } else if (hitGround || b.life <= 0 || b.x < -40 || b.x > WORLD_W + 40 || b.y < -80) {
        if (b.explosive) {
          const gx = b.px + (b.x - b.px) * bestT;
          const gy = hitGround ? GROUND_Y : b.y;
          explodeWeaponRound(gx, gy, b);
        } else if (hitGround) {
          const gx = b.px + (b.x - b.px) * bestT;
          spawnSpark(gx, GROUND_Y, b.angle + Math.PI, 2, "#a6a284");
          addDecal(gx + rand(-2, 2), GROUND_Y + rand(0, 2), rand(1, 3), 1, "#1a1512", 0.32);
        }
        b.dead = true;
      }
    }
    game.bullets = game.bullets.filter((b) => !b.dead);
  }

  function explodeWeaponRound(x, y, b) {
    const p = game.player;
    const radius = b.explosionRadius || 48;
    const baseDamage =
      (b.explosionDamage || 55) *
      p.stats.damage *
      (p.y < GROUND_Y - 8 ? p.stats.airDamage : 1);
    game.shake = Math.max(game.shake, 7.5);
    game.hitstop = Math.max(game.hitstop, 0.03);
    game.whiteFlash = Math.max(game.whiteFlash, 0.12);
    audio.explosion();
    addLight(x, y, radius * 1.8, 0.3, "#ffae58");
    addLight(x, y, radius * 0.7, 0.45, "#fff0b5");
    for (let i = 0; i < 24; i++) {
      const a = rand(0, TAU);
      const s = rand(22, 140);
      spawnParticle({
        kind: i % 4 === 0 ? "ember" : i % 4 === 1 ? "smoke" : "fire",
        x: x + rand(-4, 4),
        y: y + rand(-4, 4),
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - rand(8, 56),
        life: rand(0.28, 0.85),
        size: rand(1, 3),
        color: i % 4 === 0 ? "#ffd277" : "#c95829",
        gravity: i % 4 === 0 ? 150 : -18
      });
    }
    spawnParticle({
      kind: "ring",
      x,
      y,
      vx: 0,
      vy: 0,
      life: 0.24,
      maxLife: 0.24,
      size: 1,
      color: "#ffcc85",
      r0: 3,
      r1: radius
    });
    addDecal(x + rand(-8, 8), GROUND_Y + rand(0, 5), rand(16, 30), rand(2, 5), "#1c120c", 0.42);

    for (const z of game.zombies) {
      if (z.dead) continue;
      const d = Math.hypot(z.x - x, z.y - z.height * 0.5 - y);
      if (d >= radius) continue;
      const falloff = 1 - (d / radius) * 0.5;
      const dmg = baseDamage * falloff * (1 - (z.armor || 0) * 0.6);
      z.hp -= dmg;
      z.flash = 0.2;
      z.stun = Math.max(z.stun, 0.4);
      if (!z.air) z.vx += sign(z.x - x) * 100 * falloff;
      spawnBlood(z.x, z.y - z.height * 0.5, rand(0, TAU), 1, 7, 210);
      if (z.hp <= 0) killZombie(z, false, z.x, z.y - z.height * 0.5, rand(0, TAU));
    }
    for (const barrel of game.barrels) {
      if (!barrel.exploded && dist2(barrel.x, barrel.y, x, y) < (radius * 1.15) * (radius * 1.15)) {
        if (!game.pendingBooms.some((bb) => bb.barrel === barrel)) {
          game.pendingBooms.push({ barrel, timer: rand(0.06, 0.15) });
        }
      }
    }
  }

  function relicBurst(x, y, radius, damage, source) {
    if (game.relicBurstDepth > 3) return;
    game.relicBurstDepth++;
    addLight(x, y, radius * 1.35, 0.22, "#ffb15b");
    spawnParticle({
      kind: "ring",
      x,
      y,
      vx: 0,
      vy: 0,
      life: 0.22,
      maxLife: 0.22,
      size: 1,
      color: "#ffd18c",
      r0: 2,
      r1: radius
    });
    for (let i = 0; i < 12; i++) {
      const a = rand(0, TAU);
      spawnParticle({
        kind: i % 3 === 0 ? "ember" : "fire",
        x,
        y,
        vx: Math.cos(a) * rand(18, 100),
        vy: Math.sin(a) * rand(18, 100),
        life: rand(0.2, 0.55),
        size: rand(1, 2),
        color: i % 3 === 0 ? "#ffd277" : "#c95829",
        gravity: 80
      });
    }
    for (const z of game.zombies) {
      if (z.dead || z === source) continue;
      const d = Math.hypot(z.x - x, z.y - z.height * 0.5 - y);
      if (d < radius) {
        const dmg = damage * (1 - (d / radius) * 0.45) * (1 - (z.armor || 0) * 0.6);
        z.hp -= dmg;
        z.flash = Math.max(z.flash, 0.15);
        spawnBlood(z.x, z.y - z.height * 0.5, rand(0, TAU), 1, 4, 190);
        if (z.hp <= 0 && !z.dead) killZombie(z, false, z.x, z.y - z.height * 0.5, rand(0, TAU));
      }
    }
    game.relicBurstDepth--;
  }

  function chainLightning(source, x, y) {
    const targets = game.zombies
      .filter((z) => z !== source && !z.dead && Math.hypot(z.x - x, z.y - z.height * 0.5 - y) < 155)
      .sort((a, b) => Math.hypot(a.x - x, a.y - y) - Math.hypot(b.x - x, b.y - y))
      .slice(0, 2);
    if (!targets.length) return;
    let fromX = x;
    let fromY = y;
    const points = [{ x, y }];
    for (const t of targets) {
      const tx = t.x;
      const ty = t.y - t.height * 0.5;
      points.push({ x: tx, y: ty });
      const dmg = (18 + game.wave * 1.2) * game.player.stats.damage * (1 - (t.armor || 0) * 0.5);
      t.hp -= dmg;
      t.flash = Math.max(t.flash, 0.16);
      t.stun = Math.max(t.stun, 0.18);
      spawnParticle({
        kind: "spark",
        x: tx,
        y: ty,
        vx: rand(-30, 30),
        vy: rand(-50, 10),
        life: 0.2,
        size: 2,
        color: "#bff4ff"
      });
      if (t.hp <= 0 && !t.dead) killZombie(t, false, tx, ty, rand(0, TAU));
      fromX = tx;
      fromY = ty;
    }
    game.arcs.push({ points, life: 0.18, maxLife: 0.18, color: "#bff4ff" });
    addLight(x, y, 55, 0.14, "#9fe8ff");
    audio.spark();
    void fromX;
    void fromY;
  }

  function updateArcs(dt) {
    for (const a of game.arcs) a.life -= dt;
    game.arcs = game.arcs.filter((a) => a.life > 0);
  }

  function drawArcs() {
    if (!game.arcs.length) return;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const a of game.arcs) {
      const alpha = clamp(a.life / a.maxLife, 0, 1);
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = a.color;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      for (let i = 0; i < a.points.length - 1; i++) {
        const p1 = a.points[i];
        const p2 = a.points[i + 1];
        ctx.moveTo(p1.x, p1.y);
        const mx = (p1.x + p2.x) / 2 + rand(-4, 4);
        const my = (p1.y + p2.y) / 2 + rand(-3, 3);
        ctx.lineTo(mx, my);
        ctx.lineTo(p2.x, p2.y);
      }
      ctx.stroke();
    }
    ctx.restore();
  }

  function damageZombie(z, b, hx, hy, head) {
    const p = game.player;
    const stats = p.stats;
    const rapid = b.weaponId === "minigun" || b.weaponId === "smg";
    const crit = !head && Math.random() < stats.critChance;
    let multiplier = head ? 2.25 * stats.headshot : crit ? stats.critMul : 1;
    let dmg = b.damage * stats.damage * multiplier;
    if (stats.fury && p.health / p.maxHealth < 0.45) dmg *= 1.3;
    if (p.y < GROUND_Y - 8) dmg *= stats.airDamage;
    dmg *= 1 - (z.armor || 0);
    const frontBlocked = z.type === "bulwark" && !head && sign(b.vx) === -z.dir;
    if (frontBlocked) {
      dmg *= 0.3;
      spawnSpark(hx, hy, b.angle + Math.PI, 2, "#d9c18d");
      if (Math.random() < 0.3) spawnPopup(hx, hy - 8, "BLOCK", "#b8c0ad", 1, 0.45);
    }
    const special = head || crit;
    z.hp -= dmg;
    z.flash = head ? 0.18 : crit ? 0.16 : 0.14;
    z.stun = Math.max(z.stun, head ? 0.27 : crit ? 0.2 : 0.14);
    const kb = z.boss ? 3 : head ? 44 : crit ? 34 : z.type === "brute" ? 9 : 27;
    z.vx += sign(b.vx) * kb;
    if (z.boss) {
      z.stun = Math.min(z.stun, 0.06);
      z.vx *= 0.35;
    }
    if ((head || crit) && z.type !== "brute" && z.attackTimer >= 0) {
      z.attackTimer = -1;
      z.hitDone = true;
      z.attackCd = Math.max(z.attackCd, z.cooldown * 0.8);
    }
    game.hits++;
    game.hitMarker = special ? 0.24 : 0.16;
    game.hitMarkerHead = special;
    game.hitstop = Math.max(
      game.hitstop,
      rapid ? (head ? 0.042 : crit ? 0.028 : 0) : head ? 0.07 : crit ? 0.052 : 0.04
    );
    game.shake = Math.max(game.shake, rapid ? (head ? 3.8 : crit ? 2.7 : 1.4) : head ? 6.5 : crit ? 5 : 3.2);
    game.camKickX -= sign(b.vx) * (rapid ? (head ? 0.8 : 0.3) : head ? 2.1 : crit ? 1.5 : 0.85);
    game.reticleKick = Math.min(12, game.reticleKick + (special ? 4.2 : rapid ? 0.8 : 1.8));

    if (stats.lifesteal > 0) {
      const heal = dmg * stats.lifesteal;
      if (heal > 0.05) {
        p.health = Math.min(p.maxHealth, p.health + heal);
        if (Math.random() < 0.22) {
          spawnParticle({
            kind: "spark",
            x: p.x + rand(-4, 4),
            y: GROUND_Y - rand(12, 28),
            vx: rand(-10, 10),
            vy: rand(-28, -8),
            life: rand(0.25, 0.5),
            size: 1,
            color: "#a9d77e"
          });
        }
      }
    }

    spawnBlood(
      hx,
      hy,
      b.angle,
      head ? 1.15 : crit ? 1.05 : 0.95,
      rapid ? (head ? 14 : 6) : special ? 22 : 10,
      head ? 300 : crit ? 260 : 195
    );
    if (special) {
      spawnBone(hx, hy, b.angle);
      spawnBone(hx, hy, b.angle);
      spawnParticle({
        kind: "ring",
        x: hx,
        y: hy,
        vx: 0,
        vy: 0,
        life: 0.26,
        maxLife: 0.26,
        size: 10,
        color: "#ffe0b0",
        r0: 1,
        r1: 17
      });
    } else {
      spawnParticle({
        kind: "ring",
        x: hx,
        y: hy,
        vx: 0,
        vy: 0,
        life: 0.15,
        maxLife: 0.15,
        size: 1,
        color: "#e8b39d",
        r0: 1,
        r1: 9
      });
    }
    addHitFlash(hx, hy, special);

    const popX = z.x + rand(-3, 3);
    let dmgPopup = game.popups.find(
      (pp) =>
        pp.zombie === z &&
        pp.life > 0 &&
        pp.damageTotal !== undefined &&
        (pp.volley === b.volley || rapid)
    );
    if (dmgPopup) {
      dmgPopup.damageTotal += dmg;
      dmgPopup.headHit = dmgPopup.headHit || special;
      dmgPopup.text = Math.round(dmgPopup.damageTotal) + (dmgPopup.headHit ? "!" : "");
      dmgPopup.color = dmgPopup.headHit ? "#f2c078" : "#d9d3bd";
      dmgPopup.scale = dmgPopup.headHit ? 2 : 1;
      dmgPopup.life = Math.max(dmgPopup.life, 0.55);
      dmgPopup.maxLife = Math.max(dmgPopup.maxLife, 0.55);
      dmgPopup.volley = b.volley;
      if (rapid) dmgPopup.y = Math.max(dmgPopup.y, z.y - z.height - 18);
    } else {
      dmgPopup = spawnPopup(
        popX,
        z.y - z.height - 5,
        Math.round(dmg) + (special ? "!" : ""),
        special ? "#f2c078" : "#d9d3bd",
        special ? 2 : 1,
        0.7,
        { zombie: z, volley: b.volley, damageTotal: dmg, headHit: special, bornAt: game.time }
      );
    }
    if (
      head &&
      !game.popups.some(
        (pp) => pp.zombie === z && pp.headLabel && game.time - (pp.bornAt || 0) < 0.5
      )
    ) {
      spawnPopup(z.x, z.y - z.height - 16, "HEADSHOT", "#d7353f", 1, 0.65, {
        zombie: z,
        volley: b.volley,
        headLabel: true,
        bornAt: game.time
      });
    }

    if (game.relicFlags.explosiveRounds) {
      game.relicHitCount++;
      if (game.relicHitCount % 8 === 0) {
        relicBurst(hx, hy, 34, 20 + game.wave * 1.4, z);
      }
    }
    if (game.relicFlags.chainLightning) {
      game.chainHitCount++;
      if (game.chainHitCount % 6 === 0) {
        chainLightning(z, hx, hy);
      }
    }

    if (z.hp <= 0) {
      killZombie(z, head, hx, hy, b.angle);
    } else {
      if (!rapid || Math.random() < 0.32) audio.flesh(head);
      if (head) game.score += 15;
      else if (crit) game.score += 6;
    }
  }

  function killZombie(z, head, hx, hy, angle) {
    if (z.dead) return;
    z.dead = true;
    z.deathTime = 0;
    z.deathDir = Math.random() < 0.5 ? -1 : 1;
    game.kills++;
    game.waveKilled++;
    if (head) game.heads++;
    const points = Math.round(z.score * (1 + (game.wave - 1) * 0.12)) + (head ? 80 : 0);
    game.score += points;
    game.hitstop = Math.max(game.hitstop, head ? 0.07 : 0.04);
    game.shake = Math.max(game.shake, head ? 7 : 4);
    game.whiteFlash = Math.max(game.whiteFlash, head ? 0.08 : 0.03);
    audio.flesh(head);
    spawnBlood(
      z.x + rand(-4, 4),
      z.y - z.height * rand(0.35, 0.7),
      angle,
      1,
      head ? 24 : 15,
      head ? 290 : 210
    );
    spawnBone(z.x, z.y - z.height * 0.6, angle);
    if (z.air) {
      for (let i = 0; i < 9; i++) {
        spawnParticle({
          kind: "feather",
          x: z.x + rand(-5, 5),
          y: z.y - rand(2, 8),
          vx: rand(-45, 45),
          vy: rand(-35, 25),
          life: rand(0.45, 1),
          size: rand(1, 2),
          color: i % 3 ? "#777a64" : "#aaa88d",
          gravity: 25
        });
      }
    }
    addDecal(z.x + rand(-12, 12), GROUND_Y + rand(0, 6), rand(12, 28), rand(2, 5), "#5b1019", 0.62);
    addDecal(z.x + rand(-18, 18), GROUND_Y + rand(2, 9), rand(5, 14), rand(1, 3), "#3c0a10", 0.5);
    spawnPopup(z.x, z.y - z.height - 20, "+" + points, "#a9bb83", 1, 0.8);

    if (z.volatile) {
      volatileBurst(z);
    }

    if (game.relicFlags.corpseBloom && !z.boss && !z._relicBloom && game.relicBurstDepth < 3) {
      z._relicBloom = true;
      relicBurst(z.x, z.y - z.height * 0.45, 46, 26 + game.wave * 1.2, z);
    }

    if (z.boss) {
      game.boss = null;
      game.bossesKilled++;
      game.shake = 16;
      game.hitstop = Math.max(game.hitstop, 0.1);
      game.whiteFlash = Math.max(game.whiteFlash, 0.2);
      game.redFlash = Math.max(game.redFlash, 0.2);
      addLight(z.x, z.y - z.height * 0.5, 180, 0.5, z.bossColor || "#ffb066");
      audio.bossRoar();
      for (let i = 0; i < 46; i++) {
        const a = rand(0, TAU);
        spawnParticle({
          kind: i % 4 === 0 ? "ember" : "smoke",
          x: z.x + rand(-18, 18),
          y: z.y - z.height * 0.5 + rand(-24, 24),
          vx: Math.cos(a) * rand(30, 170),
          vy: Math.sin(a) * rand(30, 170) - 40,
          life: rand(0.45, 1.4),
          size: rand(1, 4),
          color: i % 4 === 0 ? z.bossColor || "#ffb066" : "#5b4c3e",
          gravity: i % 4 === 0 ? 90 : -20
        });
      }
      spawnParticle({
        kind: "ring",
        x: z.x,
        y: z.y - z.height * 0.5,
        vx: 0,
        vy: 0,
        life: 0.6,
        maxLife: 0.6,
        size: 1,
        color: "#ffd398",
        r0: 12,
        r1: 135
      });
      spawnPickup("medkit", z.x + rand(-18, 18));
      spawnPickup("ammo", z.x + rand(-26, 26));
      showToast("☠", "BOSS 击破 · " + z.bossName, "blood", 3.2);
    }

    // loot
    const roll = Math.random();
    const luck = game.player.stats.luck;
    if (z.type === "brute") {
      spawnPickup("ammo", z.x + rand(-8, 8));
      spawnPickup(Math.random() < 0.5 ? "medkit" : "ammo", z.x + rand(-20, 20));
      if (game.wave >= 3 && Math.random() < 0.16 + luck * 0.25 && game.player.weapons.length < MAX_WEAPONS) {
        dropWeaponCrate(z.x);
      }
    } else if (roll < 0.09 + Math.min(0.07, game.wave * 0.004) + luck * 0.12) {
      spawnPickup("ammo", z.x);
    } else if (roll < 0.26 + luck * 0.18) {
      spawnPickup("medkit", z.x);
    } else if (roll < 0.275 + luck * 0.2 && game.wave >= 3 && game.player.weapons.length < MAX_WEAPONS) {
      dropWeaponCrate(z.x);
    }

    if (head && game.relicFlags.headhunter) {
      const w = game.player.weapons[game.player.weapon];
      if (w && !w.infinite && w.mag < w.magSize) {
        w.mag++;
      }
    }
    if (game.relicFlags.ammoDrops && Math.random() < 0.2) {
      spawnPickup("ammo", z.x + rand(-18, 18));
    }

    if (head && game.heads % 5 === 0) {
      showToast("×", "连续爆头 · 分数加成", "");
    }
  }

  function volatileBurst(z) {
    const x = z.x;
    const y = z.y - z.height * 0.45;
    addLight(x, y, 78, 0.32, "#b4dd56");
    game.shake = Math.max(game.shake, 4.5);
    game.redFlash = Math.max(game.redFlash, 0.08);
    audio.acidBurst();
    for (let i = 0; i < 24; i++) {
      const a = rand(0, TAU);
      const s = rand(30, 155);
      spawnParticle({
        kind: "acid",
        x: x + rand(-5, 5),
        y: y + rand(-10, 10),
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - rand(10, 60),
        life: rand(0.35, 0.95),
        size: rand(1, 3),
        color: i % 3 ? "#a8d15b" : "#d8f088",
        gravity: 320
      });
    }
    spawnParticle({
      kind: "ring",
      x,
      y,
      vx: 0,
      vy: 0,
      life: 0.28,
      maxLife: 0.28,
      size: 1,
      color: "#c3e873",
      r0: 2,
      r1: 34
    });
    addDecal(x + rand(-8, 8), GROUND_Y + rand(0, 5), rand(14, 28), rand(2, 5), "#566b33", 0.46);
    const p = game.player;
    if (p && !p.dead && dist2(x, y, p.x, p.y - 17) < 46 * 46) {
      hurtPlayer(10 + game.evolutionLevel * 2, z);
    }
  }

  function explodeBarrel(barrel) {
    if (barrel.exploded) return;
    barrel.exploded = true;
    const bx = barrel.x;
    const by = barrel.y - 8;
    game.shake = 16;
    game.hitstop = Math.max(game.hitstop, 0.06);
    game.whiteFlash = Math.max(game.whiteFlash, 0.42);
    game.redFlash = Math.max(game.redFlash, 0.12);
    game.camKickX += rand(-3, 3);
    audio.explosion();
    addLight(bx, by, 155, 0.38, "#ff9b45");
    addLight(bx, by, 60, 0.55, "#fff3bd");
    addDecal(bx + rand(-10, 10), GROUND_Y + rand(0, 7), rand(34, 54), rand(5, 9), "#18120d", 0.58);
    addDecal(bx + rand(-14, 14), GROUND_Y + rand(0, 7), rand(18, 32), rand(3, 6), "#2b1710", 0.54);

    for (let i = 0; i < 44; i++) {
      const a = rand(0, TAU);
      const s = rand(30, 210);
      spawnParticle({
        kind: i % 3 === 0 ? "ember" : i % 3 === 1 ? "smoke" : "fire",
        x: bx + rand(-5, 5),
        y: by + rand(-8, 8),
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - rand(20, 100),
        life: rand(0.35, 1.2),
        maxLife: 1.2,
        size: rand(1, 4),
        color: i % 3 === 0 ? "#ffbf5c" : "#c75a29",
        gravity: i % 3 === 0 ? 180 : -30
      });
    }
    for (let i = 0; i < 3; i++) {
      spawnParticle({
        kind: "ring",
        x: bx,
        y: by,
        vx: 0,
        vy: 0,
        life: 0.3 + i * 0.08,
        maxLife: 0.38 + i * 0.08,
        size: 1,
        color: i === 0 ? "#fff2c4" : "#ffb05c",
        r0: 4,
        r1: 52 + i * 16
      });
    }

    for (const z of game.zombies) {
      if (z.dead) continue;
      const d = Math.hypot(z.x - bx, z.y - 8 - by);
      if (d < 98) {
        const falloff = 1 - d / 98;
        z.hp -= 190 * falloff;
        z.flash = 0.2;
        z.vx += sign(z.x - bx) * 120 * falloff;
        z.stun = Math.max(z.stun, 0.4);
        spawnBlood(z.x, z.y - z.height * 0.6, Math.atan2(-20, z.x - bx), 1, 12, 220);
        if (z.hp <= 0) killZombie(z, false, z.x, z.y - z.height * 0.6, 0);
      }
    }

    const p = game.player;
    if (p && !p.dead) {
      const d = Math.hypot(p.x - bx, GROUND_Y - by);
      if (d < 90) {
        hurtPlayer(Math.round(10 + 13 * (1 - d / 90)), barrel);
        p.vx += sign(p.x - bx) * 85;
      }
    }

    for (const other of game.barrels) {
      if (!other.exploded && Math.hypot(other.x - bx, other.y - barrel.y) < 62) {
        if (!game.pendingBooms.some((b) => b.barrel === other)) {
          game.pendingBooms.push({ barrel: other, timer: rand(0.12, 0.28) });
        }
      }
    }
  }

  function updateBulletFx(dt) {
    for (const item of game.pendingBooms) {
      item.timer -= dt;
      if (item.timer <= 0) {
        item.done = true;
        explodeBarrel(item.barrel);
      }
    }
    game.pendingBooms = game.pendingBooms.filter((b) => !b.done);
    updateArcs(dt);
  }

  /* --------------------------------------------------------------------- */
  /* pickups                                                               */
  /* --------------------------------------------------------------------- */

  function spawnPickup(type, x, extra) {
    game.pickups.push({
      type,
      x: clamp(x, 34, WORLD_W - 34),
      y: GROUND_Y - 4,
      life: type === "weapon" ? 55 : 35,
      bob: rand(0, TAU),
      taken: false,
      ...(extra || {})
    });
  }

  function updatePickups(dt) {
    const p = game.player;
    for (const item of game.pickups) {
      item.life -= dt;
      item.bob += dt * 3.2;
      if (item.life <= 0) item.taken = true;
      if (item.taken || p.dead) continue;
      if (Math.abs(item.x - p.x) < p.stats.pickupRadius) {
        if (item.type === "weapon" && p.weapons.length >= MAX_WEAPONS) continue;
        item.taken = true;
        collectPickup(item);
      }
    }
    game.pickups = game.pickups.filter((i) => !i.taken);
  }

  function collectPickup(item) {
    const p = game.player;
    if (item.type === "ammo") {
      let added = 0;
      for (const w of p.weapons) {
        if (w.infinite) continue;
        const add = Math.max(1, Math.round(w.magSize * 0.16 * p.stats.ammoMul * p.stats.pickupMul));
        w.reserve += add;
        added += add;
      }
      showToast("+", added > 0 ? "弹药补充 +" + added : "手枪弹药无限", "");
    } else if (item.type === "medkit") {
      const heal = Math.round(26 * p.stats.pickupMul);
      p.health = Math.min(p.maxHealth, p.health + heal);
      showToast("+", "急救包 +" + heal + " HP", "");
    } else if (item.type === "weapon") {
      const def = WEAPON_DEFS[item.weaponId];
      if (def) {
        const added = unlockWeapon(item.weaponId, true);
        if (!added) {
          for (const w of p.weapons) {
            if (!w.infinite) w.reserve += Math.ceil(w.magSize * 0.14);
          }
          showToast("!", "武器槽已满 · 已转换为少量弹药", "", 2.4);
        }
      }
    }
    audio.pickup();
    for (let i = 0; i < 9; i++) {
      spawnParticle({
        kind: "spark",
        x: item.x,
        y: item.y - 4,
        vx: rand(-30, 30),
        vy: rand(-55, -10),
        life: rand(0.3, 0.7),
        size: 1,
        color: item.type === "medkit" ? "#c9dbc0" : item.type === "weapon" ? "#ffd27a" : "#e6c47c"
      });
    }
    updateHUD();
  }

  /* --------------------------------------------------------------------- */
  /* particles & impact                                                    */
  /* --------------------------------------------------------------------- */

  function spawnParticle(o) {
    if (game.particles.length > 340) game.particles.shift();
    o.maxLife = o.maxLife || o.life;
    o.gravity = o.gravity === undefined ? 0 : o.gravity;
    game.particles.push(o);
  }

  function spawnBlood(x, y, angle, strength, amount, power) {
    const base = angle === undefined ? 0 : angle;
    for (let i = 0; i < amount; i++) {
      const a = base + rand(-0.95, 0.95);
      const sp = rand(24, power * strength);
      spawnParticle({
        kind: "blood",
        x: x + rand(-2, 2),
        y: y + rand(-2, 2),
        vx: Math.cos(a) * sp + rand(-22, 22),
        vy: Math.sin(a) * sp - rand(10, 90),
        life: rand(0.5, 1.35),
        size: rand(1, 3),
        color: Math.random() < 0.45 ? "#d5353b" : Math.random() < 0.65 ? "#9a1a24" : "#620d16",
        gravity: 410
      });
    }
    for (let i = 0; i < Math.ceil(amount / 3); i++) {
      spawnParticle({
        kind: "mist",
        x: x + rand(-4, 4),
        y: y + rand(-4, 4),
        vx: rand(-30, 30),
        vy: rand(-45, 5),
        life: rand(0.35, 0.8),
        size: rand(3, 7),
        color: "#7c151e",
        gravity: -10
      });
    }
    spawnParticle({
      kind: "ring",
      x,
      y,
      vx: 0,
      vy: 0,
      life: 0.13,
      maxLife: 0.13,
      size: 1,
      color: "#e0a58f",
      r0: 1,
      r1: amount > 12 ? 11 : 7
    });
  }

  function spawnBone(x, y, angle) {
    for (let i = 0; i < 3; i++) {
      const a = angle + rand(-1.3, 1.3);
      spawnParticle({
        kind: "bone",
        x,
        y,
        vx: Math.cos(a) * rand(30, 110),
        vy: Math.sin(a) * rand(20, 90) - 30,
        life: rand(0.45, 0.9),
        size: rand(1, 2),
        color: "#c9c0a2",
        gravity: 420
      });
    }
  }

  function spawnMuzzleFx(x, y, angle, big, weaponId) {
    const heavy = weaponId === "minigun";
    const sparkCount = big ? 9 : heavy ? 2 : weaponId === "smg" ? 3 : 4;
    for (let i = 0; i < sparkCount; i++) {
      const a = angle + rand(-0.28, 0.28);
      const speed = big ? rand(80, 230) : rand(55, heavy ? 120 : 150);
      spawnParticle({
        kind: "spark",
        x,
        y,
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        life: rand(0.05, big ? 0.16 : 0.12),
        size: big || heavy ? 1.5 : 1,
        color: i % 2 ? "#fff0b0" : heavy ? "#e3a250" : "#d9924c"
      });
    }
    const smokeCount = heavy ? 0 : weaponId === "smg" ? 1 : 4;
    for (let i = 0; i < smokeCount; i++) {
      const a = angle + rand(-0.55, 0.55);
      spawnParticle({
        kind: "smoke",
        x,
        y,
        vx: Math.cos(a) * rand(8, 38) - Math.cos(angle) * 14,
        vy: Math.sin(a) * rand(8, 30) - 22,
        life: rand(0.3, 0.8),
        size: rand(1.5, 3.4),
        color: "#83857b",
        gravity: -10
      });
    }
    if (!heavy || Math.random() < 0.28) {
      const perp = angle + Math.PI / 2;
      spawnParticle({
        kind: "casing",
        x,
        y,
        vx: Math.cos(perp) * rand(28, 55) + rand(-10, 10),
        vy: Math.sin(perp) * rand(18, 40) - 45,
        life: 1.4,
        size: big || heavy ? 2 : 1,
        color: "#d5ad5b",
        gravity: 420
      });
    }
  }

  function addHitFlash(x, y, head) {
    spawnParticle({
      kind: "flash",
      x,
      y,
      vx: 0,
      vy: 0,
      life: 0.1,
      size: head ? 15 : 9,
      color: head ? "#fff6db" : "#ffe4ba"
    });
  }

  function spawnSpark(x, y, angle, amount, color) {
    for (let i = 0; i < amount; i++) {
      const a = angle + rand(-1.2, 1.2);
      spawnParticle({
        kind: "spark",
        x,
        y,
        vx: Math.cos(a) * rand(30, 120),
        vy: Math.sin(a) * rand(30, 120) - 20,
        life: rand(0.08, 0.24),
        size: 1,
        color
      });
    }
  }

  function addDecal(x, y, w, h, color, alpha) {
    if (game.decals.length > 80) game.decals.shift();
    game.decals.push({
      x,
      y,
      w,
      h,
      color,
      alpha,
      seed: Math.random()
    });
  }

  function spawnPopup(x, y, text, color, scale, life, extra) {
    if (game.popups.length > 20) game.popups.shift();
    const popup = {
      x,
      y,
      text,
      color,
      scale,
      life,
      maxLife: life,
      vy: -24,
      ...(extra || {})
    };
    game.popups.push(popup);
    return popup;
  }

  function addLight(x, y, r, life, color) {
    game.lights.push({ x, y, r, life, maxLife: life, color });
  }

  function updateParticles(dt) {
    for (const p of game.particles) {
      if (p.life <= 0) continue;
      p.life -= dt;
      if (p.kind === "ring" || p.kind === "flash") continue;
      if (p.kind === "ghost") {
        p.life -= dt;
        continue;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.vy += (p.gravity || 0) * dt;
      p.vx *= Math.exp(-1.6 * dt);

      if (p.kind === "smoke") {
        p.vx *= Math.exp(-1.2 * dt);
        p.vy -= 7 * dt;
      }

      if ((p.kind === "blood" || p.kind === "bone" || p.kind === "acid") && p.y > GROUND_Y) {
        if (Math.random() < (p.kind === "acid" ? 0.2 : 0.38)) {
          addDecal(
            p.x + rand(-2, 2),
            GROUND_Y + rand(0, 5),
            rand(1.5, 5),
            rand(1, 2),
            p.kind === "bone" ? "#aaa287" : p.kind === "acid" ? "#5d7334" : p.color,
            rand(0.2, 0.45)
          );
        }
        p.life = 0;
      }
      if (p.kind === "casing" && p.y > GROUND_Y + rand(0, 1)) {
        p.y = GROUND_Y;
        if (Math.abs(p.vy) > 22) {
          p.vy *= -0.32;
          p.vx *= 0.62;
        } else {
          p.vy = 0;
          p.vx *= 0.82;
        }
        p.bounce = (p.bounce || 0) + 1;
      }
      if (p.kind === "casing" && p.bounce > 2) p.vx *= 0.9;
      if (p.y > H + 30) p.life = 0;
    }
    game.particles = game.particles.filter((p) => p.life > 0);

    for (const item of game.popups) {
      item.life -= dt;
      item.y += item.vy * dt;
      item.vy *= Math.exp(-2.2 * dt);
    }
    game.popups = game.popups.filter((p) => p.life > 0);

    for (const l of game.lights) {
      l.life -= dt;
    }
    game.lights = game.lights.filter((l) => l.life > 0);

    for (const c of game.casings) c.life -= dt;
    game.casings = game.casings.filter((c) => c.life > 0);
  }

  function updateFxTimers(dt) {
    game.shake = expDamp(game.shake, 7.5, dt);
    game.camKickX = expDamp(game.camKickX, 8.5, dt);
    game.hitMarker = Math.max(0, game.hitMarker - dt);
    game.reticleKick = expDamp(game.reticleKick, 7, dt);
    game.whiteFlash = Math.max(0, game.whiteFlash - dt * 4.2);
    game.redFlash = Math.max(0, game.redFlash - dt * 2.6);
    game.flash = Math.max(0, game.flash - dt * 4);
    game.lightning = Math.max(0, game.lightning - dt * 4.5);

    const s = game.shake;
    game.shakeX = rand(-s, s);
    game.shakeY = rand(-s, s) * 0.6;

    game.fieldTipTimer += dt;
  }

  /* --------------------------------------------------------------------- */
  /* ambient / atmosphere                                                  */
  /* --------------------------------------------------------------------- */

  function updateAmbient(dt) {
    game.ambientTime += dt;
    const time = game.ambientTime;

    for (const r of rain) {
      r.y += r.speed * dt;
      r.x += 25 * dt;
      if (r.y > H + 10) {
        r.y = -rand(2, 30);
        r.x = rand(-20, W);
      }
      if (r.x > W + 10) r.x = -10;
    }

    for (const f of fogBanks) {
      f.x += f.v * dt;
      if (f.x > W + f.w) f.x = -f.w;
    }

    for (const l of lamps) {
      const base = 0.87 + Math.sin(time * 2.3 + l.phase) * 0.04 + Math.sin(time * 12.7 + l.phase * 2) * 0.02;
      if (l.broken) {
        const dip = Math.sin(time * 9.2 + l.phase) > 0.965 ? 0.25 : 1;
        l.flick = base * dip;
      } else {
        l.flick = base;
      }
    }

    if (game.state === "title" || game.state === "playing" || game.state === "dying") {
      game.lightningTimer -= dt;
      if (game.lightningTimer <= 0) {
        game.lightningTimer = rand(13, 28);
        game.lightning = 1;
        game.thunderQueue = rand(0.35, 1.2);
        if (game.state === "playing" || game.state === "title") {
          setTimeout(() => audio.thunder(rand(0.8, 1.5)), game.thunderQueue * 1000);
        }
      }
    }
    if (game.thunderQueue > 0) game.thunderQueue -= dt;
  }

  function updateCamera(dt) {
    const p = game.player;
    let target;
    if (game.state === "title") {
      target = 1120 + Math.sin(game.time * 0.18) * 9;
    } else if (game.state === "dying" || game.state === "gameover") {
      target = p.x - W / 2 + sign(p.x - game.camera.x - W / 2) * 6;
    } else {
      const look = (mouse.x - W / 2) * 0.15;
      target = p.x - W / 2 + look;
    }
    target = clamp(target, 0, WORLD_W - W);
    const rate = game.state === "title" ? 1.2 : 6.2;
    game.camera.x = lerp(game.camera.x, target, Math.min(1, dt * rate));
  }

  function updateTitle(dt) {
    const p = game.player;
    if (p) {
      p.breath += dt;
      p.aim = 0.03 + Math.sin(game.ambientTime * 0.35) * 0.015;
      p.walk += dt * 1.1;
    }
    updateCamera(dt);
    updateParticles(dt);
    updateFxTimers(dt);
  }

  function updateDying(dt) {
    updatePlayerDying(dt);
    updateParticles(dt);
    updateBulletFx(dt);
    updateFxTimers(dt);
    updateCamera(dt);
  }

  /* --------------------------------------------------------------------- */
  /* main loop                                                             */
  /* --------------------------------------------------------------------- */

  function tick(now) {
    requestAnimationFrame(tick);
    let dt = (now - game.last) / 1000;
    game.last = now;
    if (!isFinite(dt) || dt < 0) dt = 0;
    if (dt > 0.05) dt = 0.05;
    game.time += dt;

    updateAmbient(dt);

    if (game.state === "playing") {
      if (game.hitstop > 0) {
        game.hitstop -= dt;
        updateParticles(dt * 0.18);
        updateFxTimers(dt);
        updateCamera(dt);
      } else {
        game.playTime += dt;
        updatePlayer(dt);
        updateZombies(dt);
        updateEnemyShots(dt);
        updateGrenades(dt);
        updateBurrow(dt);
        updateBullets(dt);
        updateBulletFx(dt);
        updateWave(dt);
        updatePickups(dt);
        updateParticles(dt);
        updateFxTimers(dt);
        updateCamera(dt);
        game.hudTimer += dt;
        if (game.hudTimer >= 0.05) {
          game.hudTimer = 0;
          updateHUD();
        }
      }
    } else if (game.state === "dying") {
      updateDying(dt);
    } else if (game.state === "title") {
      updateTitle(dt);
    } else if (game.state === "gameover") {
      updateParticles(dt * 0.35);
      updateFxTimers(dt);
      updateCamera(dt);
    }

    render();
  }

  /* --------------------------------------------------------------------- */
  /* rendering                                                             */
  /* --------------------------------------------------------------------- */

  const glowCache = new Map();
  const fogBandGradients = [];

  function glowSprite(rgb) {
    let sprite = glowCache.get(rgb);
    if (sprite) return sprite;
    const size = 128;
    sprite = document.createElement("canvas");
    sprite.width = size;
    sprite.height = size;
    const g = sprite.getContext("2d");
    const grad = g.createRadialGradient(size / 2, size / 2, 1, size / 2, size / 2, size / 2);
    grad.addColorStop(0, "rgba(" + rgb + ", 1)");
    grad.addColorStop(0.18, "rgba(" + rgb + ", 0.62)");
    grad.addColorStop(0.48, "rgba(" + rgb + ", 0.17)");
    grad.addColorStop(1, "rgba(" + rgb + ", 0)");
    g.fillStyle = grad;
    g.fillRect(0, 0, size, size);
    glowCache.set(rgb, sprite);
    return sprite;
  }

  function hexRgb(hex) {
    if (!hex || hex[0] !== "#") return "255,255,255";
    const n = parseInt(hex.slice(1), 16);
    return ((n >> 16) & 255) + "," + ((n >> 8) & 255) + "," + (n & 255);
  }

  function drawGlowSprite(rgb, x, y, r, alpha) {
    if (alpha <= 0.001 || r <= 0) return;
    ctx.globalAlpha = Math.min(1, alpha);
    ctx.drawImage(glowSprite(rgb), x - r, y - r, r * 2, r * 2);
  }

  function pixEllipse(cx, cy, rx, ry, color, alpha = 1) {
    if (rx <= 0 || ry <= 0) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = color;
    for (let y = -ry; y <= ry; y++) {
      const w = Math.floor(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))));
      if (w > 0) ctx.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2, 1);
    }
    ctx.restore();
  }

  function drawPixelDisc(cx, cy, r, color) {
    ctx.fillStyle = color;
    for (let y = -r; y <= r; y++) {
      const w = Math.floor(Math.sqrt(Math.max(0, r * r - y * y)));
      if (w > 0) ctx.fillRect(Math.round(cx - w), Math.round(cy + y), w * 2, 1);
    }
  }

  function drawCrane(x, baseY, scale, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(Math.round(x), Math.round(baseY));
    ctx.scale(scale, scale);
    ctx.fillStyle = "#0d1a20";
    ctx.fillRect(-2, -74, 4, 74);
    ctx.fillRect(28, -74, 4, 74);
    ctx.fillRect(-5, -78, 40, 3);
    ctx.fillRect(0, -55, 30, 2);
    ctx.fillRect(0, -33, 30, 2);
    ctx.fillRect(10, -70, 2, 38);
    ctx.fillRect(21, -70, 2, 38);
    ctx.fillRect(18, -84, 19, 7);
    ctx.fillRect(34, -82, 2, 10);
    ctx.fillRect(37, -82, 58, 3);
    ctx.fillRect(42, -84, 3, 14);
    ctx.fillRect(46, -78, 56, 1);
    ctx.fillRect(80, -80, 1, 8);
    ctx.fillRect(95, -80, 1, 8);
    ctx.fillRect(-7, -3, 44, 3);
    const beacon = 0.35 + Math.sin(game.ambientTime * 1.9 + x) * 0.3;
    ctx.globalAlpha = alpha * Math.max(0.15, beacon);
    ctx.fillStyle = "#cc3d3d";
    ctx.fillRect(18, -87, 1, 1);
    ctx.fillRect(44, -85, 1, 1);
    ctx.restore();
  }

  function drawWarehouseSilhouette(x, y, w, h, alpha) {
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#0b1217";
    ctx.fillRect(Math.round(x), Math.round(y), w, h);
    ctx.fillRect(Math.round(x - 4), Math.round(y - 3), w + 8, 3);
    ctx.fillRect(Math.round(x + w * 0.18), Math.round(y - 8), w * 0.16, 8);
    ctx.fillRect(Math.round(x + w * 0.7), Math.round(y - 12), 3, 12);
    ctx.fillStyle = "rgba(202, 166, 104, 0.3)";
    for (let i = 0; i < 5; i++) {
      if (hash(x + i * 7.3) > 0.38) {
        ctx.fillRect(Math.round(x + 12 + i * (w / 5.4)), Math.round(y + h * 0.42), 5, 4);
        ctx.fillStyle = "rgba(239, 202, 133, 0.1)";
        ctx.fillRect(Math.round(x + 13 + i * (w / 5.4)), Math.round(y + h * 0.42 + 4), 3, 3);
        ctx.fillStyle = "rgba(202, 166, 104, 0.3)";
      }
    }
    ctx.fillStyle = "rgba(137, 29, 34, 0.4)";
    ctx.fillRect(Math.round(x + w - 10), Math.round(y + 8), 1, 1);
    ctx.restore();
  }

  function drawFarHarbor(cam) {
    const off = -cam * 0.1;
    ctx.save();
    ctx.translate(off, 0);

    // Long low warehouse line.
    for (let i = 0; i < 5; i++) {
      const x = -120 + i * 440;
      if (x > W + 220 || x + 260 < -240) continue;
      drawWarehouseSilhouette(x, 133, 210, 36, 0.75);
      drawWarehouseSilhouette(x + 250, 143, 92, 25, 0.58);
    }

    // Cranes.
    drawCrane(88, 174, 1.1, 0.8);
    drawCrane(384, 176, 0.72, 0.6);
    drawCrane(690, 173, 1.16, 0.62);
    drawCrane(980, 177, 0.76, 0.52);
    drawCrane(1310, 172, 1.24, 0.56);
    drawCrane(1660, 176, 0.78, 0.46);
    drawCrane(2010, 174, 0.98, 0.42);

    // A moored cargo ship, almost lost in the fog.
    ctx.save();
    ctx.globalAlpha = 0.58;
    ctx.fillStyle = "#0a1216";
    ctx.fillRect(268, 146, 186, 17);
    ctx.fillRect(292, 139, 55, 8);
    ctx.fillRect(310, 128, 18, 12);
    ctx.fillRect(331, 133, 24, 7);
    ctx.fillRect(445, 143, 20, 4);
    ctx.fillStyle = "#394449";
    ctx.fillRect(318, 131, 2, 2);
    ctx.fillStyle = "rgba(220, 176, 104, 0.8)";
    ctx.fillRect(319, 131, 1, 1);
    ctx.fillRect(323, 133, 1, 1);
    ctx.fillRect(286, 149, 4, 1);
    ctx.fillStyle = "rgba(173, 44, 46, 0.65)";
    ctx.fillRect(445, 144, 1, 1);
    ctx.fillStyle = "#0c1418";
    for (let i = 0; i < 5; i++) ctx.fillRect(274 + i * 36, 149, 24, 7);
    ctx.restore();

    ctx.restore();
  }

  function drawShipLights(cam) {
    const off = -cam * 0.1;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const blink = 0.4 + Math.sin(game.ambientTime * 1.7) * 0.25;
    ctx.globalAlpha = blink;
    ctx.fillStyle = "#d5a366";
    ctx.fillRect(off + 319, 131, 1, 1);
    ctx.fillStyle = "#ad2e31";
    ctx.fillRect(off + 445, 144, 1, 1);
    ctx.restore();
  }

  function drawWater(cam) {
    const t = game.ambientTime;
    const phase = PHASES[game.phaseIndex] || PHASES[0];
    if (!phase._waterGrad) {
      phase._waterGrad = ctx.createLinearGradient(0, 158, 0, GROUND_Y);
      phase._waterGrad.addColorStop(0, phase.water[0]);
      phase._waterGrad.addColorStop(0.25, phase.water[1]);
      phase._waterGrad.addColorStop(0.75, phase.water[2]);
      phase._waterGrad.addColorStop(1, phase.water[3]);
    }
    ctx.fillStyle = phase._waterGrad;
    ctx.fillRect(0, 158, W, GROUND_Y - 158);

    // Long horizon haze.
    if (!phase._hazeGrad) {
      phase._hazeGrad = ctx.createLinearGradient(0, 158, 0, 198);
      phase._hazeGrad.addColorStop(0, "rgba(" + phase.horizon + ", 0.16)");
      phase._hazeGrad.addColorStop(1, "rgba(" + phase.horizon + ", 0)");
    }
    ctx.fillStyle = phase._hazeGrad;
    ctx.fillRect(0, 158, W, 44);

    // Water glints.
    for (let row = 0; row < 15; row++) {
      const y = 166 + row * 3.6;
      const drift = (t * (7 + row * 0.45) + row * 41) % 120;
      ctx.globalAlpha = (0.055 + row * 0.004) * (phase.id === "day" ? 1.45 : 1);
      ctx.fillStyle = row < 5 ? phase.waterGlints[0] : phase.waterGlints[1];
      for (let x = -140; x < W + 40; x += 61) {
        const sx = (x + drift + hash(row * 13.1) * 45) % (W + 140);
        ctx.fillRect(Math.floor(sx), Math.floor(y + Math.sin(t * 0.7 + row) * 1.4), 12 + (row % 4) * 5, 1);
      }
    }

    // Celestial reflection path.
    const moonX = phase.celestial.x - cam * 0.015;
    for (let i = 0; i < 13; i++) {
      const y = 167 + i * 4;
      const w = 6 + Math.sin(t * 0.8 + i * 1.7) * 6 + i * 0.4;
      const x = moonX + Math.sin(t * 0.55 + i * 1.3) * (3 + i * 0.16);
      ctx.globalAlpha = (0.08 + Math.max(0, 0.16 - i * 0.009)) * (phase.id === "day" ? 0.65 : 1);
      ctx.fillStyle = phase.pathColor;
      ctx.fillRect(Math.round(x - w / 2), y, Math.round(w), 1);
    }

    // Lamp reflections, distorted by the water.
    for (const lamp of lamps) {
      const sx = lamp.x - cam;
      if (sx < -30 || sx > W + 30) continue;
      for (let i = 0; i < 10; i++) {
        const y = 168 + i * 4.2;
        const xx = sx + Math.sin(t * 1.3 + i * 1.8 + lamp.phase) * (2 + i * 0.18);
        ctx.globalAlpha = (0.035 + (1 - i / 10) * 0.07 * lamp.flick) * phase.lamp;
        ctx.fillStyle = "#d9a761";
        ctx.fillRect(Math.round(xx - 2), Math.round(y), 4, 1);
      }
    }

    // Floating debris and foam.
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = "#23363a";
    ctx.fillRect(63 - (t * 2) % 35, 207, 17, 2);
    ctx.fillRect(318 + Math.sin(t * 0.2) * 7, 196, 12, 1);
    ctx.globalAlpha = 0.1;
    ctx.fillStyle = "#c4c5ae";
    ctx.fillRect(66 - (t * 2) % 35, 209, 11, 1);
    ctx.globalAlpha = 1;
  }

  function drawMidContainers(cam) {
    ctx.save();
    ctx.translate(-cam * 0.31, 0);
    ctx.fillStyle = "#0a1114";
    ctx.fillRect(-100, 176, W + 900, 7);
    ctx.fillStyle = "rgba(127, 106, 72, 0.11)";
    ctx.fillRect(-100, 176, W + 900, 1);

    for (const c of backgroundContainers) {
      if (c.x > W + 320 || c.x + c.w < -200) continue;
      ctx.globalAlpha = 0.96;
      ctx.fillStyle = c.color;
      ctx.fillRect(c.x, c.y, c.w, c.h);
      ctx.fillStyle = c.accent;
      ctx.fillRect(c.x, c.y, c.w, 2);
      ctx.fillRect(c.x, c.y + c.h - 2, c.w, 2);
      ctx.fillStyle = "rgba(0,0,0,0.32)";
      for (let i = 8; i < c.w; i += 8) ctx.fillRect(c.x + i, c.y + 3, 1, c.h - 5);
      ctx.fillStyle = "rgba(220, 210, 175, 0.4)";
      drawText(String(c.mark) + "C", c.x + 6, c.y + 6, "rgba(220,210,175,0.6)", 1);
      ctx.fillStyle = "rgba(142, 58, 38, 0.25)";
      ctx.fillRect(c.x + c.w * 0.2, c.y + c.h * 0.55, c.w * 0.38, 2);
      ctx.fillRect(c.x + c.w * 0.65, c.y + c.h * 0.7, c.w * 0.2, 1);

      // stacked containers
      if (c.h < 36) {
        ctx.fillStyle = "#1a2428";
        ctx.fillRect(c.x + 8, c.y - 18, c.w - 20, 17);
        ctx.fillStyle = "rgba(190, 154, 103, 0.2)";
        ctx.fillRect(c.x + 8, c.y - 18, c.w - 20, 1);
      }
    }

    // Cargo pallets / far dock clutter.
    ctx.globalAlpha = 0.55;
    ctx.fillStyle = "#111a1e";
    for (let i = 0; i < 8; i++) {
      const x = 30 + i * 170 + hash(i) * 50;
      const w = 24 + hash(i + 5) * 22;
      ctx.fillRect(x, 170, w, 7);
      ctx.fillRect(x + 3, 164, 3, 6);
    }
    ctx.restore();
  }

  function drawSky() {
    const t = game.ambientTime;
    const cam = game.camera.x;
    const phase = PHASES[game.phaseIndex] || PHASES[0];
    if (!phase._skyGrad) {
      phase._skyGrad = ctx.createLinearGradient(0, 0, 0, 166);
      phase._skyGrad.addColorStop(0, phase.sky[0]);
      phase._skyGrad.addColorStop(0.45, phase.sky[1]);
      phase._skyGrad.addColorStop(0.76, phase.sky[2]);
      phase._skyGrad.addColorStop(1, phase.sky[3]);
    }
    ctx.fillStyle = phase._skyGrad;
    ctx.fillRect(0, 0, W, 166);

    if (game.lightning > 0) {
      ctx.fillStyle = "rgba(154, 180, 190, " + (game.lightning * 0.22).toFixed(3) + ")";
      ctx.fillRect(0, 0, W, 180);
    }

    // Stars.
    if (phase.stars > 0.01) {
      for (const s of stars) {
        const sx = ((s.x - cam * 0.018) % W + W) % W;
        const tw = 0.35 + 0.65 * Math.abs(Math.sin(t * s.v + s.p));
        ctx.globalAlpha = s.a * tw * phase.stars * (0.7 + game.lightning * 0.8);
        ctx.fillStyle = phase.id === "day" ? "#f0f0dd" : "#b9c8c7";
        ctx.fillRect(Math.round(sx), Math.round(s.y), s.s, s.s);
      }
      ctx.globalAlpha = 1;
    }

    // Moon / sun.
    const cel = phase.celestial;
    const celX = cel.x - cam * 0.015;
    const celY = cel.y;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const glow = ctx.createRadialGradient(celX, celY, 3, celX, celY, cel.kind === "sun" ? 92 : 72);
    glow.addColorStop(0, "rgba(" + cel.glow + ", " + cel.alpha + ")");
    glow.addColorStop(0.35, "rgba(" + cel.glow + ", " + (cel.alpha * 0.36).toFixed(3) + ")");
    glow.addColorStop(1, "rgba(" + cel.glow + ", 0)");
    ctx.fillStyle = glow;
    ctx.fillRect(celX - 100, celY - 100, 200, 200);
    ctx.restore();
    drawPixelDisc(celX, celY, cel.r, cel.color);
    drawPixelDisc(celX - 1, celY - 1, cel.r - 2, cel.light);
    if (cel.kind === "moon") {
      ctx.globalAlpha = 0.28;
      ctx.fillStyle = "#8f9078";
      ctx.fillRect(celX - 6, celY - 5, 4, 3);
      ctx.fillRect(celX + 2, celY + 1, 3, 2);
      ctx.fillRect(celX - 3, celY + 7, 2, 1);
      ctx.fillRect(celX + 6, celY - 7, 2, 2);
      ctx.globalAlpha = 1;
    } else if (phase.id !== "day") {
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = "#5a3530";
      ctx.fillRect(celX - 24, celY + 9, 55, 2);
      ctx.fillRect(celX - 14, celY + 13, 36, 1);
      ctx.globalAlpha = 1;
    }

    // Torn clouds.
    for (const c of clouds) {
      const span = W + 340;
      let cx = ((c.x - cam * 0.05 + t * c.v * 2.2) % span + span) % span - 160;
      ctx.globalAlpha = c.a * phase.cloudAlpha * (0.6 + game.lightning * 0.8);
      ctx.fillStyle = phase.cloudColor;
      ctx.fillRect(Math.round(cx), Math.round(c.y), Math.round(c.w), Math.round(c.h * 0.35));
      ctx.fillRect(Math.round(cx + c.w * 0.13), Math.round(c.y + c.h * 0.35), Math.round(c.w * 0.66), Math.round(c.h * 0.25));
      ctx.fillRect(Math.round(cx + c.w * 0.36), Math.round(c.y + c.h * 0.55), Math.round(c.w * 0.38), Math.round(c.h * 0.2));
    }
    ctx.globalAlpha = 1;

    // Faint horizon light.
    if (!phase._horizonGrad) {
      phase._horizonGrad = ctx.createLinearGradient(0, 128, 0, 166);
      phase._horizonGrad.addColorStop(0, "rgba(" + phase.horizon + ", 0)");
      phase._horizonGrad.addColorStop(0.7, "rgba(" + phase.horizon + ", 0.12)");
      phase._horizonGrad.addColorStop(1, "rgba(" + phase.horizon + ", 0.24)");
    }
    ctx.fillStyle = phase._horizonGrad;
    ctx.fillRect(0, 128, W, 38);
  }

  function drawFogBand() {
    const t = game.ambientTime;
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    for (let i = 0; i < 3; i++) {
      const y = 150 + i * 13;
      if (!fogBandGradients[i]) {
        const a = 0.035 - i * 0.008;
        const g = ctx.createLinearGradient(0, y - 8, 0, y + 12);
        g.addColorStop(0, "rgba(130, 150, 146, 0)");
        g.addColorStop(0.45, "rgba(126, 145, 142, " + a + ")");
        g.addColorStop(1, "rgba(96, 120, 118, 0)");
        fogBandGradients[i] = g;
      }
      ctx.fillStyle = fogBandGradients[i];
      ctx.fillRect(0, y - 8, W, 22);
    }
    ctx.globalAlpha = 0.045;
    ctx.fillStyle = "#93a3a0";
    for (const f of fogBanks) {
      const x = ((f.x + t * f.v) % (W + f.w)) - f.w;
      ctx.fillRect(Math.round(x), Math.round(f.y + Math.sin(t * 0.2 + f.phase) * 2), Math.round(f.w), Math.round(f.h));
      ctx.fillRect(Math.round(x + f.w * 0.2), Math.round(f.y + 5), Math.round(f.w * 0.55), Math.round(f.h * 0.65));
    }
    ctx.restore();
  }

  const DOCK_TILE_W = 960;
  let dockTile = null;

  function buildDockTile() {
    const c = document.createElement("canvas");
    c.width = DOCK_TILE_W;
    c.height = H - (GROUND_Y - 2);
    const g = c.getContext("2d");
    g.fillStyle = "#241c16";
    g.fillRect(0, 0, DOCK_TILE_W, c.height);
    g.fillStyle = "#34291f";
    g.fillRect(0, 2, DOCK_TILE_W, c.height - 2);

    for (let y = 4; y < c.height; y += 9) {
      const row = Math.floor((y - 2) / 9);
      g.fillStyle = row % 3 === 0 ? "#3d2f23" : row % 3 === 1 ? "#382b20" : "#33271e";
      g.fillRect(0, y, DOCK_TILE_W, 8);
      g.fillStyle = "rgba(8, 6, 5, 0.6)";
      g.fillRect(0, y + 8, DOCK_TILE_W, 1);
      g.fillStyle = "rgba(222, 196, 149, 0.06)";
      g.fillRect(0, y, DOCK_TILE_W, 1);
    }

    // Board joints repeat every 32 px so tile edges stay seamless.
    for (let x = 0; x < DOCK_TILE_W; x += 32) {
      const h = hash(x * 0.37 + 11);
      g.fillStyle = "rgba(9, 7, 6, 0.38)";
      g.fillRect(x, 2, 1, c.height - 2);
      g.fillStyle = "rgba(189, 156, 99, 0.035)";
      g.fillRect(x + 1, 2, 1, c.height - 2);
      if (h > 0.45) {
        const y = 10 + Math.floor(h * 30);
        g.fillStyle = "rgba(5, 4, 4, 0.38)";
        g.fillRect(x + 1, y, 22, 1);
      }
      if (h > 0.72) {
        g.fillStyle = "#76684e";
        g.fillRect(x + 4, 5, 1, 1);
        g.fillRect(x + 17, 5, 1, 1);
      }
    }

    for (let i = 0; i < 64; i++) {
      const x = (i * 173.3 + 41) % DOCK_TILE_W;
      const y = 4 + hash(i * 6.7) * 42;
      g.globalAlpha = 0.12 + hash(i) * 0.13;
      g.fillStyle = hash(i + 10) > 0.5 ? "#06090a" : "#6e6049";
      g.fillRect(Math.round(x), Math.round(y), 2 + Math.floor(hash(i + 3) * 4), 1);
    }
    g.globalAlpha = 1;

    g.fillStyle = "#0b0908";
    g.fillRect(0, 0, DOCK_TILE_W, 3);
    g.fillStyle = "#5d4932";
    g.fillRect(0, 3, DOCK_TILE_W, 1);
    g.fillStyle = "rgba(225, 197, 137, 0.2)";
    g.fillRect(0, 2, DOCK_TILE_W, 1);
    dockTile = c;
  }

  function drawDock(camX) {
    const t = game.ambientTime;
    if (!dockTile) buildDockTile();
    const tileX = Math.floor(camX / DOCK_TILE_W) * DOCK_TILE_W;
    ctx.drawImage(dockTile, tileX, GROUND_Y - 2);
    if (tileX + DOCK_TILE_W < camX + W + 20) {
      ctx.drawImage(dockTile, tileX + DOCK_TILE_W, GROUND_Y - 2);
    }

    // Puddles.
    for (const p of puddles) {
      if (p.x < camX - 80 || p.x > camX + W + 80) continue;
      pixEllipse(p.x, p.y, p.w / 2, 4, "#0a1418", p.a + 0.08);
      pixEllipse(p.x - 3, p.y - 1, p.w * 0.36, 1, "#587079", p.a * 0.8);
      ctx.globalAlpha = 0.12;
      ctx.fillStyle = "#b8b58e";
      ctx.fillRect(p.x - p.w * 0.2, p.y + 1, p.w * 0.28, 1);
      ctx.globalAlpha = 1;
    }

    // Wet sheen at the edge.
    ctx.globalAlpha = 0.08 + Math.sin(t * 0.4) * 0.015;
    ctx.fillStyle = "#84a0a0";
    ctx.fillRect(camX, GROUND_Y + 1, W, 2);
    ctx.globalAlpha = 1;
  }

  function drawRopes(camX) {
    ctx.save();
    ctx.strokeStyle = "rgba(118, 101, 71, 0.28)";
    ctx.lineWidth = 1;
    for (let i = 0; i < bollards.length - 1; i++) {
      const a = bollards[i];
      const b = bollards[i + 1];
      if (b < camX - 100 || a > camX + W + 100) continue;
      if (i % 2 === 1) continue;
      ctx.beginPath();
      ctx.moveTo(a, GROUND_Y - 12);
      ctx.quadraticCurveTo((a + b) / 2, GROUND_Y + 12, b, GROUND_Y - 12);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawBollard(x, camX) {
    if (x < camX - 30 || x > camX + W + 30) return;
    pixEllipse(x, GROUND_Y + 2, 8, 2, "#080706", 0.5);
    ctx.fillStyle = "#0d0e0e";
    ctx.fillRect(x - 5, GROUND_Y - 4, 10, 4);
    ctx.fillStyle = "#232725";
    ctx.fillRect(x - 3, GROUND_Y - 15, 6, 12);
    ctx.fillStyle = "#353a35";
    ctx.fillRect(x - 4, GROUND_Y - 17, 8, 3);
    ctx.fillStyle = "#4d5047";
    ctx.fillRect(x - 4, GROUND_Y - 17, 8, 1);
    ctx.fillStyle = "#6b4d30";
    ctx.fillRect(x + 3, GROUND_Y - 10, 1, 3);
    ctx.fillStyle = "#121413";
    ctx.fillRect(x - 3, GROUND_Y - 20, 6, 3);
  }

  function drawCrate(x, y, s, kind) {
    const w = Math.round(22 * s);
    const h = Math.round(15 * s);
    if (w < 5) return;
    const palettes = [
      { base: "#4c3927", light: "#705637", dark: "#2a1f14", strap: "#8c7850" },
      { base: "#3d4e40", light: "#5a6d52", dark: "#222d25", strap: "#93875e" },
      { base: "#513c2f", light: "#785b43", dark: "#2e2017", strap: "#9a8157" }
    ];
    const c = palettes[kind % palettes.length];
    pixEllipse(x, y + 1, w * 0.52, 2, "#070605", 0.55);
    ctx.fillStyle = c.base;
    ctx.fillRect(x - w / 2, y - h, w, h);
    ctx.fillStyle = c.light;
    ctx.fillRect(x - w / 2, y - h, w, 2);
    ctx.fillStyle = c.dark;
    ctx.fillRect(x - w / 2, y - 2, w, 2);
    ctx.fillRect(x + w / 2 - 1, y - h, 1, h);
    // slats and braces
    ctx.fillStyle = c.strap;
    ctx.globalAlpha = 0.38;
    ctx.fillRect(x - w / 2 + 2, y - h + 3, w - 4, 1);
    ctx.fillRect(x - w / 2 + 2, y - 6, w - 4, 1);
    ctx.globalAlpha = 1;
    ctx.fillStyle = c.light;
    ctx.globalAlpha = 0.28;
    ctx.fillRect(x - w / 2 + 2, y - h + 3, 1, h - 5);
    ctx.fillRect(x + w / 2 - 3, y - h + 3, 1, h - 5);
    ctx.globalAlpha = 1;
    if (s > 0.7) {
      drawText("7", x - 1, y - h + 5, "rgba(217, 204, 170, 0.36)", 1, "center");
      ctx.fillStyle = "rgba(20, 18, 13, 0.55)";
      ctx.fillRect(x - w / 2 + 3, y - 4, w - 6, 1);
    }
  }

  function drawLampPost(lamp, camX) {
    if (lamp.x < camX - 40 || lamp.x > camX + W + 40) return;
    const x = lamp.x;
    const top = GROUND_Y - lamp.height;
    pixEllipse(x, GROUND_Y + 1, 10, 2, "#050505", 0.6);
    ctx.fillStyle = "#1a1c1b";
    ctx.fillRect(x - 5, GROUND_Y - 3, 10, 3);
    ctx.fillStyle = "#272b28";
    ctx.fillRect(x - 1, top, 3, lamp.height - 2);
    ctx.fillStyle = "#474b42";
    ctx.fillRect(x, top, 1, lamp.height);
    ctx.fillStyle = "#111413";
    ctx.fillRect(x - 2, top - 4, 11, 3);
    ctx.fillRect(x + 6, top - 3, 6, 2);
    ctx.fillStyle = "#343832";
    ctx.fillRect(x + 9, top - 2, 4, 4);
    ctx.fillStyle = lamp.broken ? "#a98555" : "#f0c784";
    ctx.globalAlpha = lamp.flick;
    ctx.fillRect(x + 10, top - 1, 3, 2);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#202525";
    ctx.fillRect(x + 7, top - 8, 9, 2);
    ctx.fillRect(x + 8, top - 10, 7, 2);
    // warning plate
    ctx.fillStyle = "rgba(18, 22, 21, 0.8)";
    ctx.fillRect(x - 5, GROUND_Y - 48, 11, 10);
    ctx.fillStyle = "rgba(179, 155, 103, 0.3)";
    ctx.fillRect(x - 5, GROUND_Y - 48, 11, 1);
    drawText("07", x, GROUND_Y - 46, "rgba(190, 177, 143, 0.6)", 1, "center");
    // little rust flakes
    ctx.fillStyle = "rgba(145, 76, 43, 0.5)";
    ctx.fillRect(x + 1, top + 30, 1, 4);
    ctx.fillRect(x - 1, top + 58, 1, 3);
  }

  function drawProps(camX) {
    drawRopes(camX);
    for (const x of bollards) drawBollard(x, camX);
    for (const lamp of lamps) drawLampPost(lamp, camX);
    for (const c of crates) {
      if (c.x > camX + W + 60 || c.x < camX - 60) continue;
      drawCrate(c.x, c.y, c.s, c.kind);
    }

    // A stack of pallets near the middle of the dock.
    const px = 1620;
    if (px > camX - 80 && px < camX + W + 80) {
      ctx.fillStyle = "#33261b";
      ctx.fillRect(px - 18, GROUND_Y - 5, 36, 4);
      ctx.fillStyle = "#1d150f";
      ctx.fillRect(px - 18, GROUND_Y - 1, 36, 1);
      ctx.fillRect(px - 14, GROUND_Y - 9, 28, 2);
      ctx.fillStyle = "#493522";
      ctx.fillRect(px - 12, GROUND_Y - 4, 3, 3);
      ctx.fillRect(px + 9, GROUND_Y - 4, 3, 3);
    }

    // A frayed chain hanging from the lamp arm.
    const chainLamp = lamps[2];
    if (chainLamp.x > camX - 40 && chainLamp.x < camX + W + 40) {
      ctx.strokeStyle = "rgba(45, 50, 47, 0.8)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < 12; i++) {
        const y = GROUND_Y - chainLamp.height + 4 + i * 5;
        ctx.moveTo(chainLamp.x - 1, y);
        ctx.lineTo(chainLamp.x - 1, y + 3);
      }
      ctx.stroke();
    }
  }

  function drawBurrowWarnings() {
    for (const w of game.burrowWarnings) {
      if (w.spawned) continue;
      const k = clamp(1 - w.timer / w.maxTimer, 0, 1);
      const pulse = 0.55 + Math.sin(game.ambientTime * 13 + w.phase) * 0.25;
      const r = 7 + k * 16;
      ctx.save();
      pixEllipse(w.x, GROUND_Y + 2, r + 5, (r + 5) * 0.32, "#1c0c09", 0.72);
      ctx.globalAlpha = 0.32 + pulse * 0.45;
      ctx.strokeStyle = "#f08b54";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(w.x, GROUND_Y + 1, r, r * 0.32, 0, 0, TAU);
      ctx.stroke();
      ctx.globalAlpha = 0.18 + pulse * 0.25;
      ctx.strokeStyle = "#ffc084";
      ctx.beginPath();
      ctx.ellipse(w.x, GROUND_Y + 1, r + 5, (r + 5) * 0.32, 0, 0, TAU);
      ctx.stroke();

      ctx.globalAlpha = 0.75 + pulse * 0.2;
      ctx.strokeStyle = "#d35d35";
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const a = w.phase + i * 1.37;
        ctx.moveTo(w.x + Math.cos(a) * 3, GROUND_Y + Math.sin(a) * 1.5);
        ctx.lineTo(w.x + Math.cos(a) * (r + 7), GROUND_Y + Math.sin(a) * (r * 0.34 + 2));
      }
      ctx.stroke();

      ctx.fillStyle = "#f2a060";
      const triY = GROUND_Y - 19 - Math.sin(game.ambientTime * 9 + w.phase) * 3;
      ctx.beginPath();
      ctx.moveTo(w.x - 5, triY);
      ctx.lineTo(w.x + 5, triY);
      ctx.lineTo(w.x, triY + 7);
      ctx.closePath();
      ctx.fill();
      ctx.fillStyle = "#2a0c08";
      ctx.fillRect(w.x - 1, triY + 2, 2, 2);
      ctx.fillRect(w.x - 1, triY + 5, 2, 1);

      if (k > 0.5) {
        ctx.globalAlpha = (k - 0.5) * 1.7;
        ctx.fillStyle = "#a58567";
        ctx.fillRect(w.x - 11, GROUND_Y - 4 - k * 5, 22, 2);
      }
      ctx.restore();
    }
  }

  function drawDecals() {
    for (const d of game.decals) {
      ctx.globalAlpha = d.alpha;
      ctx.fillStyle = d.color;
      ctx.fillRect(d.x, d.y, d.w, d.h);
      ctx.globalAlpha = d.alpha * 0.55;
      ctx.fillRect(d.x + d.w * 0.2, d.y + d.h, d.w * 0.35, 1);
      ctx.fillRect(d.x - d.w * 0.1, d.y + d.h * 0.4, 2, 1);
      if (d.seed > 0.62) {
        ctx.fillRect(d.x + d.w + 2, d.y + 1, 2, 1);
      }
    }
    ctx.globalAlpha = 1;
  }

  function drawBarrels(camX) {
    for (const b of game.barrels) {
      if (b.exploded) continue;
      if (b.x < camX - 30 || b.x > camX + W + 30) continue;
      const x = b.x;
      const y = b.y;
      const bob = Math.sin(game.ambientTime * 1.4 + b.flicker) * 0.35;
      pixEllipse(x, y + 1, 9, 2, "#050505", 0.6);
      ctx.save();
      ctx.translate(0, bob);
      ctx.fillStyle = "#6e2a23";
      ctx.fillRect(x - 6, y - 16, 12, 15);
      ctx.fillStyle = "#8d3d2d";
      ctx.fillRect(x - 6, y - 16, 12, 2);
      ctx.fillRect(x - 5, y - 14, 2, 11);
      ctx.fillStyle = "#3a1715";
      ctx.fillRect(x - 6, y - 11, 12, 2);
      ctx.fillRect(x - 6, y - 4, 12, 2);
      ctx.fillStyle = "#d2a05e";
      ctx.fillRect(x - 6, y - 9, 12, 1);
      ctx.fillStyle = "#1d1310";
      ctx.fillRect(x + 3, y - 15, 1, 2);
      ctx.fillStyle = "#ffb049";
      ctx.globalAlpha = 0.55 + Math.sin(game.ambientTime * 3 + b.flicker) * 0.2;
      ctx.fillRect(x - 2, y - 14, 4, 3);
      ctx.globalAlpha = 1;
      drawText("FUEL", x, y - 19, "rgba(232, 194, 131, 0.55)", 1, "center");
      ctx.strokeStyle = "rgba(24, 17, 13, 0.5)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(x, y - 16, 6, 1.8, 0, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawPickups(camX) {
    for (const item of game.pickups) {
      if (item.x < camX - 40 || item.x > camX + W + 40) continue;
      if (item.life < 5 && Math.floor(item.life * 4) % 2 === 0) continue;
      const x = item.x;
      const y = item.y + Math.sin(item.bob) * 1.5;
      const weaponDef = item.type === "weapon" ? WEAPON_DEFS[item.weaponId] : null;
      const color =
        item.type === "medkit"
          ? "#9fc58f"
          : weaponDef
            ? weaponDef.ammoColor || "#e2b269"
            : "#d9bd75";
      const glowR = weaponDef ? 36 : 22;

      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      ctx.imageSmoothingEnabled = true;
      drawGlowSprite(hexRgb(color), x, y - 4, glowR, weaponDef ? 0.34 : 0.2);
      ctx.globalAlpha = weaponDef ? 0.38 : 0.2;
      ctx.fillStyle = color;
      ctx.fillRect(x - 0.5, y - (weaponDef ? 28 : 22), 1, weaponDef ? 20 : 14);
      ctx.restore();

      pixEllipse(x, GROUND_Y + 1, weaponDef ? 12 : 7, 1.5, "#050505", 0.55);
      if (weaponDef) {
        ctx.fillStyle = "#3b3021";
        ctx.fillRect(x - 11, y - 8, 22, 8);
        ctx.fillStyle = "#7f6841";
        ctx.fillRect(x - 11, y - 8, 22, 1);
        ctx.fillStyle = "#1e1811";
        ctx.fillRect(x - 9, y - 2, 18, 1);
        ctx.fillStyle = "#b58c4f";
        ctx.fillRect(x - 9, y - 7, 2, 5);
        ctx.fillRect(x + 7, y - 7, 2, 5);
        ctx.fillStyle = "#d9c496";
        drawText(weaponDef.code, x, y - 16, "#e8cb91", 1, "center");
        drawText("CACHE", x, y - 23, "rgba(217, 199, 156, 0.5)", 1, "center");
      } else if (item.type === "ammo") {
        ctx.fillStyle = "#544b33";
        ctx.fillRect(x - 5, y - 7, 10, 7);
        ctx.fillStyle = "#7b6d49";
        ctx.fillRect(x - 5, y - 7, 10, 1);
        ctx.fillStyle = "#d9b86d";
        ctx.fillRect(x - 3, y - 5, 2, 3);
        ctx.fillRect(x, y - 5, 2, 3);
        ctx.fillStyle = "#201b13";
        ctx.fillRect(x - 5, y - 2, 10, 1);
      } else {
        ctx.fillStyle = "#b9bfa9";
        ctx.fillRect(x - 5, y - 7, 10, 7);
        ctx.fillStyle = "#d8ddc9";
        ctx.fillRect(x - 5, y - 7, 10, 1);
        ctx.fillStyle = "#a63032";
        ctx.fillRect(x - 1, y - 6, 2, 5);
        ctx.fillRect(x - 3, y - 4, 6, 1);
        ctx.fillStyle = "#384039";
        ctx.fillRect(x - 5, y - 1, 10, 1);
      }
    }
  }

  function getZombieColors(z) {
    if (z.title) {
      return {
        skin: "#44514a",
        shirt: "#252e30",
        pants: "#171c1d",
        blood: "#3c0c10",
        hair: "#0d1112",
        eye: "#e03a3f",
        bone: "#6e7567",
        accent: "#3a4741"
      };
    }
    const variants = [
      {
        skin: "#7d8b6c",
        shirt: "#3b3d39",
        pants: "#252728",
        blood: "#6e1820",
        hair: "#1a1c1b",
        eye: "#e0483f",
        bone: "#c5baa0",
        accent: "#96754a"
      },
      {
        skin: "#8a8d76",
        shirt: "#3a4a50",
        pants: "#2b3032",
        blood: "#7a1d22",
        hair: "#232321",
        eye: "#e35b39",
        bone: "#c9c0a7",
        accent: "#b08345"
      },
      {
        skin: "#74836b",
        shirt: "#4d4038",
        pants: "#202426",
        blood: "#63151b",
        hair: "#181a18",
        eye: "#d8403c",
        bone: "#b7af95",
        accent: "#7c5a39"
      }
    ];
    const c = { ...variants[z.variant % variants.length] };
    if (z.type === "brute") {
      Object.assign(c, {
        skin: "#77775e",
        shirt: "#4a3e33",
        pants: "#252523",
        blood: "#65151c",
        accent: "#c0853b"
      });
    } else if (z.type === "runner") {
      Object.assign(c, { skin: "#909178", shirt: "#3c4242", eye: "#ff5a45" });
    }
    const muts = z.mutations || [];
    if (muts.includes("feral")) {
      c.eye = "#ff6046";
      c.blood = "#86141d";
    }
    if (muts.includes("regen")) {
      c.skin = "#7b8d63";
      c.accent = "#93a75a";
    }
    if (muts.includes("volatile")) {
      c.accent = "#b9d35f";
      c.eye = "#d9ef7d";
    }
    if (muts.includes("spitter") && z.spitter) {
      c.eye = "#bdf06c";
    }
    return c;
  }

  function drawBird(z, deadPose = false) {
    const camX = game.camera.x;
    if (z.x < camX - 80 || z.x > camX + W + 80) return;
    const c = getZombieColors(z);
    const flash = z.flash > 0;
    const skin = flash ? "#f4f6e9" : "#8a8b74";
    const wing = flash ? "#e9eadc" : "#686c59";
    const blood = flash ? "#ecc6ba" : "#6f1820";
    const scale = z.scale;
    const flap = Math.sin(z.walk * 2.4) * 3.6;
    const tilt = clamp(z.vy / 140, -0.35, 0.35);

    pixEllipse(z.x, GROUND_Y + 1, 7, 1.5, "#030303", 0.18);
    ctx.save();
    ctx.globalAlpha =
      (deadPose ? clamp(1 - Math.max(0, z.deathTime - 1.8) / 1.4, 0, 1) : 1) * 0.96;
    ctx.translate(Math.round(z.x), Math.round(z.y - z.height * 0.5));
    if (deadPose) {
      const p = clamp(z.deathTime / 0.55, 0, 1);
      ctx.rotate(z.deathDir * 1.4 * (1 - Math.pow(1 - p, 3)));
      ctx.translate(0, Math.sin(p * Math.PI) * 3);
    } else {
      ctx.rotate(tilt);
    }
    ctx.scale(z.dir * scale, scale);

    // Ragged wings.
    ctx.fillStyle = wing;
    ctx.fillRect(-10, -2 - flap, 7, 2);
    ctx.fillRect(-13, -3 - flap, 4, 1);
    ctx.fillRect(-7, 0 - flap, 4, 1);
    ctx.fillRect(2, -2 + flap, 7, 2);
    ctx.fillRect(9, -1 + flap, 4, 1);
    ctx.fillRect(3, 0 + flap, 4, 1);
    ctx.fillStyle = flash ? "#d9ddcf" : "#4d5143";
    ctx.fillRect(-9, -1 - flap, 2, 1);
    ctx.fillRect(7, -1 + flap, 2, 1);

    // Body.
    ctx.fillStyle = skin;
    ctx.fillRect(-6, -4, 11, 7);
    ctx.fillRect(-3, -5, 7, 1);
    ctx.fillStyle = flash ? "#ffffff" : "#b7b59a";
    ctx.fillRect(-5, -3, 8, 1);
    ctx.fillStyle = blood;
    ctx.fillRect(-2, 2, 4, 2);
    ctx.fillRect(0, 3, 1, 2);
    ctx.fillStyle = flash ? "#e9eadc" : "#565a49";
    ctx.fillRect(-9, -0.5, 3, 1);

    // Head, beak, eye.
    ctx.fillStyle = skin;
    ctx.fillRect(3, -6, 5, 5);
    ctx.fillRect(4, -7, 3, 1);
    ctx.fillStyle = flash ? "#ffffff" : "#b49a54";
    ctx.fillRect(8, -4, 4, 1);
    ctx.fillRect(9, -3, 2, 1);
    ctx.fillStyle = flash ? "#ffffff" : "#d0b36a";
    ctx.fillRect(8, -3, 3, 1);
    ctx.fillStyle = c.eye;
    ctx.fillRect(5, -5, 2, 1);
    ctx.globalAlpha = 0.9;
    ctx.fillStyle = blood;
    ctx.fillRect(4, -2, 2, 1);

    // A few feathers sticking out of the wound.
    ctx.fillStyle = flash ? "#ffffff" : "#9c9a7e";
    ctx.fillRect(-5, -6, 1, 2);
    ctx.fillRect(-2, -6, 1, 1);
    ctx.fillRect(1, -6, 1, 2);
    ctx.restore();
  }

  function drawZombie(z, deadPose = false) {
    const camX = game.camera.x;
    if (z.x < camX - 70 || z.x > camX + W + 70) return;
    if (z.air) {
      drawBird(z, deadPose);
      return;
    }
    const c = getZombieColors(z);
    const flash = !z.title && z.flash > 0;
    const skin = flash ? "#f3f6e8" : c.skin;
    const shirt = flash ? "#e5e9da" : c.shirt;
    const pants = flash ? "#cbd4c8" : c.pants;
    const hair = flash ? "#e5e9da" : c.hair;
    const blood = flash ? "#e9c3b5" : c.blood;
    const bone = flash ? "#ffffff" : c.bone;
    const scale = z.scale;
    const walk = z.walk;
    const moving = !deadPose && z.attackTimer < 0;
    const step = moving ? Math.sin(walk) : 0;
    const bob = deadPose ? 0 : Math.abs(Math.sin(walk)) * 0.8;
    const attackProgress = z.attackTimer >= 0 ? clamp(z.attackTimer / z.attackTime, 0, 1) : 0;
    const lunge = z.lunge > 0 ? Math.sin((1 - z.lunge / 0.28) * Math.PI) * 3 : 0;

    if (!deadPose) {
      pixEllipse(z.x, GROUND_Y + 1, z.width * 0.72, 2.4, "#030303", z.title ? 0.4 : 0.58);
    }

    ctx.save();
    ctx.globalAlpha = deadPose ? clamp(1 - Math.max(0, z.deathTime - 2.1) / 1.1, 0, 1) : 1;
    ctx.translate(Math.round(z.x), GROUND_Y);
    if (deadPose) {
      const p = clamp(z.deathTime / 0.5, 0, 1);
      const ease = 1 - Math.pow(1 - p, 3);
      ctx.rotate(z.deathDir * 1.42 * ease);
      ctx.translate(0, -Math.sin(ease * Math.PI) * 2 + Math.max(0, z.deathTime - 2.15) * 7);
    } else {
      ctx.translate(0, -bob + lunge);
    }
    ctx.scale(z.dir * scale, scale);

    // Legs.
    ctx.fillStyle = pants;
    const legSwing = deadPose ? 0 : step * 2.4;
    ctx.fillRect(-4 + legSwing, -12, 4, 9);
    ctx.fillRect(1.5 - legSwing, -12, 4, 9);
    ctx.fillStyle = flash ? "#b6c1b6" : "#171818";
    ctx.fillRect(-5 + legSwing, -3, 5, 3);
    ctx.fillRect(1.5 - legSwing, -3, 5, 3);
    ctx.fillStyle = flash ? "#dce2d6" : "#4c4c42";
    ctx.fillRect(-4 + legSwing, -6, 3, 1);
    ctx.fillRect(2 - legSwing, -6, 3, 1);

    // Hunched torso.
    ctx.fillStyle = shirt;
    ctx.fillRect(-5, -22, 9, 12);
    ctx.fillRect(-4, -23, 7, 2);
    ctx.fillRect(-5, -12, 8, 2);
    // torn hem
    ctx.fillStyle = pants;
    ctx.fillRect(-5, -11, 2, 3);
    ctx.fillRect(-1, -12, 2, 2);
    ctx.fillRect(2, -11, 2, 2);
    // rib cage / exposed side
    ctx.fillStyle = skin;
    ctx.fillRect(2, -19, 3, 5);
    ctx.fillStyle = blood;
    ctx.fillRect(3, -18, 1, 3);
    ctx.fillStyle = bone;
    ctx.fillRect(2, -18, 2, 1);
    ctx.fillRect(2, -16, 2, 1);

    // Backpack / work harness.
    ctx.fillStyle = flash ? "#d5ddd0" : z.variant === 1 ? "#4d4c3d" : "#302c25";
    ctx.fillRect(-8, -21, 3, 8);
    ctx.fillStyle = accentColor(flash, c.accent);
    ctx.fillRect(-6, -22, 2, 8);
    ctx.fillRect(1, -22, 1, 8);

    // Shoulder / bent spine.
    ctx.fillStyle = shirt;
    ctx.fillRect(0, -21, 4, 2);

    // Walking arms, reaching forward.
    const armBase = z.attackTimer >= 0 ? -1.7 + attackProgress * 1.8 : -0.12 + step * 0.16;
    drawZombieArm(3, -19, armBase, skin, shirt, flash, c);
    drawZombieArm(1, -18, armBase + (z.attackTimer >= 0 ? -0.36 : 0.12), skin, shirt, flash, c);

    // Head.
    ctx.save();
    ctx.translate(2.5, -27);
    ctx.rotate(z.attackTimer >= 0 ? -0.13 + Math.sin(attackProgress * Math.PI) * 0.2 : 0.12 + Math.sin(walk * 0.6) * 0.05);
    ctx.fillStyle = skin;
    ctx.fillRect(-2, -4, 7, 7);
    ctx.fillRect(4, -2, 2, 3);
    ctx.fillStyle = flash ? "#d7dfd4" : "#4a4b40";
    ctx.fillRect(-3, -5, 6, 2);
    ctx.fillRect(3, -5, 2, 2);
    ctx.fillStyle = hair;
    ctx.fillRect(-3, -6, 4, 2);
    ctx.fillRect(-1, -7, 3, 2);
    // Dock-worker headgear gives each body a little history.
    if (z.type === "brute" || z.variant === 2) {
      ctx.fillStyle = flash ? "#ffffff" : z.type === "brute" ? "#a76b2d" : "#987032";
      ctx.fillRect(-4, -7, 9, 2);
      ctx.fillRect(-3, -8, 7, 1);
      ctx.fillRect(-5, -5, 11, 1);
      ctx.fillStyle = flash ? "#ffffff" : "#d1a75d";
      ctx.fillRect(-3, -7, 5, 1);
    } else if (z.variant === 1) {
      ctx.fillStyle = flash ? "#eef2e8" : "#5e5a3e";
      ctx.fillRect(-4, -7, 3, 5);
      ctx.fillRect(-4, -8, 9, 2);
      ctx.fillRect(3, -7, 2, 3);
      ctx.fillStyle = flash ? "#ffffff" : "#777152";
      ctx.fillRect(-3, -8, 7, 1);
    }
    // jaw
    ctx.fillStyle = flash ? "#f0f3e8" : "#4e4a3b";
    ctx.fillRect(2, 2, 4, 2);
    ctx.fillStyle = blood;
    ctx.fillRect(3, 2, 2, 2);
    // eye
    ctx.fillStyle = c.eye;
    ctx.globalAlpha = z.title ? 0.8 + Math.sin(game.ambientTime * 2 + z.phase) * 0.2 : 0.95;
    ctx.fillRect(4, -2, 1, 1);
    ctx.globalAlpha = 1;
    // torn cheek
    ctx.fillStyle = blood;
    ctx.fillRect(5, 1, 1, 1);
    if (z.spitter) {
      ctx.fillStyle = flash ? "#f1f6e3" : "#7f3427";
      ctx.fillRect(2, 4, 4, 2);
      ctx.globalAlpha = 0.72 + Math.sin(game.ambientTime * 4 + z.phase) * 0.2;
      ctx.fillStyle = flash ? "#ffffff" : "#a8d15b";
      ctx.fillRect(2, 3, 3, 2);
      ctx.fillRect(4, 2, 1, 2);
      if (z.spitAnim > 0) {
        ctx.fillRect(5, 4, 3, 2);
      }
      ctx.globalAlpha = 1;
    }
    ctx.restore();

    // Blood stains on clothing.
    if (!z.title) {
      ctx.fillStyle = blood;
      ctx.globalAlpha = 0.78;
      ctx.fillRect(-4, -18, 3, 1);
      ctx.fillRect(1, -15, 2, 2);
      ctx.fillRect(-2, -10, 1, 2);
      ctx.globalAlpha = 1;
    }

    const muts = z.mutations || [];
    if (muts.includes("carapace")) {
      ctx.fillStyle = flash ? "#ffffff" : c.bone;
      ctx.globalAlpha = 0.9;
      ctx.fillRect(-4, -21, 4, 1);
      ctx.fillRect(-3, -18, 5, 1);
      ctx.fillRect(-1, -15, 3, 1);
      ctx.fillRect(-6, -22, 1, 3);
      ctx.fillRect(3, -20, 1, 3);
      ctx.fillStyle = flash ? "#f5f7ea" : "#8e8469";
      ctx.fillRect(-3, -22, 1, 2);
      ctx.fillRect(1, -19, 1, 2);
      ctx.globalAlpha = 1;
    }
    if (muts.includes("feral")) {
      ctx.fillStyle = flash ? "#ffffff" : "#8c1d22";
      ctx.globalAlpha = 0.88;
      ctx.fillRect(-4, -19, 1, 4);
      ctx.fillRect(-2, -15, 1, 1);
      ctx.fillRect(3, -17, 1, 4);
      ctx.fillRect(1, -20, 1, 1);
      ctx.globalAlpha = 1;
    }
    if (muts.includes("regen")) {
      ctx.globalAlpha = 0.55 + Math.sin(game.ambientTime * 3 + z.phase) * 0.15;
      ctx.fillStyle = flash ? "#ffffff" : "#8fae5b";
      ctx.fillRect(-4, -13, 4, 2);
      ctx.fillRect(2, -20, 2, 2);
      ctx.fillRect(-5, -9, 2, 1);
      ctx.globalAlpha = 1;
    }
    if (muts.includes("volatile")) {
      const pulse = 0.5 + Math.sin(game.ambientTime * 5 + z.phase) * 0.25;
      ctx.globalAlpha = pulse;
      ctx.fillStyle = flash ? "#ffffff" : "#b8d45c";
      ctx.fillRect(-3, -16, 2, 2);
      ctx.fillRect(1, -13, 2, 2);
      ctx.fillRect(0, -20, 1, 1);
      ctx.fillStyle = flash ? "#ffffff" : "#e4ef88";
      ctx.fillRect(-2, -15, 1, 1);
      ctx.globalAlpha = 1;
    }

    // Brute detail: hazard vest, hook.
    if (z.type === "brute") {
      ctx.fillStyle = flash ? "#f0e8cd" : "#ad6e2e";
      ctx.fillRect(-5, -22, 3, 9);
      ctx.fillRect(2, -21, 2, 8);
      ctx.fillStyle = flash ? "#f8f5e2" : "#d5c29a";
      ctx.fillRect(-5, -17, 8, 1);
      ctx.fillRect(-5, -20, 8, 1);
      // hook at the end of the front arm
      ctx.save();
      ctx.translate(12, -18);
      ctx.rotate(armBase - 0.2);
      ctx.fillStyle = flash ? "#d8dfd2" : "#68665a";
      ctx.fillRect(8, -1, 6, 2);
      ctx.fillStyle = flash ? "#e8ecdf" : "#8e7450";
      ctx.fillRect(13, -1, 2, 5);
      ctx.restore();
    }

    // Soft rim highlight, keeps the silhouette readable in the dark.
    ctx.globalAlpha = z.title ? 0.16 : 0.2;
    ctx.fillStyle = z.title ? "#28413f" : "#c3bda4";
    ctx.fillRect(-1, -29, 1, 6);
    ctx.fillRect(4, -22, 1, 4);
    ctx.globalAlpha = 1;

    ctx.restore();
  }

  function accentColor(flash, color) {
    return flash ? "#eef2e6" : color;
  }

  function drawZombieArm(sx, sy, angle, skin, shirt, flash, c) {
    ctx.save();
    ctx.translate(sx, sy);
    ctx.rotate(angle);
    // sleeve
    ctx.fillStyle = shirt;
    ctx.fillRect(0, -1.4, 7, 2.8);
    // forearm
    ctx.fillStyle = skin;
    ctx.fillRect(6, -1.1, 7, 2.2);
    // hand / claws
    ctx.fillStyle = skin;
    ctx.fillRect(12, -1.6, 2, 3);
    ctx.fillStyle = flash ? "#ffffff" : c.bone;
    ctx.fillRect(14, -1.5, 2, 1);
    ctx.fillRect(14, 0.5, 2, 1);
    ctx.globalAlpha = 0.5;
    ctx.fillStyle = flash ? "#ffffff" : c.blood;
    ctx.fillRect(7, 0.7, 4, 0.8);
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function drawZombieHealth(z) {
    if (z.dead || z.title) return;
    const pct = clamp(z.hp / z.maxHp, 0, 1);
    if (pct >= 0.999 && z.type !== "brute") return;
    const w = Math.max(11, z.width * 1.2);
    const x = z.x - w / 2;
    const y = z.y - z.height - 5;
    ctx.globalAlpha = 0.8;
    ctx.fillStyle = "rgba(4, 7, 8, 0.78)";
    ctx.fillRect(x, y, w, 2);
    ctx.fillStyle = z.type === "brute" ? "#b65b35" : "#a42c32";
    ctx.fillRect(x + 1, y, (w - 2) * pct, 1);
    ctx.globalAlpha = 1;
  }

  function drawScreamerFx(z) {
    if (z.dead) return;
    const mouthY = z.y - z.height * 0.74;
    const p = z.screamAnim > 0 ? z.screamAnim / 0.65 : 0;
    ctx.save();
    if (p > 0) {
      ctx.globalCompositeOperation = "lighter";
      ctx.imageSmoothingEnabled = true;
      drawGlowSprite("228,83,75", z.x, mouthY, 16 + p * 20, 0.35 + p * 0.3);
      ctx.globalAlpha = 0.55 + p * 0.35;
      ctx.strokeStyle = "#e37a6f";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(z.x, mouthY, 8 + (1 - p) * 28, 0, TAU);
      ctx.stroke();
    }
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = 0.75 + Math.sin(game.ambientTime * 7 + z.phase) * 0.2;
    ctx.fillStyle = "#df635a";
    ctx.fillRect(Math.round(z.x + z.dir * 1), Math.round(mouthY - 2), 2, 3);
    ctx.restore();
  }

  function drawBulwarkShield(z) {
    if (z.dead) return;
    const side = z.dir;
    const sx = z.x + side * z.width * 0.58;
    const top = z.y - z.height * 0.62;
    ctx.save();
    ctx.globalAlpha = 0.98;
    ctx.fillStyle = "#3d4640";
    ctx.fillRect(sx - 2, top - 6, 5, z.height * 0.72);
    ctx.fillStyle = "#6d7568";
    ctx.fillRect(sx - 2, top - 6, 1, z.height * 0.72);
    ctx.fillStyle = "#181c1a";
    ctx.fillRect(sx - 3, top - 7, 7, 2);
    ctx.fillRect(sx - 3, top + z.height * 0.63, 7, 2);
    ctx.fillStyle = "#b6473b";
    ctx.fillRect(sx - 1, top + z.height * 0.24, 2, z.height * 0.28);
    ctx.fillStyle = "#c9a06d";
    ctx.fillRect(sx - 3, top - 5, 1, 1);
    ctx.fillRect(sx - 3, top + z.height * 0.6, 1, 1);
    ctx.restore();
  }

  function drawRageAura(z) {
    if (z.dead || z.rageTime <= 0 || z.boss) return;
    ctx.save();
    ctx.globalAlpha = 0.18 + Math.sin(game.ambientTime * 10 + z.phase) * 0.08;
    ctx.fillStyle = "#d65048";
    ctx.fillRect(z.x - z.width * 0.55, z.y - z.height - 1, z.width * 1.1, 2);
    ctx.fillRect(z.x - 2, z.y - z.height - 4, 4, 2);
    ctx.restore();
  }

  function drawBossMarks(z) {
    if (!z.boss || z.dead) return;
    const color = z.bossColor || "#b64a38";
    ctx.save();
    if (z.bossStyle === "air") {
      ctx.globalAlpha = 0.7;
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(z.x, z.y - z.height * 0.66, 18, 4, 0, 0, TAU);
      ctx.stroke();
      ctx.fillStyle = "#ffd1a0";
      ctx.globalAlpha = 0.9;
      ctx.fillRect(Math.round(z.x - 5), Math.round(z.y - z.height * 0.58), 2, 2);
    } else {
      const top = z.y - z.height - 1;
      ctx.globalAlpha = 0.95;
      ctx.fillStyle = color;
      for (let i = -2; i <= 2; i++) {
        const h = 8 - Math.abs(i) * 2;
        const bx = z.x + i * 6;
        ctx.beginPath();
        ctx.moveTo(bx - 3, top);
        ctx.lineTo(bx, top - h);
        ctx.lineTo(bx + 3, top);
        ctx.closePath();
        ctx.fill();
      }
      ctx.fillStyle = "#f7d39a";
      ctx.globalAlpha = 0.9;
      ctx.fillRect(Math.round(z.x - 4), Math.round(top + 2), 2, 2);
      ctx.fillRect(Math.round(z.x + 3), Math.round(top + 2), 2, 2);
      if (z.bossStyle === "caster") {
        ctx.globalAlpha = 0.55;
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.ellipse(z.x, top - 16, 15, 4, 0, 0, TAU);
        ctx.stroke();
      }
    }
    ctx.restore();
  }

  function drawBossAura(z) {
    if (!z.boss || z.dead) return;
    const color = z.bossColor || "#b64a38";
    const pulse = 0.55 + Math.sin(game.ambientTime * 4.2) * 0.15;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.imageSmoothingEnabled = true;
    const ay = z.air ? z.y : GROUND_Y - 5;
    drawGlowSprite(hexRgb(color), z.x, ay, z.air ? 45 : 54, 0.18 + pulse * 0.08);
    ctx.globalAlpha = 0.55;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(z.x, ay, z.width * 0.72, z.width * 0.2, 0, 0, TAU);
    ctx.stroke();
    ctx.restore();

    if (z.bossAction === "chargeWind") {
      const t = clamp(1 - z.bossActionT / 0.72, 0, 1);
      ctx.save();
      ctx.globalAlpha = 0.32 + t * 0.35;
      ctx.fillStyle = "#d05b45";
      ctx.fillRect(z.x - 2, GROUND_Y - 46, 4, 44);
      ctx.globalAlpha = 0.2 + t * 0.4;
      ctx.fillRect(z.x - 12, GROUND_Y - 2, 24, 2);
      ctx.restore();
    } else if (z.bossAction === "slamWind") {
      const t = clamp(1 - z.bossActionT / 0.68, 0, 1);
      ctx.save();
      ctx.globalAlpha = 0.35 + t * 0.4;
      ctx.strokeStyle = "#e1895d";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(z.x, GROUND_Y, 22 + t * 70, 7 + t * 20, 0, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawZombies() {
    // corpses first, then the living
    for (const z of game.zombies) {
      if (z.dead) drawZombie(z, true);
    }
    for (const z of game.zombies) {
      if (!z.dead) {
        if (z.boss) drawBossAura(z);
        drawRageAura(z);
        drawZombie(z, false);
        if (z.boss) drawBossMarks(z);
        if (z.type === "screamer") drawScreamerFx(z);
        if (z.type === "bulwark") drawBulwarkShield(z);
      }
    }
    for (const z of game.zombies) {
      drawZombieHealth(z);
    }

    if (game.state === "title") {
      for (const t of titleZombies) {
        const z = {
          type: "walker",
          x: t.x,
          y: GROUND_Y,
          dir: -1,
          scale: t.scale,
          walk: game.ambientTime * 1.2 + t.phase,
          phase: t.phase,
          variant: t.variant,
          attackTimer: -1,
          attackTime: 0.5,
          lunge: 0,
          flash: 0,
          dead: false,
          title: true,
          width: 11 * t.scale,
          height: 29 * t.scale
        };
        drawZombie(z, false);
      }
    }
  }

  function drawPlayerBody(p, deadPose = false) {
    const moving =
      !deadPose &&
      game.state === "playing" &&
      (keys.has("KeyA") || keys.has("KeyD") || keys.has("ArrowLeft") || keys.has("ArrowRight"));
    const sprint =
      keys.has("ShiftLeft") || keys.has("ShiftRight");
    const step = moving ? Math.sin(p.walk) * (sprint ? 3.2 : 2.2) : Math.sin(p.breath * 1.8) * 0.18;
    const bob = deadPose ? 0 : moving ? Math.abs(Math.sin(p.walk)) * 0.7 : Math.sin(p.breath * 1.8) * 0.3;

    const airborne = !deadPose && p.y < GROUND_Y - 4;
    ctx.save();
    ctx.globalAlpha = deadPose ? 1 : p.invuln > 0 && Math.floor(game.time * 24) % 2 === 0 ? 0.66 : 1;
    ctx.translate(Math.round(p.x), Math.round(p.y));

    if (deadPose) {
      const pAng = p.deathAngle;
      ctx.translate(0, -1);
      ctx.rotate(pAng);
      ctx.translate(0, -2);
    } else {
      ctx.translate(0, -bob);
    }
    ctx.scale(p.facing, 1);

    // shadow is drawn separately
    // legs (tucked in the air)
    const legStep = airborne ? 1.2 : step;
    ctx.fillStyle = "#34352b";
    ctx.fillRect(-4 + legStep, airborne ? -8 : -10, 4, airborne ? 7 : 8);
    ctx.fillRect(1.5 - legStep, airborne ? -8 : -10, 4, airborne ? 7 : 8);
    ctx.fillStyle = "#111210";
    ctx.fillRect(-5 + legStep, airborne ? -2 : -3, 5, 3);
    ctx.fillRect(1.5 - legStep, airborne ? -2 : -3, 5, 3);
    ctx.fillStyle = "#6e6a50";
    ctx.fillRect(-4 + legStep, airborne ? -5 : -7, 3, 1);
    ctx.fillRect(2 - legStep, airborne ? -5 : -7, 3, 1);

    // backpack
    ctx.fillStyle = "#373b2e";
    ctx.fillRect(-8, -21, 4, 9);
    ctx.fillStyle = "#565a41";
    ctx.fillRect(-8, -21, 4, 1);
    ctx.fillStyle = "#a08c5a";
    ctx.fillRect(-7, -17, 1, 4);

    // coat
    ctx.fillStyle = "#3e4e43";
    ctx.fillRect(-5, -21, 10, 11);
    ctx.fillRect(-6, -11, 12, 4);
    ctx.fillStyle = "#526453";
    ctx.fillRect(-5, -21, 8, 2);
    ctx.fillStyle = "#222b25";
    ctx.fillRect(-6, -9, 12, 1);
    ctx.fillRect(-4, -7, 2, 2);
    ctx.fillRect(1, -8, 2, 3);
    // belt + pouches
    ctx.fillStyle = "#1b1e18";
    ctx.fillRect(-5, -12, 10, 2);
    ctx.fillStyle = "#8d7147";
    ctx.fillRect(-3, -12, 2, 2);
    ctx.fillRect(2, -12, 2, 2);

    // scarf
    ctx.fillStyle = "#983a35";
    ctx.fillRect(-4, -23, 8, 3);
    ctx.fillStyle = "#c34b42";
    ctx.fillRect(-3, -23, 6, 1);
    ctx.fillStyle = "#6f2c2c";
    ctx.fillRect(-5, -21, 2, 4);
    if (moving) {
      ctx.fillRect(-7 - Math.min(2, Math.abs(step)), -20 + Math.sin(p.walk) * 2, 2, 2);
    }

    // neck / head
    ctx.fillStyle = "#b9a17c";
    ctx.fillRect(-1, -26, 4, 3);
    ctx.fillStyle = "#c6ad86";
    ctx.fillRect(-3, -31, 7, 6);
    ctx.fillRect(-2, -33, 5, 2);
    // beanie / dark cap
    ctx.fillStyle = "#202620";
    ctx.fillRect(-4, -34, 8, 3);
    ctx.fillRect(-3, -36, 6, 2);
    ctx.fillStyle = "#3c493e";
    ctx.fillRect(-4, -34, 8, 1);
    // hair
    ctx.fillStyle = "#2c2921";
    ctx.fillRect(-3, -31, 2, 2);
    // eye
    ctx.fillStyle = "#eee3c7";
    ctx.fillRect(2, -29, 2, 1);
    ctx.fillStyle = "#2a231c";
    ctx.fillRect(3, -29, 1, 1);
    // stubble/dirt
    ctx.fillStyle = "rgba(45, 37, 28, 0.55)";
    ctx.fillRect(-2, -26, 4, 1);

    // shoulder patch
    ctx.fillStyle = "#8f7440";
    ctx.fillRect(2, -20, 2, 2);

    ctx.restore();
  }

  function drawPlayer() {
    const p = game.player;
    if (!p) return;
    const lift = GROUND_Y - p.y;
    if (!p.dead) {
      pixEllipse(
        p.x,
        GROUND_Y + 1,
        Math.max(3, 9 - lift * 0.045),
        2,
        "#040404",
        Math.max(0.14, 0.58 - lift * 0.0036)
      );
      if (p.dodge > 0) {
        ctx.globalAlpha = 0.18;
        ctx.fillStyle = "#a9bb83";
        ctx.fillRect(p.x - p.dodgeDir * 12 - 3, p.y - 26, 6, 26);
        ctx.globalAlpha = 1;
      }
    }

    if (p.jetting) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";
      const flame = 6 + Math.random() * 8;
      ctx.globalAlpha = 0.75;
      ctx.fillStyle = "#ffb15b";
      ctx.fillRect(p.x - 3, p.y + 1, 2, flame);
      ctx.fillRect(p.x + 2, p.y + 1, 2, flame * 0.8);
      ctx.fillStyle = "#fff1bc";
      ctx.fillRect(p.x - 2, p.y + 1, 1, flame * 0.5);
      ctx.fillRect(p.x + 2, p.y + 1, 1, flame * 0.45);
      ctx.globalAlpha = 0.22;
      ctx.fillStyle = "#ff8d3d";
      ctx.fillRect(p.x - 5, p.y, 11, 2);
      ctx.restore();
    }

    if (!p.dead && p.reload > 0) drawReloadRing(p);

    drawPlayerBody(p, p.dead);

    if (!p.dead) {
      drawPlayerGun(p);
      if (p.reload > 0) drawReloadGunFx(p);
      if (p.reloadFlash > 0) {
        const s = getShoulder(p);
        ctx.save();
        ctx.globalCompositeOperation = "lighter";
        ctx.imageSmoothingEnabled = true;
        drawGlowSprite(hexRgb(reloadStyleColor(p.weapons[p.weapon])), s.x, s.y, 32, p.reloadFlash * 0.7);
        ctx.restore();
      }
      drawMuzzleFlash(p);
      if (p.invuln > 0) {
        ctx.globalAlpha = 0.12 + Math.sin(game.time * 25) * 0.06;
        ctx.strokeStyle = "#b74545";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y - 16, 18, 0, TAU);
        ctx.stroke();
        ctx.globalAlpha = 1;
      }
    } else {
      // Pool of blood under the body.
      pixEllipse(p.x + p.facing * 5, GROUND_Y + 2, 18 + p.deathTime * 3, 3, "#5b1019", 0.4);
    }
  }

  function reloadStyleColor(w) {
    switch (w.reloadStyle) {
      case "shell":
        return "#e08a4d";
      case "belt":
        return "#ffd178";
      case "bolt":
        return "#d8c08b";
      case "cell":
        return "#7fd8d0";
      case "cyl":
        return "#ffbd6b";
      default:
        return "#f0c274";
    }
  }

  function drawReloadRing(p) {
    const prog = clamp(1 - p.reload / (p.reloadTotal || 1), 0, 1);
    const w = p.weapons[p.weapon];
    const color = reloadStyleColor(w);
    const cx = p.x;
    const cy = p.y - 17;
    const r = 24;
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.2;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, TAU);
    ctx.stroke();

    ctx.globalAlpha = 0.95;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, -Math.PI / 2, -Math.PI / 2 + TAU * prog);
    ctx.stroke();

    ctx.globalAlpha = 0.42;
    ctx.lineWidth = 1;
    const ticks = 12;
    for (let i = 0; i < ticks; i++) {
      const a = -Math.PI / 2 + (i / ticks) * TAU;
      const on = i / ticks <= prog;
      ctx.globalAlpha = on ? 0.9 : 0.18;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(a) * (r + 4), cy + Math.sin(a) * (r + 4));
      ctx.lineTo(cx + Math.cos(a) * (r + 7), cy + Math.sin(a) * (r + 7));
      ctx.stroke();
    }

    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 1;
    const spin = game.time * 2.4;
    for (let i = 0; i < 3; i++) {
      const a = spin + (i / 3) * TAU;
      ctx.beginPath();
      ctx.arc(cx, cy, r + 9, a, a + 0.5);
      ctx.stroke();
    }

    // A component orbits the ring while it is being worked into the gun.
    const orbit = -Math.PI / 2 + prog * TAU;
    const ox = cx + Math.cos(orbit) * (r + 14);
    const oy = cy + Math.sin(orbit) * (r + 14);
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = color;
    ctx.translate(ox, oy);
    ctx.rotate(orbit + Math.PI / 2);
    if (w.reloadStyle === "cell") {
      ctx.fillRect(-2, -4, 4, 8);
      ctx.fillStyle = "#e8fffc";
      ctx.fillRect(-1, -3, 2, 3);
    } else if (w.reloadStyle === "shell") {
      ctx.fillRect(-1.5, -3, 3, 6);
      ctx.fillStyle = "#f0c274";
      ctx.fillRect(-1.5, 2, 3, 1);
    } else if (w.reloadStyle === "belt") {
      ctx.fillRect(-4, -1, 8, 2);
      ctx.fillStyle = "#241d15";
      ctx.fillRect(-2, -1, 1, 2);
      ctx.fillRect(1, -1, 1, 2);
    } else {
      ctx.fillRect(-2, -4, 4, 7);
      ctx.fillStyle = "#f0c274";
      ctx.fillRect(-2, -4, 4, 1);
    }
    ctx.restore();
  }

  function drawReloadGunFx(p) {
    if (p.reload <= 0) return;
    const w = p.weapons[p.weapon];
    const prog = clamp(1 - p.reload / (p.reloadTotal || 1), 0, 1);
    const s = getShoulder(p);
    const pulse = Math.sin(prog * Math.PI);
    const style = w.reloadStyle || "mag";
    ctx.save();
    ctx.translate(s.x, s.y + pulse * 2.5);
    ctx.rotate(p.aim - pulse * 0.22);
    if (Math.cos(p.aim) < 0) ctx.scale(1, -1);
    const color = reloadStyleColor(w);
    if (style === "shell" || style === "cyl") {
      const pump = Math.sin(clamp((prog - 0.22) / 0.56, 0, 1) * Math.PI) * 4;
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = "#6b4b30";
      ctx.fillRect(9 + pump, 1, 6, 2);
      ctx.fillStyle = color;
      ctx.fillRect(10 + pump, 1, 4, 1);
      if (prog > 0.18 && prog < 0.8) {
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = "#c04a3d";
        const sy = -3 + Math.sin(prog * Math.PI * 3) * 2;
        ctx.fillRect(6, sy, 3, 1);
      }
    } else if (style === "belt") {
      ctx.globalAlpha = 0.85;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const x = 1 + i * 2.2;
        const y = 3 + Math.sin(prog * TAU + i * 0.8) * 1.5;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
      for (let i = 0; i < 6; i += 2) {
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.7;
        ctx.fillRect(1 + i * 2.2, 2.2, 1, 2);
      }
    } else {
      const shift = prog < 0.55 ? Math.sin(clamp((prog - 0.18) / 0.37, 0, 1) * Math.PI) * 4 : -Math.sin(clamp((prog - 0.55) / 0.25, 0, 1) * Math.PI) * 2;
      ctx.globalAlpha = 0.95;
      ctx.fillStyle = "#44382a";
      ctx.fillRect(4, 3 + shift, 3, 5);
      ctx.fillStyle = color;
      ctx.fillRect(4, 3 + shift, 3, 1);
      ctx.globalAlpha = 0.35;
      ctx.fillRect(3, 2 + shift, 5, 1);
    }
    ctx.restore();
  }

  function drawPlayerGun(p) {
    const s = getShoulder(p);
    const aim = p.aim;
    const w = p.weapons[p.weapon];
    const recoil = Math.min(3, p.recoil * 0.45);
    const reloadPulse = p.reload > 0 ? Math.sin(clamp(1 - p.reload / (p.reloadTotal || 1), 0, 1) * Math.PI) : 0;
    ctx.save();
    ctx.translate(s.x, s.y + reloadPulse * 2.5);
    ctx.rotate(aim - reloadPulse * 0.22);
    if (Math.cos(aim) < 0) ctx.scale(1, -1);
    ctx.translate(-recoil, 0);

    // support hand sleeve behind the grip
    ctx.fillStyle = "#202922";
    ctx.fillRect(-2, -2.5, 7, 5);
    ctx.fillStyle = "#34423a";
    ctx.fillRect(0, -2.5, 6, 1);
    ctx.fillStyle = "#b9a17c";
    ctx.fillRect(5, -2, 3, 4);

    if (w.id === "shotgun") {
      ctx.fillStyle = "#3f2a20";
      ctx.fillRect(4, -1.5, 7, 4);
      ctx.fillStyle = "#73513a";
      ctx.fillRect(4, -1.5, 7, 1);
      ctx.fillStyle = "#252b2a";
      ctx.fillRect(9, -2, 11, 3);
      ctx.fillStyle = "#59615a";
      ctx.fillRect(10, -2, 9, 1);
      ctx.fillStyle = "#1b1e1c";
      ctx.fillRect(19, -1.5, 2, 2);
      ctx.fillStyle = "#5c4431";
      ctx.fillRect(11, 0.5, 5, 2);
      ctx.fillStyle = "#9c7a4c";
      ctx.fillRect(16, 1, 1, 1);
    } else if (w.id === "smg") {
      ctx.fillStyle = "#2b3235";
      ctx.fillRect(5, -2.2, 12, 3.6);
      ctx.fillStyle = "#697477";
      ctx.fillRect(6, -2.2, 10, 1);
      ctx.fillStyle = "#171c1c";
      ctx.fillRect(7, 1, 4, 5);
      ctx.fillRect(13, 0.8, 2, 5);
      ctx.fillStyle = "#8a704b";
      ctx.fillRect(17, -1.5, 4, 2);
      ctx.fillStyle = "#b9a17c";
      ctx.fillRect(9, 1.5, 3, 2.5);
    } else if (w.id === "rifle") {
      ctx.fillStyle = "#3c3327";
      ctx.fillRect(3, -1.6, 8, 4);
      ctx.fillStyle = "#7e6b4c";
      ctx.fillRect(3, -1.6, 7, 1);
      ctx.fillStyle = "#242a28";
      ctx.fillRect(10, -2, 14, 3);
      ctx.fillStyle = "#7d877f";
      ctx.fillRect(11, -2, 12, 1);
      ctx.fillStyle = "#101413";
      ctx.fillRect(23, -1.7, 3, 1.6);
      ctx.fillRect(9, -5, 7, 2);
      ctx.fillStyle = "#56635d";
      ctx.fillRect(10, -5, 5, 1);
      ctx.fillStyle = "#191d1b";
      ctx.fillRect(14, 0.6, 4, 4);
      ctx.fillStyle = "#b9a17c";
      ctx.fillRect(15, 1.5, 3, 2.5);
    } else if (w.id === "autoshotgun") {
      ctx.fillStyle = "#3b3f36";
      ctx.fillRect(4, -2.5, 15, 4.5);
      ctx.fillStyle = "#727a6a";
      ctx.fillRect(5, -2.5, 13, 1);
      ctx.fillStyle = "#1b1e19";
      ctx.fillRect(8, 1.4, 4, 6);
      ctx.fillRect(14, 1.4, 4, 6);
      ctx.fillStyle = "#a88952";
      ctx.fillRect(18, -1.8, 5, 2.5);
      ctx.fillStyle = "#b9a17c";
      ctx.fillRect(10, 1.6, 3, 2.5);
    } else if (w.id === "minigun") {
      ctx.fillStyle = "#2c322e";
      ctx.fillRect(4, -3.1, 20, 5.6);
      ctx.fillStyle = "#667067";
      ctx.fillRect(5, -3.1, 18, 1);
      ctx.fillStyle = "#171b18";
      ctx.fillRect(7, 2.2, 10, 4);
      ctx.fillStyle = "#a9864e";
      ctx.fillRect(8, 2.2, 8, 1);
      ctx.fillStyle = "#151a17";
      ctx.fillRect(23, -2.4, 5, 1);
      ctx.fillRect(23, -0.2, 6, 1);
      ctx.fillRect(23, 1.8, 5, 1);
      ctx.fillStyle = "#818a7b";
      const barrelGlow = Math.floor(w.spin * 3);
      for (let i = 0; i < 3; i++) {
        ctx.fillRect(23 + ((i + barrelGlow) % 3), -2.6 + i * 1.9, 6, 1);
      }
      ctx.fillStyle = "#c39b5a";
      ctx.fillRect(19, -1.8, 2, 1);
    } else if (w.id === "launcher") {
      ctx.fillStyle = "#3b402e";
      ctx.fillRect(4, -3.6, 17, 6.4);
      ctx.fillStyle = "#68704f";
      ctx.fillRect(5, -3.6, 15, 1);
      ctx.fillStyle = "#1b1e16";
      ctx.fillRect(6, 2.8, 5, 6);
      ctx.fillRect(14, 2.8, 4, 5);
      ctx.fillStyle = "#7a5f37";
      ctx.fillRect(9, 1, 7, 2);
      ctx.fillStyle = "#252a20";
      ctx.fillRect(20, -3.2, 7, 5.6);
      ctx.fillStyle = "#5f684c";
      ctx.fillRect(21, -3.2, 5, 1);
      ctx.fillStyle = "#c69a58";
      ctx.fillRect(11, -4.3, 3, 1);
      ctx.fillStyle = "#9b3d2d";
      ctx.fillRect(18, -1.5, 3, 2);
    } else if (w.id === "railgun") {
      ctx.fillStyle = "#293a3c";
      ctx.fillRect(2, -2.6, 20, 4.6);
      ctx.fillStyle = "#5d8383";
      ctx.fillRect(3, -2.6, 17, 1);
      ctx.fillStyle = "#131d1e";
      ctx.fillRect(9, 1.5, 8, 4);
      ctx.fillStyle = "#2b4e51";
      ctx.fillRect(6, -1.5, 4, 4);
      ctx.fillStyle = "#8fe3dd";
      ctx.fillRect(7, -1, 1, 3);
      ctx.fillRect(11, -1.5, 1, 4);
      ctx.fillRect(15, -1.5, 1, 4);
      ctx.fillStyle = "#c8f8f2";
      ctx.globalAlpha = 0.55 + Math.sin(game.time * 8) * 0.2;
      ctx.fillRect(18, -1.6, 2, 3);
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#1a2425";
      ctx.fillRect(21, -2.2, 10, 2);
      ctx.fillRect(21, 0.4, 8, 1);
      ctx.fillStyle = "#79c9c5";
      ctx.fillRect(24, -1.8, 5, 1);
    } else {
      ctx.fillStyle = "#2d3230";
      ctx.fillRect(6, -2, 11, 3.5);
      ctx.fillStyle = "#6d7167";
      ctx.fillRect(7, -2, 9, 1);
      ctx.fillStyle = "#1a1c1b";
      ctx.fillRect(8, 0.5, 5, 4);
      ctx.fillStyle = "#b9a17c";
      ctx.fillRect(8, 1.5, 3, 2.5);
      ctx.fillStyle = "#c8b078";
      ctx.fillRect(16, -1.6, 2, 2.2);
      ctx.fillStyle = "#0f1110";
      ctx.fillRect(17, -1.2, 1, 1);
    }
    ctx.restore();
  }

  function drawMuzzleFlash(p) {
    if (p.muzzleTimer <= 0) return;
    const w = p.weapons[p.weapon];
    const m = getMuzzle(p);
    const a = p.aim;
    const life = clamp(p.muzzleTimer / (w.spinUp ? 0.032 : 0.055), 0, 1);
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.translate(m.x, m.y);
    ctx.rotate(a + (Math.random() - 0.5) * 0.2);
    ctx.globalAlpha = life;
    ctx.fillStyle = "#fff4ca";
    ctx.fillRect(-1, -1, 7, 2);
    ctx.fillRect(0, -3, 3, 1);
    ctx.fillRect(0, 2, 3, 1);
    ctx.fillStyle = "#ffc35d";
    ctx.fillRect(-2, -5, 3, 2);
    ctx.fillRect(-2, 4, 3, 2);
    ctx.fillRect(1, -7, 3, 1);
    ctx.fillRect(1, 6, 3, 1);
    ctx.restore();

    // smoke curl at the muzzle
    ctx.globalAlpha = life * 0.12;
    ctx.fillStyle = "#d9d2bb";
    ctx.fillRect(m.x - Math.cos(a) * 8, m.y - Math.sin(a) * 8 - 4, 4, 3);
    ctx.globalAlpha = 1;
  }

  function drawBullets() {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.imageSmoothingEnabled = true;
    for (const b of game.bullets) {
      const camX = game.camera.x;
      if (b.x < camX - 40 || b.x > camX + W + 40) continue;
      if (b.explosive) {
        drawGlowSprite("255,157,72", b.x, b.y, 12, 0.55);
        ctx.globalAlpha = 0.9;
        ctx.fillStyle = "#3e4430";
        ctx.fillRect(Math.round(b.x) - 2, Math.round(b.y) - 2, 4, 4);
        ctx.fillStyle = "#ffcf83";
        ctx.fillRect(Math.round(b.x) - 1, Math.round(b.y) - 1, 2, 2);
        ctx.globalAlpha = 0.3;
        ctx.strokeStyle = "#e29a58";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(b.px, b.py);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        continue;
      }
      if (b.rail) {
        drawGlowSprite("155,235,242", b.x, b.y, 18, 0.45);
        ctx.strokeStyle = "#dcfbff";
        ctx.globalAlpha = 0.95;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(b.px, b.py);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        ctx.strokeStyle = b.tracer;
        ctx.globalAlpha = 0.35;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(b.px, b.py);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        ctx.globalAlpha = 0.55;
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(Math.round(b.x) - 1, Math.round(b.y) - 1, 3, 3);
        continue;
      }
      ctx.strokeStyle = b.tracer;
      ctx.globalAlpha = 0.78;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(b.px, b.py);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.globalAlpha = 0.3;
      ctx.fillStyle = b.tracer;
      ctx.fillRect(b.x - 1, b.y - 1, 3, 2);
    }
    ctx.restore();
  }

  function drawGrenades() {
    for (const g of game.grenades) {
      const blink = Math.sin(g.spin * 2.4) > 0;
      ctx.save();
      ctx.translate(Math.round(g.x), Math.round(g.y));
      ctx.rotate(g.spin);
      ctx.fillStyle = "#37402d";
      ctx.fillRect(-3, -3, 6, 6);
      ctx.fillStyle = "#6e7a4d";
      ctx.fillRect(-3, -3, 6, 1);
      ctx.fillStyle = blink ? "#ffb15b" : "#95302d";
      ctx.fillRect(-1, -1, 2, 2);
      ctx.fillStyle = "#20261c";
      ctx.fillRect(-1, -5, 2, 2);
      ctx.restore();
      ctx.globalAlpha = 0.4;
      ctx.fillStyle = "#c4a260";
      ctx.fillRect(g.x - 1, g.y + 2, 3, 1);
      ctx.globalAlpha = 1;
    }
  }

  function drawEnemyShots() {
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.imageSmoothingEnabled = true;
    for (const s of game.enemyShots) {
      const camX = game.camera.x;
      if (s.x < camX - 30 || s.x > camX + W + 30) continue;
      drawGlowSprite("199,238,112", s.x, s.y, 14, 0.55);
      ctx.globalAlpha = 0.9;
      ctx.fillStyle = "#bce66a";
      ctx.fillRect(Math.round(s.x - 1), Math.round(s.y - 1) + Math.sin(s.wobble) * 0.6, 3, 3);
      ctx.fillStyle = "#7da845";
      ctx.fillRect(Math.round(s.x - 3), Math.round(s.y + 1), 2, 1);
      ctx.fillRect(Math.round(s.x + 1), Math.round(s.y + 2), 2, 1);
      ctx.globalAlpha = 1;
    }
    ctx.restore();
  }

  function drawParticles() {
    const left = game.camera.x - 24;
    const right = game.camera.x + W + 24;
    for (const p of game.particles) {
      if (p.x < left || p.x > right) continue;
      const life = clamp(p.life / p.maxLife, 0, 1);
      if (p.kind === "blood" || p.kind === "bone") {
        ctx.globalAlpha = Math.min(1, life * 1.8);
        ctx.fillStyle = p.color;
        const s = Math.max(1, Math.round(p.size));
        ctx.fillRect(Math.round(p.x), Math.round(p.y), s, p.kind === "bone" ? 1 : s);
      } else if (p.kind === "mist") {
        ctx.globalAlpha = life * 0.14;
        ctx.fillStyle = p.color;
        ctx.fillRect(Math.round(p.x - p.size / 2), Math.round(p.y - p.size / 4), Math.round(p.size), Math.round(p.size * 0.5));
      } else if (p.kind === "smoke") {
        ctx.globalAlpha = life * 0.16;
        ctx.fillStyle = p.color;
        const s = p.size * (1.5 - life * 0.5);
        ctx.fillRect(Math.round(p.x - s), Math.round(p.y - s), Math.round(s * 2), Math.round(s * 1.4));
      } else if (p.kind === "dust") {
        ctx.globalAlpha = life * 0.32;
        ctx.fillStyle = p.color;
        const s = Math.max(1, Math.round(p.size));
        ctx.fillRect(Math.round(p.x), Math.round(p.y), s, s);
      } else if (p.kind === "feather") {
        ctx.globalAlpha = life * 0.75;
        ctx.fillStyle = p.color;
        ctx.fillRect(Math.round(p.x), Math.round(p.y), 2, 1);
      } else if (p.kind === "casing") {
        ctx.globalAlpha = Math.min(1, life * 1.5);
        ctx.fillStyle = p.color;
        ctx.fillRect(Math.round(p.x), Math.round(p.y), Math.max(1, Math.round(p.size)) + 1, 1);
      } else if (p.kind === "mag") {
        ctx.save();
        ctx.globalAlpha = Math.min(1, life * 1.7);
        ctx.translate(Math.round(p.x), Math.round(p.y));
        ctx.rotate((1 - life) * 8 + (p.x % 2));
        ctx.fillStyle = p.color;
        ctx.fillRect(-2, -3, 4, 6);
        ctx.fillStyle = "#8d7147";
        ctx.fillRect(-2, -3, 4, 1);
        ctx.restore();
      } else if (p.kind === "ring") {
        const t = 1 - life;
        const r = lerp(p.r0 || 2, p.r1 || 20, t);
        ctx.globalAlpha = life * 0.72;
        ctx.strokeStyle = p.color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, r, 0, TAU);
        ctx.stroke();
      } else if (p.kind === "ghost") {
        ctx.globalAlpha = life * 0.13;
        ctx.fillStyle = "#a9bb83";
        ctx.fillRect(Math.round(p.x - 3), Math.round(p.y - 25), 6, 25);
      }
    }

    // Additive pass: no save/restore per particle.
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    for (const p of game.particles) {
      if (p.x < left || p.x > right) continue;
      const life = clamp(p.life / p.maxLife, 0, 1);
      if (p.kind === "spark" || p.kind === "fire" || p.kind === "ember") {
        ctx.globalAlpha = life;
        ctx.fillStyle = p.color;
        const s = Math.max(1, Math.round(p.size));
        ctx.fillRect(Math.round(p.x), Math.round(p.y), s, s);
        ctx.globalAlpha = life * 0.28;
        ctx.fillRect(Math.round(p.x - s), Math.round(p.y - s), s * 3, s * 3);
      } else if (p.kind === "acid") {
        ctx.globalAlpha = life;
        ctx.fillStyle = p.color;
        const s = Math.max(1, Math.round(p.size));
        ctx.fillRect(Math.round(p.x), Math.round(p.y), s, s);
        ctx.globalAlpha = life * 0.2;
        ctx.fillRect(Math.round(p.x - s), Math.round(p.y - s), s * 3, s * 3);
      } else if (p.kind === "flash") {
        ctx.globalAlpha = life;
        ctx.fillStyle = p.color;
        const s = p.size;
        ctx.fillRect(Math.round(p.x - s / 2), Math.round(p.y), Math.round(s), 1);
        ctx.fillRect(Math.round(p.x), Math.round(p.y - s / 2), 1, Math.round(s));
        ctx.fillRect(Math.round(p.x - 1), Math.round(p.y - 1), 3, 3);
        ctx.globalAlpha = life * 0.22;
        ctx.fillRect(Math.round(p.x - s), Math.round(p.y - s), Math.round(s * 2), Math.round(s * 2));
      }
    }
    ctx.restore();
    ctx.globalAlpha = 1;
  }

  function drawPopups() {
    for (const p of game.popups) {
      const a = clamp(p.life / p.maxLife * 1.8, 0, 1);
      const scale = Math.max(1, Math.round(p.scale));
      ctx.globalAlpha = a * 0.75;
      drawText(p.text, p.x - 1, p.y, "#040505", scale, "center");
      drawText(p.text, p.x + 1, p.y + 1, "#040505", scale, "center");
      ctx.globalAlpha = a;
      drawText(p.text, p.x, p.y, p.color, scale, "center");
    }
    ctx.globalAlpha = 1;
  }

  function drawForegroundFog() {
    const t = game.ambientTime;
    ctx.save();
    ctx.globalCompositeOperation = "screen";
    ctx.imageSmoothingEnabled = true;
    for (let i = 0; i < 4; i++) {
      const x = ((t * (5 + i * 2.4) + i * 120) % (W + 200)) - 100;
      const y = 232 + i * 8;
      drawGlowSprite("94,113,111", x, y, 90 + i * 20, 0.035);
    }
    ctx.restore();
  }

  function drawLighting(camX) {
    const p = game.player;
    const t = game.ambientTime;
    const phase = PHASES[game.phaseIndex] || PHASES[0];
    const lampPower = phase.lamp;
    const flashPower = phase.flashlight;

    // Base darkness.
    const dark = ctx.createLinearGradient(0, 0, 0, H);
    dark.addColorStop(0, "rgba(2, 5, 10, " + phase.ambientDark[0] + ")");
    dark.addColorStop(0.48, "rgba(2, 5, 10, " + phase.ambientDark[1] + ")");
    dark.addColorStop(1, "rgba(0, 2, 4, " + phase.ambientDark[2] + ")");
    ctx.fillStyle = dark;
    ctx.fillRect(0, 0, W, H);

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.imageSmoothingEnabled = true;

    // Lamp pools.
    if (lampPower > 0.02) {
      for (const lamp of lamps) {
        const sx = lamp.x - camX;
        if (sx < -100 || sx > W + 100) continue;
        const sy = GROUND_Y - lamp.height + 7;
        const rad = 88 + (lamp.broken ? Math.sin(t * 8 + lamp.phase) * 9 : 0);
        drawGlowSprite("244,191,112", sx, sy, rad, 0.27 * lamp.flick * lampPower);

        // Narrow downward glow on the dock.
        const floor = ctx.createLinearGradient(sx, sy, sx, GROUND_Y);
        floor.addColorStop(0, "rgba(226, 166, 91, " + (0.085 * lamp.flick * lampPower).toFixed(3) + ")");
        floor.addColorStop(1, "rgba(226, 166, 91, 0)");
        ctx.fillStyle = floor;
        ctx.beginPath();
        ctx.moveTo(sx - 3, sy);
        ctx.lineTo(sx + 3, sy);
        ctx.lineTo(sx + 58, GROUND_Y);
        ctx.lineTo(sx - 58, GROUND_Y);
        ctx.closePath();
        ctx.fill();
      }
    }

    // Player flashlight and body heat.
    if (p && !p.dead && (game.state === "playing" || game.state === "paused" || game.state === "dying")) {
      const s = getShoulder(p);
      const sx = s.x - camX;
      const sy = s.y - game.shakeY;
      const aim = p.aim;
      const reach = 174;
      const spread = 0.19;
      const beam = ctx.createLinearGradient(sx, sy, sx + Math.cos(aim) * reach, sy + Math.sin(aim) * reach);
      beam.addColorStop(0, "rgba(255, 235, 176, " + (0.32 * flashPower).toFixed(3) + ")");
      beam.addColorStop(0.35, "rgba(247, 220, 157, " + (0.17 * flashPower).toFixed(3) + ")");
      beam.addColorStop(0.8, "rgba(211, 198, 151, " + (0.055 * flashPower).toFixed(3) + ")");
      beam.addColorStop(1, "rgba(211, 198, 151, 0)");
      ctx.fillStyle = beam;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + Math.cos(aim - spread) * reach, sy + Math.sin(aim - spread) * reach);
      ctx.lineTo(sx + Math.cos(aim + spread) * reach, sy + Math.sin(aim + spread) * reach);
      ctx.closePath();
      ctx.fill();

      const core = ctx.createLinearGradient(sx, sy, sx + Math.cos(aim) * 82, sy + Math.sin(aim) * 82);
      core.addColorStop(0, "rgba(255, 245, 208, " + (0.2 * flashPower).toFixed(3) + ")");
      core.addColorStop(1, "rgba(255, 236, 177, 0)");
      ctx.fillStyle = core;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + Math.cos(aim - 0.06) * 90, sy + Math.sin(aim - 0.06) * 90);
      ctx.lineTo(sx + Math.cos(aim + 0.06) * 90, sy + Math.sin(aim + 0.06) * 90);
      ctx.closePath();
      ctx.fill();

      const bodyY = p.y - 16;
      drawGlowSprite("220,189,128", p.x - camX, bodyY, 54, 0.17 * Math.max(0.35, flashPower));

      if (p.jetting) {
        drawGlowSprite("255,166,84", p.x - camX, p.y - 5, 48, 0.32);
      }

      if (p.muzzleLight > 0) {
        const m = getMuzzle(p);
        const mr = 92 * clamp(p.muzzleLight / 0.075, 0, 1);
        drawGlowSprite("255,225,150", m.x - camX, m.y, mr, 0.3);
      }
    }

    // Burrow warnings glow through the dock.
    for (const w of game.burrowWarnings) {
      if (w.spawned) continue;
      const sx = w.x - camX;
      if (sx < -50 || sx > W + 50) continue;
      const pulse = 0.6 + Math.sin(game.ambientTime * 10 + w.phase) * 0.3;
      drawGlowSprite("240,120,60", sx, GROUND_Y - 2, 56, 0.18 + pulse * 0.16);
    }

    // Explosions and temporary lights.
    for (const l of game.lights) {
      const life = clamp(l.life / l.maxLife, 0, 1);
      const sx = l.x - camX;
      const sy = l.y - game.shakeY;
      if (sx < -l.r || sx > W + l.r) continue;
      drawGlowSprite(hexRgb(l.color), sx, sy, l.r, 0.42 * life);
    }

    // Pickup aura.
    for (const item of game.pickups) {
      const sx = item.x - camX;
      if (sx < -20 || sx > W + 20) continue;
      const weaponDef = item.type === "weapon" ? WEAPON_DEFS[item.weaponId] : null;
      const color = item.type === "medkit" ? "159,197,143" : weaponDef ? "232,179,105" : "217,189,117";
      drawGlowSprite(color, sx, item.y - 4, 18, 0.16);
    }
    ctx.globalAlpha = 1;

    // Muzzle glow reflected in the wet dock.
    if (p && !p.dead && p.muzzleLight > 0) {
      const m = getMuzzle(p);
      ctx.globalAlpha = clamp(p.muzzleLight / 0.075, 0, 1) * 0.4;
      const rg = ctx.createLinearGradient(m.x - camX, GROUND_Y, m.x - camX, GROUND_Y + 23);
      rg.addColorStop(0, "rgba(255, 196, 99, 0.14)");
      rg.addColorStop(1, "rgba(255, 160, 70, 0)");
      ctx.fillStyle = rg;
      ctx.fillRect(m.x - camX - 22, GROUND_Y, 44, 24);
      ctx.globalAlpha = 1;
    }

    ctx.restore();

    // A cold colour grade and a soft red edge when hurt.
    if (game.redFlash > 0) {
      const r = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.8);
      r.addColorStop(0, "rgba(120, 12, 18, 0)");
      r.addColorStop(1, "rgba(137, 14, 22, " + Math.min(0.7, game.redFlash).toFixed(3) + ")");
      ctx.fillStyle = r;
      ctx.fillRect(0, 0, W, H);
    }
  }

  function drawRain() {
    const phase = PHASES[game.phaseIndex] || PHASES[0];
    ctx.save();
    ctx.strokeStyle = "rgba(" + phase.rainColor + ", " + phase.rainAlpha + ")";
    ctx.lineWidth = 0.6;
    ctx.globalAlpha = 0.22;
    ctx.beginPath();
    for (const r of rain) {
      ctx.moveTo(Math.round(r.x), Math.round(r.y));
      ctx.lineTo(Math.round(r.x - 1), Math.round(r.y - r.len));
    }
    ctx.stroke();
    ctx.globalAlpha = phase.id === "day" ? 0.16 : 0.1;
    ctx.fillStyle = "#b8c7c5";
    for (let i = 0; i < rain.length; i += 9) {
      const r = rain[i];
      if (r.y > 206) {
        ctx.fillRect(Math.round(r.x) - 2, GROUND_Y - 1, 2, 1);
        ctx.fillRect(Math.round(r.x) + 2, GROUND_Y - 2, 1, 1);
      }
    }
    ctx.restore();
  }

  function drawWeather() {
    drawRain();
  }

  function drawScreenFlashes() {
    if (game.whiteFlash > 0) {
      ctx.fillStyle = "rgba(255, 241, 206, " + Math.min(0.7, game.whiteFlash).toFixed(3) + ")";
      ctx.fillRect(0, 0, W, H);
    }
    if (game.lightning > 0.12) {
      ctx.fillStyle = "rgba(177, 203, 208, " + (game.lightning * 0.16).toFixed(3) + ")";
      ctx.fillRect(0, 0, W, H);
    }

    // Subtle cold frame.
    const phase = PHASES[game.phaseIndex] || PHASES[0];
    const edge = ctx.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, H * 0.84);
    edge.addColorStop(0, "rgba(0,0,0,0)");
    edge.addColorStop(0.74, "rgba(0,3,6," + (phase.vignette * 0.24).toFixed(3) + ")");
    edge.addColorStop(1, "rgba(0,2,4," + phase.vignette.toFixed(3) + ")");
    ctx.fillStyle = edge;
    ctx.fillRect(0, 0, W, H);
  }

  function findZombieUnderCursor() {
    const wx = mouse.x + game.camera.x;
    const wy = mouse.y + game.shakeY;
    for (const z of game.zombies) {
      if (z.dead) continue;
      if (
        wx > z.x - z.width * 0.6 &&
        wx < z.x + z.width * 0.6 &&
        wy > z.y - z.height - 2 &&
        wy < z.y + 2
      ) {
        return z;
      }
    }
    return null;
  }

  function drawCrosshair() {
    if (game.state !== "playing" || !game.player || game.player.dead) return;
    const p = game.player;
    const w = p.weapons[p.weapon];
    const target = findZombieUnderCursor();
    const empty = w.mag <= 0;
    const spread = 3.8 + game.reticleKick + (mouse.down ? 1.4 : 0);
    const cx = Math.round(mouse.x);
    const cy = Math.round(mouse.y);
    const hit = game.hitMarker > 0;
    const color = hit ? (game.hitMarkerHead ? "#ffd48a" : "#ffffff") : empty ? "#c23a41" : target ? "#e7b36d" : "rgba(226, 221, 201, 0.88)";

    ctx.save();
    if (hit) {
      const k = clamp(game.hitMarker / 0.2, 0, 1);
      const d = 5 + (1 - k) * 3;
      ctx.globalAlpha = 0.95 * k;
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(cx - d, cy - d);
      ctx.lineTo(cx - d + 3, cy - d + 3);
      ctx.moveTo(cx + d, cy - d);
      ctx.lineTo(cx + d - 3, cy - d + 3);
      ctx.moveTo(cx - d, cy + d);
      ctx.lineTo(cx - d + 3, cy + d - 3);
      ctx.moveTo(cx + d, cy + d);
      ctx.lineTo(cx + d - 3, cy + d - 3);
      ctx.stroke();
    }

    ctx.globalAlpha = 0.95;
    ctx.fillStyle = color;
    ctx.fillRect(cx, cy, 1, 1);
    const tick = 3;
    ctx.fillRect(cx - Math.round(spread) - tick, cy, tick, 1);
    ctx.fillRect(cx + Math.round(spread), cy, tick, 1);
    ctx.fillRect(cx, cy - Math.round(spread) - tick, 1, tick);
    ctx.fillRect(cx, cy + Math.round(spread), 1, tick);

    if (target) {
      const sx = target.x - game.camera.x;
      const sy = target.y - target.height - 2 - game.shakeY;
      const hw = target.width * 0.66;
      ctx.globalAlpha = 0.55;
      ctx.strokeStyle = "#e7b36d";
      ctx.lineWidth = 1;
      const corner = 4;
      const top = sy;
      const bottom = target.y + 2 - game.shakeY;
      for (const side of [-1, 1]) {
        const xx = sx + side * hw;
        ctx.beginPath();
        ctx.moveTo(xx, top + corner);
        ctx.lineTo(xx, top);
        ctx.lineTo(xx - side * corner, top);
        ctx.moveTo(xx, bottom - corner);
        ctx.lineTo(xx, bottom);
        ctx.lineTo(xx - side * corner, bottom);
        ctx.stroke();
      }
    }

    if (p.reload > 0) {
      ctx.globalAlpha = 0.55;
      ctx.strokeStyle = "#e2b269";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.arc(cx, cy, 10, -Math.PI / 2, -Math.PI / 2 + TAU * (1 - p.reload / p.reloadTotal));
      ctx.stroke();
      drawText("RELOAD", cx, cy + 18, "#cbbd9f", 1, "center", 0.66);
    } else if (empty) {
      drawText("R", cx, cy + 16, "#c23a41", 1, "center", 0.6);
    }
    ctx.restore();
  }

  function drawThreatIndicators() {
    if (game.state !== "playing" || !game.player || game.player.dead) return;
    let left = 0;
    let right = 0;
    let leftNear = 0;
    let rightNear = 0;
    for (const z of game.zombies) {
      if (z.dead) continue;
      const sx = z.x - game.camera.x;
      if (sx < -8) {
        left++;
        leftNear = Math.max(leftNear, 1 - Math.min(1, Math.abs(sx) / 260));
      } else if (sx > W + 8) {
        right++;
        rightNear = Math.max(rightNear, 1 - Math.min(1, (sx - W) / 260));
      }
    }
    const pulse = 0.56 + Math.sin(game.ambientTime * 4.5) * 0.18;
    ctx.save();
    if (left > 0) {
      ctx.globalAlpha = 0.3 + leftNear * 0.34;
      const g = ctx.createLinearGradient(0, 0, 32, 0);
      g.addColorStop(0, "rgba(132, 17, 24, 0.32)");
      g.addColorStop(1, "rgba(132, 17, 24, 0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 50, 38, H - 100);
      ctx.globalAlpha = pulse;
      ctx.fillStyle = "#d6353e";
      const y = GROUND_Y - 50;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(10 + i * 5, y + 8);
        ctx.lineTo(15 + i * 5, y);
        ctx.lineTo(20 + i * 5, y + 8);
        ctx.closePath();
        ctx.fill();
      }
      drawText(String(left), 20, y + 13, "#d9d3bd", 1, "center");
    }
    if (right > 0) {
      ctx.globalAlpha = 0.3 + rightNear * 0.34;
      const g = ctx.createLinearGradient(W, 0, W - 32, 0);
      g.addColorStop(0, "rgba(132, 17, 24, 0.32)");
      g.addColorStop(1, "rgba(132, 17, 24, 0)");
      ctx.fillStyle = g;
      ctx.fillRect(W - 38, 50, 38, H - 100);
      ctx.globalAlpha = pulse;
      ctx.fillStyle = "#d6353e";
      const y = GROUND_Y - 50;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.moveTo(W - 10 - i * 5, y + 8);
        ctx.lineTo(W - 15 - i * 5, y);
        ctx.lineTo(W - 20 - i * 5, y + 8);
        ctx.closePath();
        ctx.fill();
      }
      drawText(String(right), W - 20, y + 13, "#d9d3bd", 1, "center");
    }
    ctx.restore();
  }

  function drawTitleAtmosphere() {
    // A weak red glow beyond the quarantine line.
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const g = ctx.createRadialGradient(420, 190, 0, 420, 190, 95);
    g.addColorStop(0, "rgba(116, 26, 28, 0.06)");
    g.addColorStop(1, "rgba(116, 26, 28, 0)");
    ctx.fillStyle = g;
    ctx.fillRect(320, 95, 200, 190);
    ctx.restore();
  }

  function render() {
    const camX = Math.round(game.camera.x + game.shakeX + game.camKickX);
    const camY = Math.round(game.shakeY);

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, H);
    drawSky();
    drawFarHarbor(game.camera.x);
    drawWater(game.camera.x);
    drawMidContainers(game.camera.x);
    drawShipLights(game.camera.x);
    drawFogBand();
    const phase = PHASES[game.phaseIndex] || PHASES[0];
    if (phase.bgTint) {
      ctx.save();
      ctx.globalCompositeOperation = "screen";
      ctx.fillStyle = phase.bgTint;
      ctx.fillRect(0, 0, W, GROUND_Y);
      ctx.restore();
    }

    ctx.save();
    ctx.translate(-camX, -camY);
    drawDock(camX);
    drawProps(camX);
    drawDecals();
    drawBurrowWarnings();
    drawBarrels(camX);
    drawPickups(camX);
    drawZombies();
    drawEnemyShots();
    drawGrenades();
    drawPlayer();
    drawBullets();
    drawArcs();
    drawParticles();
    drawPopups();
    ctx.restore();

    drawForegroundFog();
    drawLighting(camX);
    if (phase.grade) {
      ctx.fillStyle = phase.grade;
      ctx.fillRect(0, 0, W, H);
    }
    drawWeather();
    drawScreenFlashes();
    drawThreatIndicators();
    drawCrosshair();
    if (game.state === "title") drawTitleAtmosphere();
  }


  /* --------------------------------------------------------------------- */
  /* boot                                                                  */
  /* --------------------------------------------------------------------- */

  function boot() {
    resetRun();
    game.state = "title";
    game.titleHigh = game.best;
    dom.titleHighScore.textContent = pad(game.best, 6);
    dom.titleBestWave.textContent = pad(game.bestWave);
    game.camera.x = 1120;
    game.last = performance.now();
    dom.startBtn.addEventListener("click", () => {
      if (game.state === "title") startRun();
    });
    dom.howBtn.addEventListener("click", () => setOverlay(dom.help, false));
    dom.helpCloseBtn.addEventListener("click", () => setOverlay(dom.help, true));
    dom.resumeBtn.addEventListener("click", resumeGame);
    dom.restartBtn.addEventListener("click", restartRun);
    dom.againBtn.addEventListener("click", restartRun);
    dom.upgradeRerollBtn.addEventListener("click", rerollUpgrades);
    dom.pauseBtn.addEventListener("click", () => {
      if (game.state === "playing") pauseGame();
      else if (game.state === "paused") resumeGame();
    });
    setOverlay(dom.help, true);
    setOverlay(dom.pause, true);
    setOverlay(dom.upgrade, true);
    setOverlay(dom.gameover, true);
    requestAnimationFrame(tick);
  }

  boot();
})();
