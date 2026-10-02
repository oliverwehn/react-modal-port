// script.jsx — the .jsx extension turns on CodePen's Babel block, which compiles it to script.js.
// Bare imports are resolved by CodePen's Packages block, using the versions in package.json.
// React is imported because Babel compiles JSX to React.createElement().
import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ModalPort, ModalProvider, useModal, useModalStack, useModalState } from 'react-modal-port';

/* ---------------------------------------------------------------------------
 * How the animations work
 *
 * Enter: every modal remounts when it becomes the top of the stack, so a CSS
 * animation plays each time (see the CSS panel). Each modal remembers in its
 * modal state whether it has been shown before, so it can tell a fresh launch
 * (push forward) from coming back after the modal above it closed (reveal).
 *
 * Exit: a modal stays open until its resolver settles. `useAnimatedModal`
 * wraps each resolver (and onDismiss) so it first plays the exit animation
 * and only then runs, so the library removes the modal after the animation.
 *
 * Depth: modals below the top one are not mounted, so the top modal draws
 * them as a deck of "ghost" cards behind itself (useModalStack gives the size).
 * ------------------------------------------------------------------------- */

const EXIT_KEYFRAMES = {
  pop: [
    { opacity: 1, transform: 'none' },
    { opacity: 0, transform: 'translateY(3rem) scale(0.96)' },
  ],
  drawer: [{ transform: 'none' }, { transform: 'translateX(100%)' }],
  sheet: [{ transform: 'none' }, { transform: 'translateY(100%)' }],
};

async function playExit(modalId) {
  const dialog = document.querySelector('dialog.backdrop');
  // Only animate if this modal is the one on screen (it may be covered by another).
  if (!dialog || dialog.dataset.modalId !== String(modalId)) return;
  const modal = dialog.querySelector('.modal');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const timing = { duration: reduced ? 1 : 240, easing: 'cubic-bezier(0.4, 0, 1, 1)', fill: 'forwards' };
  const animations = [modal.animate(EXIT_KEYFRAMES[modal.dataset.motion] ?? EXIT_KEYFRAMES.pop, timing)];
  // The last modal takes the scrim with it.
  if (dialog.dataset.stackSize === '1') {
    animations.push(dialog.querySelector('.scrim').animate([{ opacity: 1 }, { opacity: 0 }], timing));
  }
  await Promise.all(animations.map((animation) => animation.finished));
}

/** Same signature as `launchModal`, but every way of closing animates out first. */
function useAnimatedModal() {
  const launchModal = useModal();
  return (Component, resolvers, props, options = {}) => {
    let id;
    const animated = (fn) => async (...args) => {
      await playExit(id);
      return fn(...args);
    };
    const wrapped = Object.fromEntries(Object.entries(resolvers).map(([key, fn]) => [key, animated(fn)]));
    const handle = launchModal(Component, wrapped, props, {
      ...options,
      onDismiss: options.onDismiss && animated(options.onDismiss),
    });
    id = handle.id;
    return { id, close: animated(handle.close) };
  };
}

/* --- Backdrop --------------------------------------------------------------- */
function Backdrop({ children, onBackdropClick, modalId, stackSize }) {
  const ref = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    dialog.showModal();
    return () => dialog.close();
  }, []);

  return (
    <dialog
      ref={ref}
      className="backdrop"
      aria-labelledby="modal-title"
      data-modal-id={modalId}
      data-stack-size={stackSize}
      onCancel={(event) => {
        event.preventDefault(); // Escape: let the library (and the exit animation) decide
        onBackdropClick?.(event);
      }}
    >
      <div className="scrim" data-dismissible={Boolean(onBackdropClick)} onClick={onBackdropClick} />
      <span className="stack-badge">
        {stackSize} modal{stackSize === 1 ? '' : 's'} on the stack
      </span>
      {children}
    </dialog>
  );
}

const MAX_GHOSTS = 3;

