# EverDream — Accessibility (ARIA + Keyboard Navigation)

## Context
The app has zero ARIA labels, no keyboard navigation support, and no screen reader compatibility. This was flagged as BUG-014 in the QA audit and blocks app store submission.

## Goal
Add accessibility attributes across all components so the app is navigable by keyboard and readable by screen readers.

## What To Do

### Shell Navigation (`src/components/Shell.tsx`)
- Add `role="navigation"` and `aria-label="Main navigation"` to the `<nav>` element
- Add `aria-label` to every nav button (e.g. "Go to Journal", "Record a dream", "Settings")
- Ensure all buttons have visible focus indicators

### Every Screen Component (`src/screens/*.tsx`)
- Add `role="main"` to the outermost wrapper
- Exactly one `<h1>` per screen (the screen title)
- `aria-label` on every `<button>` that doesn't have visible text (icon buttons)
- `aria-label` on every `<input>` field
- `role="switch"` and `aria-checked` on all toggle buttons
- Back buttons: `aria-label="Back to [parent screen]"`

### Modals and Overlays
- `role="dialog"` on all modal backdrop containers
- `aria-label` on close/dismiss buttons
- Focus should be trapped inside modals when open

### Focus Management
- All interactive elements must have visible focus states
- Use `focus:outline-none focus:ring-2 focus:ring-sage/30` pattern (matches existing codebase)

## Constraints
- Do NOT change visual design — only add attributes
- Do NOT change component structure or props
- Apply to ALL screen files, both existing and newly extracted

## Verification
- `npm run build` passes
- Tab key navigates through all interactive elements with visible focus
- Screen reader announces nav items, headings, and buttons correctly
