# Shared, saved data on Firebase (Cloud Firestore + Anonymous Auth)

Site: https://koolkisan.web.app · Firebase project `studio-7384096917-d1286` · chamber `CH-DEMO`.

## How it works
* The pages (`trust.html`, `alert.html`, the home page tiles) read and write **Cloud Firestore** directly from the browser,
  signed in with **Anonymous Auth** (no backend yet, so no Blaze plan needed). The Firebase JS SDK is bundled locally
  (`web/vendor/firebase/kk-firebase.js`, built by `tools/firebase_bundle`), no CDN.
* The Firebase config comes from Firebase Hosting's reserved URL `/__/firebase/init.json` – nothing secret in the repo.
* `firestore.rules` protects the data: the ledger is **append-only** (a block can only be created at head + 1 with the
  right `prevHash`; no update or delete for anyone), the room can never hold more than 150 kg or a bay more than its
  limit, and owner-only actions (void, mark reviewed, run the chamber clock, alerts, reset) need the device's uid in
  `chambers/CH-DEMO.admins`. The FIRST device that opens the site creates `CH-DEMO` and becomes its owner.
* Reset demo = a new "epoch": everybody sees an empty room, nothing is deleted.
* When Firestore cannot be reached (file://, Vercel, no network) the pages run the **offline demo** with the banner
  "Offline demo – changes not saved" (kept in that browser only).
* The signing key for the slip QR is still the clearly labelled demo key (a real key needs the backend).

## Firebase console – one time
1. https://console.firebase.google.com → project **studio-7384096917-d1286**.
2. **Build → Authentication → Get started → Sign-in method → Anonymous → Enable → Save.**
3. **Authentication → Settings → Authorized domains → Add domain:** `koolkisan.web.app` (and `koolkisan.firebaseapp.com`).
4. **Build → Firestore Database → Create database →** Production mode → location **asia-south1 (Mumbai)** → Enable.
   (The rules are uploaded by the deploy command below; you do not need to paste them.)
5. **Project settings (gear) → General → Your apps:** there must be a **Web app** (`</>`). If there is none: Add app → Web →
   nickname `koolkisan-web` → Register (no need to copy the config). This is what `/__/firebase/init.json` serves.
6. Open **https://koolkisan.web.app/trust.html?role=owner on the judge laptop FIRST** – that device becomes the owner.
   Its device id is shown on the owner page. To add another owner device: Firestore → `chambers` → `CH-DEMO` →
   `admins` → add the uid shown on that device's owner page.

## Deploy (Windows, Command Prompt)
```
cd /d C:\path\to\coldstorage
git pull
firebase use studio-7384096917-d1286
firebase deploy --only hosting:koolkisan,firestore
```

## Test locally with the emulator (optional)
```
firebase emulators:start --only firestore,auth --project demo-koolkisan
python -m http.server 8766 --directory static_site
```
Then open `http://localhost:8766/trust.html?emu=127.0.0.1:8080&authemu=127.0.0.1:9099` (two browsers = two devices).
`python -m pytest tests/test_shared_data.py` runs the live tests (sync, rules, reset) when the emulator is running.
