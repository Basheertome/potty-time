// Froggy Timer - toddler step-by-step checklist

const HANDWASH_AUDIO_SRC = "audio/handwash-song.mp3";
const WIPE_FX_SRC = "audio/wipe-fx.mp3";
const FLUSH_FX_SRC = "audio/flush-fx.mp3";
const POTTY_WAIT_AUDIO_SRC = "audio/potty-wait.mp3";
const WAITING_MUSIC_TARGET_VOLUME = 0.6;
const WAITING_MUSIC_FADE_MS = 2500;

const COMPLETE_VOICE_SRC = "audio/voice-complete.mp3";
const GOODJOB_FX_SRC = "audio/goodjob-fx.mp3";

// Icons are Google's open-source Noto Emoji SVGs (the Android/Google
// emoji style) rather than the platform's native emoji font, so they
// render identically on iOS, Android, and desktop instead of iOS
// showing Apple's emoji artwork.
const STEPS = [
  {
    id: "potty",
    title: "Time for Potty!",
    icon: "images/emoji/toilet.svg",
    waitingMusic: true,
    voice: "audio/voice-potty.mp3",
  },
  {
    id: "wipe",
    title: "Let's Wipe",
    icon: "images/emoji/roll-of-paper.svg",
    sound: "wipe",
    voice: "audio/voice-wipe.mp3",
  },
  {
    id: "pantsup",
    title: "Pull up your pants!",
    icon: "images/emoji/briefs.svg",
    voice: "audio/voice-pantsup.mp3",
  },
  {
    id: "flush",
    title: "Time to Flush!",
    icon: "images/emoji/cyclone.svg",
    sound: "flush",
    voice: "audio/voice-flush.mp3",
  },
  {
    id: "washhands",
    title: "Wash Hands",
    icon: "images/emoji/bubbles.svg",
    isSong: true,
    voice: "audio/voice-washhands.mp3",
  },
];

const state = {
  started: false,
  stepIndex: 0,
  finished: false,
};

const app = document.getElementById("app");
const canvas = document.getElementById("canvas");

const FROG_ANIM_MIN_DELAY_MS = 3000;
const FROG_ANIM_MAX_DELAY_MS = 10000;
const FROG_STILL_SRC = "images/frog-still.png";
const FROG_BLINK_SRC = "images/frog-blink-strip.png";
const FROG_RIBBIT_SRC = "images/frog-ribbit-strip.png";
const FROG_BLINK_FRAME_COUNT = 48;
const FROG_BLINK_DURATION_MS = 2000;
const FROG_RIBBIT_FRAME_COUNT = 32;
const FROG_RIBBIT_DURATION_MS = 4000;

// Decode the blink/ribbit strips up front. Without this, the first
// (and sometimes a later) switch from the still image to one of these
// leaves the frog blank for a frame while the browser fetches and
// decodes a background-image it's never displayed before.
function preloadImage(src) {
  const img = new Image();
  img.src = src;
  if (img.decode) {
    img.decode().catch(() => {});
  }
}
preloadImage(FROG_BLINK_SRC);
preloadImage(FROG_RIBBIT_SRC);

// Builds a .step-emoji wrapper around an <img> icon instead of a text
// node holding a literal emoji character, so classList.add() from the
// bounce/bubble-bob animations keeps working unchanged on the wrapper.
function createStepIcon(src) {
  const wrap = document.createElement("div");
  wrap.className = "step-emoji";
  const img = document.createElement("img");
  img.src = src;
  img.alt = "";
  wrap.appendChild(img);
  return wrap;
}

// Sets a pond-button's label as a wrapped span rather than plain
// textContent, so the horizontal letter-stretch (.pond-button > span in
// style.css) applies only to the text and not to the button's own box
// (which also carries the pond-button background image).
function setButtonLabel(button, text) {
  const label = document.createElement("span");
  label.textContent = text;
  button.appendChild(label);
}

