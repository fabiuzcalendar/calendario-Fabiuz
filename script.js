const today = new Date();
let currentDate = new Date(today);

const monthNames = [
  "GENNAIO","FEBBRAIO","MARZO","APRILE","MAGGIO","GIUGNO",
  "LUGLIO","AGOSTO","SETTEMBRE","OTTOBRE","NOVEMBRE","DICEMBRE"
];

const dayNamesFull = ["DOM","LUN","MAR","MER","GIO","VEN","SAB"];
const dayNamesShort = ["D","L","M","M","G","V","S"];

/******** FESTIVITÀ ITALIANE ********/

/* feste fisse (valgono ogni anno) -> mappa MD -> nome */
const fixedHolidays = {
  "01-01": "Capodanno",
  "01-06": "Epifania",
  "04-25": "Festa della Liberazione",
  "05-01": "Festa dei Lavoratori",
  "06-02": "Festa della Repubblica",
  "08-15": "Ferragosto",
  "11-01": "Ognissanti",
  "12-08": "Immacolata Concezione",
  "12-25": "Natale",
  "12-26": "Santo Stefano"
};

/* Calcolo Pasqua (algoritmo di Meeus/Jones/Butcher) */
function easterSunday(year) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31); // 3=Marzo, 4=Aprile
  const day = ((h + l - 7 * m + 114) % 31) + 1;

  // ritorna Date in ora locale (mezzogiorno per evitare edge timezone)
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function pad2(n) { return String(n).padStart(2, "0"); }

function toISO(d) {
  return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
}
function toMD(d) {
  return `${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`;
}

/* Feste mobili (per anno) -> restituisce mappa ISO -> nome */
function variableHolidaysForYear(year) {
  const easter = easterSunday(year);
  const easterMonday = new Date(easter);
  easterMonday.setDate(easterMonday.getDate() + 1);

  return {
    [toISO(easter)]: "Pasqua",
    [toISO(easterMonday)]: "Lunedì dell’Angelo"
  };
}

/* Ritorna nome festa se esiste */
function getHolidayName(iso, md, year) {
  // fisse
  if (fixedHolidays[md]) return fixedHolidays[md];

  // mobili (Pasqua/Pasquetta)
  const vars = variableHolidaysForYear(year);
  if (vars[iso]) return vars[iso];

  return "";
}

/******** COMPLEANNI ********/
const birthdays = {
 // "02-08": "Compleanno Katiuscia", con le // è nascosto
  "06-24": "Compleanno Sonia",
  "07-02": "Compleanno Laura",
  "07-03": "Compleanno Mamma",
  "07-06": "Compleanno Francesco",
  "08-02": "Compleanno Fabio",
  "01-29": "Compleanno Papà"
};

/******** RENDER ********/
function renderAll() {
  const y = currentDate.getFullYear();
  const m = currentDate.getMonth();

  renderCalendar("prev-days","prev-month",y,m-1,false,false);
  renderCalendar("days","current-month",y,m,true,true);
  renderCalendar("next-days","next-month",y,m+1,false,false);
}

