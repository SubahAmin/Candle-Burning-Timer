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

function flickerCandle() {
  if (isExtinguished) return;

  currentFrame = 1 - currentFrame;
  candleImg.src = candleStages[currentStage][currentFrame];

  const nextDelay = FLICKER_MIN_MS + Math.random() * (FLICKER_MAX_MS - FLICKER_MIN_MS);
  flickerTimeout = setTimeout(flickerCandle, nextDelay);
}

function extinguishCandle() {
  isExtinguished = true;
  if (flickerTimeout) {
    clearTimeout(flickerTimeout);
    flickerTimeout = null;
  }
  candleImg.src = FINAL_FRAME;
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
let isRunning = false;

const digitEls = [
  document.getElementById("digit0"),
  document.getElementById("digit1"),
  document.getElementById("digit2"),
  document.getElementById("digit3"),
];

const upButtons = document.querySelectorAll(".digit-arrow.up");
const downButtons = document.querySelectorAll(".digit-arrow.down");
const startBtn = document.getElementById("startBtn");

function maxForIndex(index) {
  if (index === 2) return 5;
  return 9;
}

function renderDigits() {
  digitEls.forEach((el, i) => {
    el.textContent = digits[i];
  });
}

function changeDigit(index, delta) {
  if (isRunning) return;

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

function startCountdown() {
  stopCountdown();
  if (remainingSeconds <= 0) return;

  countdownInterval = setInterval(() => {
    remainingSeconds--;
    secondsToDigits(Math.max(remainingSeconds, 0));
    updateCandleStage();

    if (remainingSeconds <= 0) {
      stopCountdown();
      extinguishCandle();
      isRunning = false;
      setEditingEnabled(true);
      startBtn.textContent = "Start";
    }
  }, 1000);
}

startBtn.addEventListener("click", () => {
  if (isRunning) {
    stopCountdown();
    isRunning = false;
    setEditingEnabled(true);
    startBtn.textContent = "Start";
    return;
  }

  const seconds = digitsToSeconds();
  if (seconds <= 0) return;

  remainingSeconds = seconds;
  totalSeconds = seconds;

  currentStage = 0;
  isExtinguished = false;
  if (flickerTimeout) {
    clearTimeout(flickerTimeout);
    flickerTimeout = null;
  }
  flickerCandle();

  isRunning = true;
  setEditingEnabled(false);
  startBtn.textContent = "Stop";

  startCountdown();
});

renderDigits();