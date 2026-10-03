# @klndr/mobile — the iOS and Android app

Expo (React Native) + Expo Router, sharing `@klndr/core` and `@klndr/tokens` with the web app. The
work is planned in `docs/mobile-port/PLAN.md`; the reasoning lives in `DECISIONS.md` next to it.

## Commands

Run from the repository root, so the workspace dependencies resolve:

```sh
npm install                          # once, at the root — installs every workspace
npm run typecheck                    # web, mobile, core and tokens
npm run start   -w apps/mobile       # Metro, then press a / i
npm run android -w apps/mobile       # Metro + an Android device or emulator
npm run ios     -w apps/mobile       # Metro + an iOS device or simulator
```

`npm start` needs a development build (`eas build --profile development`, see `eas.json`): once a
native module is in play, Expo Go cannot run the app.

## Environment

Copy `.env.example` to `.env`, which is gitignored; that file lists the names and their meanings.
`EXPO_PUBLIC_*` values are inlined into the bundle at build time and read through `src/env.ts`.
