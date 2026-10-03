# Mobile port plan

Native iOS and Android apps for klndr (DayForge), built with Expo (React Native) while the
Nuxt web app in `apps/web` keeps working unchanged. Tick each task as it finishes. Stop at
each CHECKPOINT and post a review summary.

Legend: `[ ]` todo, `[x]` done, `[~]` in progress / blocked.

## Phase 0 — groundwork (the web app keeps working)

### 0.1 Monorepo
- [x] Commit 1: pure `git mv` of the Nuxt app into `apps/web` (app.vue, nuxt.config.ts,
      assets, components, composables, lib, middleware, pages, plugins, server, utils,
      tsconfig.json, package.json, .env.example).
- [x] Commit 2: root `package.json` with npm workspaces, updated root `package-lock.json`,
      any fixes.
- [x] Keep at the root: firebase.json, .firebaserc, firestore.rules, firestore.indexes.json,
      PRODUCT.md, DESIGN.md, .agents/, agent/, skills-lock.json, .mcp.json.
- [x] Update `.claude/launch.json` so its configs still start the web app.
- [x] Acceptance: one `npm install` at the root works; web typecheck and build pass;
      `npm run dev -w apps/web` serves the same app.
- [x] Deviation logged: `oxc-parser` pinned to 0.144.0 (Smart App Control blocks the binary
      in the 0.143.0 package nuxt pins). See DECISIONS.md.
- [ ] HUMAN_TODO: move `.env` into `apps/web/`.
- [ ] HUMAN_TODO: if the web app is served by Firebase Hosting, point it at `apps/web`.

### 0.2 packages/core (@klndr/core)
- [x] Move: types and constants, time, layout.
- [x] Move: pure validation helpers and the profile model.
- [x] Move: color keys, labels and canonicalization (Tailwind classes stay in web).
- [x] Move: category helpers.
- [x] Move: emoji search and recents, behind an injected key-value storage interface.
- [x] Move: markdown, split into a parser (small AST) and an HTML renderer (byte-identical).
- [x] Move: API client as `createApiClient({ baseUrl, getToken })`.
- [x] Move: the `Store` interface and its types.
- [x] Move: undo/redo engine from useTimelineHistory as a plain class with `subscribe`
      (the Vue composable becomes a thin wrapper).
- [x] Nuxt (incl. the Nitro server build) compiles the TypeScript source; Metro must too.
- [x] Acceptance: web imports from `@klndr/core` and behaves the same.
- [x] Vitest: time, layout (layoutDay, columnsBeside, lanesFor, withLanes).
- [x] Vitest: markdown parity on fixtures, toggleTaskLine.
- [x] Vitest: validation.
- [x] Vitest: profile cleanPatch.
- [x] Vitest: the undo engine.
- [x] Also covered: colour canonicalization, the category helpers, emoji search and recents, and the
      API client (URL building, token, error mapping) — 10 suites, 251 tests.
- [x] Logged in DECISIONS.md: the markdown AST is by block and inline markup stays one ordered pass
      (so the HTML stays byte-identical), and what stayed in the web app as a thin adapter.

### 0.3 packages/tokens (@klndr/tokens)
- [x] Light and dark theme colors (exact values from apps/web/assets/css/main.css).
- [x] Radii, spacing and the type scale.
- [x] Every palette role in lib/colors.ts for all 12 colors (block, blockDone, chip, dot,
      accent, selected, ghost, icon, meta, check: background, border, text) as concrete sRGB
      for light and dark.
- [x] Resolve the palette: read Tailwind v4 oklch from tailwindcss/theme.css, apply alpha
      modifiers, compute `color-mix(in oklab, …)` exactly with culori.
- [x] Generate the CSS-variable blocks main.css imports, without changing any computed value.
- [x] Acceptance: tests pin a sample of resolved colors; the web's CSS variables are unchanged.
- [x] The theme data is the source of truth in `src/theme.ts`; `npm run generate -w packages/tokens`
      writes `generated/theme.css` (which main.css imports) and `generated/palette.ts` (the palette as
      data). Tests fail if either drifts, and `culori` is a devDependency only, so no app computes
      colours at runtime.
