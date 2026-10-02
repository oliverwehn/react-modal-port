# react-modal-port

[![npm version](https://img.shields.io/npm/v/react-modal-port.svg)](https://www.npmjs.com/package/react-modal-port)
[![CI](https://github.com/oliverwehn/react-modal-port/actions/workflows/ci.yml/badge.svg)](https://github.com/oliverwehn/react-modal-port/actions/workflows/ci.yml)
[![license: MIT](https://img.shields.io/npm/l/react-modal-port.svg)](./LICENSE)

**Headless modal management for React.** You own the modal: markup, styles, accessibility and animation. react-modal-port owns the logic: launching modals from anywhere, stacking them, resolving them (async included) and keeping per-modal state, with every launch type-checked against your component's props.

**Demos on CodePen:** [Usage examples](https://codepen.io/oliverwehn/pen/018e18fb-0f15-724c-8fdf-4f47406f37d9) · [Animation examples](https://codepen.io/oliverwehn/pen/01a0fb4d-2c07-7c34-af66-1ac02a634b22) (sources in [`demo/`](./demo))

---

- [Headless by design](#headless-by-design)
- [How it works](#how-it-works)
- [Installation](#installation)
- [Quick start](#quick-start)
- [Type-safe launches](#type-safe-launches)
- [Recipe: `await confirm()`](#recipe-await-confirm)
- [Async resolvers](#async-resolvers)
- [Dismissible modals](#dismissible-modals)
- [Stacked modals and modal state](#stacked-modals-and-modal-state)
- [Accessible backdrop with native `<dialog>`](#accessible-backdrop-with-native-dialog)
- [Animating modals in and out](#animating-modals-in-and-out)
- [Next.js and Server Components](#nextjs-and-server-components)
- [API reference](#api-reference)

## Headless by design

Most modal libraries give you a modal *component* and ask you to bend your design system around it. react-modal-port is the opposite: it ships **no markup and no styles**. Your modals are ordinary React components, and the library manages *which* modal is shown, *when* it closes and *what state it keeps*.

| react-modal-port handles | You decide |
| --- | --- |
| Launching a modal from any component, hook or other modal | What modals and backdrops look like |
| A stack of modals, rendered at one place in your app | Markup, styling and your design system's dialog component |
| Resolving: a modal stays open until its resolver has run (or its promise has settled), then exactly that modal closes | Focus handling, scroll locking and other accessibility details |
| Per-modal state that survives while other modals cover it | Enter and exit animations |
| Type-checking every launch against the modal's props | Where in the DOM modals render (in place or via a portal) |

Because the backdrop is your component too, react-modal-port works with a native `<dialog>`, with your component library's dialog, or with a plain `<div>`.

## How it works

1. **`<ModalProvider>`** holds the modal stack. Wrap your app in it.
2. **`<ModalPort>`** is the outlet: it renders the top modal of the stack inside your **backdrop** component.
3. **`launchModal(Component, resolvers, props)`**, from the `useModal()` hook, pushes a modal onto the stack.
4. **Resolvers** are the modal's function props that *end* it. When the modal calls one, your function runs, and then that modal is removed. Any other function you pass in `props` is just a callback and leaves the modal open.
5. **Modal state** (`useModalState()`) belongs to one modal. It is kept while other modals are stacked on top and can be handed on to them.

## Installation

```bash
npm install react-modal-port
```

Requires React 19. Upgrading from 0.x? See [MIGRATION.md](./MIGRATION.md).

## Quick start

A modal is a plain component. Its resolvers, here `onConfirm` and `onCancel`, are normal props:

```tsx
// confirm-modal.tsx
export type ConfirmModalProps = {
  question: string;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmModal({ question, onConfirm, onCancel }: ConfirmModalProps) {
  return (
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="confirm-title">
      <h2 id="confirm-title">{question}</h2>
      <button type="button" onClick={onCancel}>Cancel</button>
      <button type="button" onClick={onConfirm}>Confirm</button>
    </div>
  );
}
```

Add the provider and the port once, with a backdrop of your own:

```tsx
// app.tsx
import type { ReactNode } from 'react';
import { ModalPort, ModalProvider, type ModalPortRenderProps } from 'react-modal-port';

function Backdrop({ children, onBackdropClick }: ModalPortRenderProps) {
  return (
    <div className="backdrop" onClick={onBackdropClick}>
      {children}
    </div>
  );
}

export function App({ children }: { children: ReactNode }) {
  return (
    <ModalProvider>
      {children}
      <ModalPort backdrop={Backdrop} />
    </ModalProvider>
  );
}
```

Launch the modal from anywhere inside the provider:

```tsx
// delete-button.tsx
import { useModal } from 'react-modal-port';
import { ConfirmModal } from './confirm-modal';

export function DeleteButton({ onDelete }: { onDelete: () => void }) {
  const launchModal = useModal();

  return (
    <button
      type="button"
      onClick={() =>
        launchModal(
          ConfirmModal,
          { onConfirm: onDelete, onCancel: () => {} }, // resolvers: each one closes the modal
          { question: 'Delete this file?' },             // the remaining props
        )
      }
    >
      Delete
    </button>
  );
}
```

That's the whole setup. Styling `.backdrop` and `.modal` is up to you; for a ready-made accessible backdrop, see [Accessible backdrop with native `<dialog>`](#accessible-backdrop-with-native-dialog).

## Type-safe launches

`launchModal(Component, resolvers, props?, options?)` reads the modal's props from `Component` and checks the other arguments against them:

| Argument | Description |
| --- | --- |
| `Component` | The modal component. |
| `resolvers` | The modal's function props that close it. The modal is removed after the resolver returns, or after its promise settles. Only the first resolver call counts; later calls are ignored. |
| `props` | The modal's remaining props. Required when required props remain, otherwise optional. |
| `options` | `{ onDismiss }`, see [Dismissible modals](#dismissible-modals). |

TypeScript catches the usual mistakes:

```tsx
const noop = () => {};
launchModal(ConfirmModal, { onConfirm: noop, onCancle: noop }, { question: '?' }); // ✗ unknown resolver "onCancle"
launchModal(ConfirmModal, { onConfirm: noop, onCancel: noop });                    // ✗ prop "question" is missing
launchModal(ConfirmModal, { onConfirm: noop, onCancel: noop }, { question: 42 });  // ✗ "question" must be a string
```

`launchModal` returns a handle, `{ id, close() }`. `close()` removes that modal without calling a resolver, for example after a timeout.

## Recipe: `await confirm()`

Because resolvers are plain functions, a promise-based API is a few lines on top of `launchModal`:

```tsx
import { useCallback } from 'react';
import { useModal } from 'react-modal-port';
import { ConfirmModal } from './confirm-modal';

export function useConfirm() {
  const launchModal = useModal();
  return useCallback(
    (question: string) =>
      new Promise<boolean>((resolve) => {
        launchModal(
          ConfirmModal,
          { onConfirm: () => resolve(true), onCancel: () => resolve(false) },
          { question },
          { onDismiss: () => resolve(false) },
        );
      }),
    [launchModal],
  );
}

// In a component:
//   const confirm = useConfirm();
//   if (await confirm('Discard your changes?')) discard();
```

## Async resolvers

When a resolver returns a promise, the modal stays open until the promise settles:

```tsx
// SaveModal is your component with these props; saveDraft() is your API call.
type SaveModalProps = { onSave: () => Promise<void>; onCancel: () => void };

launchModal(SaveModal, {
  onSave: async () => {
    await saveDraft(); // the modal is still shown while this runs
  },
  onCancel: () => {},
});
```

- **Fulfilled:** the modal closes. Only *this* modal is removed, even if other modals were stacked on top of it in the meantime.
- **Rejected or thrown:** the modal stays open, and the promise returned to the modal component rejects with the same error. The modal can show the error and let the user try again.

## Dismissible modals

Pass `onDismiss` in the options to let users close a modal from outside its content:

```tsx
// In DeleteButton from the quick start:
launchModal(
  ConfirmModal,
  { onConfirm: onDelete, onCancel: () => {} },
  { question: 'Delete this file?' },
  { onDismiss: () => console.log('dismissed') },
);
```

Your backdrop then receives `onBackdropClick`. It calls `onDismiss` and closes the modal, but only for clicks on the backdrop itself, not for clicks inside the modal. For modals launched without `onDismiss`, `onBackdropClick` is `undefined`, so the backdrop can tell whether the current modal is dismissible and wire Escape the same way.

## Stacked modals and modal state

A modal can launch another one. The port shows the top modal and returns to the previous one when the top one closes.

Only the top modal is mounted, so component state (`useState`) inside a covered modal is lost. For anything that should outlive a nested modal, use **modal state**: `useModalState()` gives each modal its own state, which is kept while other modals cover it and discarded when the modal closes. Since it's ordinary data, the modal can also hand it on to the next modal.

Here a name form opens the confirmation from the quick start on top of itself. The confirmation gets the name from the form's modal state, and confirming resolves the form with it as well:

```tsx
import { useModal, useModalState } from 'react-modal-port';
import { ConfirmModal } from './confirm-modal';

export function AskForNameModal({ provideName }: { provideName: (name: string) => void }) {
  const launchModal = useModal();
  const [state, setState] = useModalState<{ name: string }>();
  const name = state?.name ?? '';

  const next = () =>
    launchModal(
      ConfirmModal,
      {
        onConfirm: () => provideName(name), // resolves this form too, with its state
        onCancel: () => {},                 // back to the form, input intact
      },
      { question: `Call you “${name}”?` },  // modal state handed on as a prop
    );

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-labelledby="name-title">
      <h2 id="name-title">How should we call you?</h2>
      <input
        aria-label="Name"
        value={name}
        onChange={(event) => {
          const value = event.target.value;
          setState((prev) => ({ ...prev, name: value }));
        }}
      />
      <button type="button" onClick={next}>Next</button>
    </div>
  );
}
```

`setState` accepts a new state object or an updater function, like React's `setState`.

## Accessible backdrop with native `<dialog>`

Accessibility stays in your hands so it can match your design system. The native `<dialog>` element does most of the work: opened with `showModal()`, it renders in the top layer, makes the rest of the page inert, traps focus and fires `cancel` on Escape.

```tsx
import { useEffect, useRef } from 'react';
import type { ModalPortRenderProps } from 'react-modal-port';

export function DialogBackdrop({ children, onBackdropClick }: ModalPortRenderProps) {
  const ref = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = ref.current;
    dialog?.showModal();
    return () => dialog?.close();
  }, []);

  return (
    <dialog
      ref={ref}
      className="modal-backdrop"
      onClick={onBackdropClick}
      onCancel={(event) => {
        event.preventDefault(); // Escape: let the library decide whether the modal closes
        onBackdropClick?.(event);
      }}
    >
      {children}
    </dialog>
  );
}
```

```css
.modal-backdrop {
  /* clip, not hidden: focus() can't scroll a clipped dialog, which matters for
     modals that animate in from off-screen */
  overflow: clip;
}

/* Lock page scroll while a modal is open */
body:has(dialog.modal-backdrop[open]) { overflow: hidden; }
```

Give each modal an accessible name (`aria-labelledby` or `aria-label`). The dialog stays open while stacked modals swap inside it, so move focus into each modal when it mounts.

## Animating modals in and out

**Enter:** every modal remounts when it becomes the top of the stack, including when it reappears after the modal above it closes. A CSS animation on the modal's root element therefore plays each time:

```css
.modal { animation: pop-in 250ms ease-out both; }
@keyframes pop-in { from { opacity: 0; transform: scale(0.96); } }
```

If the animation moves the modal in from off-screen (a drawer or a bottom sheet), focus it with `element.focus({ preventScroll: true })`. A plain `focus()` scrolls the off-screen element into view and cancels the slide.

**Exit:** a modal stays mounted until its resolver settles, so a resolver that first awaits an exit animation gets a clean exit. A small wrapper around `launchModal` applies this to every resolver and to `onDismiss`:

```tsx
import { useModal, type LaunchModal } from 'react-modal-port';

// Plays the exit animation of the modal with this id, if it is the one on screen.
declare function playExit(modalId: number): Promise<void>;

type AnyFn = (...args: never[]) => unknown;

export function useAnimatedModal(): LaunchModal {
  const launchModal = useModal();
  return ((Component, resolvers, props, options = {}) => {
    let id = 0;
    const animated =
      <F extends AnyFn>(fn: F) =>
      async (...args: Parameters<F>) => {
        await playExit(id);
        return fn(...args);
      };
    const wrapped = Object.fromEntries(
      Object.entries(resolvers as Record<string, AnyFn>).map(([key, fn]) => [key, animated(fn)]),
    );
    const handle = launchModal(Component, wrapped as never, props as never, {
      ...options,
      onDismiss: options.onDismiss && animated(options.onDismiss),
    });
    id = handle.id;
    return { id, close: animated(handle.close) };
  }) as LaunchModal;
}
```

The backdrop receives `modalId` and `stackSize`, so `playExit` can check that the modal is the one on screen, and fade the backdrop out too when it is the last one. The [animation examples](https://codepen.io/oliverwehn/pen/01a0fb4d-2c07-7c34-af66-1ac02a634b22) have a complete version using the Web Animations API, with a drawer, a bottom sheet, stacked modals shown as a deck, and support for `prefers-reduced-motion` (source in [`demo/codepen-animated/`](./demo/codepen-animated)).

## Next.js and Server Components

The package is marked `"use client"`, so `ModalProvider` and `ModalPort` can be rendered from a Server Component layout, for example a Next.js `app/layout.tsx`. Your backdrop is passed to `ModalPort` as a component, so define the provider, port and backdrop together in a small client component and render that from the layout. The modals themselves are client components, since they use event handlers and hooks.

## API reference

### `<ModalProvider>`

Holds the modal stack. Wrap your app, or the part of it that uses modals. `ModalContextProvider` is a deprecated alias.

### `<ModalPort>`

| Prop | Type | Description |
| --- | --- | --- |
| `backdrop` | `ComponentType<ModalPortRenderProps>` | Optional. Rendered around the current modal. |
| `container` | `Element \| DocumentFragment` | Render into this element through a portal instead of in place. |
| `onModalLaunch` | `() => void` | The stack went from empty to non-empty. |
| `onModalClose` | `() => void` | The stack became empty. |
| `onStackChange` | `(size: number) => void` | A modal was launched or closed. |
| `render` | | Deprecated alias of `backdrop`. |

The backdrop receives these props (`ModalPortRenderProps`):

| Prop | Type | Description |
| --- | --- | --- |
| `children` | `ReactNode` | The current modal. |
| `onBackdropClick` | `((event) => void) \| undefined` | Dismisses the modal. `undefined` unless it was launched with `onDismiss`. Ignores clicks that bubble up from the modal. |
| `modalId` | `number` | Id of the modal shown. |
| `stackSize` | `number` | Number of modals on the stack, including the one shown. |

### `launchModal`

```ts
launchModal(Component, resolvers, props?, options?): ModalHandle
```

| | |
| --- | --- |
| `resolvers` | A subset of the modal's function props. Each is wrapped so that the modal closes after it has run or its promise has settled; on a throw or rejection the modal stays open. |
| `props` | The modal's remaining props. |
| `options.onDismiss` | Enables dismissing from outside the modal; wrapped like a resolver. |
| returns `{ id, close }` | `close()` removes the modal without calling a resolver. A no-op once the modal is gone. |

### Hooks

| Hook | Returns |
| --- | --- |
| `useModal()` | `launchModal`. Stable across renders; components that only call this hook do not re-render when modals open or close. |
| `useModalState<S>()` | `[state \| null, setState]` for the modal the hook is called in. Outside a modal, it refers to the top modal (`null` if there is none). |
| `useModalStack()` | A read-only array of `{ id, render, props, state }`, bottom first. |
| `useModalContext()` | Deprecated. `{ stack, launchModal, updateState }`; re-renders on every stack change. |

All hooks throw when used outside a `ModalProvider`.

### Types

| Type | Description |
| --- | --- |
| `LaunchModal` | The type of `launchModal`. |
| `LaunchOptions` | `{ onDismiss? }` |
| `ModalHandle` | `{ id, close }`, returned by `launchModal`. |
| `ModalPortProps`, `ModalPortRenderProps` | Props of `ModalPort` and of your backdrop. |
| `ModalState`, `UpdateModalState<S>` | Modal state and its setter. |
| `ModalStackEntry` | An item of `useModalStack()`. |
| `FunctionKeys<P>`, `Resolvers<P, R>`, `RestProps<P, R>` | Helpers behind the `launchModal` signature, useful for wrappers like `useConfirm`. |

## License

MIT
