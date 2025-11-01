// js/auth.js
import { auth, provider, signInWithPopup, onAuthStateChanged, signOut } from "./firebase.js";

const loginBtn = document.getElementById("loginBtn");
const continueGuest = document.getElementById("continueGuest");
const greeting = document.getElementById("greeting");
const userPhoto = document.getElementById("userPhoto");

function saveUserLocally(user) {
  const payload = {
    name: user.displayName || "Guest",
    email: user.email || "",
    photo: user.photoURL || "",
    uid: user.uid || "guest_" + Date.now()
  };
  localStorage.setItem("bm_user", JSON.stringify(payload));
  return payload;
}

loginBtn.addEventListener("click", async () => {
  try {
    const res = await signInWithPopup(auth, provider);
    const user = res.user;
    saveUserLocally(user);
    window.location.href = "home.html";
  } catch (e) {
    console.error("Sign-in error", e);
    alert("Sign-in failed — check console");
  }
});

continueGuest.addEventListener("click", () => {
  const guest = { name: "Guest", email: "", photo: "", uid: "guest_" + Date.now() };
  localStorage.setItem("bm_user", JSON.stringify(guest));
  window.location.href = "home.html";
});

// show if already logged in (in case of returning user)
onAuthStateChanged(auth, (u) => {
  if (u) {
    greeting.innerText = `Welcome, ${u.displayName}`;
    if (u.photoURL) {
      userPhoto.src = u.photoURL;
      userPhoto.classList.remove("hidden");
    }
    saveUserLocally(u);
  } else {
    // not logged in
  }
});
