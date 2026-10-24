const walletButton = document.querySelector("#walletButton");
const actionButton = document.querySelector("#actionButton");
const timerElement = document.querySelector("#timer");
const paidElement = document.querySelector("#paidAmount");
const remainingElement = document.querySelector("#remainingAmount");
const liveState = document.querySelector("#liveState");
const flowProgress = document.querySelector("#flowProgress");
const sessionEscrow = document.querySelector("#sessionEscrow");
const attestPanel = document.querySelector("#attestPanel");
const studentAttest = document.querySelector("#studentAttest");
const tutorAttest = document.querySelector("#tutorAttest");
const proofStatus = document.querySelector("#proofStatus");
const certificate = document.querySelector("#certificate");
const proofDuration = document.querySelector("#proofDuration");
const toast = document.querySelector("#toast");

const RATE_PER_MINUTE = 0.5;
const DEPOSIT = 2;
let phase = "open";
let elapsed = 0;
let intervalId;
let studentDone = false;
let tutorDone = false;

function formatTime(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const seconds = (totalSeconds % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => toast.classList.remove("show"), 2600);
}

function renderMoney() {
  const paid = Math.min(DEPOSIT, elapsed * RATE_PER_MINUTE / 60);
  const remaining = phase === "open" ? 0 : DEPOSIT - paid;
  timerElement.textContent = formatTime(elapsed);
  paidElement.textContent = `${paid.toFixed(4)} MON`;
  remainingElement.textContent = `${remaining.toFixed(4)} MON`;
  flowProgress.style.width = `${Math.min(100, paid / DEPOSIT * 100)}%`;
}

function setPhase(nextPhase) {
  phase = nextPhase;
  if (phase === "funded") {
    sessionEscrow.textContent = "2 MON";
    remainingElement.textContent = "2.0000 MON";
    actionButton.textContent = "Start payment stream";
    liveState.innerHTML = "<i></i> FUNDED";
    showToast("2 MON deposited into demo escrow.");
  }
  if (phase === "active") {
    actionButton.textContent = "End & settle now";
    actionButton.classList.remove("primary");
    actionButton.classList.add("danger");
    liveState.innerHTML = "<i></i> LIVE";
    intervalId = window.setInterval(() => {
      elapsed += 1;
      renderMoney();
      if (elapsed * RATE_PER_MINUTE / 60 >= DEPOSIT) setPhase("ended");
    }, 1000);
    showToast("Payment stream started.");
  }
  if (phase === "ended") {
    window.clearInterval(intervalId);
    renderMoney();
    actionButton.hidden = true;
    attestPanel.hidden = false;
    liveState.innerHTML = "<i></i> SETTLED";
    showToast("Payment settled. Unused MON is refundable.");
  }
}

function attest(button, participant) {
  if (button.disabled) return;
  button.disabled = true;
  button.classList.add("done");
  button.querySelector("b").textContent = "Attested ✓";
  if (participant === "student") studentDone = true;
  if (participant === "tutor") tutorDone = true;
  proofStatus.textContent = studentDone && tutorDone ? "Skill proof recorded" : "One signature recorded";
  showToast(`${participant[0].toUpperCase()}${participant.slice(1)} attestation recorded.`);
  if (studentDone && tutorDone) {
    certificate.classList.add("earned");
    proofDuration.textContent = formatTime(elapsed);
    liveState.innerHTML = "<i></i> PROVEN";
    window.setTimeout(() => certificate.scrollIntoView({ behavior: "smooth", block: "center" }), 450);
  }
}

walletButton.addEventListener("click", () => {
  const connected = walletButton.dataset.connected === "true";
  walletButton.dataset.connected = String(!connected);
  walletButton.textContent = connected ? "Connect wallet" : "0x71C4…A92F";
  showToast(connected ? "Demo wallet disconnected." : "Demo wallet connected.");
});

actionButton.addEventListener("click", () => {
  if (phase === "open") setPhase("funded");
  else if (phase === "funded") setPhase("active");
  else if (phase === "active") setPhase("ended");
});

studentAttest.addEventListener("click", () => attest(studentAttest, "student"));
tutorAttest.addEventListener("click", () => attest(tutorAttest, "tutor"));

renderMoney();
