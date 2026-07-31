// Potty Time - toddler step-by-step checklist

const HANDWASH_AUDIO_SRC = "audio/handwash-song.mp3";

const STEPS = [
  {
    id: "potty",
    title: "Time for Potty!",
    emoji: "\u{1F6BD}",
    waitingMusic: true,
    frogCroak: true,
  },
  {
    id: "wipe",
    title: "Let's Wipe",
    emoji: "\u{1F9FB}",
    sound: "sparkle",
  },
  {
    id: "pantsup",
    title: "Pull up your pants!",
    emoji: "\u{1F456}",
  },
  {
    id: "flush",
    title: "Time to Flush!",
    emoji: "\u{1F6BD}",
    sound: "swoosh",
  },
  {
    id: "washhands",
    title: "Wash Hands",
    emoji: "\u{1FAE7}",
    isSong: true,
  },
];

const state = {
  stepIndex: 0,
  finished: false,
};

const app = document.getElementById("app");

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

function playSparkleChime() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const notes = [1046.5, 1318.5, 1568, 2093, 1568, 1318.5];
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq * (1 + (Math.random() - 0.5) * 0.02);
      const t = ctx.currentTime + i * 0.07;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.16, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.18);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + 0.2);
    });
    setTimeout(() => ctx.close(), 700);
  } catch (e) {
    // Web Audio unsupported; silently skip
  }
}

function playSwoosh() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const duration = 0.55;
    const bufferSize = Math.floor(ctx.sampleRate * duration);
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    const noise = ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = ctx.createBiquadFilter();
    filter.type = "lowpass";
    filter.frequency.setValueAtTime(3200, ctx.currentTime);
    filter.frequency.exponentialRampToValueAtTime(200, ctx.currentTime + duration);

    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.35, ctx.currentTime);
    gain.gain.linearRampToValueAtTime(0.0001, ctx.currentTime + duration);

    noise.connect(filter).connect(gain).connect(ctx.destination);
    noise.start();
    noise.stop(ctx.currentTime + duration);
    setTimeout(() => ctx.close(), duration * 1000 + 200);
  } catch (e) {
    // Web Audio unsupported; silently skip
  }
}

function playStepSound(step) {
  if (step.sound === "sparkle") {
    playSparkleChime();
  } else if (step.sound === "swoosh") {
    playSwoosh();
  } else {
    playChime();
  }
}

let waitingMusicCtx = null;
let waitingMusicActive = false;
let waitingMusicTimeoutId = null;
let waitingMusicUnlockAttached = false;

function stopWaitingMusic() {
  waitingMusicActive = false;
  if (waitingMusicTimeoutId) {
    clearTimeout(waitingMusicTimeoutId);
    waitingMusicTimeoutId = null;
  }
  if (waitingMusicCtx) {
    const ctx = waitingMusicCtx;
    waitingMusicCtx = null;
    ctx.close().catch(() => {});
  }
}

function startWaitingMusic() {
  const step = STEPS[state.stepIndex];
  if (!step || !step.waitingMusic) return;

  if (!waitingMusicCtx) {
    try {
      waitingMusicCtx = new (window.AudioContext || window.webkitAudioContext)();
    } catch (e) {
      return;
    }
  }
  const ctx = waitingMusicCtx;
  ctx.resume().catch(() => {});

  if (waitingMusicActive) return;
  waitingMusicActive = true;

  const notes = [523.25, 659.25, 783.99, 659.25];
  const noteDuration = 0.42;
  const loopGap = 0.3;

  const playLoop = () => {
    if (!waitingMusicActive || waitingMusicCtx !== ctx) return;
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "triangle";
      osc.frequency.value = freq;
      const t = ctx.currentTime + i * noteDuration;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.linearRampToValueAtTime(0.12, t + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + noteDuration * 0.9);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + noteDuration);
    });
    const totalMs = (notes.length * noteDuration + loopGap) * 1000;
    waitingMusicTimeoutId = setTimeout(playLoop, totalMs);
  };
  playLoop();
}