let frogEl = null;
let frogAnimating = false;

// Creates the frog overlay (the background art has the frog cut out so
// it can blink/ribbit on its own). On step screens it's also an
// invisible "go back a step" tap target, matching where the frog used
// to be baked into the art; on the Start/All Done screens it's purely
// decorative and lets clicks pass through to their own handlers.
function createFrogOverlay({ clickable }) {
  const el = document.createElement(clickable ? "button" : "div");
  el.className = "frog-overlay";
  if (clickable) {
    el.setAttribute("aria-label", "Go back a step");
    el.addEventListener("click", (event) => {
      event.stopPropagation();
      goToPreviousStep();
    });
  }
  canvas.appendChild(el);
  frogEl = el;
  frogAnimating = false;
  return el;
}

// Steps through a sprite strip by hand, computing pixel-exact frame
// offsets from the element's own rendered size rather than relying on
// a CSS steps() animation over a percentage background-position: at
// non-integer scale factors that leaves faint bleed from the
// neighboring frame at the edges, which is glaring on a strip like the
// ribbit's where adjacent frames differ a lot.
function playFrogSprite(el, src, frameCount, durationMs, onDone) {
  const rect = el.getBoundingClientRect();
  const frameW = Math.round(rect.width);
  const frameH = Math.round(rect.height);
  el.style.backgroundImage = `url("${src}")`;
  el.style.backgroundSize = `${frameW * frameCount}px ${frameH}px`;
  el.style.backgroundPosition = "0px 0px";

  const start = performance.now();
  function step(now) {
    if (!canvas.contains(el)) return; // torn down by a render() mid-animation
    const elapsed = now - start;
    const frame = Math.min(frameCount - 1, Math.floor((elapsed / durationMs) * frameCount));
    el.style.backgroundPosition = `-${frame * frameW}px 0px`;
    if (elapsed < durationMs) {
      requestAnimationFrame(step);
    } else {
      onDone();
    }
  }
  requestAnimationFrame(step);
}

function playFrogAnimation() {
  if (!frogEl || !canvas.contains(frogEl) || frogAnimating) return;
  frogAnimating = true;
  const el = frogEl;
  const isRibbit = Math.random() < 0.5;
  const src = isRibbit ? FROG_RIBBIT_SRC : FROG_BLINK_SRC;
  const frameCount = isRibbit ? FROG_RIBBIT_FRAME_COUNT : FROG_BLINK_FRAME_COUNT;
  const duration = isRibbit ? FROG_RIBBIT_DURATION_MS : FROG_BLINK_DURATION_MS;
  playFrogSprite(el, src, frameCount, duration, () => {
    if (canvas.contains(el)) {
      el.style.backgroundImage = `url("${FROG_STILL_SRC}")`;
      el.style.backgroundSize = "100% 100%";
      el.style.backgroundPosition = "0px 0px";
    }
    frogAnimating = false;
  });
}

function scheduleNextFrogAnimation() {
  const delay = FROG_ANIM_MIN_DELAY_MS + Math.random() * (FROG_ANIM_MAX_DELAY_MS - FROG_ANIM_MIN_DELAY_MS);
  setTimeout(() => {
    playFrogAnimation();
    scheduleNextFrogAnimation();
  }, delay);
}

function playChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [523.25, 659.25, 783.99];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.0001, ctx.currentTime + i * 0.12);
      gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + i * 0.12 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + i * 0.12 + 0.3);
      osc.connect(gain).connect(ctx.destination);
      osc.start(ctx.currentTime + i * 0.12);
      osc.stop(ctx.currentTime + i * 0.12 + 0.32);
    });
    setTimeout(() => ctx.close(), 700);
  } catch (e) {
    // Web Audio unsupported; silently skip
  }
}

function playClip(src) {
  try {
    const audio = new Audio(src);
    audio.play().catch(() => {});
  } catch (e) {
    // Audio unsupported; silently skip
  }
}

