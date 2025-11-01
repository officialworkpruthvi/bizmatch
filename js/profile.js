// js/profile.js
import { db, doc, getDoc, setDoc, collection, getDocs, deleteDoc } from "./firebase.js";
import { startTimer } from "./timer.js";

const USER = JSON.parse(localStorage.getItem("bm_user") || "null");
const savedContent = document.getElementById("savedContent");
const noSaved = document.getElementById("noSaved");
const profileThumb2 = document.getElementById("profileThumb2");

function showThumb() {
  if (USER?.photo) {
    profileThumb2.src = USER.photo;
    profileThumb2.classList.remove("hidden");
  }
}

async function loadSaved() {
  if (!USER) {
    noSaved.innerText = "Please login to see saved ideas.";
    return;
  }
  try {
    const col = collection(db, "users", USER.uid, "savedIdeas");
    const snaps = await getDocs(col);
    const list = snaps.docs.map(s => ({ id: s.id, ...s.data() }));
    if (list.length === 0) {
      noSaved.classList.remove("hidden");
      savedContent.innerHTML = "";
      return;
    }
    noSaved.classList.add("hidden");
    savedContent.innerHTML = "";
    for (const item of list) {
      const card = document.createElement("div");
      card.className = "saved-card";
      card.innerHTML = `
        <div style="display:flex;justify-content:space-between;align-items:center">
          <div><strong>${item.title}</strong><div class="muted small">${new Date(item.savedAt?.seconds ? item.savedAt.seconds*1000 : item.savedAt).toLocaleString()}</div></div>
          <div style="display:flex;gap:6px">
            <button class="btn btn-sm remove-btn">Remove</button>
          </div>
        </div>
        <div style="margin-top:8px">
          <textarea class="note-area" placeholder="Your private notes..."></textarea>
          <div style="display:flex;justify-content:flex-end;margin-top:8px"><button class="btn btn-sm save-note">Save Note</button></div>
        </div>
      `;
      const txt = card.querySelector(".note-area");
      const saveBtn = card.querySelector(".save-note");
      const removeBtn = card.querySelector(".remove-btn");

      // load notes
      const ref = doc(db, "users", USER.uid, "savedIdeas", item.id);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        txt.value = snap.data().notes || "";
      }

      saveBtn.addEventListener("click", async () => {
        try {
          await setDoc(ref, { notes: txt.value, updatedAt: new Date() }, { merge: true });
          alert("Notes saved.");
        } catch (e) {
          console.error(e);
          alert("Failed to save notes.");
        }
      });

      removeBtn.addEventListener("click", async () => {
        if (!confirm("Remove saved idea?")) return;
        await deleteDoc(ref);
        card.remove();
      });

      savedContent.appendChild(card);
    }
  } catch (e) {
    console.error("loadSaved err", e);
    savedContent.innerHTML = "<div class='muted'>Failed to load saved ideas.</div>";
  }
}

(async function init() {
  showThumb();
  await loadSaved();
  startTimer("timerWidgetProfile");
})();