function ensureWaitingMusicUnlock() {
  if (waitingMusicUnlockAttached) return;
  waitingMusicUnlockAttached = true;
  document.addEventListener("pointerdown", () => startWaitingMusic(), { once: true });
}

// Percent boxes (of #app's locked aspect-ratio canvas) registering each
// overlay frame over the frog baked into bg-pond.png, so it can be
// animated without disturbing the frog on every other screen.
const FROG_CROAK_BOX = { left: -0.9, top: 25.2, width: 40, height: 18.2 };
const FROG_CROAK_FRAMES = [
  { src: "images/frog-croak-0.png", box: FROG_CROAK_BOX },
  { src: "images/frog-croak-1.png", box: FROG_CROAK_BOX },
  { src: "images/frog-croak-2.png", box: FROG_CROAK_BOX },
  { src: "images/frog-croak-3.png", box: FROG_CROAK_BOX },
];
const FROG_CROAK_SEQUENCE = [
  { frame: 0, hold: 4500 },
  { frame: 1, hold: 180 },
  { frame: 2, hold: 260 },
  { frame: 3, hold: 4500 },
];

let croakTimeoutId = null;
let croakImgEl = null;

function stopFrogCroak() {
  if (croakTimeoutId) {
    clearTimeout(croakTimeoutId);
    croakTimeoutId = null;
  }
  croakImgEl = null;
}

function applyFrogBox(img, box) {
  img.style.left = `${box.left}%`;
  img.style.top = `${box.top}%`;
  img.style.width = `${box.width}%`;
  img.style.height = `${box.height}%`;
}

function startFrogCroak() {
  const img = document.createElement("img");
  img.className = "frog-anim";
  applyFrogBox(img, FROG_CROAK_FRAMES[0].box);
  img.src = FROG_CROAK_FRAMES[0].src;
  app.appendChild(img);
  croakImgEl = img;

  let seqIndex = 0;
  const tick = () => {
    if (!croakImgEl) return;
    const step = FROG_CROAK_SEQUENCE[seqIndex];
    const frame = FROG_CROAK_FRAMES[step.frame];
    croakImgEl.src = frame.src;
    applyFrogBox(croakImgEl, frame.box);
    seqIndex = (seqIndex + 1) % FROG_CROAK_SEQUENCE.length;
    croakTimeoutId = setTimeout(tick, step.hold);
  };
  tick();
}

const FROG_JUMP_FRAMES = [
  { src: "images/frog-jump-0.png", box: { left: 2.9, top: 28.2, width: 32.2, height: 15.2 }, hold: 350 },
  { src: "images/frog-jump-1.png", box: { left: 3.0, top: 28.1, width: 32.0, height: 15.2 }, hold: 450 },
  { src: "images/frog-jump-2.png", box: { left: 2.9, top: 29.0, width: 32.2, height: 14.4 }, hold: 220 },
  { src: "images/frog-jump-3.png", box: { left: 2.9, top: 16.9, width: 49.1, height: 26.5 }, hold: 260 },
  { src: "images/frog-jump-4.png", box: { left: 17.0, top: 8.2, width: 60.4, height: 25.5 }, hold: 320 },
];
const FROG_JUMP_EXIT_BOX = { left: 130, top: -35, width: 60.4, height: 25.5 };

function startFrogJumpAway() {
  const img = document.createElement("img");
  img.className = "frog-anim";
  applyFrogBox(img, FROG_JUMP_FRAMES[0].box);
  img.src = FROG_JUMP_FRAMES[0].src;
  app.appendChild(img);

  let i = 0;
  const step = () => {
    if (!img.isConnected) return;
    const frame = FROG_JUMP_FRAMES[i];
    img.src = frame.src;
    applyFrogBox(img, frame.box);
    i += 1;
    if (i < FROG_JUMP_FRAMES.length) {
      setTimeout(step, frame.hold);
    } else {
      setTimeout(() => {
        img.style.transition = "left 0.6s ease-out, top 0.6s ease-out, opacity 0.6s ease-out 0.2s";
        applyFrogBox(img, FROG_JUMP_EXIT_BOX);
        img.style.opacity = "0";
        setTimeout(() => img.remove(), 900);
      }, frame.hold);
    }
  };
  step();
}