function playStepSound(step) {
  if (step.sound === "wipe") {
    playClip(WIPE_FX_SRC);
  } else if (step.sound === "flush") {
    playClip(FLUSH_FX_SRC);
  } else {
    playChime();
  }
}

let waitingMusicAudio = null;
let waitingMusicActive = false;
let waitingMusicFadeIntervalId = null;
let waitingMusicUnlockAttached = false;
let pottyVoicePlayed = false;

function stopWaitingMusic() {
  waitingMusicActive = false;
  pottyVoicePlayed = false;
  if (waitingMusicFadeIntervalId) {
    clearInterval(waitingMusicFadeIntervalId);
    waitingMusicFadeIntervalId = null;
  }
  if (waitingMusicAudio) {
    waitingMusicAudio.pause();
    waitingMusicAudio.currentTime = 0;
  }
}

function startWaitingMusic() {
  const step = STEPS[state.stepIndex];
  if (!step || !step.waitingMusic) return;
  if (waitingMusicActive) return;
  waitingMusicActive = true;

  if (!waitingMusicAudio) {
    waitingMusicAudio = new Audio(POTTY_WAIT_AUDIO_SRC);
    waitingMusicAudio.loop = true;
  }
  const audio = waitingMusicAudio;
  audio.volume = 0;

  audio
    .play()
    .then(() => {
      const steps = 30;
      const stepMs = WAITING_MUSIC_FADE_MS / steps;
      let i = 0;
      if (waitingMusicFadeIntervalId) clearInterval(waitingMusicFadeIntervalId);
      waitingMusicFadeIntervalId = setInterval(() => {
        i += 1;
        audio.volume = Math.min(WAITING_MUSIC_TARGET_VOLUME, (i / steps) * WAITING_MUSIC_TARGET_VOLUME);
        if (i >= steps) {
          clearInterval(waitingMusicFadeIntervalId);
          waitingMusicFadeIntervalId = null;
        }
      }, stepMs);
    })
    .catch(() => {
      waitingMusicActive = false;
    });
}

function startPottyWaitingSequence() {
  const step = STEPS[state.stepIndex];
  if (!step || !step.waitingMusic) return;
  if (waitingMusicActive) return; // music already running
  if (pottyVoicePlayed) return; // voice already in flight; its "ended" handler starts the music
  pottyVoicePlayed = true;

  if (step.voice) {
    const voice = new Audio(step.voice);
    voice.addEventListener("ended", startWaitingMusic);
    voice.play().catch(startWaitingMusic);
  } else {
    startWaitingMusic();
  }
}

function ensureWaitingMusicUnlock() {
  if (waitingMusicUnlockAttached) return;
  waitingMusicUnlockAttached = true;
  document.addEventListener("pointerdown", () => startPottyWaitingSequence(), { once: true });
}

function render() {
  canvas.innerHTML = "";
  stopWashSession();
  if (!state.started) {
    renderStart();
    return;
  }
  if (state.finished) {
    renderComplete();
    return;
  }
  const step = STEPS[state.stepIndex];

  if (step.waitingMusic) {
    startPottyWaitingSequence();
    ensureWaitingMusicUnlock();
  } else {
    stopWaitingMusic();
    if (step.voice && !step.isSong) {
      playClip(step.voice);
    }
  }

  createFrogOverlay({ clickable: true });

  const card = document.createElement("div");
  card.className = "step-card has-button";

  const emoji = createStepIcon(step.icon);
  card.appendChild(emoji);

  if (step.isSong) {
    canvas.appendChild(card);

    const reflection = document.createElement("div");
    reflection.className = "pond-reflection";
    canvas.appendChild(reflection);

    const button = document.createElement("div");
    button.className = "pond-button static";
    const line1 = document.createElement("div");
    line1.textContent = "Wash";
    const line2 = document.createElement("div");
    line2.textContent = "your hands!";
    button.appendChild(line1);
    button.appendChild(line2);
    canvas.appendChild(button);

    const track = document.createElement("div");
    track.className = "song-progress-track";
    const fill = document.createElement("div");
    fill.className = "song-progress-fill";
    fill.id = "song-progress-fill";
    track.appendChild(fill);
    canvas.appendChild(track);

    emoji.classList.add("bubble-bob");
    runHandWashSong(step, emoji, card, button, reflection);
    return;
  }

  canvas.appendChild(card);

  const reflection = document.createElement("div");
  reflection.className = "pond-reflection";
  reflection.id = "pond-reflection";
  canvas.appendChild(reflection);

  const button = document.createElement("button");
  button.className = "pond-button";
  setButtonLabel(button, step.title);
  button.id = "action-button";
  button.addEventListener("click", () => handleStepComplete(step, emoji, card, button, reflection));
  canvas.appendChild(button);
}

