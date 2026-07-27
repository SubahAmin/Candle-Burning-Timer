// ---------- Candle stages & flicker ----------

const candleImg = document.getElementById("candleImg");

const candleStages = [
  ["assets/Untitled-1_0000_1-2.png", "assets/Untitled-1_0001_1-1.png"], // stage 1 - tallest
  ["assets/Untitled-1_0002_2-2.png", "assets/Untitled-1_0003_2-1.png"], // stage 2
  ["assets/Untitled-1_0004_3-2.png", "assets/Untitled-1_0005_3-1.png"], // stage 3
  ["assets/Untitled-1_0006_4-2.png", "assets/Untitled-1_0007_4-1.png"], // stage 4
  ["assets/Untitled-1_0008_5-2.png", "assets/Untitled-1_0009_5-1.png"], // stage 5 - shortest
];

const FINAL_FRAME = "assets/Untitled-1_0008_5-3.png";

const FLICKER_MIN_MS = 150;
const FLICKER_MAX_MS = 400;

let currentStage = 0;
let currentFrame = 0;
let flickerTimeout = null;
let isExtinguished = false;

// flicker runs continuously whenever the candle is "lit" —
// during running AND paused, only stopped when extinguished or reset
function flickerCandle() {
  if (isExtinguished) return;

  currentFrame = 1 - currentFrame;
  candleImg.src = candleStages[currentStage][currentFrame];

  const nextDelay = FLICKER_MIN_MS + Math.random() * (FLICKER_MAX_MS - FLICKER_MIN_MS);
  flickerTimeout = setTimeout(flickerCandle, nextDelay);
}

function stopFlicker() {
  if (flickerTimeout) {
    clearTimeout(flickerTimeout);
    flickerTimeout = null;
  }
}

function extinguishCandle() {
  isExtinguished = true;
  stopFlicker();
  candleImg.src = FINAL_FRAME;
}

function resetCandleToFull() {
  isExtinguished = false;
  stopFlicker();
  currentStage = 0;
  currentFrame = 0;
  candleImg.src = candleStages[0][0];
}

function updateCandleStage() {
  if (totalSeconds <= 0) {
    currentStage = 0;
    return;
  }
  const progress = remainingSeconds / totalSeconds;
  const stageIndex = Math.min(
    candleStages.length - 1,
    Math.floor((1 - progress) * candleStages.length)
  );
  currentStage = stageIndex;
}

// ---------- Segmented digit picker ----------

let digits = [0, 2, 0, 9];

const digitEls = [
  document.getElementById("digit0"),
  document.getElementById("digit1"),
  document.getElementById("digit2"),
  document.getElementById("digit3"),
];

const upButtons = document.querySelectorAll(".digit-arrow.up");
const downButtons = document.querySelectorAll(".digit-arrow.down");
const startBtn = document.getElementById("startBtn");
const pauseBtn = document.getElementById("pauseBtn");
const stopBtn = document.getElementById("stopBtn");

function maxForIndex(index) {
  if (index === 2) return 5; // seconds tens digit: 0-5 only
  return 9;
}

function renderDigits() {
  digitEls.forEach((el, i) => {
    el.textContent = digits[i];
  });
}

function changeDigit(index, delta) {
  if (timerState !== "idle") return;

  const max = maxForIndex(index);
  let value = digits[index] + delta;

  if (value > max) value = 0;
  if (value < 0) value = max;

  digits[index] = value;
  renderDigits();
}

upButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const index = parseInt(btn.dataset.index, 10);
    changeDigit(index, 1);
  });
});

downButtons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const index = parseInt(btn.dataset.index, 10);
    changeDigit(index, -1);
  });
});

function setEditingEnabled(enabled) {
  upButtons.forEach((btn) => (btn.disabled = !enabled));
  downButtons.forEach((btn) => (btn.disabled = !enabled));
}

// ---------- Timer ----------

let countdownInterval = null;
let remainingSeconds = 0;
let totalSeconds = 0;

// "idle"    -> digits editable, Start visible, Pause/Stop hidden
// "running" -> countdown + melt active, Pause visible, Start/Stop hidden
// "paused"  -> countdown + melt frozen, candle keeps flickering at current height,
//              Start hidden, Pause becomes hidden, Stop + a "Resume"-labeled button shown
let timerState = "idle";

function digitsToSeconds() {
  const mins = digits[0] * 10 + digits[1];
  const secs = digits[2] * 10 + digits[3];
  return mins * 60 + secs;
}

function secondsToDigits(totalSecondsValue) {
  const mins = Math.floor(totalSecondsValue / 60);
  const secs = totalSecondsValue % 60;
  digits[0] = Math.floor(mins / 10) % 10;
  digits[1] = mins % 10;
  digits[2] = Math.floor(secs / 10);
  digits[3] = secs % 10;
  renderDigits();
}

function stopCountdown() {
  if (countdownInterval) {
    clearInterval(countdownInterval);
    countdownInterval = null;
  }
}

function tick() {
  remainingSeconds--;
  secondsToDigits(Math.max(remainingSeconds, 0));
  updateCandleStage();

  if (remainingSeconds <= 0) {
    stopCountdown();
    extinguishCandle();
    goIdle();
  }
}

function startCountdown() {
  stopCountdown();
  countdownInterval = setInterval(tick, 1000);
}

function goIdle() {
  timerState = "idle";
  setEditingEnabled(true);
  startBtn.style.display = "inline-block";
  startBtn.textContent = "Start";
  pauseBtn.style.display = "none";
  stopBtn.style.display = "none";
}

function beginNewTimer() {
  const seconds = digitsToSeconds();
  if (seconds <= 0) return;

  remainingSeconds = seconds;
  totalSeconds = seconds;

  currentStage = 0;
  isExtinguished = false;
  stopFlicker();
  flickerCandle();

  timerState = "running";
  setEditingEnabled(false);
  startBtn.style.display = "none";
  pauseBtn.style.display = "inline-block";
  pauseBtn.textContent = "Pause";
  stopBtn.style.display = "inline-block";

  startCountdown();
}

function pauseTimer() {
  stopCountdown();
  // flicker keeps running (do NOT call stopFlicker here) so the flame
  // still flickers between frame 1 and 2 while paused; currentStage stays
  // exactly where it was, so height is frozen
  timerState = "paused";
  pauseBtn.textContent = "Resume";
}

function resumeTimer() {
  if (isExtinguished) return;

  timerState = "running";
  pauseBtn.textContent = "Pause";

  startCountdown(); // continues counting down + melting from remainingSeconds/currentStage
}

function stopTimer() {
  stopCountdown();
  resetCandleToFull();

  remainingSeconds = 0;
  totalSeconds = 0;
  secondsToDigits(0); // resets digit boxes to 00:00

  goIdle();
}

startBtn.addEventListener("click", () => {
  if (timerState === "idle") {
    beginNewTimer();
  }
});

pauseBtn.addEventListener("click", () => {
  if (timerState === "running") {
    pauseTimer();
  } else if (timerState === "paused") {
    resumeTimer();
  }
});

stopBtn.addEventListener("click", () => {
  if (timerState === "running" || timerState === "paused") {
    stopTimer();
  }
});

renderDigits();
