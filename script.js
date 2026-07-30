// Potty Time - toddler step-by-step checklist

const HANDWASH_AUDIO_SRC = "audio/handwash-song.mp3";

const STEPS = [
  {
    id: "potty",
    title: "Potty Time",
    instruction: "Sit down and go potty!",
    emoji: "\u{1F6BD}",
    color: "#FFE29A",
  },
  {
    id: "wipe",
    title: "Wipe",
    instruction: "Wipe all nice and clean!",
    emoji: "\u{1F9FB}",
    color: "#FFC1D6",
  },
  {
    id: "pantsup",
    title: "Pants Up",
    instruction: "Pull your pants back up!",
    emoji: "\u{1F456}",
    color: "#A6E8E0",
  },
  {
    id: "flush",
    title: "Flush",
    instruction: "Push the handle to flush!",
    emoji: "\u{1F6BD}",
    color: "#B8F2C9",
  },
  {
    id: "washhands",
    title: "Wash Hands",
    instruction: "Wash your hands with the song!",
    emoji: "\u{1F9FC}",
    color: "#FCE3B0",
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

function render() {
  app.innerHTML = "";
  if (state.finished) {
    renderComplete();
    return;
  }
  const step = STEPS[state.stepIndex];
  app.style.background = step.color;

  const card = document.createElement("div");
  card.className = "step-card";

  const emoji = document.createElement("div");
  emoji.className = "step-emoji";
  emoji.textContent = step.emoji;
  card.appendChild(emoji);

  const title = document.createElement("h1");
  title.className = "step-title";
  title.textContent = step.title;
  card.appendChild(title);

  const instruction = document.createElement("p");
  instruction.className = "step-instruction";
  instruction.textContent = step.instruction;
  card.appendChild(instruction);

  if (step.isSong) {
    const caption = document.createElement("div");
    caption.className = "song-caption";
    caption.id = "song-caption";
    caption.textContent = "\u{1F3B5} Wash your hands! \u{1F3B5}";
    card.appendChild(caption);

    const track = document.createElement("div");
    track.className = "song-progress-track";
    const fill = document.createElement("div");
    fill.className = "song-progress-fill";
    fill.id = "song-progress-fill";
    track.appendChild(fill);
    card.appendChild(track);

    app.appendChild(card);

    emoji.classList.add("scrubbing");
    runHandWashSong(() => goToNextStep());
    return;
  }

  const button = document.createElement("button");
  button.className = "big-button";
  button.textContent = "I Did It!";
  button.id = "action-button";
  button.addEventListener("click", () => handleStepComplete(emoji, card));
  card.appendChild(button);

  app.appendChild(card);
}

function handleStepComplete(emojiEl, card) {
  const button = document.getElementById("action-button");
  button.disabled = true;

  emojiEl.classList.add("bounce");
  playChime();
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

function runHandWashSong(onDone) {
  const fill = document.getElementById("song-progress-fill");
  const audio = new Audio(HANDWASH_AUDIO_SRC);

  audio.addEventListener("timeupdate", () => {
    if (audio.duration) {
      fill.style.width = `${(audio.currentTime / audio.duration) * 100}%`;
    }
  });

  const finish = () => {
    setTimeout(() => {
      playChime();
      onDone();
    }, 1500);
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
  app.style.background = "#FFD6E8";

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
  instruction.textContent = "You're a Potty Pro!";
  card.appendChild(instruction);

  app.appendChild(card);

  playChime();
}

function spawnConfetti() {
  const pieces = ["⭐", "\u{1F389}", "\u{1F38A}", "\u{1F308}", "✨"];
  for (let i = 0; i < 24; i++) {
    const el = document.createElement("div");
    el.className = "confetti";
    el.textContent = pieces[Math.floor(Math.random() * pieces.length)];
    el.style.left = `${Math.random() * 100}%`;
    el.style.animationDuration = `${2 + Math.random() * 1.5}s`;
    el.style.animationDelay = `${Math.random() * 0.6}s`;
    app.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  }
}

render();