function renderStart() {
  createFrogOverlay({ clickable: false });

  const card = document.createElement("div");
  card.className = "step-card has-button";

  const emoji = createStepIcon("images/emoji/frog.svg");

  const title = document.createElement("h1");
  title.className = "step-title";
  title.textContent = "Froggy Timer";
  card.appendChild(title);

  const instruction = document.createElement("p");
  instruction.className = "step-instruction";
  instruction.textContent = "Let's get started!";
  card.appendChild(instruction);

  // The icon goes last, below both lines of text. The text is what
  // needs a clean background to stay legible, so it takes the highest,
  // clearest part of the sky; the icon is opaque artwork and doesn't
  // care what it sits in front of.
  card.appendChild(emoji);

  canvas.appendChild(card);

  const reflection = document.createElement("div");
  reflection.className = "pond-reflection";
  canvas.appendChild(reflection);

  const button = document.createElement("button");
  button.className = "pond-button";
  setButtonLabel(button, "Start");
  button.id = "action-button";
  button.addEventListener("click", () => {
    button.disabled = true;
    emoji.classList.add("bounce");
    button.classList.add("bobble");
    reflection.classList.add("ripple");
    playChime();
    // Kick off the voice-then-music sequence synchronously within this
    // click so the browser counts it as a user gesture and doesn't
    // block autoplay.
    state.started = true;
    startPottyWaitingSequence();
    setTimeout(() => render(), 1600);
  });
  canvas.appendChild(button);
}

function handleStepComplete(step, emojiEl, card, button, reflection) {
  stopWaitingMusic();
  button.disabled = true;

  emojiEl.classList.add("bounce");
  button.classList.add("bobble");
  reflection.classList.add("ripple");
  playStepSound(step);
  showYay(card);

  setTimeout(() => goToNextStep(), 1600);
}

function showYay(card) {
  const yay = document.createElement("div");
  yay.className = "yay-pop";
  const text = document.createElement("span");
  text.className = "yay-pop-text";
  text.textContent = "Yay!";
  yay.appendChild(text);
  const star = document.createElement("img");
  star.className = "yay-star";
  star.src = "images/emoji/star.svg";
  star.alt = "";
  yay.appendChild(star);
  card.appendChild(yay);
  setTimeout(() => yay.remove(), 1400);
}

const BUBBLE_SPAWN_INTERVAL_MS = 450;
const MAX_ACTIVE_BUBBLES = 16;
const BUBBLE_MIN_LIFETIME_MS = 3500;
const BUBBLE_MAX_LIFETIME_MS = 7500;