function render() {
  app.innerHTML = "";
  if (state.finished) {
    renderComplete();
    return;
  }
  app.classList.remove("no-frog");
  const step = STEPS[state.stepIndex];

  if (step.waitingMusic) {
    startWaitingMusic();
    ensureWaitingMusicUnlock();
  } else {
    stopWaitingMusic();
  }

  stopFrogCroak();

  const card = document.createElement("div");
  card.className = "step-card has-button";

  const emoji = document.createElement("div");
  emoji.className = "step-emoji";
  emoji.textContent = step.emoji;
  card.appendChild(emoji);

  if (step.isSong) {
    app.appendChild(card);

    const reflection = document.createElement("div");
    reflection.className = "pond-reflection";
    app.appendChild(reflection);

    const button = document.createElement("div");
    button.className = "pond-button static";
    button.textContent = "\u{1F3B5} Wash your hands! \u{1F3B5}";
    app.appendChild(button);

    const track = document.createElement("div");
    track.className = "song-progress-track";
    const fill = document.createElement("div");
    fill.className = "song-progress-fill";
    fill.id = "song-progress-fill";
    track.appendChild(fill);
    app.appendChild(track);

    emoji.classList.add("bubble-bob");
    runHandWashSong(() => goToNextStep());
    return;
  }

  app.appendChild(card);

  const reflection = document.createElement("div");
  reflection.className = "pond-reflection";
  reflection.id = "pond-reflection";
  app.appendChild(reflection);

  const button = document.createElement("button");
  button.className = "pond-button";
  button.textContent = step.title;
  button.id = "action-button";
  button.addEventListener("click", () => handleStepComplete(step, emoji, card, button, reflection));
  app.appendChild(button);

  if (step.frogCroak) {
    startFrogCroak();
  }
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

const TOTAL_WASH_BUBBLES = 45;

function spawnWashBubble() {
  const bubble = document.createElement("div");
  bubble.className = "wash-bubble";
  bubble.textContent = "\u{1FAE7}";
  const size = 1.6 + Math.random() * 2.2;
  bubble.style.fontSize = `${size}rem`;
  bubble.style.left = `${4 + Math.random() * 92}%`;
  bubble.style.top = `${10 + Math.random() * 78}%`;
  app.appendChild(bubble);
  return bubble;
}

function popAllWashBubbles(bubbles) {
  const spread = 1000;
  bubbles.forEach((bubble, i) => {
    const delay = (i / Math.max(bubbles.length, 1)) * spread + Math.random() * 60;
    setTimeout(() => {
      bubble.classList.add("pop");
      setTimeout(() => bubble.remove(), 320);
    }, delay);
  });
}

function runHandWashSong(onDone) {
  const fill = document.getElementById("song-progress-fill");
  const audio = new Audio(HANDWASH_AUDIO_SRC);
  const bubbles = [];
  let bubblesSpawned = 0;

  audio.addEventListener("timeupdate", () => {
    if (audio.duration) {
      const progress = audio.currentTime / audio.duration;
      fill.style.width = `${progress * 100}%`;

      const targetCount = Math.floor(progress * TOTAL_WASH_BUBBLES);
      while (bubblesSpawned < targetCount) {
        bubbles.push(spawnWashBubble());
        bubblesSpawned += 1;
      }
    }
  });

  const finish = () => {
    popAllWashBubbles(bubbles);
    setTimeout(() => {
      playChime();
      onDone();
    }, 1800);
  };

  audio.addEventListener("ended", finish);
  audio.play().catch(() => {
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
  app.classList.add("no-frog");
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

  app.appendChild(card);

  playChime();
  startFrogJumpAway();
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

render();