function renderCalendar(containerId, titleId, y, m, showBirthdays, isMain) {
  const ref = new Date(y, m, 1);
  y = ref.getFullYear();
  m = ref.getMonth();

  const container = document.getElementById(containerId);
  const title = document.getElementById(titleId);
  container.innerHTML = "";
  title.textContent = `${monthNames[m]} ${y}`;

  const daysInMonth = new Date(y, m + 1, 0).getDate();
  const todayIso = today.toISOString().slice(0,10);

  let leftCol, rightCol;
  if (isMain) {
    leftCol = document.createElement("div");
    rightCol = document.createElement("div");
    leftCol.className = "month-half";
    rightCol.className = "month-half";
    container.append(leftCol, rightCol);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(y, m, d, 12, 0, 0, 0);
    const iso = `${y}-${pad2(m+1)}-${pad2(d)}`;
    const md  = `${pad2(m+1)}-${pad2(d)}`;

    const div = document.createElement("div");
    div.className = "day";

    if (iso === todayIso && isMain) div.classList.add("today");

    const holidayName = getHolidayName(iso, md, y);

    if (
      date.getDay() === 0 ||               // domenica
      !!holidayName                        // qualunque festa: rosso come domenica
    ) {
      div.classList.add("sunday");
    }

    const name = isMain
      ? dayNamesFull[date.getDay()]
      : dayNamesShort[date.getDay()];

    // Mostriamo testo festa + compleanno SOLO nel mese centrale (isMain)
    const holidayHTML = (isMain && holidayName)
      ? `<div class="holiday">${holidayName}</div>`
      : "";

    const birthdayHTML = (isMain && showBirthdays && birthdays[md])
      ? `<div class="birthday">${birthdays[md]}</div>`
      : "";

    div.innerHTML = `
      <div class="day-number">${d}</div>
      <div class="day-name">${name}</div>
      ${holidayHTML}
      ${birthdayHTML}
    `;

    if (isMain) (d <= 15 ? leftCol : rightCol).appendChild(div);
    else container.appendChild(div);
  }
}

/******** NAVIGAZIONE ********/
function changeMonth(delta) {
  currentDate.setMonth(currentDate.getMonth() + delta);
  renderAll();
}

function resetToToday() {
  currentDate = new Date(today);
  renderAll();
}

/******** AUTO ********/
renderAll();

(function midnightReload(){
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24,0,0,0);
  setTimeout(() => location.reload(), midnight - now);
})();

(function nightMode(){
  const h = new Date().getHours();
  if (h >= 21 || h < 7) document.body.classList.add("night");
})();

/******** KIOSK ROTATION + FILL (Raspberry-safe) ********/
(function kioskRotateAndFill(){
  const app = document.getElementById("calendar-app");
  if (!app) return;

  function setMode(){
    const w = window.innerWidth;
    const h = window.innerHeight;

    // Se siamo su TV landscape (w>h) ruotiamo per avere calendario verticale
    if (w > h) {
      app.classList.add("rotated");
      app.classList.remove("normal");
    } else {
      app.classList.add("normal");
      app.classList.remove("rotated");
    }
  }

  function setFillScale(){
    // reset scala (variabile CSS)
    app.style.setProperty("--kiosk-scale", "1");

    const rect = app.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

    // COVER: riempie tutto lo schermo (niente nero). Può tagliare un filo ai bordi.
    const s = Math.max(vw / rect.width, vh / rect.height);

    const safe = Math.max(0.1, Math.min(s, 3));
    app.style.setProperty("--kiosk-scale", String(safe));
  }

  function applyAll(){
    setMode();
    setTimeout(setFillScale, 80);
  }

  window.addEventListener("resize", applyAll);
  applyAll();
})();

/******** NOTE / LISTA SPESA (OVERLAY) ********/
const NOTES_TIMEOUT_MS = 45000; // 45s (regolabile)
let notesOpen = false;
let notesTimer = null;

const NOTES_STORAGE_KEY = "calendario_notes_lines_v1";

function normLine(s) {
  return (s || "")
    .replace(/\r/g, "")
    .trim();
}

function parseLines(text) {
  return normLine(text)
    .split("\n")
    .map(l => l.trim())
    .filter(l => l.length > 0);
}

function stripDash(line) {
  // consenti "- carote" oppure "carote"
  return line.replace(/^[-•]\s*/,"").trim();
}

function loadSavedText() {
  return localStorage.getItem(NOTES_STORAGE_KEY) || "";
}

function saveText(text) {
  localStorage.setItem(NOTES_STORAGE_KEY, text);
}

