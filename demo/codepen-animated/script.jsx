// CodePen JS panel (preprocessor: Babel).
// Imports use full esm.sh URLs: CodePen's Babel turns bare imports ('react') into require() calls.
// `?deps=` pins react-modal-port to the same React version, so the page and the library share one React.
import React, { useEffect, useRef, useState } from 'https://esm.sh/react@19.3.0';
import { createRoot } from 'https://esm.sh/react-dom@19.3.0/client';
import { ModalPort, ModalProvider, useModal } from 'https://esm.sh/react-modal-port@^1.0.0?deps=react@19.3.0,react-dom@19.3.0';

/* ---------------------------------------------------------------------------
 * How the animations work
 *
 * Enter: every modal remounts when it becomes the top of the stack, so a CSS
 * animation on `.modal` plays each time (see the CSS panel).
 *
 * Exit: a modal stays open until its resolver settles. `useAnimatedModal`
 * wraps each resolver (and onDismiss) so it first plays the exit animation
 * and only then runs, so the library removes the modal after the animation.
 * ------------------------------------------------------------------------- */

const EXIT_KEYFRAMES = {
  pop: [{ opacity: 1, transform: 'none' }, { opacity: 0, transform: 'translateY(0.5rem) scale(0.96)' }],
  drawer: [{ transform: 'none' }, { transform: 'translateX(100%)' }],
  sheet: [{ transform: 'none' }, { transform: 'translateY(100%)' }],
};

async function playExit(modalId) {
  const dialog = document.querySelector('dialog.backdrop');
  // Only animate if this modal is the one on screen (it may be covered by another).
  if (!dialog || dialog.dataset.modalId !== String(modalId)) return;
  const modal = dialog.querySelector('.modal');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const timing = { duration: reduced ? 1 : 200, easing: 'ease-in', fill: 'forwards' };
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

function Modal({ motion = 'pop', title, children, actions }) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current.querySelector('button')?.focus();
  }, []);
  return (
    <div className="modal" data-motion={motion} ref={ref}>
      <h2 id="modal-title">{title}</h2>
      {children}
      <div className="actions">{actions}</div>
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
      <p>Open another step on top, then close it: it animates out and this one animates back in.</p>
    </Modal>
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
          <p>Each modal animates in on top; closing one reveals the previous with its own animation.</p>
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
