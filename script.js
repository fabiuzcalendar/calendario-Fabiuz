

const today = new Date();
let currentDate = new Date(today);

const monthNames = [
  "GENNAIO","FEBBRAIO","MARZO","APRILE","MAGGIO","GIUGNO",
  "LUGLIO","AGOSTO","SETTEMBRE","OTTOBRE","NOVEMBRE","DICEMBRE"
];

const dayNamesFull = ["DOM","LUN","MAR","MER","GIO","VEN","SAB"];
const dayNamesShort = ["D","L","M","M","G","V","S"];

/******** EVENTI (GitHub RAW) ********/
const EVENTS_URL = "https://raw.githubusercontent.com/fabiuzcalendar/calendario-Fabiuz/main/events.json";
let eventsCache = {};

function normalizeEventsCache(json){
  const out = {};
  if (!json || typeof json !== "object") return out;

  for (const [date, value] of Object.entries(json)) {
    if (Array.isArray(value)) {
      out[date] = value.filter(v => typeof v === "string" && v.trim()).map(v => v.trim());
    } else if (value && typeof value === "object" && typeof value.text === "string") {
      out[date] = [value.text.trim()].filter(Boolean);
    } else if (typeof value === "string" && value.trim()) {
      out[date] = [value.trim()];
    }
  }
  return out;
}

async function refreshEvents(){
  try{
    const url = EVENTS_URL + "?t=" + Date.now();
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return;
    const json = await res.json();
    eventsCache = normalizeEventsCache(json);
    renderAll();
  }catch(e){}
}

/******** NOTE (GitHub RAW - solo lettura) ********/
const NOTES_URL = "https://raw.githubusercontent.com/fabiuzcalendar/calendario-Fabiuz/main/notes.txt";
let notesCacheText = "";

async function refreshNotes(){
  try{
    const url = NOTES_URL + "?t=" + Date.now();
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return;
    notesCacheText = await res.text();
  }catch(e){}
}

function renderNotesOverlay(){
  const box = document.getElementById("notes-list");
  const count = document.getElementById("notes-count");
  if (!box || !count) return;

  const text = (notesCacheText || "").replace(/\r/g,"").trimEnd();
  box.textContent = text;

  const n = text
    ? text.split("\n").filter(l => l.trim().length > 0).length
    : 0;

  count.textContent = `${n} righe`;
}

/******** FESTIVITÀ ITALIANE ********/

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
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day, 12, 0, 0, 0);
}

function pad2(n){ return String(n).padStart(2,"0"); }
function toISO(d){ return `${d.getFullYear()}-${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`; }
function toMD(d){ return `${pad2(d.getMonth()+1)}-${pad2(d.getDate())}`; }

function variableHolidaysForYear(year){
  const easter = easterSunday(year);
  const easterMonday = new Date(easter);
  easterMonday.setDate(easterMonday.getDate() + 1);

  return {
    [toISO(easter)]: "Pasqua",
    [toISO(easterMonday)]: "Lunedì dell’Angelo"
  };
}

function getHolidayName(iso, md, year){
  if (fixedHolidays[md]) return fixedHolidays[md];
  const vars = variableHolidaysForYear(year);
  if (vars[iso]) return vars[iso];
  return "";
}

/******** COMPLEANNI ********/
const birthdays = {
  "06-24": "Compleanno Sonia",
  "07-02": "Compleanno Laura",
  "07-03": "Compleanno Mamma",
  "07-06": "Compleanno Francesco",
  "08-02": "Compleanno Fabio",
  "02-08": "Compleanno Katiuscia &#9829",
  "01-29": "Compleanno Papà"
};

/******** RENDER ********/
function renderAll(){
  const y = currentDate.getFullYear();
  const m = currentDate.getMonth();

  renderCalendar("prev-days","prev-month",y,m-1,false,false);
  renderCalendar("days","current-month",y,m,true,true);
  renderCalendar("next-days","next-month",y,m+1,false,false);
}

function renderCalendar(containerId, titleId, y, m, showBirthdays, isMain){
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
  if (isMain){
    leftCol = document.createElement("div");
    rightCol = document.createElement("div");
    leftCol.className = "month-half";
    rightCol.className = "month-half";
    container.append(leftCol, rightCol);
  }

  for (let d=1; d<=daysInMonth; d++){
    const date = new Date(y, m, d, 12, 0, 0, 0);
    const iso = `${y}-${pad2(m+1)}-${pad2(d)}`;
    const md  = `${pad2(m+1)}-${pad2(d)}`;

    const div = document.createElement("div");
    div.className = "day";

    if (iso === todayIso && isMain) div.classList.add("today");

    const holidayName = getHolidayName(iso, md, y);

    if (date.getDay() === 0 || !!holidayName){
      div.classList.add("sunday");
    }

    const name = isMain
      ? dayNamesFull[date.getDay()]
      : dayNamesShort[date.getDay()];

    const holidayHTML = (isMain && holidayName)
      ? `<div class="holiday">${holidayName}</div>`
      : "";

    const birthdayHTML = (isMain && showBirthdays && birthdays[md])
      ? `<div class="birthday">${birthdays[md]}</div>`
      : "";

    const dayEvents = eventsCache[iso] || [];
    const isPast = iso < todayIso;

    const eventHTML = (isMain && dayEvents.length)
      ? dayEvents.map(text => `<div class="event ${isPast ? "done" : ""}">${text}</div>`).join("")
      : "";

    div.innerHTML = `
      <div class="day-number">${d}</div>
      <div class="day-name">${name}</div>
      ${holidayHTML}
      ${birthdayHTML}
      ${eventHTML}
    `;

    if (isMain)
      (d <= 15 ? leftCol : rightCol).appendChild(div);
    else
      container.appendChild(div);
  }
}

