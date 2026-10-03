# Human TODO

Things only the owner can do, grouped by what each item unblocks. Exact steps given.

## Task 0.1 — monorepo
- [ ] Move `.env` into `apps/web/` — Nuxt reads `.env` from the app folder. Do not commit it.
      The app still runs without it (credential-free dev mode serves the "local-dev" store),
      so the build is not blocked while this is pending.
- [ ] If the web app is served by Firebase Hosting, point its root/public directory at
      `apps/web` (`.output/public`) before the next deploy. `firebase.json` in this repo has
      no `hosting` block today, so check the Hosting console setting if one exists.

## Environment (Windows) — Smart App Control
- [ ] Decide how to handle Smart App Control, which blocks the Windows binary in
      `@oxc-parser/binding-win32-x64-msvc@0.143.0` — the exact version `nuxt@3.21.11` pins.
      Until then the repo works around it by pinning `oxc-parser@0.144.0` in the root
      `overrides` (see DECISIONS.md).
      To remove the workaround: Windows Security → App & browser control → Smart App Control
      → Off. Note it cannot be turned back on without resetting Windows, so the choice is
      yours; leaving the override in place is harmless.

## Task 0.4 — store compliance
- [ ] Deploy the updated `firestore.rules` (`firebase deploy --only firestore:rules`).
- [ ] Apple Services ID, key, and the Firebase console setup for "Sign in with Apple".

## Task 1.1 — mobile app identity
- [ ] Confirm the iOS bundle id / Android package (placeholder `com.klndr.app`). It cannot
      change after the first store release.

## Task 3.2 — rules tests
- [ ] Run the Firestore rules tests (the emulator needs Java installed).

## Task 4.2 — deep links
- [ ] Provide the Apple Team ID and the Android signing certificate SHA-256.

## Task 4.3 — artwork
- [ ] Provide final app-icon artwork.

## Task 4.4 — release
- [ ] Create the App Review demo account.
