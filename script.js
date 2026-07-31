// Froggy Timer - toddler step-by-step checklist

const HANDWASH_AUDIO_SRC = "audio/handwash-song.mp3";
const WIPE_FX_SRC = "audio/wipe-fx.mp3";
const FLUSH_FX_SRC = "audio/flush-fx.mp3";
const POTTY_WAIT_AUDIO_SRC = "audio/potty-wait.mp3";
const WAITING_MUSIC_TARGET_VOLUME = 0.6;
const WAITING_MUSIC_FADE_MS = 2500;

const STEPS = [
  {
    id: "potty",
    title: "Time for Potty!",
    emoji: "\u{1F6BD}",
    waitingMusic: true,
  },
  {
    id: "wipe",
    title: "Let's Wipe",
    emoji: "\u{1F9FB}",
    sound: "wipe",
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
    sound: "flush",
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
  if (state.finished) {
    renderComplete();
    return;
  }
  const step = STEPS[state.stepIndex];

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
    runHandWashSong(() => goToNextStep());
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

const BUBBLE_SPAWN_INTERVAL_MS = 130;

function spawnWashBubble(fillProgress) {
  const wrap = document.createElement("div");
  wrap.className = "wash-bubble-wrap";

  // Pile line rises from near the bottom to near the top as the song
  // progresses, with jitter so bubbles look stacked rather than in a
  // perfectly flat row.
  const pileTop = 92 - fillProgress * 84;
  const top = Math.max(2, pileTop + (Math.random() - 0.5) * 14);
  wrap.style.left = `${2 + Math.random() * 96}%`;
  wrap.style.top = `${top}%`;

  const size = (1.6 + Math.random() * 2.2) * 3;
  wrap.style.width = `${size}rem`;
  wrap.style.height = `${size}rem`;

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

function popAllWashBubbles(bubbles) {
  const spread = 900;
  bubbles.forEach((wrap, i) => {
    const delay = (i / Math.max(bubbles.length, 1)) * spread + Math.random() * 60;
    setTimeout(() => {
      const img = wrap.querySelector(".wash-bubble");
      if (img) img.classList.add("pop");
      setTimeout(() => wrap.remove(), 320);
    }, delay);
  });
}

function runHandWashSong(onDone) {
  const fill = document.getElementById("song-progress-fill");
  const audio = new Audio(HANDWASH_AUDIO_SRC);
  const bubbles = [];
  let progress = 0;
  let spawnIntervalId = null;

  audio.addEventListener("timeupdate", () => {
    if (audio.duration) {
      progress = audio.currentTime / audio.duration;
      fill.style.width = `${progress * 100}%`;
    }
  });

  const finish = () => {
    if (spawnIntervalId) {
      clearInterval(spawnIntervalId);
      spawnIntervalId = null;
    }
    popAllWashBubbles(bubbles);
    setTimeout(() => {
      playChime();
      onDone();
    }, 1800);
  };

  audio.addEventListener("ended", finish);
  audio
    .play()
    .then(() => {
      bubbles.push(spawnWashBubble(progress));
      spawnIntervalId = setInterval(() => {
        bubbles.push(spawnWashBubble(progress));
      }, BUBBLE_SPAWN_INTERVAL_MS);
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

  playChime();
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
