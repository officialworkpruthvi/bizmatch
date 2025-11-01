# BizMatch (Vanilla HTML/CSS/JS + Firebase)

## What this is
A mobile-first "business idea discovery" web app built with plain HTML/CSS/JavaScript and Firebase (Auth + Firestore).  
Features:
- Google sign-in (or guest)
- Infinite-scroll feed of curated business ideas
- Save ideas and write private notes (saved in Firestore under your user only)
- Session timer with daily stat stored in Firestore
- Mobile-first pink/premium UI

## Quick setup (local)
1. Create folder `bizmatch` and copy files from this package into it (index.html, home.html, profile.html, css/, js/).
2. Create a Firebase project:
   - Go to https://console.firebase.google.com
   - Add project -> Add Web app
   - Copy the config values and paste them into `js/firebase.js` (replace placeholders).
   - In Authentication -> Sign-in method -> enable *Google*.
   - In Authentication -> add `http://localhost` (and later your Vercel domain) to authorized domains.
   - In Firestore -> Create database -> Start in test mode (for dev).
3. Serve the files:
   - Option A: Use VS Code Live Server extension -> Open `index.html`.
   - Option B: Open `index.html` directly in browser (for Firebase popup to work it's better to use a local server; Live Server is recommended).
4. Click **Sign in with Google** and grant permissions. You should be redirected to `home.html`.
5. Explore, save ideas, and visit `profile.html` to see saved ideas and notes.

## Deploy to Vercel
1. Initialize a Git repo and push the project to GitHub.
2. Go to https://vercel.com -> New Project -> import your repo.
3. In Vercel Project Settings -> Environment Variables: you do NOT necessarily need env vars because firebase config is client-side; just ensure your firebase config in `js/firebase.js` is correct.
4. Deploy.

## Firestore structure
- users/{uid}/savedIdeas/{businessId} -> { businessId, title, notes, savedAt, updatedAt }
- users/{uid}/stats/{YYYY-MM-DD} -> { seconds, updatedAt }

## Notes & next steps
- Expand `js/data.js` to include 100+ curated ideas.
- When ready for AI suggestions, create a backend API that calls OpenAI/GPT and returns recommendations.
- For production, consider Firestore security rules (to restrict read/write to authenticated users on their paths).

Enjoy — ask me to:
- Generate 100+ business entries to paste into `js/data.js`
- Help you configure Firestore security rules
- Create a zipped repo you can download
