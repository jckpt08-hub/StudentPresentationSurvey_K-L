"use strict";

const CONFIG = {
  // Google Apps Script 웹 앱 주소를 붙여 넣으면 응답이 구글 시트로 전송됩니다.
  // 예: "https://script.google.com/macros/s/...../exec"
  SUBMIT_ENDPOINT: "",

  // "enteredParity": 참가자가 입력한 정수의 짝·홀수로 조건 배정
  // "random": 입력값과 무관하게 브라우저가 조건을 무작위 배정
  ASSIGNMENT_MODE: "enteredParity",

  PRIME_DURATION_MS: 200,
  HAPPY_IMAGE: "assets/happy.svg",
  ANGRY_IMAGE: "assets/angry.svg"
};

const QUESTIONS = [
  "학교 생활은 만족스러운가요?",
  "학교 생활은 작년에 비해 올해 본인에게 더 즐거움을 주는 방향으로 발전하였나요?",
  "학교에서 교칙 위반 행위(배달음식, 타방 등)를 하고자 하는 충동이 매일 생겨나나요?",
  "올해 1학기 본인의 학교 생활 중 후회되는 것이 없나요? (없을수록 높은 번호 선택)",
  "올해에 비해 내년 본인의 인생이 더 행복해질 것이라고 느끼나요?"
];

const state = {
  participantNumber: null,
  condition: null,
  currentQuestion: 0,
  responses: Array(QUESTIONS.length).fill(null),
  startedAt: null,
  completedAt: null,
  resultPayload: null,
  transitionLocked: false
};

const introScreen = document.getElementById("introScreen");
const surveyScreen = document.getElementById("surveyScreen");
const completeScreen = document.getElementById("completeScreen");
const participantNumberInput = document.getElementById("participantNumber");
const numberError = document.getElementById("numberError");
const consentCheck = document.getElementById("consentCheck");
const startButton = document.getElementById("startButton");
const questionNumber = document.getElementById("questionNumber");
const questionText = document.getElementById("questionText");
const progressText = document.getElementById("progressText");
const progressBar = document.getElementById("progressBar");
const scaleButtons = document.getElementById("scaleButtons");
const nextButton = document.getElementById("nextButton");
const primeOverlay = document.getElementById("primeOverlay");
const primeImage = document.getElementById("primeImage");
const submitStatus = document.getElementById("submitStatus");
const downloadButton = document.getElementById("downloadButton");
const restartButton = document.getElementById("restartButton");

preloadImages();
buildScaleButtons();

startButton.addEventListener("click", startSurvey);
nextButton.addEventListener("click", handleNext);
downloadButton.addEventListener("click", downloadResult);
restartButton.addEventListener("click", () => window.location.reload());
participantNumberInput.addEventListener("keydown", (event) => {
  if (event.key === "Enter") startSurvey();
});

function preloadImages() {
  [CONFIG.HAPPY_IMAGE, CONFIG.ANGRY_IMAGE].forEach((src) => {
    const image = new Image();
    image.src = src;
  });
}

function buildScaleButtons() {
  const fragment = document.createDocumentFragment();

  for (let value = 1; value <= 10; value += 1) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "scale-button";
    button.textContent = String(value);
    button.dataset.value = String(value);
    button.setAttribute("role", "radio");
    button.setAttribute("aria-checked", "false");
    button.setAttribute("aria-label", `${value}점`);
    button.addEventListener("click", () => selectResponse(value));
    fragment.appendChild(button);
  }

  scaleButtons.appendChild(fragment);
}

function startSurvey() {
  const rawValue = participantNumberInput.value.trim();
  const numericValue = Number(rawValue);

  numberError.textContent = "";

  if (!rawValue || !Number.isInteger(numericValue)) {
    numberError.textContent = "소수점이 없는 정수를 입력해 주세요.";
    participantNumberInput.focus();
    return;
  }

  if (!consentCheck.checked) {
    numberError.textContent = "참여 안내에 동의한 뒤 시작해 주세요.";
    consentCheck.focus();
    return;
  }

  state.participantNumber = numericValue;
  state.condition = assignCondition(numericValue);
  state.startedAt = new Date();

  showScreen(surveyScreen);
  renderQuestion();
}

function assignCondition(number) {
  if (CONFIG.ASSIGNMENT_MODE === "random") {
    const randomBit = window.crypto.getRandomValues(new Uint8Array(1))[0] % 2;
    return randomBit === 0 ? "happy" : "angry";
  }

  return Math.abs(number) % 2 === 0 ? "happy" : "angry";
}

