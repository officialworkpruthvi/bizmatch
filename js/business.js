// business.js
import { db } from './firebaseConfig.js';
import { doc, getDoc } from "https://www.gstatic.com/firebasejs/12.4.0/firebase-firestore.js";

const params = new URLSearchParams(window.location.search);
const id = params.get('id');
const container = document.getElementById('business-details');

async function loadBusiness() {
  const docRef = doc(db, "businesses", id);
  const docSnap = await getDoc(docRef);

  if (docSnap.exists()) {
    const b = docSnap.data();
    container.innerHTML = `
      <h2>${b.title}</h2>
      <p>${b.description}</p>
      <h3>Setup Guide</h3>
      <p>${b.guide}</p>
      <h3>Videos & Resources</h3>
      ${b.videos.map(v => `<iframe src="${v}" width="100%" height="300"></iframe>`).join('')}
      <h3>Tools & Websites</h3>
      <ul>${b.tools.map(t => `<li><a href="${t}" target="_blank">${t}</a></li>`).join('')}</ul>
      <h3>Expected Income:</h3>
      <p>${b.income}</p>
    `;
  }
}

loadBusiness();
