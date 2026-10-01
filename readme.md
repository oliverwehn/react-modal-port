# react-modal-port

Launch modals from any React component, render them in one place, and have TypeScript check every launch.

- **Bring your own UI.** Modals and backdrops are your components; the library ships no styles or markup.
- **Launch from anywhere.** `useModal()` returns a stable `launchModal` function that can be called from components, effects or other modals.
- **One outlet.** `<ModalPort>` renders the top modal of a stack, wherever you put it (or into a portal).
- **Type-safe.** Resolvers and props are checked against the modal component's props.
- **Async-aware stacking.** A modal closes when one of its resolvers settles, even if other modals were stacked on top in the meantime.

**Requires React 19.** Upgrading from 0.x? See [MIGRATION.md](./MIGRATION.md).

---

- [Installation](#installation)
- [Setup](#setup)
- [Launching modals](#launching-modals)
- [Asynchronous resolution](#asynchronous-resolution)
- [Dismissing modals](#dismissing-modals)
- [Stacking and modal state](#stacking-and-modal-state)
- [An accessible backdrop with `<dialog>`](#an-accessible-backdrop-with-dialog)
- [API reference](#api-reference)

## Installation

```bash
npm install react-modal-port
```

## Setup

Wrap your app in `ModalProvider` and place one `ModalPort` where modals should render. `backdrop` is the component the current modal is rendered into.

```tsx
import type { ReactNode } from 'react';
import { ModalPort, ModalProvider, type ModalPortRenderProps } from 'react-modal-port';

function Backdrop({ children, onBackdropClick }: ModalPortRenderProps) {
  return (
    <div
      onClick={onBackdropClick}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.65)',
      }}
    >
      {children}
    </div>
  );
}

export function RootLayout({ children }: { children: ReactNode }) {
  return (
    <ModalProvider>
      {children}
      <ModalPort backdrop={Backdrop} />
    </ModalProvider>
  );
}
```

The package is marked `"use client"`, so it can be imported from React Server Component layouts (for example in Next.js).

## Launching modals

A modal is a plain component. The functions it calls to finish are its **resolvers**.

```tsx
type DecisionModalProps = {
  question: string;
  decideYay: () => void;
  decideNay: () => void;
};

export function DecisionModal({ question, decideYay, decideNay }: DecisionModalProps) {
  return (
    <div role="dialog" aria-modal="true" aria-labelledby="decision-title">
      <h2 id="decision-title">{question}</h2>
      <button type="button" onClick={decideYay}>Yay</button>
      <button type="button" onClick={decideNay}>Nay</button>
    </div>
  );
}
```

Launch it with `launchModal(Component, resolvers, props?, options?)`:

```tsx
import { useState } from 'react';
import { useModal } from 'react-modal-port';
import { DecisionModal } from './decision-modal';

export function Page() {
  const launchModal = useModal();
  const [decision, setDecision] = useState<boolean | null>(null);

  const ask = () => {
    launchModal(
      DecisionModal,
      { decideYay: () => setDecision(true), decideNay: () => setDecision(false) },
      { question: 'Ship it?' },
    );
  };

  return (
    <>
      <p>{decision === null ? 'Make your decision!' : `Your decision: ${decision ? 'Yay' : 'Nay'}`}</p>
      <button type="button" onClick={ask}>Decide now</button>
    </>
  );
}
```

| Argument | Description |
| --- | --- |
| `Component` | The modal component. Its props define what the other arguments must contain. |
| `resolvers` | Function props of the modal that close it. Each one is called with the modal's arguments, and the modal is removed once it returns (or its promise resolves). Calling a second resolver after the first is ignored. |
| `props` | The modal's remaining props. Required when the modal still has required props, otherwise optional. |
| `options` | `{ onDismiss }`: see [Dismissing modals](#dismissing-modals). |

TypeScript catches the common mistakes:

```tsx
launchModal(DecisionModal, { decideYey: () => {} }, { question: '?' }); // ✗ unknown resolver
launchModal(DecisionModal, { decideYay: () => {}, decideNay: () => {} }); // ✗ `question` is missing
```

A function prop that is *not* listed in `resolvers` can be passed in `props`. It is then just a callback and does not close the modal.

`launchModal` returns a handle, `{ id, close() }`. `close()` removes that modal without calling a resolver, for example after a timeout.

## Asynchronous resolution

If a resolver returns a promise, the modal stays open until it settles:

```tsx
launchModal(SaveModal, {
  onSave: async (draft: Draft) => {
    await api.save(draft); // the modal is still shown while this runs
  },
});
```

- **Fulfilled:** the modal closes. This happens even if other modals were stacked on top of it in the meantime; only *this* modal is removed.
- **Rejected or thrown:** the modal stays open and the promise returned to the modal component rejects with the same error, so the modal can show it and let the user retry. Resolvers can be called again after a failure.

## Dismissing modals

Pass `onDismiss` in the options to make a modal dismissible from outside its content:

```tsx
launchModal(DecisionModal, resolvers, { question: 'Ship it?' }, { onDismiss: () => setDecision(null) });
```

The backdrop then receives `onBackdropClick`, which calls `onDismiss` (and closes the modal) only for clicks on the backdrop itself, not for clicks that bubble up from the modal. For modals launched without `onDismiss`, `onBackdropClick` is `undefined`, so the backdrop can tell whether the current modal is dismissible.

## Stacking and modal state

Modals launched while another one is open are stacked. The port shows the top one and returns to the previous one when it closes. Each stacked modal keeps its own **modal state**, read and updated with `useModalState()` from inside the modal. Modal state survives while other modals are on top and is discarded when the modal closes.

Component state (`useState`) inside a modal does **not** survive being covered, because only the top modal is mounted. Use modal state for anything that should outlive a nested modal.

```tsx
import { useModal, useModalState } from 'react-modal-port';
import { ConfirmModal } from './confirm-modal';

type AskForNameProps = { provideName: (name: string) => void };

export function AskForNameModal({ provideName }: AskForNameProps) {
  const launchModal = useModal();
  const [state, setState] = useModalState<{ name: string }>();
  const name = state?.name ?? '';

  const confirm = () => {
    launchModal(
      ConfirmModal,
      // Resolving the confirmation also resolves this modal.
      { confirm: (ok: boolean) => { if (ok) provideName(name); } },
      { name },
    );
  };

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="name-title">
      <h2 id="name-title">How should we call you?</h2>
      <input
        aria-label="Name"
        value={name}
        onChange={(event) => {
          const value = event.target.value;
          setState((prev) => ({ ...prev, name: value }));
        }}
      />
      <button type="button" onClick={confirm}>Set name</button>
    </div>
  );
}
```

`setState` accepts a new state object or an updater function, like React's own `setState`. Prefer the updater form when the new state depends on the old one.

## An accessible backdrop with `<dialog>`

The library leaves markup and accessibility to you, so they can match your design system. The native `<dialog>` element covers most of it: shown with `showModal()`, it sits in the top layer, makes the rest of the page inert, traps focus and fires `cancel` on Escape.

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
        event.preventDefault(); // let the library decide whether the modal closes
        onBackdropClick?.(event);
      }}
    >
      {children}
    </dialog>
  );
}
```

```css
/* Lock page scroll while a modal is open */
body:has(dialog.modal-backdrop[open]) { overflow: hidden; }
```

Give each modal an accessible name (`aria-labelledby` or `aria-label`), and move focus into it if the first focusable element is not the right target.

## API reference

### `<ModalProvider>`

Holds the modal stack. Wrap your app (or the part that uses modals) in it. `ModalContextProvider` is a deprecated alias.

### `<ModalPort>`

| Prop | Type | Description |
| --- | --- | --- |
| `backdrop` | `ComponentType<ModalPortRenderProps>` | Renders around the current modal. Receives `children`, `onBackdropClick` (undefined unless the modal is dismissible), `modalId` and `stackSize`. Optional. |
| `container` | `Element \| DocumentFragment` | Render into this element through a portal. |
| `onModalLaunch` | `() => void` | The stack went from empty to non-empty. |
| `onModalClose` | `() => void` | The stack became empty. |
| `onStackChange` | `(size: number) => void` | Any modal was launched or closed. |
| `render` | | Deprecated alias of `backdrop`. |

### Hooks

| Hook | Returns |
| --- | --- |
| `useModal()` | `launchModal`. Stable across renders; components using only this hook do not re-render when modals open or close. |
| `useModalState<S>()` | `[state \| null, setState]` for the modal the hook is called in. Called outside a modal, it refers to the top modal (`null` if none). |
| `useModalStack()` | A read-only array of `{ id, render, props, state }`, bottom first. |
| `useModalContext()` | Deprecated. `{ stack, launchModal, updateState }`; re-renders on every stack change. |

All hooks throw if used outside a `ModalProvider`.

## License

MIT
