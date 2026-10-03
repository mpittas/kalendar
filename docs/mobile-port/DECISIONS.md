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

## 2026-10-03 — 0.2: what @klndr/core is, and what stayed in the web app

`packages/core` ships TypeScript source and has no build step: Vite compiles it for the web app,
Vitest compiles it for its own tests, and Metro will compile it for the mobile app.
`apps/web/nuxt.config.ts` adds it to `build.transpile`, which Nuxt passes on to Nitro's
`externals.inline` (`@nuxt/nitro-server` builds that list from it). Without it Nitro would treat the
package as an external and try to `require` a `.ts` file at runtime. Verified on the build: no file
in `.output/server` mentions `@klndr/core`, and all twelve core modules appear in its source maps.

What did not move, because it belongs to the framework or to the bundler:
- `apps/web/lib/colors.ts` keeps the Tailwind classes (`PALETTE`, `paletteOf`); the keys, the labels
  and `canonicalColor` come from core.
- `apps/web/lib/emojis.ts` keeps the two `emojibase-data` dynamic imports and passes `localStorage`
  in as core's `KeyValueStorage`; grouping, search and the recent list are core's.
- `apps/web/lib/api.ts` is three lines now: `createApiClient({ getToken: getIdToken })`.
- `server/utils/validation.ts` keeps the two helpers that need the request (`parseId`,
  `readJsonObject`) and re-exports the pure ones, so nitro's auto-imports still find them under
  `server/utils`. Checked in the regenerated `.nuxt/types/nitro-imports.d.ts`.
- `useCategories` keeps the shared Vue state; the pure helpers (`withImplicitCategories`,
  `sortCategoriesByName`, `colorOfCategory`, `nextCategoryColor`, `CategoryEntry`) are core's.
- `useTimelineHistory` keeps only the Vue wiring around core's `TimelineHistory`.
- The `Store` interface moved; its two implementations stayed (they become `createStore(db)` in 3.1).

## 2026-10-03 — 0.2: the markdown split, and why the AST is by block

The plan asks for a parser with a small AST and a byte-identical HTML renderer. Here the split is by
block: `parseMarkdown(source)` returns paragraphs, headings, rules, quotes, fenced code and lists
(each item keeping its source line, its indentation and its checkbox), and `renderMarkdownHtml(blocks)`
turns that back into HTML.

Inline markup is deliberately not a tree. The inline passes (code spans, links, strong, em, del) are
global and ordered, and they are allowed to span a code span or wrap a link label — `**`code`**` has
to come out as `<strong><code>code</code></strong>`, and `[*x*](url)` emphasises inside the link — so
a tree built by a left-to-right tokeniser would produce different HTML in those cases. `renderInlineHtml`
is exported for the renderer to use, and the whole output is pinned by 53 fixtures generated from the
implementation *before* it moved (`packages/core/test/fixtures/markdown-cases.ts`; regenerate on
purpose, never to make a test pass). If 2.3 wants inline nodes for the native preview, those fixtures
are the contract to keep.

## 2026-10-03 — 0.2: Vitest 5.0.3, and a lockfile that only grew

Vitest 5.0.3 accepts Vite 6, 7 or 8, and the repo already had Vite 8.3.1, so nothing was duplicated
and no new native binary was pulled in — the Smart App Control problem only ever hit
`oxc-parser@0.143.0`. The install added 14 packages and 260 lockfile lines, all additions: the
`oxc-parser` pin and every other pinned version are untouched, so the fragile part of the 0.1
workaround is intact.

## 2026-10-03 — 0.2: tooling used for the move itself

The import rewrite (37 files importing the four moved modules) was done with a one-shot codemod that
merges each file's moved imports into a single `@klndr/core` statement and wraps the long ones. Its
first version was wrong — its statement regex matched across import statements and mangled the
formatting — so the affected files were reverted from git and the codemod fixed to match whole
statements by line before being re-run. The markdown fixtures were generated the same way: a one-shot
script run against the old implementation, then deleted. Neither script is part of the repo.