- [x] Logged in DECISIONS.md: Tailwind v4's oklch palette resolves to values that differ from the v3
      hexes (indigo-500 is #615fff, not #6366f1), and how a plain versus a `dark:` utility resolves.

### 0.4 Store compliance in the web app and server
- [ ] Account deletion: "Delete account" section on the profile page (typed confirmation +
      re-authentication).
- [ ] Account deletion deletes all user data (every subcollection under users/{uid}, the meta
      markers, then the profile doc), then the Auth user.
- [ ] Data part as a `Store` method (MemoryStore + FirestoreStore) behind `DELETE /api/account`.
- [ ] firestore.rules: owner may delete `users/{uid}` and `meta/*`; loosen nothing else.
- [ ] Apple-linked accounts: revoke the Apple token on deletion.
- [ ] HUMAN_TODO: deploy the rules.
- [ ] Public `/account-deletion` page (in-app steps + email request). Add to PUBLIC_PATHS.
- [ ] Public `/privacy` page (draft policy, placeholders, marked DRAFT). Add to PUBLIC_PATHS.
- [ ] Link both from the landing footer, the login page and the signup page.
- [ ] Sign in with Apple on the web (Firebase OAuthProvider "apple.com") next to Google.
- [ ] HUMAN_TODO: Apple Services ID, key, and Firebase console setup.

### CHECKPOINT A
- [ ] Stop and post a review summary: what moved, what changed in the web app, verification
      output, the HUMAN_TODO list.

## Phase 1 — mobile foundation

### 1.1 Create apps/mobile
- [ ] `create-expo-app` (latest stable SDK, TypeScript, Expo Router).
- [ ] app.config.ts: name "klndr", scheme "klndr", portrait, automatic light/dark.
- [ ] app.config.ts: iOS bundle id + Android package from one constant, placeholder
      "com.klndr.app".
- [ ] app.config.ts: Apple sign-in capability, Android edge-to-edge.
- [ ] app.config.ts: typed env vars EXPO_PUBLIC_API_BASE_URL, EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
      EXPO_PUBLIC_DEMO_MODE, EXPO_PUBLIC_DATA_MODE.
- [ ] app.config.ts: Firebase native config file paths from env vars.
- [ ] eas.json: development (dev client, internal distribution), preview, production.
- [ ] Acceptance: web typecheck still passes (scope apps/web compilerOptions.types if
      @types/react leaks in).
- [ ] HUMAN_TODO: confirm the bundle id before the first store build.

### 1.2 Design system
- [ ] Uniwind wired to @klndr/tokens.
- [ ] Theme preference (system/light/dark) persisted in MMKV.
- [ ] Inter loaded via expo-font; tabular numerals for every time.
- [ ] Primitives: Text (DESIGN.md type scale).
- [ ] Primitives: Button (primary, secondary, ghost, destructive; 44px min height).
- [ ] Primitives: IconButton, TextField, Switch, SegmentedControl, ListRow, Chip.
- [ ] Primitives: Toast with an Undo action.
- [ ] Primitives: ColorSwatch, EmptyState, Skeleton.
- [ ] Sheets use Expo Router form-sheet presentation with detents.
- [ ] Menus and date/time pickers use native controls (Expo UI or platform pickers).
- [ ] Every primitive: accessibility roles/labels, respects reduce-motion, large text sizes.

### 1.3 Auth
- [ ] React Native Firebase auth with email/password and password reset.
- [ ] Native Google sign-in.
- [ ] Sign in with Apple on iOS (nonce flow).
- [ ] Apple sign-in on Android through Firebase's OAuth provider flow.
- [ ] First sign-in creates users/{uid} exactly like loadProfile in useAuth.ts.
- [ ] Expo Router auth gate: signed-out stack vs the tabs.
- [ ] Demo mode (EXPO_PUBLIC_DEMO_MODE=1): no sign-in; API calls without a token.
- [ ] Platform adapters: .native.ts (RNFirebase) and .web.ts (Firebase JS SDK).

### 1.4 Data
- [ ] TanStack Query hooks over the core API client (day tasks, range tasks, templates,
      categories, checklist items, day checklist, day notes, profile).
- [ ] Optimistic mutations matching DayPlanner.vue (temp ids, rollback, toasts).
- [ ] Query cache persisted in MMKV.
- [ ] Refetch on foreground and on reconnect.

## Phase 2 — screens

### 2.1 Day tab (centerpiece)
- [ ] Header: date title (tap → date picker sheet), Today, prev/next, undo/redo.
- [ ] Swipe horizontally between days; routines shelf above the timeline.
- [ ] Geometry: SLOT_MINUTES 30, SLOT_HEIGHT 48, SNAP_MINUTES 15, bit-for-bit formulas.
- [ ] Short-block and two-line rules; hour gutter; now-line with a live pill (every 30 s).
- [ ] On open, scroll to the first block (or 07:00).
- [ ] Tap empty grid → task editor at the 15-minute slot.
- [ ] Tap a block → edit; tap its ring → toggle done.
- [ ] Long-press 300 ms → lift (scale 1.02, shadow, medium haptic).
- [ ] Drag: follow finger, snap to 15 min, selection haptic on snap change.
- [ ] Drag: horizontal picks the column via core layout functions; neighbours animate aside.
- [ ] Drag: start/end times in the gutter; 72px edge auto-scroll, up to 16px/frame.
- [ ] Drag: release → optimistic save + undo entry.
- [ ] Resize from the bottom edge in 15-min steps (min 15, up to midnight), haptics + label.
- [ ] Only discrete changes cross to the JS thread; nothing re-renders every frame.
- [ ] Accessibility: announce title + time range; actions to move/lengthen/etc.
- [ ] Unit-test geometry, snapping and lane planning.
- [ ] HUMAN_TODO: try the timeline on a device build.

### 2.2 Task editor sheet
- [ ] Title, emoji (emoji picker sheet), category (native menu + "new category").
- [ ] Start time and duration (native pickers, DURATION_CHOICES).
- [ ] Notes and template quick-pick.
- [ ] Save; delete with an undo toast.

### 2.3 Checklist and notes sheets
- [ ] Checklist: toggle, quick add (every day / only today), skip + restore, edit, delete.
- [ ] Notes: monospace editor, preview as native views from the core markdown parser,
      tappable task checkboxes (toggleTaskLine), same saving/error behavior as web.

### 2.4 Calendar tab
- [ ] Month grid with each day's first blocks and a "+N" overflow.
- [ ] Week start from the profile; swipe between months; jump-to-month picker.
- [ ] Tap a day → open it in the Day tab.

### 2.5 Library tab
- [ ] Categories with their activities, and search.
- [ ] Create/edit/delete activities.
- [ ] Create/rename/recolor categories.
- [ ] Delete a category with "move its activities to…" or "delete them too".

### 2.6 Settings tab
- [ ] Display name, timezone, week starts on Monday, default block duration.
- [ ] Theme, and reminder lead time (used in 4.1).
- [ ] Privacy policy link, sign out, and delete account (the 0.4 flow).

### 2.7 Polish
- [ ] Empty, loading (skeleton) and error states everywhere.
- [ ] Haptics only on meaningful actions.
- [ ] Keyboard avoidance in every sheet; no layout jumps.
- [ ] Correct in dark mode and at the largest text size.


## Phase 3 — offline-first data mode

### 3.1 Shared store logic
- [ ] Move server/utils/db.ts logic into @klndr/core as `createStore(db)`.
- [ ] Small document-database interface: get, query, batched commit with server timestamps.
- [ ] Adapters: REST client (server), in-memory (tests/dev), Firebase JS SDK (web),
      React Native Firebase (mobile).
- [ ] Server behavior unchanged; prove with core tests on the in-memory adapter.

### 3.2 Categories by id
- [ ] Add categoryId to templates and tasks (keep writing the name too).
- [ ] Resolve name and color by id, falling back to the name.
- [ ] Backfill existing docs lazily per user, behind a new meta marker.
- [ ] Update firestore.rules; write rules tests with @firebase/rules-unit-testing.
- [ ] HUMAN_TODO: run the rules tests (the emulator needs Java).

### 3.3 Mobile "firestore" mode
- [ ] React Native Firebase with offline persistence.
- [ ] Snapshot listeners feed the same TanStack Query cache.
- [ ] Writes apply locally at once; the UI never waits for the server.
- [ ] Subtle "Offline: changes will sync" indicator.

### 3.4 Keep "api" as the default in every build profile.

### CHECKPOINT B
- [ ] Stop and report the data-model changes, the rules diff, the test results, and exact
      steps to try "firestore" mode on a real account before switching the default.

## Phase 4 — store readiness

### 4.1 Local reminders (expo-notifications)
- [ ] Optional alert N minutes before each block, set in Settings.
- [ ] Schedule only the next 24–48 h; reschedule whenever blocks change.
- [ ] Ask for permission in context, not at launch.

### 4.2 Deep links
- [ ] klndr://day/YYYY-MM-DD and the web /day/YYYY-MM-DD and /calendar URLs.
- [ ] Add apple-app-site-association and assetlinks.json under apps/web/public/.well-known.
- [ ] HUMAN_TODO: Apple Team ID and the Android signing certificate SHA-256.

### 4.3 App icon and splash
- [ ] Generate from the calendar mark in nuxt.config.ts (SVG → PNG with sharp), including
      Android adaptive and monochrome icons.
- [ ] HUMAN_TODO: final artwork.

### 4.4 docs/mobile-port/RELEASE.md
- [ ] Apple App Privacy and Google Play Data safety answers derived from the code.
- [ ] Store listing drafts (name, subtitle, description, keywords, category, URLs).
- [ ] A screenshot list.
- [ ] App Review notes with a demo account. HUMAN_TODO: create the account.
- [ ] Exact EAS steps (dev builds, TestFlight, Play closed test, submission).

### CHECKPOINT C
- [ ] Final report.

## Out of scope
- Porting/replacing the web app or landing page with Expo web.
- Tablet layouts, widgets and Live Activities, upgrading Nuxt.

