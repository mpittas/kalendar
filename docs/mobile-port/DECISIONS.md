# Decisions

Short entries for choices not already fixed in the plan. Newest last. Record any forced
deviation here.

## 2026-10-03 — fixed by the project brief (not reopened)
- Mobile app: Expo (React Native) for iOS and Android; the Nuxt app stays the production
  web app. Written so it could later run on web too, without porting the web app now.
- Repo layout: npm workspaces — `apps/web` (Nuxt), `apps/mobile` (Expo), `packages/core`
  (framework-free TS), `packages/tokens` (design tokens). Workspace packages ship TS source
  with no build step.
- Mobile stack: latest stable Expo SDK + Expo Router + strict TypeScript; CNG (never commit
  `ios/`/`android/`); Uniwind for styling (NativeWind v5 only if forced, and then say why);
  React Native Reusables components; lucide-react-native; gesture-handler + reanimated;
  expo-haptics; React Native Firebase; Google/Apple sign-in SDKs; TanStack Query; MMKV; Inter.
- Offline: v1 works offline behind a switch. Mobile starts on the HTTP API ("api" mode);
  Phase 3 adds "firestore" mode, which becomes the default only after the owner approves.
- Devices: phones only, portrait, iOS `supportsTablet: false`.
- Navigation: native tabs Day / Calendar / Library / Settings; checklist, notes, task editor
  and pickers open as native sheets.

## 2026-10-03 — open choices to record as they are made
- Account-deletion wording and the exact confirmation string.
- Privacy-policy placeholders (legal name, contact email).
- Whether the mobile boot splash uses the drawn calendar mark.

## 2026-10-03 — forced deviation: pin `oxc-parser` to 0.144.0

`nuxt@3.21.11` depends on `oxc-parser: ^0.143.0`, which for 0.x resolves to exactly
`0.143.0`. On this machine Windows Smart App Control is enforced
(`VerifiedAndReputablePolicyState = 1`) and blocks that package's Windows native binary:

    require('@oxc-parser/binding-win32-x64-msvc')
    -> "An Application Control policy has blocked this file."

The binary is unsigned and has no cloud reputation, so SAC refuses to load it. `Unblock-File`
does not help (there is no Mark-of-the-Web), and copying the file does not help either — the
verdict is per content hash. The identical packages at 0.142.0, 0.144.0, 0.146.0, 0.150.0 and
0.152.0 all load fine, so only that one hash is affected. Nuxt imports oxc-parser from
`loadNuxt`, so `nuxt prepare` (and therefore `npm install`, via its `postinstall`), `nuxt dev`
and `nuxt build` all failed.

Workaround applied:
- `overrides.oxc-parser = "0.144.0"` in the root `package.json`.
- The matching lockfile sections patched to 0.144.0: `node_modules/oxc-parser`, its 19
  platform `@oxc-parser/binding-*` entries, and `node_modules/@oxc-project/types`.

npm does not re-apply a changed override when the lockfile already has a satisfying entry, and
dropping the lockfile entirely floats every transitive dependency (rolldown moved 1.2.11 →
1.2.12, which crashes `nuxt prepare` with "Class extends value undefined"), so the original
lockfile was kept and only those sections were edited. Every other pinned version is
unchanged.

Review notes:
- This is a machine-specific workaround, not an upstream requirement. 0.144.0 is one minor
  above Nuxt's tested range; the parser API Nuxt uses is unchanged and typecheck, build and
  dev all pass.
- Remove the override once Smart App Control is off or Nuxt bumps oxc-parser.
- The cleanest fix is to turn Smart App Control off, but it cannot be re-enabled without
  resetting Windows, so that is the owner's decision (see HUMAN_TODO.md).

