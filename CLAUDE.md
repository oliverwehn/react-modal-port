# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project

`react-modal-port` is a small, dependency-free React 19 library for launching type-checked modals from any component and rendering them at a single outlet. The public API is documented in `readme.md`; 0.x → 1.0 changes are in `MIGRATION.md` and `CHANGELOG.md`.

## Commands

- `npm run verify`: the full gate (lint → typecheck → test:coverage → build → check:package). `prepublishOnly` and CI run the same chain.
- `npm test`: Vitest (jsdom). It also type-checks `*.test-d.tsx` files, because `typecheck.enabled` is set in `vitest.config.ts`.
- Single test: `npx vitest run src/__tests__/resolvers.test.tsx -t "B1"`
- `npm run test:coverage`: thresholds are 100% for lines, functions and statements, and 95% for branches. `src/index.ts` and `src/types.ts` are excluded.
- `npm run typecheck`: `tsc` over src, tests and configs (`tsconfig.json`). The build uses `tsconfig.build.json`, which covers `src` without the tests.
- `npm run build`: tsup emits `dist/index.{js,cjs,d.ts,d.cts}`, with a `"use client"` banner.
- `npm run check:package`: publint, `attw --pack`, then `scripts/smoke-test.mjs`. The smoke test packs the tarball, installs it into a temporary consumer, loads it as both CJS and ESM, and checks the file list.

CI runs on Node 22, 24 and 26, because Vitest, jsdom and ESLint require Node 22 or newer.

## Architecture

- `src/store.ts`: a pure reducer over a stack of `ModalItem`s, with `push`, `remove` and `setState`. Items are matched by **id**, never by position.
- `src/context.tsx`: `ModalProvider` keeps the reducer state in three contexts:
  - `ActionsContext`: holds `launchModal` and `setState`, memoised once and never changing, so `useModal()` consumers never re-render.
  - `StackContext`: the stack items.
  - `ItemContext`: the id of the modal a component is rendered inside.

  `launchModal` assigns the id outside the reducer (for StrictMode safety). It wraps every resolver, and `onDismiss`, with a shared per-modal `settled` flag. A wrapped resolver resolves once, removes its own id, and on throw resets the flag and rethrows. An `onBackdropClick` key inside the resolvers is legacy; it is mapped to `onDismiss` and triggers a warning.
- `src/modal-port.tsx`: renders only the top item, inside `<ItemContext key={id}>`. The key forces a remount per modal, and the context lets `useModalState` target its own modal. Resolvers are spread after props, so resolvers win on a name collision. Optionally renders through `createPortal` into `container`.
- `src/types.ts`: `LaunchModal` is generic over the component `C`, with props `P = ComponentProps<C>`. `R` is inferred from the keys of the `resolvers` object. `LaunchRest` makes `props` required only when required props remain. Change these types together with `src/__tests__/types.test-d.tsx`, which has `@ts-expect-error` cases for each rejected mistake.

Every public export, types included, must be listed in `src/index.ts`. The smoke test checks the runtime export names.

## Tests

`src/__tests__/` has these layers:
- `store` (reducer unit tests)
- `resolvers`, `modal-port` and `hooks` (behaviour tests through the public API)
- `render-count` (re-render isolation)
- `strict-mode`
- `types.test-d.tsx`

The regression tests for the 0.3 bugs are labelled B1 to B4 in their test names. Use `TestBackdrop` from `helpers.tsx`: it deliberately does not stop event propagation, so the port's own target check is exercised.

## Repo notes

- `dist/` and `types/` are build output and are not tracked.
- `updated-script.js` is an untracked browser demo that imports the published package from esm.sh. It is not part of the build.
