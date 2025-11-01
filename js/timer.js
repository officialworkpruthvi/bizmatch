// js/timer.js
import { auth, db, doc, setDoc } from "./firebase.js";

// Used in home.html and profile
const USER = JSON.parse(localStorage.getItem("bm_user") || "null");
if (!USER) {
  // no-op
}

let seconds = 0;
let interval = null;

function formatTime(s) {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}m ${sec}s`;
}

export function startTimer(widgetId = "timerWidget") {
  const widget = document.getElementById(widgetId);
  if (!widget) return;
  // restore from localStorage per day
  const todayKey = new Date().toISOString().slice(0,10);
  const storeKey = `bm_timer_${USER?.uid}_${todayKey}`;
  const saved = parseInt(localStorage.getItem(storeKey) || "0", 10);
  seconds = isNaN(saved) ? 0 : saved;

  widget.innerText = `⏱ ${formatTime(seconds)}`;

  interval = setInterval(async () => {
    seconds += 1;
    widget.innerText = `⏱ ${formatTime(seconds)}`;
    // persist locally every 5 sec
    localStorage.setItem(storeKey, String(seconds));
    // occasionally write to Firestore if user logged in (every 15s)
  }, 1000);

  // write to Firestore every 15 seconds if logged in and not guest
  setInterval(async () => {
    try {
      if (USER && !USER.uid.startsWith("guest_")) {
        const statDocRef = doc(db, "users", USER.uid, "stats", todayKey);
        await setDoc(statDocRef, { seconds, updatedAt: new Date() }, { merge: true });
      }
    } catch (e) {
      console.warn("Failed to write timer to Firestore", e);
    }
  }, 15000);
}