function spawnWashBubble() {
  const wrap = document.createElement("div");
  wrap.className = "wash-bubble-wrap";

  // Scattered across most of the vertical space so bubbles read as a
  // loose floating cloud rather than a solid pile of suds.
  const top = 10 + Math.random() * 76;
  wrap.style.top = `${top}%`;

  const size = (1.6 + Math.random() * 2.2) * 1.8;
  wrap.style.width = `${size}rem`;
  wrap.style.height = `${size}rem`;

  // Center-based horizontal placement (offset by half the bubble's own
  // size) so bubbles near the edges still bleed past x=0%/100% instead
  // of leaving a gap between their edge and the screen edge.
  const centerPercent = Math.random() * 100;
  wrap.style.left = `calc(${centerPercent}% - ${size / 2}rem)`;

  wrap.style.setProperty("--drift-x", `${(Math.random() - 0.5) * 18}px`);
  wrap.style.setProperty("--drift-y", `${-6 - Math.random() * 12}px`);
  wrap.style.setProperty("--float-dur", `${2.4 + Math.random() * 2}s`);
  wrap.style.animationDelay = `${Math.random() * -3}s`;

  const img = document.createElement("img");
  img.className = "wash-bubble";
  img.src = "images/bubble.png";
  wrap.appendChild(img);

  canvas.appendChild(wrap);
  return wrap;
}

function popWashBubble(wrap) {
  const img = wrap.querySelector(".wash-bubble");
  if (img) img.classList.add("pop");
  setTimeout(() => wrap.remove(), 320);
}

function popAllWashBubbles(entries) {
  const spread = 900;
  entries.forEach((entry, i) => {
    const delay = (i / Math.max(entries.length, 1)) * spread + Math.random() * 60;
    setTimeout(() => popWashBubble(entry.wrap), delay);
  });
}

let activeWashSession = null;

function stopWashSession() {
  if (!activeWashSession) return;
  const session = activeWashSession;
  activeWashSession = null;
  session.audio.pause();
  if (session.spawnIntervalId) clearInterval(session.spawnIntervalId);
  session.bubbles.forEach((entry) => {
    clearTimeout(entry.timeoutId);
    entry.wrap.remove();
  });
}

function runHandWashSong(step, emojiEl, card, staticButton, reflection) {
  const fill = document.getElementById("song-progress-fill");
  const audio = new Audio(HANDWASH_AUDIO_SRC);
  const session = { audio, spawnIntervalId: null, bubbles: [] };
  activeWashSession = session;
  clearButterflies();

  audio.addEventListener("timeupdate", () => {
    if (audio.duration) {
      fill.style.width = `${(audio.currentTime / audio.duration) * 100}%`;
    }
  });

  const spawnLoopBubble = () => {
    if (session.bubbles.length >= MAX_ACTIVE_BUBBLES) return;
    const wrap = spawnWashBubble();
    const entry = { wrap, timeoutId: null };
    const lifetime = BUBBLE_MIN_LIFETIME_MS + Math.random() * (BUBBLE_MAX_LIFETIME_MS - BUBBLE_MIN_LIFETIME_MS);
    entry.timeoutId = setTimeout(() => {
      const idx = session.bubbles.indexOf(entry);
      if (idx !== -1) session.bubbles.splice(idx, 1);
      popWashBubble(wrap);
    }, lifetime);
    session.bubbles.push(entry);
  };

  const finish = () => {
    if (session.spawnIntervalId) {
      clearInterval(session.spawnIntervalId);
      session.spawnIntervalId = null;
    }
    session.bubbles.forEach((entry) => clearTimeout(entry.timeoutId));
    popAllWashBubbles(session.bubbles.splice(0));
    activeWashSession = null;
    setTimeout(() => {
      emojiEl.classList.remove("bubble-bob");
      const button = document.createElement("button");
      button.className = "pond-button";
      setButtonLabel(button, "All Clean!");
      button.id = "action-button";
      staticButton.replaceWith(button);
      button.addEventListener("click", () => handleStepComplete(step, emojiEl, card, button, reflection));
    }, 1800);
  };

  audio.addEventListener("ended", finish);

  const startSong = () => {
    audio
      .play()
      .then(() => {
        spawnLoopBubble();
        session.spawnIntervalId = setInterval(spawnLoopBubble, BUBBLE_SPAWN_INTERVAL_MS);
      })
      .catch(() => {
        // Autoplay blocked; move on after a reasonable fallback delay.
        setTimeout(finish, 20000);
      });
  };

  if (step.voice) {
    const voice = new Audio(step.voice);
    voice.addEventListener("ended", startSong);
    voice.play().catch(startSong);
  } else {
    startSong();
  }
}

