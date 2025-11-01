import { auth, db } from './firebaseConfig.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-auth.js";
import { doc, setDoc } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

const buttons = document.querySelectorAll('.interest');
const saveBtn = document.getElementById('saveInterests');
let selected = [];

buttons.forEach(btn => {
  btn.addEventListener('click', () => {
    btn.classList.toggle('selected');
    const text = btn.textContent;
    selected.includes(text)
      ? selected = selected.filter(i => i !== text)
      : selected.push(text);
  });
});

saveBtn.addEventListener('click', async () => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      await setDoc(doc(db, "users", user.uid), {
        interests: selected
      }, { merge: true });
      window.location.href = "home.html";
    }
  });
});