function buildListFromTextarea() {
  const input = document.getElementById("notes-input");
  const list = document.getElementById("notes-list");
  const count = document.getElementById("notes-count");
  if (!input || !list || !count) return;

  const lines = parseLines(input.value).map(stripDash).filter(Boolean);

  list.innerHTML = "";
  lines.forEach((itemText, idx) => {
    const div = document.createElement("div");
    div.className = "notes-item";
    div.textContent = `- ${itemText}`;
    div.title = "Click per eliminare";

    div.addEventListener("click", () => {
      // elimina SOLO quella riga
      const newLines = lines.filter((_, i) => i !== idx);
      const newText = newLines.map(x => `- ${x}`).join("\n");
      input.value = newText;
      saveText(newText);
      buildListFromTextarea();
      resetNotesTimer();
    });

    list.appendChild(div);
  });

  count.textContent = `${lines.length} voci`;
}

function resetNotesTimer() {
  if (notesTimer) clearTimeout(notesTimer);
  notesTimer = setTimeout(() => closeNotes(), NOTES_TIMEOUT_MS);
}

function openNotes() {
  const overlay = document.getElementById("notes-overlay");
  const input = document.getElementById("notes-input");
  if (!overlay || !input) return;

  notesOpen = true;
  overlay.classList.remove("hidden");
  overlay.setAttribute("aria-hidden", "false");

  // carica testo salvato
  input.value = loadSavedText();

  // render lista
  buildListFromTextarea();

  // focus per scrivere subito (utile anche con tastiera)
  setTimeout(() => input.focus(), 50);

  resetNotesTimer();
}

function closeNotes() {
  const overlay = document.getElementById("notes-overlay");
  if (!overlay) return;

  notesOpen = false;
  overlay.classList.add("hidden");
  overlay.setAttribute("aria-hidden", "true");

  if (notesTimer) clearTimeout(notesTimer);
  notesTimer = null;

  // torna al mese attuale (come volevi)
  resetToToday();
}

function toggleNotes() {
  if (!notesOpen) openNotes();
  else closeNotes();
}

// Hook UI: bottone chiudi + typing salva
(function notesUIBoot(){
  const input = document.getElementById("notes-input");
  const closeBtn = document.getElementById("notes-close");
  const overlay = document.getElementById("notes-overlay");

  if (closeBtn) closeBtn.addEventListener("click", () => closeNotes());

  if (input) {
    input.addEventListener("input", () => {
      saveText(input.value);
      buildListFromTextarea();
      resetNotesTimer();
    });

    // se premi ESC chiude (utile da tastiera)
    input.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        e.preventDefault();
        closeNotes();
      }
    });
  }

  // click sullo sfondo scuro chiude
  if (overlay) {
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) closeNotes();
    });
  }
})();

/******** INPUT: TASTIERA (per tasti fisici) ********/
(function keyboardMonthControl(){
  let last = 0;
  const cooldownMs = 70;      // più reattivo
  let queued = 0;             // accumula 1 step se premi troppo veloce
  let queueTimer = null;

  function flushQueue(){
    if (queued === 0) return;
    const step = queued;
    queued = 0;
    changeMonth(step);
  }

  function enqueue(step){
    // se arriva troppo presto, non lo perdiamo: lo accodiamo
    queued += step;

    if (queueTimer) clearTimeout(queueTimer);
    queueTimer = setTimeout(() => {
      flushQueue();
      queueTimer = null;
    }, cooldownMs);
  }

  window.addEventListener("keydown", (e) => {
    if (e.repeat) return;

    const now = Date.now();
    const tooSoon = (now - last < cooldownMs);
    last = now;

    if (e.key === "ArrowLeft") {
      e.preventDefault();
      if (tooSoon) enqueue(-1);
      else changeMonth(-1);

    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      if (tooSoon) enqueue(1);
      else changeMonth(1);

    } else if (e.key === "Home") {
      e.preventDefault();
      if (notesOpen) closeNotes();
      else resetToToday();

    } else if (e.key === "n" || e.key === "N") {
      e.preventDefault();
      toggleNotes();
    }
  }, { passive: false });
})();
