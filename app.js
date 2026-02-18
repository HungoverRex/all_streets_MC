const DATA_FILE = "quiz_data.json";
const NUM_CHOICES = 4;
const ADVANCE_DELAY_MS = 800;

// State
let items = [];
let pool = [];
let current = null;
let score = 0;
let total = 0;
let answeredCount = 0;
let missed = [];
let skipped = [];

// Helpers
function normalizeSet(arr) {
  return arr.slice().sort((a, b) => a - b).join(",");
}

function formatSet(arr) {
  return arr.slice().sort((a, b) => a - b).join(", ");
}

function shuffleArray(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// UI elements
const questionEl = document.getElementById("question");
const countEl = document.getElementById("count");
const choicesEl = document.getElementById("choices");
const feedbackEl = document.getElementById("feedback");
const scoreEl = document.getElementById("score");
const remainingEl = document.getElementById("remaining");

const submitBtn = document.getElementById("submit");
const skipBtn = document.getElementById("skip");
const finishBtn = document.getElementById("finish");
const restartBtn = document.getElementById("restart");

function resetPool() {
  pool = shuffleArray(items.slice());
  updateRemaining();
}

function updateRemaining() {
  remainingEl.textContent = `Remaining: ${pool.length}`;
}

function updateCount() {
  countEl.textContent = `Question: ${answeredCount + 1} / ${items.length}`;
}

function renderChoices(choices) {
  choicesEl.innerHTML = "";
  choices.forEach(choice => {
    const label = document.createElement("label");
    label.className = "choice";

    const input = document.createElement("input");
    input.type = "radio";
    input.name = "choice";
    input.value = choice;

    const span = document.createElement("span");
    span.textContent = choice;

    label.appendChild(input);
    label.appendChild(span);
    choicesEl.appendChild(label);
  });
}

function nextQuestion() {
  if (!pool.length) {
    alert("All questions complete. Reshuffling.");
    resetPool();
  }

  feedbackEl.textContent = "";
  feedbackEl.style.color = "#222";

  current = pool.pop();
  const correctSet = current.districts;
  const correctKey = normalizeSet(correctSet);

  const allSets = items.map(i => normalizeSet(i.districts));
  const uniqueSets = Array.from(new Set(allSets));

  const distractors = uniqueSets.filter(s => s !== correctKey);
  const selectedDistractors = shuffleArray(distractors).slice(0, NUM_CHOICES - 1);

  const choices = shuffleArray([
    formatSet(correctSet),
    ...selectedDistractors.map(s => s.split(",").map(Number).sort((a, b) => a - b).join(", "))
  ]);

  questionEl.textContent = `What districts is ${current.street} in?`;
  renderChoices(choices);
  updateRemaining();
  updateCount();
}

function getSelectedChoice() {
  const checked = document.querySelector("input[name='choice']:checked");
  return checked ? checked.value : "";
}

function submitAnswer() {
  const selected = getSelectedChoice();
  if (!selected) {
    alert("Please choose an answer.");
    return;
  }

  const correct = formatSet(current.districts);
  total += 1;
  answeredCount += 1;

  if (selected === correct) {
    score += 1;
    feedbackEl.textContent = "✅ Correct!";
    feedbackEl.style.color = "green";
  } else {
    missed.push({
      Street: current.street,
      Correct: correct,
      YouChose: selected
    });
    feedbackEl.textContent = `❌ Incorrect. Correct: ${correct}`;
    feedbackEl.style.color = "red";
  }

  scoreEl.textContent = `Score: ${score}/${total}`;
  setTimeout(nextQuestion, ADVANCE_DELAY_MS);
}

function skipQuestion() {
  skipped.push({
    Street: current.street,
    Districts: formatSet(current.districts)
  });
  answeredCount += 1;
  feedbackEl.textContent = "⏭️ Skipped.";
  feedbackEl.style.color = "#555";
  setTimeout(nextQuestion, ADVANCE_DELAY_MS);
}

function finishQuiz() {
  const percent = total > 0 ? (score / total * 100).toFixed(1) : "0.0";
  let recap = `Score: ${score}/${total}  |  Percent: ${percent}%\n\n`;

  recap += "Missed:\n";
  recap += missed.length
    ? missed.map(m => `• ${m.Street}\n  Correct: ${m.Correct} | You chose: ${m.YouChose}`).join("\n")
    : "None 🎉";

  recap += "\n\nSkipped:\n";
  recap += skipped.length
    ? skipped.map(s => `• ${s.Street} → ${s.Districts}`).join("\n")
    : "None";

  alert(recap);
}

function restartQuiz() {
  score = 0;
  total = 0;
  answeredCount = 0;
  missed = [];
  skipped = [];

  scoreEl.textContent = "Score: 0/0";
  feedbackEl.textContent = "";

  resetPool();
  nextQuestion();
}

// Init
fetch(DATA_FILE)
  .then(res => res.json())
  .then(data => {
    items = data;
    resetPool();
    nextQuestion();
  })
  .catch(err => {
    console.error("Failed to load data:", err);
    questionEl.textContent = "Failed to load quiz data.";
  });

// Events
submitBtn.addEventListener("click", submitAnswer);
skipBtn.addEventListener("click", skipQuestion);
finishBtn.addEventListener("click", finishQuiz);
restartBtn.addEventListener("click", restartQuiz);