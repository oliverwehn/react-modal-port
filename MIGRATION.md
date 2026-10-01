# Migrating from 0.x to 1.0

1.0 fixes several stacking bugs, makes `launchModal` type-safe and modernises the package. Most apps need only a few mechanical changes. Deprecated names keep working throughout 1.x (with a development-only console warning where noted) and will be removed in 2.0.

## Required changes

### `launchModal` types are now checked

Resolvers and props are checked against the modal component's props. Code that compiled before may now report real mistakes: misspelled resolver names, missing required props, or wrongly typed props. Fix the call site, or type the modal's props.

Explicit type arguments are no longer needed or supported:

```diff
- launchModal<DecisionModalProps>(DecisionModal, resolvers, props);
+ launchModal(DecisionModal, resolvers, props);
```

Modals typed loosely (for example `React.FC<ModalProps>` or `FC<Record<string, any>>`) still accept anything, as before.

### `onBackdropClick` moved from resolvers to options

```diff
- launchModal(Modal, { onClose, onBackdropClick: () => {} }, props);
+ launchModal(Modal, { onClose }, props, { onDismiss: () => {} });
```

The old form still works at runtime and logs a deprecation warning, but no longer type-checks. The modal component no longer receives `onBackdropClick` as a prop.

The backdrop now receives `onBackdropClick` only when the modal is dismissible; otherwise it is `undefined`.

### `updateStack` was removed

`useModalContext()` no longer exposes `updateStack`, and `stack` is read-only. To close a modal programmatically, use the handle returned by `launchModal`:

```ts
const { close } = launchModal(Modal, resolvers, props);
close();
```

To inspect the stack, use `useModalStack()`.

### `useModalState` is scoped to its modal

Inside a modal, `useModalState()` now reads and writes **that modal's** state, even while another modal is stacked on top. Previously it always targeted the top modal. Outside any modal it still targets the top one.

The setter also accepts an updater function. Prefer it over spreading a captured state object:

```diff
- updateModalState({ ...modalState, name: value });
+ updateModalState((prev) => ({ ...prev, name: value }));
```

### Package layout

- The UMD build (`dist/index.umd.js`) was removed; React 19 ships no UMD builds either. Use an ES module CDN such as esm.sh.
- Type declarations moved from `types/` to `dist/`. Deep imports of `react-modal-port/types/...` will break; import types from `react-modal-port`.
- Node ≥ 18 is required for tooling that resolves the package.

## Behaviour changes you get for free

- A resolver closes **its own** modal, even if other modals were stacked on top while it was running. Previously it closed whatever modal was on top.
- Calling resolvers more than once (double-clicks, two buttons) closes the modal once.
- A resolver that throws or rejects keeps its modal open and can be called again.
- Stacking the same component on itself mounts a fresh instance instead of reusing the previous one's component state.
- Components that only call `useModal()` no longer re-render when modals open, close or update their state.

## Renamed (old names still work)

| 0.x | 1.0 |
| --- | --- |
| `ModalContextProvider` | `ModalProvider` |
| `<ModalPort render={...}>` | `<ModalPort backdrop={...}>` |
| `useModalContext()` | `useModal()`, `useModalStack()`, `useModalState()` |
| `ModalProps`, `ModalResolver`, `LaunchModalResolvers`, `LaunchModalProps` | Your modal's own prop types |
