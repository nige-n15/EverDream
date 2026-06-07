# EverDream — App.tsx Cleanup

## Context
`App.tsx` contains a floating "Generate Dream Assets" button and the PWA install prompt. The floating button is a UX problem — it overlaps content and the functionality already exists inside the Record and Assets screens.

## Goal
Simplify `App.tsx` to be a clean shell wrapper with no floating elements.

## What To Do

1. Remove the floating "Generate Dream Assets" button from `App.tsx`
   - The button's functionality (image generation) is already accessible via the Record screen
   - The Assets screen displays generated images
   - No feature is lost by removing this button

2. Keep `<PWAInstallPrompt />` — it's non-intrusive and handles itself

3. The final structure should be:
   ```
   <ProtectedRoute>
     <DreamJournalApp />
     <PWAInstallPrompt />
   </ProtectedRoute>
   ```

## Constraints
- Do NOT remove `ProtectedRoute` — auth gate must stay
- Do NOT remove `PWAInstallPrompt` — PWA install flow must stay
- Do NOT change any routing or navigation

## Verification
- `npm run build` passes
- No floating button visible on any screen
- PWA install prompt still appears when appropriate
