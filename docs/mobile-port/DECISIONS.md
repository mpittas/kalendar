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