function Modal({ motion = 'pop', title, children, actions }) {
  const ref = useRef(null);
  const depth = Math.min(useModalStack().length - 1, MAX_GHOSTS);

  // Modal state outlives the component while it is covered, so `shown` tells a
  // fresh launch apart from returning to this modal. Read it once, on mount.
  const [state, setState] = useModalState();
  const [returning] = useState(() => state?.shown === true);
  useEffect(() => {
    if (!returning) setState((prev) => ({ ...prev, shown: true }));
  }, [returning, setState]);

  useEffect(() => {
    // preventScroll: the modal starts off-screen (translated) while it animates
    // in; a plain focus() would scroll the dialog to it and cancel the motion.
    ref.current.querySelector('button')?.focus({ preventScroll: true });
  }, []);

  return (
    <div className="frame" data-motion={motion} data-enter={returning ? 'back' : 'forward'}>
      {/* Deepest ghost first, so nearer ones paint on top. */}
      {Array.from({ length: depth }, (_, index) => depth - index).map((level) => (
        <div key={level} className="ghost" style={{ '--level': level }} aria-hidden="true" />
      ))}
      <div className="modal" data-motion={motion} ref={ref}>
        <h2 id="modal-title">{title}</h2>
        {children}
        <div className="actions">{actions}</div>
      </div>
    </div>
  );
}

/* --- Modals ------------------------------------------------------------------ */
function ConfirmModal({ motion, title, text, confirm, cancel }) {
  return (
    <Modal
      motion={motion}
      title={title}
      actions={
        <>
          <button onClick={cancel}>Cancel</button>
          <button className="primary" onClick={confirm}>
            Confirm
          </button>
        </>
      }
    >
      <p>{text}</p>
    </Modal>
  );
}

function StepModal({ step, done }) {
  const launch = useAnimatedModal();
  return (
    <Modal
      title={`Step ${step}`}
      actions={
        <>
          <button onClick={done}>Close</button>
          <button
            className="primary"
            onClick={() => launch(StepModal, { done: () => {} }, { step: step + 1 })}
          >
            Open step {step + 1}
          </button>
        </>
      }
    >
      <p>
        Open another step: this card recedes into the stack behind it. Close it again and this one comes
        back to the front.
      </p>
    </Modal>
  );
}

/* --- Links to the package -------------------------------------------------- */
const LINKS = [
  ['npm', 'https://www.npmjs.com/package/react-modal-port'],
  ['GitHub', 'https://github.com/oliverwehn/react-modal-port'],
  ['Docs', 'https://github.com/oliverwehn/react-modal-port#animating-modals-in-and-out'],
];

function PackageLinks() {
  return (
    <nav className="links" aria-label="react-modal-port">
      <code>npm install react-modal-port</code>
      {LINKS.map(([label, href]) => (
        // target="_blank": npm and GitHub refuse to load inside CodePen's preview iframe.
        <a key={label} href={href} target="_blank" rel="noopener noreferrer">
          {label} ↗
        </a>
      ))}
    </nav>
  );
}

/* --- Page ------------------------------------------------------------------- */
function Demo() {
  const launch = useAnimatedModal();
  const [log, setLog] = useState('—');

  const confirm = (motion, title, text) =>
    launch(
      ConfirmModal,
      { confirm: () => setLog(`${title}: confirmed`), cancel: () => setLog(`${title}: cancelled`) },
      { motion, title, text },
      { onDismiss: () => setLog(`${title}: dismissed`) },
    );

  return (
    <main>
      <h1>Animated modals</h1>
      <p className="lead">
        react-modal-port keeps a modal mounted until its resolver settles, so exit animations need no extra
        API: await the animation, then resolve.
      </p>
      <PackageLinks />
      <div className="cards">
        <section className="card">
          <h2>Dialog</h2>
          <p>Pops in, fades out. Try Escape or clicking the backdrop.</p>
          <button onClick={() => confirm('pop', 'Publish post?', 'It will be visible to everyone.')}>Open</button>
        </section>
        <section className="card">
          <h2>Drawer</h2>
          <p>Slides in from the right and back out.</p>
          <button onClick={() => confirm('drawer', 'Filters', 'A side panel built from the same modal.')}>Open</button>
        </section>
        <section className="card">
          <h2>Bottom sheet</h2>
          <p>Rises from the bottom, a common mobile pattern.</p>
          <button onClick={() => confirm('sheet', 'Share', 'Same component, different motion.')}>Open</button>
        </section>
        <section className="card">
          <h2>Stacked</h2>
          <p>New modals push the current one back into a deck; closing one brings the previous back to the front.</p>
          <button onClick={() => launch(StepModal, { done: () => setLog('Stack closed') }, { step: 1 })}>Open</button>
        </section>
      </div>
      <p className="result">Last result: {log}</p>
    </main>
  );
}

function App() {
  return (
    <ModalProvider>
      <Demo />
      <ModalPort backdrop={Backdrop} />
    </ModalProvider>
  );
}

createRoot(document.getElementById('root')).render(<App />);
