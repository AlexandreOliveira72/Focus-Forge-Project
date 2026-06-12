/* ========================================
   POMODORO STATE
======================================== */

let isRunning = false;
let currentPhase = "focus"; // focus | break
let currentCycle = 1;
let completedFocusSessions = 0;
let completedBreakSessions = 0;

let pomodoroConfig = {
    focus: 25,
    break: 5,
    sessions: 4,
};

let activePresetId = "preset-classic";
let timerLeft = pomodoroConfig.focus * 60;
let sessionStartAt = new Date();

/* ========================================
   ELEMENTS
======================================== */

const StartBtn = document.getElementById("start-btn");
const ResetBtn = document.getElementById("reset-btn");

const TimerDisplay = document.querySelector("#timer-display h1");
const TimerMode = document.querySelector(".timer-mode");
const TimerRing = document.getElementById("timer-ring");

const ProgressValue = document.querySelector(".progress-value");
const CycleInfo = document.querySelector(".cycle-info");
const TimeEstimate = document.querySelector(".time-estimate");

const PresetBtns = document.querySelectorAll(".preset-btn");

const FocusValueEl = document.getElementById("focus-value");
const BreakValueEl = document.getElementById("break-value");
const SessionsValueEl = document.getElementById("sessions-value");

const HistoryList = document.querySelector(".history-list");
const HistoryTotal = document.querySelector(".history-total strong");

const TotalTimeEl = document.getElementById("total-time");
const EndTimeEl = document.getElementById("end-time");
const TotalCyclesEl = document.getElementById("total-cycles");

const configRules = {
    focus: { step: 5, min: 5, max: 120 },
    break: { step: 5, min: 1, max: 60 },
    sessions: { step: 1, min: 1, max: 16 },
};

/* ========================================
   HELPERS
======================================== */

function pad(number) {
    return String(number).padStart(2, "0");
}

function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;

    return `${pad(minutes)}:${pad(secs)}`;
}

function formatHM(totalMinutes) {
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    if (hours === 0) {
        return `${minutes}min`;
    }

    if (minutes === 0) {
        return `${hours}h`;
    }

    return `${hours}h ${minutes}min`;
}

