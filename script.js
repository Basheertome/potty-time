// Froggy Timer - toddler step-by-step checklist

const HANDWASH_AUDIO_SRC = "audio/handwash-song.mp3";
const WIPE_FX_SRC = "audio/wipe-fx.mp3";
const FLUSH_FX_SRC = "audio/flush-fx.mp3";
const POTTY_WAIT_AUDIO_SRC = "audio/potty-wait.mp3";
const WAITING_MUSIC_TARGET_VOLUME = 0.6;
const WAITING_MUSIC_FADE_MS = 2500;

const COMPLETE_VOICE_SRC = "audio/voice-complete.mp3";
const GOODJOB_FX_SRC = "audio/goodjob-fx.mp3";

const STEPS = [
  {
    id: "potty",
    title: "Time for Potty!",
    emoji: "\u{1F6BD}",
    waitingMusic: true,
    voice: "audio/voice-potty.mp3",
  },
  {
    id: "wipe",
    title: "Let's Wipe",
    emoji: "\u{1F9FB}",
    sound: "wipe",
    voice: "audio/voice-wipe.mp3",
  },
  {
    id: "pantsup",
    title: "Pull up your pants!",
    emoji: "\u{1FA72}",
    voice: "audio/voice-pantsup.mp3",
  },
  {
    id: "flush",
    title: "Time to Flush!",
    emoji: "\u{1F300}",
    sound: "flush",
    voice: "audio/voice-flush.mp3",
  },
  {
    id: "washhands",
    title: "Wash Hands",
    emoji: "\u{1FAE7}",
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

function stopWaitingMusic() {
  waitingMusicActive = false;
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

function ensureWaitingMusicUnlock() {
  if (waitingMusicUnlockAttached) return;
  waitingMusicUnlockAttached = true;
  document.addEventListener("pointerdown", () => startWaitingMusic(), { once: true });
}

function render() {
  canvas.innerHTML = "";
  if (!state.started) {
    renderStart();
    return;
  }
  if (state.finished) {
    renderComplete();
    return;
  }
  const step = STEPS[state.stepIndex];

  if (step.voice) {
    playClip(step.voice);
  }

  if (step.waitingMusic) {
    startWaitingMusic();
    ensureWaitingMusicUnlock();
  } else {
    stopWaitingMusic();
  }

  const card = document.createElement("div");
  card.className = "step-card has-button";

  const emoji = document.createElement("div");
  emoji.className = "step-emoji";
  emoji.textContent = step.emoji;
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
  button.textContent = step.title;
  button.id = "action-button";
  button.addEventListener("click", () => handleStepComplete(step, emoji, card, button, reflection));
  canvas.appendChild(button);
}

function renderStart() {
  const card = document.createElement("div");
  card.className = "step-card has-button";

  const emoji = document.createElement("div");
  emoji.className = "step-emoji";
  emoji.textContent = "\u{1F438}";
  card.appendChild(emoji);

  const title = document.createElement("h1");
  title.className = "step-title";
  title.textContent = "Froggy Timer";
  card.appendChild(title);

  const instruction = document.createElement("p");
  instruction.className = "step-instruction";
  instruction.textContent = "Let's get started!";
  card.appendChild(instruction);

  canvas.appendChild(card);

  const reflection = document.createElement("div");
  reflection.className = "pond-reflection";
  canvas.appendChild(reflection);

  const button = document.createElement("button");
  button.className = "pond-button";
  button.textContent = "Start";
  button.id = "action-button";
  button.addEventListener("click", () => {
    button.disabled = true;
    emoji.classList.add("bounce");
    button.classList.add("bobble");
    reflection.classList.add("ripple");
    playChime();
    // Start the waiting music synchronously within this click so the
    // browser counts it as a user gesture and doesn't block autoplay.
    state.started = true;
    startWaitingMusic();
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
  yay.textContent = "Yay! ⭐";
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

function runHandWashSong(step, emojiEl, card, staticButton, reflection) {
  const fill = document.getElementById("song-progress-fill");
  const audio = new Audio(HANDWASH_AUDIO_SRC);
  const bubbles = []; // active { wrap, timeoutId } entries
  let spawnIntervalId = null;

  audio.addEventListener("timeupdate", () => {
    if (audio.duration) {
      fill.style.width = `${(audio.currentTime / audio.duration) * 100}%`;
    }
  });

  const spawnLoopBubble = () => {
    if (bubbles.length >= MAX_ACTIVE_BUBBLES) return;
    const wrap = spawnWashBubble();
    const entry = { wrap, timeoutId: null };
    const lifetime = BUBBLE_MIN_LIFETIME_MS + Math.random() * (BUBBLE_MAX_LIFETIME_MS - BUBBLE_MIN_LIFETIME_MS);
    entry.timeoutId = setTimeout(() => {
      const idx = bubbles.indexOf(entry);
      if (idx !== -1) bubbles.splice(idx, 1);
      popWashBubble(wrap);
    }, lifetime);
    bubbles.push(entry);
  };

  const finish = () => {
    if (spawnIntervalId) {
      clearInterval(spawnIntervalId);
      spawnIntervalId = null;
    }
    bubbles.forEach((entry) => clearTimeout(entry.timeoutId));
    popAllWashBubbles(bubbles.splice(0));
    setTimeout(() => {
      emojiEl.classList.remove("bubble-bob");
      const button = document.createElement("button");
      button.className = "pond-button";
      button.textContent = "All Clean!";
      button.id = "action-button";
      staticButton.replaceWith(button);
      button.addEventListener("click", () => handleStepComplete(step, emojiEl, card, button, reflection));
    }, 1800);
  };

  audio.addEventListener("ended", finish);
  audio
    .play()
    .then(() => {
      spawnLoopBubble();
      spawnIntervalId = setInterval(spawnLoopBubble, BUBBLE_SPAWN_INTERVAL_MS);
    })
    .catch(() => {
      // Autoplay blocked; move on after a reasonable fallback delay.
      setTimeout(finish, 20000);
    });
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

function renderComplete() {
  spawnConfetti();

  const card = document.createElement("div");
  card.className = "complete-card";

  const emoji = document.createElement("div");
  emoji.className = "step-emoji bounce";
  emoji.textContent = "\u{1F389}";
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
      render();
    },
    { once: true }
  );
}

function spawnConfetti() {
  const pieces = ["⭐", "\u{1F389}", "\u{1F38A}", "\u{1F308}", "✨"];
  for (let i = 0; i < 60; i++) {
    const el = document.createElement("div");
    el.className = "confetti";
    el.textContent = pieces[Math.floor(Math.random() * pieces.length)];
    el.style.left = `${Math.random() * 100}%`;
    el.style.animationDuration = `${3.5 + Math.random() * 3}s`;
    el.style.animationDelay = `${Math.random() * 1.8}s`;
    app.appendChild(el);
    setTimeout(() => el.remove(), 8500);
  }
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
  }
});

requestWakeLock();
render();
