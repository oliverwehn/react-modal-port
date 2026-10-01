# Changelog

## 1.0.0

A full rework for correctness, type safety and packaging. See [MIGRATION.md](./MIGRATION.md) for upgrade steps.

### Breaking changes

- `launchModal` checks resolvers and props against the modal component's props. Explicit type arguments are no longer supported.
- `onBackdropClick` moved from `resolvers` to `options.onDismiss`. The resolver form still works at runtime, with a deprecation warning.
- `updateStack` was removed from the context. `stack` is now read-only.
- `useModalState()` used inside a modal is scoped to that modal.
- The UMD build and the `types/` folder were removed. Types now ship in `dist/` as `.d.ts` and `.d.cts`.

### Fixes

- A resolver closes its own modal instead of the top of the stack, so async resolvers no longer close modals that were stacked on top of them.
- A modal resolves only once, even when resolvers are called repeatedly.
- A resolver that throws or rejects leaves its modal open and can be retried. Previously the rejection went unhandled.
- Stacked instances of the same component no longer share component state.
- `useModal()` consumers no longer re-render on every stack or modal-state change.
- TypeScript users who `require()` the package under `node16`/`nodenext` resolution get correct CommonJS types.

### Features

- `launchModal` returns a handle `{ id, close() }`.
- `useModalStack()` gives a read-only view of the stack.
- `useModalState` accepts updater functions.
- `ModalPort` gained `container` (render through a portal) and `onStackChange`. The backdrop receives `modalId` and `stackSize`, and gets `onBackdropClick` only when the modal is dismissible.
- `ModalProvider` and `ModalPort backdrop` are the new names; `ModalContextProvider` and `render` remain as aliases.
- The bundles are marked `"use client"` for React Server Components.

### Compatibility

- Tested against React 19.0.0, the latest patch of 19.0, 19.1, 19.2 and 19.3, and the React canary. CI runs this matrix.

### Tooling

- Build with tsup (ESM + CJS). Tests run on Vitest with type tests, StrictMode and render-count checks, 100% coverage, and a packed-tarball smoke test. Lint, publint, arethetypeswrong and CI were added.

## 0.3.0

- Require React 19.

## 0.2.x and earlier

- Generic modal props, context improvements and initial releases.
