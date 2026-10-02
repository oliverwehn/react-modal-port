// script.jsx — the .jsx extension turns on CodePen's Babel block, which compiles it to script.js.
// Bare imports are resolved by CodePen's Packages block, using the versions in package.json.
// React is imported because Babel compiles JSX to React.createElement().
import React, { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { ModalPort, ModalProvider, useModal, useModalState } from 'react-modal-port';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/* ---------------------------------------------------------------------------
 * Backdrop: a native <dialog>, opened with showModal(). That gives focus
 * trapping, an inert page behind it and Escape (the `cancel` event) for free.
 * `onBackdropClick` is undefined unless the modal was launched with onDismiss.
 * ------------------------------------------------------------------------- */
function Backdrop({ children, onBackdropClick, stackSize }) {
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
      data-dismissible={Boolean(onBackdropClick)}
      onClick={onBackdropClick}
      onCancel={(event) => {
        event.preventDefault(); // the library decides whether the modal closes
        onBackdropClick?.(event);
      }}
    >
      <span className="stack-badge">
        {stackSize} modal{stackSize === 1 ? '' : 's'} on the stack
      </span>
      {children}
    </dialog>
  );
}

function Modal({ title, children, actions }) {
  const ref = useRef(null);

  // The <dialog> stays open while stacked modals swap inside it, so move focus
  // into each modal as it mounts (its first field or button).
  useEffect(() => {
    ref.current.querySelector('input, button')?.focus();
  }, []);

  return (
    <div className="modal" ref={ref}>
      <h2 id="modal-title">{title}</h2>
      {children}
      <div className="actions">{actions}</div>
    </div>
  );
}

/* --- 1. A simple confirmation ------------------------------------------- */
function ConfirmModal({ question, confirm, cancel }) {
  return (
    <Modal
      title={question}
      actions={
        <>
          <button onClick={cancel}>Cancel</button>
          <button className="primary" onClick={confirm}>
            Confirm
          </button>
        </>
      }
    >
      <p>Click outside or press Escape to dismiss.</p>
    </Modal>
  );
}

/* --- 2. Stacked modals sharing modal state ------------------------------ */
function AskForNameModal({ provideName, cancel }) {
  const launchModal = useModal();
  // Modal state survives while the confirmation is stacked on top.
  const [state, setState] = useModalState();
  const name = state?.name ?? '';

  const next = () => {
    launchModal(
      ConfirmNameModal,
      // Resolving the confirmation also resolves this modal.
      { answer: (ok) => ok && provideName(name) },
      { name },
    );
  };

  return (
    <Modal
      title="How should we call you?"
      actions={
        <>
          <button onClick={cancel}>Cancel</button>
          <button className="primary" onClick={next} disabled={!name.trim()}>
            Next
          </button>
        </>
      }
    >
      <p>Type a name, continue, then choose “Edit” to come back: your input is still here.</p>
      <input
        aria-label="Name"
        autoFocus
        value={name}
        onChange={(event) => {
          const value = event.target.value;
          setState((prev) => ({ ...prev, name: value }));
        }}
      />
    </Modal>
  );
}

function ConfirmNameModal({ name, answer }) {
  return (
    <Modal
      title={`Is “${name}” right?`}
      actions={
        <>
          <button onClick={() => answer(false)}>Edit</button>
          <button className="primary" onClick={() => answer(true)}>
            Yes
          </button>
        </>
      }
    >
      <p>This modal is stacked on top of the name form.</p>
    </Modal>
  );
}

/* --- 3. Async resolvers: stays open while saving, retry on failure ------- */
function SaveModal({ save, cancel }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  const onSave = async () => {
    setBusy(true);
    setError(null);
    try {
      await save(); // the modal stays open until this settles
    } catch (err) {
      setError(err.message); // rejected: the modal stays open, so we can retry
      setBusy(false);
    }
  };

  return (
    <Modal
      title="Save changes?"
      actions={
        <>
          <button onClick={cancel} disabled={busy}>
            Discard
          </button>
          <button className="primary" onClick={onSave} disabled={busy}>
            {busy ? 'Saving…' : error ? 'Retry' : 'Save'}
          </button>
        </>
      }
    >
      <p>The first attempt fails on purpose to show error handling.</p>
      {error && <p className="error" role="alert">{error}</p>}
    </Modal>
  );
}

/* --- 4. Closing programmatically with the returned handle --------------- */
function NoticeModal({ seconds, ok }) {
  return (
    <Modal title="Heads up" actions={<button className="primary" onClick={ok}>OK</button>}>
      <p>This notice closes itself after {seconds} seconds via handle.close().</p>
    </Modal>
  );
}

/* --- Links to the package -------------------------------------------------- */
const LINKS = [
  ['npm', 'https://www.npmjs.com/package/react-modal-port'],
  ['GitHub', 'https://github.com/oliverwehn/react-modal-port'],
  ['Docs', 'https://github.com/oliverwehn/react-modal-port#readme'],
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

/* --- Page ----------------------------------------------------------------- */
function Demo() {
  const launchModal = useModal();
  const [confirmResult, setConfirmResult] = useState('—');
  const [name, setName] = useState(null);
  const [saveResult, setSaveResult] = useState('—');
  const attempts = useRef(0);

  return (
    <main>
      <h1>react-modal-port</h1>
      <p className="lead">Launch modals from any component and render them in one place.</p>
      <PackageLinks />

      <div className="cards">
        <section className="card">
          <h2>1. Confirm</h2>
          <p>Resolvers close the modal. onDismiss handles backdrop clicks and Escape.</p>
          <button
            onClick={() =>
              launchModal(
                ConfirmModal,
                { confirm: () => setConfirmResult('Confirmed'), cancel: () => setConfirmResult('Cancelled') },
                { question: 'Delete this file?' },
                { onDismiss: () => setConfirmResult('Dismissed') },
              )
            }
          >
            Open
          </button>
          <p className="result">Result: {confirmResult}</p>
        </section>

        <section className="card">
          <h2>2. Stacked modals</h2>
          <p>A modal launches another; modal state survives underneath.</p>
          <button onClick={() => launchModal(AskForNameModal, { provideName: setName, cancel: () => {} })}>
            Open
          </button>
          <p className="result">{name ? `Nice to meet you, ${name}!` : 'No name yet.'}</p>
        </section>

        <section className="card">
          <h2>3. Async resolver</h2>
          <p>The modal stays open while a promise is pending, and stays open if it rejects.</p>
          <button
            onClick={() => {
              attempts.current = 0;
              launchModal(SaveModal, {
                save: async () => {
                  await sleep(800);
                  attempts.current += 1;
                  if (attempts.current === 1) throw new Error('Network error, please try again.');
                  setSaveResult(`Saved after ${attempts.current} attempts`);
                },
                cancel: () => setSaveResult('Discarded'),
              });
            }}
          >
            Open
          </button>
          <p className="result">Result: {saveResult}</p>
        </section>

        <section className="card">
          <h2>4. Programmatic close</h2>
          <p>launchModal returns a handle with close().</p>
          <button
            onClick={() => {
              const handle = launchModal(NoticeModal, { ok: () => {} }, { seconds: 3 });
              setTimeout(handle.close, 3000);
            }}
          >
            Open
          </button>
        </section>
      </div>
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
