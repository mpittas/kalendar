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

## 2026-10-03 — 0.3: how @klndr/tokens is built

`packages/tokens` has three inputs and two generated outputs. `src/theme.ts` is the theme's single
source of truth; `apps/web/lib/colors.ts` stays the place the palette classes live (the generator
reads the file and parses the object literal, so there is no second copy to keep in sync); and
Tailwind's own `theme.css` is what those classes name, because that is what a browser resolves them
to at runtime.

`npm run generate -w packages/tokens` writes two committed files: `generated/theme.css` (which
`main.css` imports as `@klndr/tokens/theme.css`) and `generated/palette.ts` (the palette as data).
Both are in git, so the web build needs no pre-step and a reviewer can read the diff; tests re-run the
generator's pure functions and fail if either file drifts. `culori` (and `@types/culori`, because
culori ships no types) is a devDependency — the apps read plain numbers and never do colour maths.

Moving `@theme inline` into an imported file was the one real risk in this, because Tailwind builds
its utilities from it. It is fine: the built stylesheet is byte-identical (see PROGRESS.md).

## 2026-10-03 — 0.3: Tailwind v4's palette resolves to different sRGB than the v3 hexes

Tailwind v4 defines its palette in oklch, and converting those values to sRGB does **not** return the
hexes the v3 palette is remembered by: `indigo-500` is `oklch(58.5% 0.233 277.117)`, which resolves to
`#615fff`, not `#6366f1`, and `rose-500` resolves to `#ff2056`, not `#f43f5e`. The low-chroma steps
(`indigo-50`, `slate-200`) do match their published hexes; the saturated mid-tones do not, because v4
re-derived them in oklch.

These tokens therefore describe what the web app actually paints: a browser resolves
`--color-indigo-500` to that oklch value and gamut-maps it to sRGB, which is what the generator does
with culori's `toGamut("rgb", "oklch")` (CSS Color 4's algorithm, the default `toGamut` arguments).

Two things follow. The values are sRGB, so on a P3 display the rendered colour is more saturated than
what the tokens say — if the phone should use the wide-gamut colour, that is a Phase 2 decision. And
the pinned tests use resolved values, not the remembered hexes.

## 2026-10-03 — 0.3: how a palette class becomes a value

- A plain utility (`bg-indigo-50`) applies in **both** themes; only a `dark:` one applies in the dark
  theme alone. Resolving dark therefore starts from the plain utilities and lets the `dark:` ones
  override them, and because the class lists keep their `dark:` utilities last, applying them in order
  lands where the cascade does. (Reading plain utilities as light-only would have left `dot`,
  `swatch`, `accent` and half of `selected` empty in dark mode.)
- An `/NN` alpha modifier becomes an 8-digit hex (`border-indigo-200/80` → `#c6d2ffcc`), which is what
  a phone paints without extra work. Every role also resolves its `hover:` variants so the data is
  complete; the mobile app has no pointer, so it simply will not use them.
- `color-mix(in oklab, var(--color-x-500) 16%, var(--background))` is computed in oklab with exactly
  those weights: 0% returns the colour it is mixed over, 100% returns the colour itself, and both are
  asserted (a check that needs no external oracle).
- The generator throws on anything it cannot read — an unknown Tailwind colour, a utility that is not
  `bg-`/`border-`/`text-`, a `color-mix` in another colour space — so adding a class the resolver does
  not understand fails loudly instead of quietly emitting a wrong colour.
- `swatch` is resolved too, even though it only repeats `dot`'s colour, because it is a role in the
  web palette and leaving a hole would invite a second source of truth.

## 2026-10-03 — 0.4: who deletes what when an account goes

The data and the identity are removed by different parties, in this order:

1. The client re-authenticates. Firebase refuses `deleteUser` when the sign-in is old, and it is the
   honest moment to ask anyway: a password account types its password, Google and Apple re-open their
   pop-up. This is also the only place the Apple access token comes from.
2. `DELETE /api/account` deletes the data: the collections first, the profile document last, so a
   failure half way leaves a profile that still says who owns the leftovers. Deletes on this path are
   unconditional (`currentDocument` preconditions are dropped), and each collection is emptied in
   batches of 300 until it is empty, so an account of any size goes.
3. Apple-linked accounts revoke the Apple token. Firebase 12 has no `User.revokeAccessToken()`; the
   revocation is the top-level `revokeAccessToken(auth, token)` and it wants the Apple *access* token,
   which only comes back from a fresh Apple credential — hence the pop-up in step 1. Failing to revoke
   is logged, not fatal: the account still has to go.
4. `deleteUser` on the client. Only the signed-in user may delete their own Auth user, and the API
   deliberately holds no admin credentials, so this cannot move to the server.

The server also forgets its in-memory seed markers, so a new account seeds from scratch.

## 2026-10-03 — 0.4: the rules change is four lines of `allow delete`

`users/{uid}` gained `allow delete: if isOwner(uid)` (it used to be `false`), and each of the three
`meta/*` markers gained its own `allow delete: if isOwner(uid)` while keeping `allow update: if false`.
Account deletion is the only thing that needs any of it; ownership, shapes, limits and immutability are
otherwise untouched.

## 2026-10-03 — 0.4: the policy pages, and what they claim

`/privacy` and `/account-deletion` are public (in PUBLIC_PATHS) and describe what the code actually
does: Firebase Authentication for identity (email/password, Google, Apple), Cloud Firestore for the
data under the user's own uid, a server that passes the caller's token through instead of holding
admin credentials, no analytics or advertising, and localStorage used only for the theme and the recent
emojis. The deletion page gives the in-app steps and an email route for someone who can no longer sign
in. The policy is marked DRAFT and carries `[COMPANY LEGAL NAME]`, `[CONTACT EMAIL]` and `[DATE]`
placeholders — HUMAN_TODO, for the owner to fill in before the app is published.