function goToNextStep() {
  if (state.stepIndex < STEPS.length - 1) {
    state.stepIndex += 1;
    render();
  } else {
    state.finished = true;
    render();
  }
}

function goToPreviousStep() {
  if (state.stepIndex > 0) {
    state.stepIndex -= 1;
    render();
  } else {
    state.started = false;
    render();
  }
}

function renderComplete() {
  spawnConfetti();
  createFrogOverlay({ clickable: false });

  const card = document.createElement("div");
  card.className = "complete-card";

  const emoji = createStepIcon("images/emoji/party-popper.svg");
  emoji.classList.add("bounce");
  card.appendChild(emoji);

  const title = document.createElement("h1");
  title.className = "step-title";
  title.textContent = "All Done!";
  card.appendChild(title);

  const instruction = document.createElement("p");
  instruction.className = "step-instruction";
  instruction.textContent = "You did it!";
  card.appendChild(instruction);

  canvas.appendChild(card);

  const fx = new Audio(GOODJOB_FX_SRC);
  fx.addEventListener("ended", () => playClip(COMPLETE_VOICE_SRC));
  fx.play().catch(() => playClip(COMPLETE_VOICE_SRC));

  app.addEventListener(
    "click",
    () => {
      state.started = false;
      state.finished = false;
      state.stepIndex = 0;
      // Back at the start screen is a safe moment to swallow a pending
      // app update, if one arrived while the routine was running.
      if (applyPendingUpdate()) return;
      render();
    },
    { once: true }
  );
}

const CONFETTI_ICONS = [
  "images/emoji/star.svg",
  "images/emoji/party-popper.svg",
  "images/emoji/confetti-ball.svg",
  "images/emoji/rainbow.svg",
  "images/emoji/sparkles.svg",
];

function spawnConfetti() {
  for (let i = 0; i < 60; i++) {
    const el = document.createElement("img");
    el.className = "confetti";
    el.src = CONFETTI_ICONS[Math.floor(Math.random() * CONFETTI_ICONS.length)];
    el.alt = "";
    el.style.left = `${Math.random() * 100}%`;
    el.style.animationDuration = `${3.5 + Math.random() * 3}s`;
    el.style.animationDelay = `${Math.random() * 1.8}s`;
    app.appendChild(el);
    setTimeout(() => el.remove(), 8500);
  }
}

const BUTTERFLY_MIN_DELAY_MS = 2000;
const BUTTERFLY_MAX_DELAY_MS = 12000;
const MAX_BUTTERFLIES = 2;
const BUTTERFLY_MIN_FLIGHT_S = 6;
const BUTTERFLY_MAX_FLIGHT_S = 9;
const BUTTERFLY_FLAP_FRAME_COUNT = 16;
const BUTTERFLY_FLAP_DURATION_MS = 800;
// Vertical bands (top %) that stay clear of the title/instruction/button
// text on every screen, so a fluttering butterfly never crosses text.
const BUTTERFLY_SAFE_LANES = [
  { min: 4, max: 12 },
  { min: 83, max: 92 },
];

const activeButterflies = [];

function clearButterflies() {
  activeButterflies.forEach((el) => el.remove());
  activeButterflies.length = 0;
}