function renderQuestion() {
  const index = state.currentQuestion;
  const selectedValue = state.responses[index];

  questionNumber.textContent = `문항 ${index + 1}`;
  questionText.textContent = QUESTIONS[index];
  progressText.textContent = `${index + 1} / ${QUESTIONS.length}`;
  progressBar.style.width = `${((index + 1) / QUESTIONS.length) * 100}%`;
  nextButton.textContent = index === QUESTIONS.length - 1 ? "제출" : "다음";

  [...scaleButtons.children].forEach((button) => {
    const isSelected = Number(button.dataset.value) === selectedValue;
    button.classList.toggle("selected", isSelected);
    button.setAttribute("aria-checked", String(isSelected));
  });

  nextButton.disabled = selectedValue === null;
}

function selectResponse(value) {
  if (state.transitionLocked) return;
  state.responses[state.currentQuestion] = value;
  renderQuestion();
}

async function handleNext() {
  if (state.transitionLocked || state.responses[state.currentQuestion] === null) return;

  if (state.currentQuestion === QUESTIONS.length - 1) {
    await finishSurvey();
    return;
  }

  state.transitionLocked = true;
  nextButton.disabled = true;

  await showPrime();
  state.currentQuestion += 1;
  renderQuestion();
  state.transitionLocked = false;
  window.scrollTo({ top: 0, behavior: "auto" });
}

function showPrime() {
  return new Promise((resolve) => {
    primeImage.src = state.condition === "happy" ? CONFIG.HAPPY_IMAGE : CONFIG.ANGRY_IMAGE;
    primeOverlay.classList.add("visible");
    primeOverlay.setAttribute("aria-hidden", "false");

    window.setTimeout(() => {
      primeOverlay.classList.remove("visible");
      primeOverlay.setAttribute("aria-hidden", "true");
      resolve();
    }, CONFIG.PRIME_DURATION_MS);
  });
}

async function finishSurvey() {
  state.transitionLocked = true;
  state.completedAt = new Date();
  state.resultPayload = createPayload();

  showScreen(completeScreen);
  window.scrollTo({ top: 0, behavior: "auto" });

  if (!CONFIG.SUBMIT_ENDPOINT) {
    submitStatus.textContent = "중앙 저장 주소가 설정되지 않아 응답이 서버로 전송되지는 않았습니다. 아래 버튼으로 응답 파일을 저장할 수 있습니다.";
    downloadButton.classList.remove("hidden");
    return;
  }

  submitStatus.textContent = "응답을 전송하고 있습니다.";

  try {
    await fetch(CONFIG.SUBMIT_ENDPOINT, {
      method: "POST",
      mode: "no-cors",
      headers: {
        "Content-Type": "text/plain;charset=utf-8"
      },
      body: JSON.stringify(state.resultPayload)
    });

    submitStatus.textContent = "응답 전송을 완료했습니다.";
  } catch (error) {
    console.error(error);
    submitStatus.textContent = "응답 전송에 실패했습니다. 아래 버튼으로 응답 파일을 저장해 연구 담당자에게 전달해 주세요.";
    downloadButton.classList.remove("hidden");
  }
}

function createPayload() {
  const rawTotal = state.responses.reduce((sum, value) => sum + value, 0);

  // 3번 문항은 높은 점수가 부정적 경향을 뜻하므로 11 - 응답값으로 역채점합니다.
  const adjustedResponses = [
    state.responses[0],
    state.responses[1],
    11 - state.responses[2],
    state.responses[3],
    state.responses[4]
  ];

  const adjustedPositivityScore = adjustedResponses.reduce((sum, value) => sum + value, 0);

  return {
    schemaVersion: 1,
    participantNumber: state.participantNumber,
    condition: state.condition,
    responses: [...state.responses],
    adjustedResponses,
    rawTotal,
    adjustedPositivityScore,
    startedAt: state.startedAt.toISOString(),
    completedAt: state.completedAt.toISOString(),
    durationMs: state.completedAt.getTime() - state.startedAt.getTime()
  };
}

function downloadResult() {
  if (!state.resultPayload) return;

  const blob = new Blob([JSON.stringify(state.resultPayload, null, 2)], {
    type: "application/json;charset=utf-8"
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `survey-response-${Date.now()}.json`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function showScreen(targetScreen) {
  [introScreen, surveyScreen, completeScreen].forEach((screen) => {
    screen.classList.toggle("active", screen === targetScreen);
  });
}
