const walletButton = document.querySelector("#walletButton");
const actionButton = document.querySelector("#actionButton");
const topUpButton = document.querySelector("#topUpButton");
const restartButton = document.querySelector("#restartButton");
const lessonVideo = document.querySelector("#lessonVideo");
const playerGate = document.querySelector("#playerGate");
const playerTitle = document.querySelector("#playerTitle");
const playerCopy = document.querySelector("#playerCopy");
const demoCourseTitle = document.querySelector("#demoCourseTitle");
const proofCourseTitle = document.querySelector("#proofCourseTitle");
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

const RATE_PER_SECOND = 0.2;
const NET_DEPOSIT_PER_PLAN = 1.8;
let phase = "open";
let elapsed = 0;
let escrow = 0;
let intervalId;
let studentDone = false;
let tutorDone = false;
let selectedVideo = "xAcTmDO6NTI";
let selectedPlaylist = "PLUl4u3cNGP62A-ynp6v6-LGBCzeH3VAQB";

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
  const paid = Math.min(escrow, elapsed * RATE_PER_SECOND);
  const remaining = phase === "open" ? 0 : Math.max(0, escrow - paid);
  timerElement.textContent = formatTime(elapsed);
  paidElement.textContent = `${paid.toFixed(4)} MON`;
  remainingElement.textContent = `${remaining.toFixed(4)} MON`;
  flowProgress.style.width = `${escrow ? Math.min(100, paid / escrow * 100) : 0}%`;
}

function showVideo() {
  const playlist = selectedPlaylist ? `&list=${selectedPlaylist}` : "";
  lessonVideo.src = `https://www.youtube-nocookie.com/embed/${selectedVideo}?autoplay=1&mute=1&rel=0${playlist}`;
  lessonVideo.hidden = false;
  playerGate.hidden = true;
}

function hideVideo(title, copy) {
  lessonVideo.src = "";
  lessonVideo.hidden = true;
  playerGate.hidden = false;
  playerTitle.textContent = title;
  playerCopy.textContent = copy;
}

function setPhase(nextPhase) {
  phase = nextPhase;
  if (phase === "funded") {
    escrow = NET_DEPOSIT_PER_PLAN;
    sessionEscrow.textContent = `${escrow.toFixed(1)} MON`;
    remainingElement.textContent = `${escrow.toFixed(4)} MON`;
    actionButton.textContent = "Start payment stream";
    liveState.innerHTML = "<i></i> FUNDED";
    showToast("2 MON paid · 0.2 MON fee · 1.8 MON escrowed.");
  }
  if (phase === "active") {
    window.clearInterval(intervalId);
    actionButton.textContent = "End & settle now";
    actionButton.disabled = false;
    actionButton.classList.remove("primary");
    actionButton.classList.add("danger");
    topUpButton.hidden = true;
    liveState.innerHTML = "<i></i> LIVE";
    showVideo();
    intervalId = window.setInterval(() => {
      elapsed += 1;
      renderMoney();
      if (elapsed * RATE_PER_SECOND >= escrow) setPhase("exhausted");
    }, 1000);
    showToast("Payment stream started.");
  }
  if (phase === "exhausted") {
    window.clearInterval(intervalId);
    intervalId = undefined;
    renderMoney();
    actionButton.disabled = false;
    topUpButton.hidden = false;
    liveState.innerHTML = "<i></i> PAUSED";
    hideVideo("Stream paused — out of tokens", "Deposit more MON to continue, or end and settle the session.");
    showToast("Out of tokens. The lecture and payment stream are paused.");
  }
  if (phase === "ended") {
    window.clearInterval(intervalId);
    intervalId = undefined;
    renderMoney();
    actionButton.disabled = true;
    actionButton.hidden = true;
    topUpButton.hidden = true;
    restartButton.hidden = false;
    attestPanel.hidden = false;
    liveState.innerHTML = "<i></i> SETTLED";
    hideVideo("Lesson ended", "The video is blank because the payment stream has stopped.");
    showToast("Payment settled. Unused MON is refundable.");
  }
}

function resetDemo() {
  window.clearInterval(intervalId);
  intervalId = undefined;
  phase = "open";
  elapsed = 0;
  escrow = 0;
  studentDone = false;
  tutorDone = false;

  actionButton.hidden = false;
  actionButton.disabled = false;
  actionButton.textContent = "Deposit 2 MON";
  actionButton.classList.add("primary");
  actionButton.classList.remove("danger");
  restartButton.hidden = true;
  topUpButton.hidden = true;
  attestPanel.hidden = true;

  studentAttest.disabled = false;
  studentAttest.classList.remove("done");
  studentAttest.querySelector("b").textContent = "Pending";
  tutorAttest.disabled = false;
  tutorAttest.classList.remove("done");
  tutorAttest.querySelector("b").textContent = "Pending";
  proofStatus.textContent = "Waiting for attestations";

  certificate.classList.remove("earned");
  proofDuration.textContent = "28m 14s";
  liveState.innerHTML = "<i></i> OPEN";
  sessionEscrow.textContent = "0 MON";
  hideVideo("Pay as you learn", "The lecture starts when the payment stream starts.");
  renderMoney();
  document.querySelector("#demo").scrollIntoView({ behavior: "smooth", block: "center" });
  showToast("New demo session ready.");
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
  else if (phase === "active") {
    actionButton.disabled = true;
    setPhase("ended");
  }
  else if (phase === "exhausted") setPhase("ended");
});

studentAttest.addEventListener("click", () => attest(studentAttest, "student"));
tutorAttest.addEventListener("click", () => attest(tutorAttest, "tutor"));
restartButton.addEventListener("click", resetDemo);
topUpButton.addEventListener("click", () => {
  escrow += NET_DEPOSIT_PER_PLAN;
  sessionEscrow.textContent = `${escrow.toFixed(1)} MON`;
  setPhase("active");
  showToast("Top-up confirmed · another 1.8 MON added to escrow.");
});

document.querySelectorAll(".class-card").forEach((card) => {
  card.addEventListener("click", () => {
    resetDemo();
    selectedVideo = card.dataset.video;
    selectedPlaylist = card.dataset.playlist;
    demoCourseTitle.textContent = card.dataset.title;
    proofCourseTitle.textContent = card.dataset.title;
    document.querySelector("#demo").scrollIntoView({ behavior: "smooth", block: "center" });
    showToast(`${card.querySelector("span").textContent} class selected.`);
  });
});

renderMoney();