function formatClock(date) {
    return `${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function formatClockFromMinutes(baseDate, addMinutes) {
    const end = new Date(baseDate.getTime() + addMinutes * 60000);
    return formatClock(end);
}

function clamp(value, min, max) {
    return Math.max(min, Math.min(value, max));
}

function getPlannedTotalMinutes() {
    const focusMinutes = pomodoroConfig.focus * pomodoroConfig.sessions;
    const breakMinutes = pomodoroConfig.break * Math.max(pomodoroConfig.sessions - 1, 0);

    return focusMinutes + breakMinutes;
}

function getRemainingPlannedMinutes() {
    if (currentPhase === "focus") {
        const remainingCurrentFocus = timerLeft / 60;
        const remainingSessionsAfterCurrent = Math.max(pomodoroConfig.sessions - currentCycle, 0);

        return Math.ceil(
            remainingCurrentFocus +
            (remainingSessionsAfterCurrent * pomodoroConfig.focus) +
            (remainingSessionsAfterCurrent * pomodoroConfig.break)
        );
    }

    const remainingCurrentBreak = timerLeft / 60;
    const remainingSessionsAfterCurrent = Math.max(pomodoroConfig.sessions - currentCycle, 0);
    const remainingBreaksAfterCurrent = Math.max(pomodoroConfig.sessions - currentCycle - 1, 0);

    return Math.ceil(
        remainingCurrentBreak +
        (remainingSessionsAfterCurrent * pomodoroConfig.focus) +
        (remainingBreaksAfterCurrent * pomodoroConfig.break)
    );
}

/* ========================================
   UI UPDATES
======================================== */

function updateTimerDisplay() {
    TimerDisplay.textContent = formatTime(timerLeft);
}

function updateModeDisplay() {
    TimerMode.textContent = currentPhase === "focus" ? "Foco" : "Pausa";
}

function updateRing() {
    if (!TimerRing) return;

    const totalSeconds = (currentPhase === "focus"
        ? pomodoroConfig.focus
        : pomodoroConfig.break) * 60;

    const remainingRatio = totalSeconds > 0 ? timerLeft / totalSeconds : 0;
    const ringProgress = Math.max(0, Math.min(360, remainingRatio * 360));

    const ringColor = currentPhase === "focus"
        ? "#22d3ee"
        : "#fb923c";

    TimerRing.style.setProperty("--ring-color", ringColor);
    TimerRing.style.setProperty("--ring-progress", `${ringProgress}deg`);
}

function updateProgressUI() {
    const progress = pomodoroConfig.sessions > 0
        ? Math.round((completedFocusSessions / pomodoroConfig.sessions) * 100)
        : 0;

    ProgressValue.textContent = `${progress}%`;
    CycleInfo.textContent = `${currentCycle} de ${pomodoroConfig.sessions} ciclos`;
    TimeEstimate.textContent = `Final previsto: ${formatClockFromMinutes(sessionStartAt, getRemainingPlannedMinutes())}`;
}

function updateSummaryUI() {
    const totalPlannedMinutes = getPlannedTotalMinutes();
    const totalFocusedMinutes = completedFocusSessions * pomodoroConfig.focus;

    if (TotalTimeEl) {
        TotalTimeEl.textContent = formatHM(totalPlannedMinutes);
    }

    if (EndTimeEl) {
        EndTimeEl.textContent = formatClockFromMinutes(sessionStartAt, totalPlannedMinutes);
    }

    if (TotalCyclesEl) {
        TotalCyclesEl.textContent = String(pomodoroConfig.sessions);
    }

    if (HistoryTotal) {
        HistoryTotal.textContent = formatHM(totalFocusedMinutes);
    }
}

function updateConfigUI() {
    if (FocusValueEl) FocusValueEl.textContent = String(pomodoroConfig.focus);
    if (BreakValueEl) BreakValueEl.textContent = String(pomodoroConfig.break);
    if (SessionsValueEl) SessionsValueEl.textContent = String(pomodoroConfig.sessions);
}

function highlightActivePreset(activeId) {
    PresetBtns.forEach((btn) => {
        const isActive = btn.id === activeId;

        btn.style.background = isActive
            ? "rgba(56,189,248,.08)"
            : "rgba(255,255,255,.03)";

        btn.style.borderColor = isActive
            ? "rgba(56,189,248,.28)"
            : "var(--border-soft)";

        btn.style.transform = isActive
            ? "translateY(-1px)"
            : "translateY(0)";
    });
}

function updateAllUI() {
    updateTimerDisplay();
    updateModeDisplay();
    updateRing();
    updateProgressUI();
    updateSummaryUI();
    updateConfigUI();
    highlightActivePreset(activePresetId);
}

/* ========================================
   HISTORY
======================================== */

function addHistoryEntry(minutes) {
    if (!HistoryList) return;

    const item = document.createElement("div");
    item.className = "history-item";

    item.innerHTML = `
        <span>✓</span>
        <p>${minutes} minutos</p>
    `;

    HistoryList.prepend(item);
}

function seedHistory() {
    if (!HistoryList) return;

    HistoryList.innerHTML = `
        <div class="history-item">
            <span>✓</span>
            <p>25 minutos</p>
        </div>

        <div class="history-item">
            <span>✓</span>
            <p>50 minutos</p>
        </div>

        <div class="history-item">
            <span>✓</span>
            <p>90 minutos</p>
        </div>
    `;
}

/* ========================================
   PRESETS
======================================== */

function applyPresetFromButton(button) {
    const focus = Number(button.dataset.focus);
    const breakTime = Number(button.dataset.break);
    const sessions = Number(button.dataset.sessions);

    activePresetId = button.id;

    // O botão Personalizado só marca como ativo e usa a config atual
    if (button.id === "preset-custom") {
        resetTimer(false);
        updateAllUI();
        return;
    }

    pomodoroConfig = {
        focus,
        break: breakTime,
        sessions,
    };

    currentPhase = "focus";
    currentCycle = 1;
    completedFocusSessions = 0;
    completedBreakSessions = 0;
    timerLeft = pomodoroConfig.focus * 60;
    isRunning = false;
    StartBtn.textContent = "Iniciar";
    sessionStartAt = new Date();

    updateAllUI();
}

PresetBtns.forEach((button) => {
    button.addEventListener("click", () => {
        applyPresetFromButton(button);
    });
});

/* ========================================
   CONFIGURATION STEPPERS
======================================== */

function adjustConfig(target, delta) {
    const rule = configRules[target];

    pomodoroConfig[target] = clamp(
        pomodoroConfig[target] + delta,
        rule.min,
        rule.max
    );

    activePresetId = "preset-custom";
    resetTimer(false);
    updateAllUI();
}

document.querySelectorAll(".config-minus").forEach((button) => {
    button.addEventListener("click", () => {
        adjustConfig(button.dataset.target, -configRules[button.dataset.target].step);
    });
});

document.querySelectorAll(".config-plus").forEach((button) => {
    button.addEventListener("click", () => {
        adjustConfig(button.dataset.target, configRules[button.dataset.target].step);
    });
});

/* ========================================
   TIMER CONTROLS
======================================== */

function handleTimer() {
    if (!isRunning) {
        isRunning = true;
        StartBtn.textContent = "Pausar";
        console.log("Iniciando o timer");
    } else {
        isRunning = false;
        StartBtn.textContent = "Continuar";
        console.log("Pausando o timer");
    }
}

function resetTimer(keepSessionStart = true) {
    isRunning = false;
    currentPhase = "focus";
    currentCycle = 1;
    completedFocusSessions = 0;
    completedBreakSessions = 0;
    timerLeft = pomodoroConfig.focus * 60;

    StartBtn.textContent = "Iniciar";

    if (!keepSessionStart) {
        sessionStartAt = new Date();
    }

    updateAllUI();

    console.log("Resetando o timer");
}

function completeCurrentPhase() {
    if (currentPhase === "focus") {
        completedFocusSessions += 1;
        addHistoryEntry(pomodoroConfig.focus);

        if (completedFocusSessions >= pomodoroConfig.sessions) {
            alert("Sessão concluída!");
            isRunning = false;
            StartBtn.textContent = "Iniciar";
            resetTimer();
            return;
        }

        currentPhase = "break";
        timerLeft = pomodoroConfig.break * 60;
        updateAllUI();
        return;
    }

    completedBreakSessions += 1;
    currentCycle += 1;
    currentPhase = "focus";
    timerLeft = pomodoroConfig.focus * 60;
    updateAllUI();
}

StartBtn.addEventListener("click", handleTimer);
ResetBtn.addEventListener("click", () => resetTimer());

/* ========================================
   TIMER LOOP
======================================== */

setInterval(() => {
    if (!isRunning) {
        return;
    }

    if (timerLeft > 0) {
        timerLeft -= 1;
        updateTimerDisplay();
        updateRing();

        if (timerLeft === 0) {
            completeCurrentPhase();
        }
    }
}, 1000);

/* ========================================
   INITIAL SETUP
======================================== */

seedHistory();
updateAllUI();