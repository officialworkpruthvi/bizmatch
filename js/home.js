// js/home.js  -> REPLACE your existing file with this content
// Robust modal handling + feed rendering + save toggle
import { BUSINESSES } from "./data.js";
import {
  db, doc, setDoc, deleteDoc, collection, getDocs, getDoc
} from "./firebase.js";
import { startTimer } from "./timer.js";

const USER = JSON.parse(localStorage.getItem("bm_user") || "null");

// DOM shortcuts (safe find)
const feed = document.getElementById("feed");
const cardTpl = document.getElementById("cardTpl");
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modalTitle");
const modalSummary = document.getElementById("modalSummary");
const modalDetails = document.getElementById("modalDetails");
const closeModalBtn = document.getElementById("closeModal");
const modalSaveBtn = document.getElementById("modalSave");
const profileThumb = document.getElementById("profileThumb");
const endMessage = document.getElementById("endMessage");

if (!feed || !cardTpl || !modal) {
  console.error("Essential DOM elements missing in home.html. Check that ids: feed, cardTpl, modal exist.");
}

// Keep track of saved state and current modal item
let visibleCount = 4;
let savedMap = {}; // { id: true }
let currentModalId = null;

// Show profile thumbnail if user has photo
function showProfileThumb() {
  try {
    if (USER && USER.photo) {
      profileThumb.src = USER.photo;
      profileThumb.classList.remove("hidden");
    }
  } catch (e) { /* ignore */ }
}

// Load saved items for current user (so Save button shows correct state)
async function loadSavedMap() {
  if (!USER || USER.uid?.startsWith?.("guest_")) return;
  try {
    const colRef = collection(db, "users", USER.uid, "savedIdeas");
    const snaps = await getDocs(colRef);
    snaps.forEach(s => {
      savedMap[s.id] = true;
    });
  } catch (e) {
    console.warn("loadSavedMap error:", e);
  }
}

// Create card DOM (cloning template)
function createCard(item) {
  const tpl = document.getElementById("cardTpl");
  if (!tpl) return document.createTextNode("Template missing");
  const clone = tpl.content.cloneNode(true);
  const article = clone.querySelector(".idea-card");

  const titleEl = clone.querySelector(".card-title");
  const summaryEl = clone.querySelector(".card-summary");
  const incomeEl = clone.querySelector(".income");
  const diffEl = clone.querySelector(".difficulty");
  const viewBtn = clone.querySelector(".view-btn");
  const saveBtn = clone.querySelector(".save-btn");

  if (titleEl) titleEl.innerText = item.title;
  if (summaryEl) summaryEl.innerText = item.summary;
  if (incomeEl) incomeEl.innerText = item.income_1_3_months;
  if (diffEl) diffEl.innerText = item.difficulty;

  // view modal
  if (viewBtn) {
    viewBtn.addEventListener("click", () => openModal(item));
  }

  // save toggle
  if (saveBtn) {
    updateSaveButtonUI(saveBtn, !!savedMap[item.id]);
    saveBtn.addEventListener("click", async () => {
      await toggleSave(item, saveBtn);
    });
  }

  return clone;
}

function updateSaveButtonUI(btn, isSaved) {
  if (!btn) return;
  if (isSaved) {
    btn.innerText = "Saved";
    btn.classList.add("btn-primary");
  } else {
    btn.innerText = "Save";
    btn.classList.remove("btn-primary");
  }
}

// Render feed
function renderFeed() {
  try {
    feed.innerHTML = "";
    const items = BUSINESSES.slice(0, visibleCount);
    items.forEach(i => {
      const c = createCard(i);
      feed.appendChild(c);
    });
    if (visibleCount >= BUSINESSES.length) {
      endMessage?.classList.remove("hidden");
    } else {
      endMessage?.classList.add("hidden");
    }
  } catch (e) {
    console.error("renderFeed error:", e);
  }
}

// Infinite scroll to load more
window.addEventListener("scroll", () => {
  if ((window.innerHeight + window.scrollY) >= (document.body.offsetHeight - 250)) {
    const old = visibleCount;
    visibleCount = Math.min(BUSINESSES.length, visibleCount + 3);
    if (visibleCount !== old) renderFeed();
  }
});