// Steps through the flap strip by hand (see playFrogSprite for why:
// pixel-exact background-position instead of a CSS steps() animation
// over a percentage, which bleeds in the neighboring frame at this
// element's non-integer scale factor). Runs for as long as the
// butterfly stays in #app; el.flapRate lets the click-to-speed-up
// handler speed this up in lockstep with the flight.
function startButterflyFlap(el) {
  const rect = el.getBoundingClientRect();
  const frameW = Math.round(rect.width);
  const frameH = Math.round(rect.height);
  el.style.backgroundSize = `${frameW * BUTTERFLY_FLAP_FRAME_COUNT}px ${frameH}px`;
  el.flapRate = 1;
  let phase = 0;
  let lastTime = performance.now();
  function step(now) {
    if (!app.contains(el)) return;
    const dt = now - lastTime;
    lastTime = now;
    phase = (phase + (dt / BUTTERFLY_FLAP_DURATION_MS) * el.flapRate) % 1;
    const frame = Math.floor(phase * BUTTERFLY_FLAP_FRAME_COUNT);
    el.style.backgroundPosition = `-${frame * frameW}px 0px`;
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function spawnButterfly() {
  if (activeButterflies.length >= MAX_BUTTERFLIES) return;
  if (activeWashSession) return; // don't appear while the hand-wash song is playing

  const el = document.createElement("div");
  el.className = "butterfly flying";

  const lane = BUTTERFLY_SAFE_LANES[Math.floor(Math.random() * BUTTERFLY_SAFE_LANES.length)];
  el.style.top = `${lane.min + Math.random() * (lane.max - lane.min)}%`;

  const duration = BUTTERFLY_MIN_FLIGHT_S + Math.random() * (BUTTERFLY_MAX_FLIGHT_S - BUTTERFLY_MIN_FLIGHT_S);
  el.style.setProperty("--fly-duration", `${duration}s`);

  const fromLeft = Math.random() < 0.5;
  if (fromLeft) {
    el.style.left = "-15dvw";
    el.style.setProperty("--fly-distance", "130dvw");
    el.style.setProperty("--fly-flip", "-1");
  } else {
    el.style.left = "115dvw";
    el.style.setProperty("--fly-distance", "-130dvw");
    el.style.setProperty("--fly-flip", "1");
  }

  el.addEventListener("animationend", (event) => {
    if (event.animationName !== "butterfly-fly") return;
    el.remove();
    const idx = activeButterflies.indexOf(el);
    if (idx !== -1) activeButterflies.splice(idx, 1);
  });

  el.addEventListener("click", (event) => {
    event.stopPropagation();
    if (el.dataset.sped) return;
    el.dataset.sped = "1";
    el.flapRate = 2;
    el.getAnimations().forEach((anim) => {
      anim.playbackRate = 2;
    });
  });

  app.appendChild(el);
  activeButterflies.push(el);
  startButterflyFlap(el);
}

function scheduleNextButterfly() {
  const delay = BUTTERFLY_MIN_DELAY_MS + Math.random() * (BUTTERFLY_MAX_DELAY_MS - BUTTERFLY_MIN_DELAY_MS);
  setTimeout(() => {
    spawnButterfly();
    scheduleNextButterfly();
  }, delay);
}

let wakeLock = null;

async function requestWakeLock() {
  if (!("wakeLock" in navigator)) return;
  try {
    wakeLock = await navigator.wakeLock.request("screen");
    wakeLock.addEventListener("release", () => {
      wakeLock = null;
    });
  } catch (e) {
    // Wake Lock unsupported or denied; the screen may dim/lock normally.
  }
}

// The Wake Lock is released automatically whenever the tab/app is hidden
// (backgrounded, screen locked, etc.), so re-request it every time it
// becomes visible again to keep the screen awake while actively in use.
document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") {
    requestWakeLock();
    remeasureViewport();
    checkForUpdate();
    applyPendingUpdate();
  }
});

// Best-effort: only actually locks in a fullscreen/installed context on
// platforms that support the Screen Orientation API (notably not iOS
// Safari). The manifest's orientation:"portrait" covers installed
// Android PWAs; elsewhere the layout is simply built to stay usable in
// landscape (see #canvas in style.css).
if (screen.orientation && screen.orientation.lock) {
  screen.orientation.lock("portrait").catch(() => {});
}

