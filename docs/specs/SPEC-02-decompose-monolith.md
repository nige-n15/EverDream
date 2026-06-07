# EverDream — Decompose Monolith: Screen Extraction

## Context
`DreamJournalApp.tsx` is a 3,286-line monolithic component that renders 16 different screens inline using `{route.screen === 'x' && (...)}` conditionals. Only `HomeScreen` and `ReflectionScreen` have been extracted so far.

## Goal
Extract each inline screen into a standalone component under `src/screens/`. Each screen should be a self-contained React component that receives all its data and callbacks via props.

## Architecture

### Component Pattern
- Each screen lives at `src/screens/ScreenName.tsx`
- Export as named export: `export function ScreenName(props: ScreenNameProps)`
- Props interface defined at the top of the file
- Import in `DreamJournalApp.tsx` and replace the inline JSX with `<ScreenName {...props} />`

### Design System Constraints
- Light/pearl theme only: `bg-cream`, `border-line`, `text-ink`, `text-muted`, `text-sage`, `text-duskDeep`
- Serif headings: `font-serif`
- Cards: `rounded-2xl border border-line bg-cream shadow-paper`
- No dark theme colors (`bg-white/5`, `text-slate-*`, `bg-purple-600`, etc.)
- Match existing patterns from `HomeScreen.tsx` and `ReflectionScreen.tsx`

### Inline Helper Components to Reuse
Instead of importing `InsightCard` and `EmptyState` from `../components/`, use the inline versions defined at the bottom of `DreamJournalApp.tsx` as a reference. Copy the same structure into your screen file or extract them to a shared location and import from there.

## Screens to Extract (in priority order)

| # | Screen | Route key | Approx lines inline | Notes |
|---|--------|-----------|---------------------|-------|
| 1 | Journal | `journal` | ~70 | Search + category filter + dream card list |
| 2 | Insights | `insights`, `dashboard` | ~90 | Real analytics: streak, themes, mood timeline, sleep metrics, correlations |
| 3 | More | `more` | ~80 | Sub-nav hub: wearables, assets, achievements, privacy, import. Theme toggle included |
| 4 | Privacy | `privacy` | ~160 | Data export, account deletion, privacy toggles, terms acceptance |
| 5 | Achievements | `achievements` | ~50 | Achievement list with locked/unlocked states, empty state |
| 6 | Assets | `assets` | ~30 | Generated dream image gallery with lightbox viewer |
| 7 | Wearables | `wearables` | ~25 | Wraps existing `WearableSettings` component with back button |
| 8 | Record | `record` | ~50 | Wraps existing `DreamCapture` component |
| 9 | Dream Detail | `dream` | ~120 | Individual dream view with analysis, image, NFT mint |

## Shared Task for Each Screen

For every screen listed above:

1. Read the inline JSX block from `DreamJournalApp.tsx`
2. Identify all state variables and callbacks the block references
3. Define a props interface with exactly those values
4. Create `src/screens/ScreenName.tsx` implementing the same UI
5. Replace the inline JSX in `DreamJournalApp.tsx` with `<ScreenName {...allProps} />`
6. Remove unused imports from `DreamJournalApp.tsx` if they were only used by the extracted screen

## Constraints
- Do NOT change routing logic or navigation behavior
- Do NOT change any state management — screens receive state via props, they don't own it
- Keep accessibility in mind: `aria-label` on all buttons and inputs, proper heading hierarchy
- After each extraction, verify `npm run build` passes
- Commit each screen separately with message: `refactor: extract [ScreenName] from DreamJournalApp`

## Verification (after all extractions)
- `npm run build` passes
- All screens render identically to before
- No orphaned imports in `DreamJournalApp.tsx`
- DreamJournalApp.tsx reduced from ~3,286 lines to under ~1,500 lines
