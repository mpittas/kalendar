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
- [ ] Deploy the updated `firestore.rules` (`firebase deploy --only firestore:rules`). The change is
      small: the owner may now delete their own profile document and the three `meta/*` seed markers
      (which is what account deletion needs) — updates to those documents are still refused.
- [ ] Apple Services ID, key, and the Firebase console setup for "Sign in with Apple" (the web button
      is in place, but Firebase needs the provider enabled before it works).
- [ ] Fill in the placeholders on the privacy policy and on the deletion page: `[COMPANY LEGAL NAME]`,
      `[CONTACT EMAIL]` and `[DATE]` (in `apps/web/pages/privacy.vue` and
      `apps/web/pages/account-deletion.vue`), then review the draft policy.
- [ ] Once Firebase is configured, delete a throwaway account and check in the Firestore console that
      nothing is left. The dev-mode run proves the endpoint and the in-memory store, but the Firestore
      path and the new rules can only be exercised against a real project (the emulator needs Java —
      see Task 3.2).

## Task 1.1 — mobile app identity
- [ ] Confirm the iOS bundle id / Android package (placeholder `com.klndr.app`). It cannot
      change after the first store release.
- [ ] `eas init` once you have an Expo account (it writes the EAS project id). `eas.json` currently
      uses `"appVersionSource": "local"` so builds work without a project; switch it to `remote` if
      you would rather EAS own the build numbers.
- [ ] Put the Firebase native config files in `apps/mobile/` (`google-services.json`,
      `GoogleService-Info.plist`) for store builds, or point `GOOGLE_SERVICES_JSON` /
      `GOOGLE_SERVICES_INFO_PLIST` at them. They are gitignored, so EAS needs them as file
      environment variables.

## Task 3.2 — rules tests
- [ ] Run the Firestore rules tests (the emulator needs Java installed).

## Task 4.2 — deep links
- [ ] Provide the Apple Team ID and the Android signing certificate SHA-256.

## Task 4.3 — artwork
- [ ] Provide final app-icon artwork.

## Task 4.4 — release
- [ ] Create the App Review demo account.