// OPEN modal and populate content
function openModal(item) {
  try {
    currentModalId = item.id;
    if (modalTitle) modalTitle.innerText = item.title || "";
    if (modalSummary) modalSummary.innerText = item.summary || "";
    if (modalDetails) {
      // build details HTML (guaranteed to be visible)
      modalDetails.innerHTML = `
        <div class="muted">Estimated income (1-3 months): <strong>${item.income_1_3_months}</strong></div>
        <div class="muted">Time/day: <strong>${item.timePerDay}</strong></div>
        <h4 style="margin-top:12px">How to start</h4>
        <ul>${(item.how || []).map(s => `<li>${s}</li>`).join("")}</ul>
        <h4 style="margin-top:12px">Suitable for</h4>
        <div class="muted">${(item.interests || []).join(", ")}</div>
        <div style="margin-top:12px"><small class="muted">Private notes are saved under your account.</small></div>
      `;
    }

    // Show Save button label depending on savedMap
    if (modalSaveBtn) updateSaveButtonUI(modalSaveBtn, !!savedMap[item.id]);

    // Show modal
    modal.classList.remove("hidden");
    // ensure modal-content gets focus for accessibility
    const content = modal.querySelector(".modal-content");
    if (content) content.focus?.();
  } catch (e) {
    console.error("openModal error:", e);
  }
}

// CLOSE modal function
function closeModal() {
  try {
    modal.classList.add("hidden");
    currentModalId = null;
    // clear modal contents (optional)
    // modalTitle.innerText = "";
    // modalSummary.innerText = "";
    // modalDetails.innerHTML = "";
  } catch (e) {
    console.error("closeModal error:", e);
  }
}

// Toggle save/un-save in Firestore
async function toggleSave(item, btnElement = null) {
  if (!USER) {
    alert("Please sign in (or continue as guest) to save ideas.");
    return;
  }
  try {
    const ref = doc(db, "users", USER.uid, "savedIdeas", item.id);
    if (savedMap[item.id]) {
      // delete
      await deleteDoc(ref);
      delete savedMap[item.id];
      updateSaveButtonUI(btnElement, false);
      alert("Removed from saved ideas.");
    } else {
      await setDoc(ref, {
        businessId: item.id,
        title: item.title,
        savedAt: new Date(),
        notes: ""
      });
      savedMap[item.id] = true;
      updateSaveButtonUI(btnElement, true);
      alert("Saved. Add notes in Saved page.");
    }
    // also update modal save button UI if present
    if (modalSaveBtn) updateSaveButtonUI(modalSaveBtn, !!savedMap[item.id]);
  } catch (e) {
    console.error("toggleSave error:", e);
    alert("Failed to save. Check console.");
  }
}

// Attach close listeners safely
function attachModalListeners() {
  try {
    if (closeModalBtn) {
      closeModalBtn.addEventListener("click", (e) => {
        e.preventDefault();
        closeModal();
      });
    }
    if (modalSaveBtn) {
      modalSaveBtn.addEventListener("click", async (e) => {
        e.preventDefault();
        if (!currentModalId) {
          // nothing selected
          closeModal();
          return;
        }
        const item = BUSINESSES.find(b => b.id === currentModalId);
        if (!item) {
          console.warn("Modal save: item not found for id", currentModalId);
          closeModal();
          return;
        }
        await toggleSave(item, null); // save from modal
        closeModal();
      });
    }

    // clicking outside modal-content closes modal
    modal.addEventListener("click", (ev) => {
      // if user clicked on the overlay (modal itself) and not the content
      if (ev.target === modal) {
        closeModal();
      }
    });

    // Escape key closes modal
    window.addEventListener("keydown", (ev) => {
      if (ev.key === "Escape") {
        if (!modal.classList.contains("hidden")) closeModal();
      }
    });
  } catch (e) {
    console.error("attachModalListeners error:", e);
  }
}

// Initialization
(async function init() {
  try {
    showProfileThumb();
    await loadSavedMap();
    renderFeed();
    attachModalListeners();
    startTimer("timerWidget");
    console.log("home.js initialized");
  } catch (e) {
    console.error("home.js init error:", e);
  }
})();