/* ---- Viewport measurement ----------------------------------------- */

// Publishes the real viewport size to CSS as --vw/--vh. Everything in
// the stylesheet sizes off these instead of vh/dvh units, because on
// iOS - especially an installed, standalone PWA - the viewport a
// stylesheet sees can still be the *previous* orientation's for a
// while after a rotation. That's what left the artwork short of the
// bottom of the screen, showing a band of flat page background, after
// going to landscape and back.
function setViewportSize() {
  const vv = window.visualViewport;
  const width = Math.round(vv ? vv.width : window.innerWidth);
  const height = Math.round(vv ? vv.height : window.innerHeight);
  if (!width || !height) return;

  const root = document.documentElement;
  root.style.setProperty("--vw", `${width}px`);
  root.style.setProperty("--vh", `${height}px`);
  // Orientation comes from the same measurement rather than from a CSS
  // media query, so the two can never disagree about which way round
  // the screen is - see the note above the rules in style.css.
  root.dataset.orientation = width > height ? "landscape" : "portrait";

  // A rotation can also leave the page scrolled down even though the
  // body can't normally scroll, which is the other half of what the
  // gap at the bottom looked like.
  if (window.scrollY !== 0 || window.scrollX !== 0) window.scrollTo(0, 0);
}

// iOS reports the pre-rotation size synchronously inside the resize and
// orientationchange events, so one measurement is never enough - take
// it again over the next few hundred milliseconds and let the last
// (correct) one win. Cheap: it only writes two custom properties.
let remeasureTimers = [];
function remeasureViewport() {
  remeasureTimers.forEach(clearTimeout);
  setViewportSize();
  requestAnimationFrame(setViewportSize);
  remeasureTimers = [80, 200, 400, 700].map((ms) =>
    setTimeout(setViewportSize, ms)
  );
}

setViewportSize();
window.addEventListener("resize", remeasureViewport);
window.addEventListener("orientationchange", remeasureViewport);
// Fires when the app is restored from the back/forward cache, which on
// iOS is how a backgrounded home-screen PWA often comes back.
window.addEventListener("pageshow", remeasureViewport);
if (window.visualViewport) {
  window.visualViewport.addEventListener("resize", setViewportSize);
}

/* ---- Service worker registration and updates ---------------------- */

let swRegistration = null;
let updateWaiting = false;

function checkForUpdate() {
  if (swRegistration) swRegistration.update().catch(() => {});
}

// A new version only takes effect on reload, but reloading out from
// under a toddler mid-routine would dump them back on the start screen
// and cut the audio. So hold the reload until they're not in the middle
// of anything - which in practice means the next time the app is opened.
// Returns true when it is reloading, so callers can skip work that the
// reload is about to throw away.
function applyPendingUpdate() {
  if (!updateWaiting) return false;
  if (state.started && !state.finished) return false;
  window.location.reload();
  return true;
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      // updateViaCache:"none" stops the browser serving sw.js itself
      // out of the HTTP cache. Without it a new worker can go unnoticed
      // for up to 24h, and none of the cache busting below ever runs.
      .register("./sw.js", { updateViaCache: "none" })
      .then((registration) => {
        swRegistration = registration;
      })
      .catch(() => {});

    // An installed PWA can sit resident for days without a navigation,
    // so poll on a slow timer as well as on every foreground.
    setInterval(checkForUpdate, 60 * 60 * 1000);
  });

  // Fires once the replacement worker has taken control. Guarded on
  // there having been a previous controller, otherwise this would also
  // fire on the very first install (via clients.claim) and reload a
  // page that is already perfectly up to date.
  const hadController = !!navigator.serviceWorker.controller;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (!hadController || updateWaiting) return;
    updateWaiting = true;
    applyPendingUpdate();
  });
}

requestWakeLock();
scheduleNextButterfly();
scheduleNextFrogAnimation();
render();
