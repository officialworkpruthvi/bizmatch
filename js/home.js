// js/home.js
import { BUSINESSES } from "./data.js";
import {
  db, doc, setDoc, getDoc, deleteDoc, collection, getDocs
} from "./firebase.js";
import { startTimer } from "./timer.js";

const USER = JSON.parse(localStorage.getItem("bm_user") || "null");

const feed = document.getElementById("feed");
const cardTpl = document.getElementById("cardTpl");
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const modalSummary = document.getElementById("modalSummary");
const modalDetails = document.getElementById("modalDetails");
const closeModal = document.getElementById("closeModal");
const modalSave = document.getElementById("modalSave");
const profileThumb = document.getElementById("profileThumb");
const endMessage = document.getElementById("endMessage");

let visibleCount = 4;
let savedMap = {}; // id -> boolean
let currentModalId = null;

function showProfileThumb() {
  if (USER?.photo) {
    profileThumb.src = USER.photo;
    profileThumb.classList.remove("hidden");
  }
}

async function loadSavedMap() {
  if (!USER || USER.uid.startsWith("guest_")) return;
  try {
    const col = collection(db, "users", USER.uid, "savedIdeas");
    const snaps = await getDocs(col);
    snaps.forEach(s => savedMap[s.id] = true);
  } catch (e) {
    console.warn("loadSavedMap err", e);
  }
}

function createCard(item) {
  const tpl = document.getElementById("cardTpl");
  const clone = tpl.content.cloneNode(true);
  const article = clone.querySelector(".idea-card");
  clone.querySelector(".card-title").innerText = item.title;
  clone.querySelector(".card-summary").innerText = item.summary;
  clone.querySelector(".income").innerText = item.income_1_3_months;
  clone.querySelector(".difficulty").innerText = item.difficulty;

  const viewBtn = clone.querySelector(".view-btn");
  const saveBtn = clone.querySelector(".save-btn");

  viewBtn.addEventListener("click", () => openModal(item));
  saveBtn.addEventListener("click", () => toggleSave(item, saveBtn));

  if (savedMap[item.id]) {
    saveBtn.innerText = "Saved";
    saveBtn.classList.add("btn-primary");
  } else {
    saveBtn.innerText = "Save";
    saveBtn.classList.remove("btn-primary");
  }

  return clone;
}

function renderFeed() {
  feed.innerHTML = "";
  const items = BUSINESSES.slice(0, visibleCount);
  items.forEach(i => {
    const c = createCard(i);
    feed.appendChild(c);
  });
  if (visibleCount >= BUSINESSES.length) {
    endMessage.classList.remove("hidden");
  } else {
    endMessage.classList.add("hidden");
  }
}

// lazy load on scroll
window.addEventListener("scroll", () => {
  if ((window.innerHeight + window.scrollY) >= (document.body.offsetHeight - 250)) {
    visibleCount = Math.min(BUSINESSES.length, visibleCount + 3);
    renderFeed();
  }
});

// Modal
function openModal(item) {
  currentModalId = item.id;
  modalTitle.innerText = item.title;
  modalSummary.innerText = item.summary;
  modalDetails.innerHTML = `
    <div class="muted">Estimated income (1-3 months): ${item.income_1_3_months}</div>
    <div class="muted">Time/day: ${item.timePerDay}</div>
    <h4 style="margin-top:12px">How to start</h4>
    <ul>${item.how.map(s => `<li>${s}</li>`).join("")}</ul>
    <h4 style="margin-top:12px">Suitable for</h4>
    <div class="muted">${item.interests.join(", ")}</div>
    <div style="margin-top:12px"><small class="muted">Only you can see saved notes; they are private.</small></div>
  `;
  // show modal
  modal.classList.remove("hidden");
}

closeModal.addEventListener("click", () => {
  modal.classList.add("hidden");
});

// Save from modal or card
async function toggleSave(item, btnElement) {
  if (!USER) {
    alert("Please sign in (or continue as guest) to save ideas.");
    return;
  }
  try {
    const ref = doc(db, "users", USER.uid, "savedIdeas", item.id);
    if (savedMap[item.id]) {
      await deleteDoc(ref);
      delete savedMap[item.id];
      if (btnElement) { btnElement.innerText = "Save"; btnElement.classList.remove("btn-primary"); }
      alert("Removed from saved ideas.");
    } else {
      await setDoc(ref, {
        businessId: item.id,
        title: item.title,
        savedAt: new Date(),
        notes: ""
      });
      savedMap[item.id] = true;
      if (btnElement) { btnElement.innerText = "Saved"; btnElement.classList.add("btn-primary"); }
      alert("Saved. You can add private notes in Saved page.");
    }
  } catch (e) {
    console.error("toggleSave err", e);
    alert("Failed to save. Check console.");
  }
}

modalSave.addEventListener("click", async () => {
  const item = BUSINESSES.find(b => b.id === currentModalId);
  if (item) {
    await toggleSave(item, null);
    modal.classList.add("hidden");
  }
});

// init
(async function init() {
  showProfileThumb();
  await loadSavedMap();
  renderFeed();
  // start timer
  startTimer("timerWidget");
})();