/******** NAVIGAZIONE ********/
function changeMonth(delta){
  currentDate.setMonth(currentDate.getMonth() + delta);
  renderAll();
}

function resetToToday(){
  currentDate = new Date(today);
  renderAll();
}

/******** NOTE OVERLAY ********/
const NOTES_TIMEOUT_MS = 45000;
let notesOpen = false;
let notesTimer = null;

function resetNotesTimer(){
  if (notesTimer) clearTimeout(notesTimer);
  notesTimer = setTimeout(() => closeNotes(), NOTES_TIMEOUT_MS);
}

function openNotes(){
  const overlay = document.getElementById("notes-overlay");
  if (!overlay) return;

  notesOpen = true;
  overlay.classList.remove("hidden");
  overlay.setAttribute("aria-hidden", "false");

  renderNotesOverlay();
  refreshNotes().then(() => renderNotesOverlay());

  startFastNotesRefresh();
  resetNotesTimer();
}

function closeNotes(){
  const overlay = document.getElementById("notes-overlay");
  if (!overlay) return;

  notesOpen = false;
  overlay.classList.add("hidden");
  overlay.setAttribute("aria-hidden", "true");

  if (notesTimer) clearTimeout(notesTimer);
  notesTimer = null;

  stopFastNotesRefresh();
  resetToToday();
}

function toggleNotes(){
  if (!notesOpen) openNotes();
  else closeNotes();
}

(function notesUIBoot(){
  const closeBtn = document.getElementById("notes-close");
  const overlay = document.getElementById("notes-overlay");

  if (closeBtn) closeBtn.addEventListener("click", closeNotes);

  if (overlay){
    overlay.addEventListener("click", (e)=>{
      if (e.target === overlay) closeNotes();
    });
  }
})();

/******** AUTO ********/
renderAll();
refreshEvents();
setInterval(refreshEvents, 30000);

refreshNotes();
setInterval(refreshNotes, 10000);

let notesFastTimer = null;
function startFastNotesRefresh(){
  if (notesFastTimer) return;
  notesFastTimer = setInterval(() => {
    refreshNotes().then(renderNotesOverlay);
  }, 2000);
}
function stopFastNotesRefresh(){
  if (!notesFastTimer) return;
  clearInterval(notesFastTimer);
  notesFastTimer = null;
}

(function midnightReload(){
  const now = new Date();
  const midnight = new Date();
  midnight.setHours(24,0,0,0);
  setTimeout(() => location.reload(), midnight - now);
})();

(function nightMode(){
  function applyNightMode(){
    const now = new Date();
    const minutesNow = now.getHours() * 60 + now.getMinutes();

    const nightStart = 21 * 60;
    const nightEnd   = 6 * 60 + 30;

    const isNight = (minutesNow >= nightStart) || (minutesNow < nightEnd);
    document.body.classList.toggle("night", isNight);
  }

  applyNightMode();
  setInterval(applyNightMode, 60000);
})();

/******** TASTIERA ********/
(function keyboardMonthControl(){
  let last = 0;
  const cooldownMs = 70;
  let queued = 0;
  let queueTimer = null;

  function flushQueue(){
    if (queued === 0) return;
    const step = queued;
    queued = 0;
    changeMonth(step);
  }

  function enqueue(step){
    queued += step;
    if (queueTimer) clearTimeout(queueTimer);
    queueTimer = setTimeout(()=>{
      flushQueue();
      queueTimer = null;
    }, cooldownMs);
  }

  window.addEventListener("keydown", (e)=>{
    if (e.repeat) return;

    const now = Date.now();
    const tooSoon = (now - last < cooldownMs);
    last = now;

    if (e.key === "ArrowLeft"){
      e.preventDefault();
      if (tooSoon) enqueue(-1);
      else changeMonth(-1);

    } else if (e.key === "ArrowRight"){
      e.preventDefault();
      if (tooSoon) enqueue(1);
      else changeMonth(1);

    } else if (e.key === "Home"){
      e.preventDefault();
      if (notesOpen) closeNotes();
      else resetToToday();

    } else if (e.key === "n" || e.key === "N"){
      e.preventDefault();
      toggleNotes();
    }
  }, { passive:false });
})();

/******** KIOSK ROTATION + FILL ********/
(function kioskRotateAndFill(){
  const app = document.getElementById("calendar-app");
  if (!app) return;

  function setMode(){
    const w = window.innerWidth;
    const h = window.innerHeight;

    if (w > h) {
      app.classList.add("rotated");
      app.classList.remove("normal");
    } else {
      app.classList.add("normal");
      app.classList.remove("rotated");
    }
  }

  function setFillScale(){
    app.style.setProperty("--kiosk-scale", "1");

    const rect = app.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;

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

