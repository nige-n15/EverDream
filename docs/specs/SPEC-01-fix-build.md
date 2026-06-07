# EverDream — Build Fix

## Problem
`npm run build` fails. Vite 8.x requires platform-specific native bindings (`rolldown`) but the installed `node_modules` only has Windows bindings. The devDependencies also have version mismatches (`@vitejs/plugin-react` at v6 era with vite 8).

## What To Do
1. Downgrade `package.json` devDependencies to a vite 5.x stack (vite ^5.4.11, plugin-react ^4.3.4, vitest ^2.1.8)
2. Delete `node_modules` and `package-lock.json`, reinstall from WSL
3. Verify build passes
4. Commit and push

## Constraints
- Do NOT change any application code — only `package.json` devDependencies and lockfile
- All existing functionality must work identically after reinstall

## Verification
- `npm run build` — must succeed with zero errors
- `npm test` — all tests pass
