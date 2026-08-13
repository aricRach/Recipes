# Setup

This app needs a Firebase project with **Google sign-in** and **Firestore** enabled, plus a
**Cloudinary** account for recipe image uploads. Nothing will load past the login screen until you
complete the steps below.

## 1. Create the Firebase project

1. Go to the [Firebase console](https://console.firebase.google.com/) and click **Add project**.
2. Give it a name (e.g. `my-recipes`) and finish the wizard (Google Analytics is optional, skip it if you don't need it).

## 2. Register a Web app

1. In the project overview, click the **`</>`** (web) icon to add a web app.
2. Give it a nickname (e.g. `recipes-web`). You don't need Firebase Hosting at this step.
3. Firebase will show you a `firebaseConfig` object — copy it, you'll need it in step 6.

## 3. Enable Google sign-in

1. In the console, go to **Build → Authentication → Sign-in method**.
2. Click **Google**, enable it, pick a support email, and save.

## 4. Create Firestore

1. Go to **Build → Firestore Database → Create database**.
2. Choose **Production mode** (the rules in `firestore.rules` handle access control).
3. Pick a location close to you.

## 5. Create a Cloudinary account and unsigned upload preset

Recipe images are uploaded directly from the browser to Cloudinary (no backend involved), so this
app uses an **unsigned** upload preset rather than your API secret.

1. Sign up at [cloudinary.com](https://cloudinary.com/) and note your **Cloud name** from the
   dashboard.
2. Go to **Settings → Upload → Upload presets → Add upload preset**.
3. Set **Signing mode** to **Unsigned** and configure it to match what `storage.rules` used to
   enforce in Firebase Storage:
   - **Folder** — set to `recipe-images` and enable **"Use filename or externally-defined
     Public ID"** off / **Disable "use folder from client"**, so the client-supplied folder value
     is scoped correctly and the preset doesn't allow writing outside it.
   - **Max file size** — 5 MB, under **Upload Manipulations → Restrictions**.
   - **Allowed formats** — restrict to `jpg,png,webp,gif` under the same section.
   - **Unique filename** — on, and **Overwrite** — off, so uploads can't collide with or replace
     someone else's file.
4. Save and note the preset name.

Since the upload preset is unsigned, the cloud name + preset name are effectively public (they ship
in the compiled JS bundle) — the settings above limit *what* can be uploaded (size, format, folder),
but **not who** can upload; the app's sign-in screen doesn't gate this endpoint. Never put your
Cloudinary **API secret** anywhere in this app. If you later want uploads restricted to signed-in
users only, that requires a small backend (e.g. a Firebase Cloud Function that verifies the caller's
Firebase auth token and mints a signed Cloudinary upload signature).

## 6. Paste your config into the app

Copy the two template files to their real names — these are gitignored so your keys never get
committed:

```bash
cp src/environments/environment.template.ts src/environments/environment.ts
cp src/environments/environment.development.template.ts src/environments/environment.development.ts
```

Then open `environment.ts` and `environment.development.ts` and fill in the `firebase` object with
the one Firebase gave you in step 2, and the `cloudinary` object with the values from step 5:

```ts
firebase: {
  apiKey: '...',
  authDomain: '...',
  projectId: '...',
  storageBucket: '...',
  messagingSenderId: '...',
  appId: '...',
},
cloudinary: {
  cloudName: '...',
  uploadPreset: '...',
},
```

## 7. Deploy security rules and indexes

The repo already contains `firestore.rules` and `firestore.indexes.json` matching the app's data
model. Deploy them with the Firebase CLI:

```bash
npm install -g firebase-tools   # if you don't already have it
firebase login
firebase use --add              # pick the project you created above
firebase deploy --only firestore:rules,firestore:indexes
```

(Alternatively, paste the contents of `firestore.rules` directly into the **Rules** tab of
Firestore in the console.)

## 8. Run the app

```bash
npm install
npm start
```

Then open http://localhost:4200, sign in with Google, and create your first recipe.

## Notes

- The "check off ingredients while cooking" line-through state is session-only (kept in memory in
  the browser tab) — it intentionally isn't saved to Firestore, so it resets when you reload.
- Free-text search filters over whatever page of recipes is currently loaded (ordered by newest
  first, optionally narrowed by a label filter); it isn't a full-text search engine. That's fine
  for a personal/shared recipe box, but won't scale to a huge public catalog.
- To deploy the built app to Firebase Hosting: `npm run build` then `firebase deploy --only hosting`
  (the `firebase.json` in this repo already points at the Angular build output).
- Deleting or replacing a recipe's photo does not delete the old file from Cloudinary — deleting
  requires a signed request (your API secret), which can't safely live in this client-only app.
  Old images are simply orphaned in your Cloudinary media library; on the free tier this is cheap
  to ignore, or you can periodically clear unused images from the Cloudinary console. Adding a
  Firebase Cloud Function that calls the Cloudinary Admin API would automate cleanup if needed
  later.
