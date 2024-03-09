# react-modal-port

This small but neat package allows you to:
* Define and style modals the way *you* want or need.
* Launch modals flexibly from anywhere in your React app.
* Have them render at one specific place in your DOM.

**Demo:** https://codepen.io/oliverwehn/pen/YzMyoBr?editors=0010

---
- [Installation](#-installation)
- [Components](#-components)
  - [ModalContextProvider](#modalcontextprovider)
  - [ModalPort](#modalport)
  - [Usage Example](#usage-example)
- [Launching Modals](#-launching-modals)
- [Stacking Modals And Handling Modal State](#-stacking-modals-and-handling-modal-state)
---

## 🏁 Installation

```bash
$ npm install react-modal-port
```

## 🧩 Components

### ModalContextProvider

The `ModalContextProvider` wraps your app to allow your app’s components to launch or render modals.

### ModalPort

The `ModalPort` defines the outlet in your app through which your modals will be rendered. It requires one prop, `render`, that expects a `React.FunctionComponent`. Any modal you’ll launch will be rendered as the child of the component passed via the prop. Typically, this component will provide a backdrop the modal is rendered on top.

Besides `children`, a prop `onBackdropClick` is passed to `render`. It holds, if provided to the modal on launch, the click handler function that should be called if the backdrop is clicked, e.g. to dismiss the modal.

The `ModalPort` accepts two addtional optional props `onModalLauch` and `onModalClose` that both expect a function. The provided functions will be called in the event of a modal being launched or, respectively, a modal being closed.

### Usage Example
```tsx
import { ModalContextProvider } from 'react-modal-port';

// Backdrop component to be passed to the `ModalPort`’s `render` prop
const Backdrop: React.FC<ModalPortRenderProps> = ({ children, onBackdropClick }) => (
  <div
    style="
      position: fixed;
      z-index: 1000,
      display: flex;
      justify-content: center;
      align-items-center;
      background-color: rgba(0,0,0,.65);
      top: 0;
      right: 0;
      bottom: 0;
      left: 0;
    "
    onClick={onBackdropClick}
  >
    {children}
  </div>
);

// Your app’s root layout component
const RootLayout:React.FC<PropsWithChildren> = ({ children }) => (
  <ModalContextProvider>
    <div style="width: 100%; min-height: 100vh;">
      {children}
      {
        /* The ModalPort defines the place in the app 
         * where your modals will be rendered  */
      }
      <ModalPort render={Backdrop} />
    </div>
  </ModalContextProvider>
);

export default RootLayout;
```

## 🚀 Launching Modals

Launching modals makes use of the `useModal` hook that provides you with the `launchModal` function.

```tsx
import { useModal } from 'react-modal-port';
import DecisionModal from './modals/decision';

const Page: React.FC = () => {

  const launchModal = useModal();
  const [ decision, setDecision ] = useState<boolean|null>(null);

  const onClick = () => {
    launchModal(
      // Modal component
      DecisionModal, 
      // Modal resolvers
      {
        decideYay: () => setDecision(true),
        decideNay: () => setDecision(false),
        // Provide an `onBackdropClick` resolver to have it passed to
        // the Backdrop component
        onBackdropClick: () => {},
      },
      // Optionally, add further props to be passed to the modal component
      {
        timeLeft: Math.random() * 86400
      }
    );
  }

  return (
    <div style="padding: 4rem;">
      <h1>Welcome</h1>
      {decision === null && (
      <p>Make your decision!</p>
      ) || (
      <p>Your decision is: {decision && "Yay" || "Nay"}</p>
      )}
      
      <div style="display: flex; flex-direction: row; gap: 0.5rem;">
        <button type="button" onClick={onClick}>Let me decide now</button>
      </div>
    </div>
  );
}

```
The `launchModal` function expects the following arguments:
| Argument | Type | Description |
|----------|------|-------------|
| render | `React.FC` | A function that renders the modal and returns a `ReactNode`. |
| resolvers | `{ [key: string]: (...args: any[]) => Promise<void>\|void }` | An object of resolver functions that will be passed as props to `render`. |
| props | `{ [key: string]: any }` | Optional: Further props you’d like to pass to the modal component in `render`. |

Modals can be created and designed to fully fit your needs. The only requirement is to define the functions to resolve them, for example, when clicking a button. The modal component for the example above could look like this:

```tsx

type DecisionModalProps = {
  decideYay: () => void;
  decideNay: () => void;
  leaveMeAlone?: () => void;
};

const DecisionModal: React.FC<DecisionModalProps> = ({
  decideYay,
  decideNay,
}) => (
  <div
    style="background-color: white; border-radius: 0.5rem; padding: 1rem; display: flex; flex-direction: column; align-items: center; gap: 0.5rem;"
    role="dialog"
    aria-modal="true"
    aria-labeledby="modal-title"
    aria-describedby="modal-description"
  >
    <h4 id="modal-title">How do you decide?</h4>
    <div id ="modal-description">
      <p>Make your decision and click one of the buttons below.</p>
    </div>
    <div style="display: flex; flex-direction: row; gap: 0.25rem; justify-content: center;">
      <button type="button" onClick={decideYay}>Yay</button>
      <button type="button" onClick={decideNay}>Nay</button>
    </div>
  </div>
)

export default DecisionModal;
```

## 🔂 Asynchronous Resolution

Modals can be simple like the one above or highly complex like a full wizard experience or questionnaire. It is also possible to trigger asynchronous operations within a resolver function. As long as the resolver function returns a promise, the modal won’t close until the promise is resolved.

So you could adapt the `onClick` handler in our earlier example as follows:
```tsx
  // ...

  const onClick = () => {
    launchModal(
      // Modal component
      DecisionModal, 
      // Modal resolvers
      {
        decideYay: () => setDecision(true),
        decideNay: () => setDecision(false),
        letMeThinkAboutIt: (p: Promise) => p,
        leaveMeAlone: () => {},
      },
    );
  }

  // ...
```

It then could cater the following modal functionality:


```tsx

type DecisionModalProps = {
  decideYay: () => void;
  decideNay: () => void;
  letMeThinkAboutIt: (p: Promise) => Promise;
  leaveMeAlone?: () => void;
};

const DecisionModal: React.FC<DecisionModalProps> = ({
  decideYay,
  decideNay,
  letMeThinkAboutIt,
}) => {

  const imUndecided = () => {
    const p = new Promise((resolve) => {
      const options = [ decideYay, decideNay ];
      setTimeout(
        () => resolve(options[Math.round(Math.random())]),
        Math.random() * 60000
      );
    });
    letMeThinkAboutIt(p);
  };

  return (
    <div
      style="background-color: white; border-radius: 0.5rem; padding: 1rem; display: flex; flex-direction: column; align-items: center; gap: 0.5rem;"
      role="dialog"
      aria-modal="true"
      aria-labeledby="modal-title"
      aria-describedby="modal-description"
    >
      <h4 id="modal-title">How do you decide?</h4>
      <div id ="modal-description">
        <p>Make your decision and click one of the buttons below.</p>
      </div>
      <div style="display: flex; flex-direction: row; gap: 0.25rem; justify-content: center;">
        <button type="button" onClick={decideYay}>Yay</button>
        <button type="button" onClick={decideNay}>Nay</button>
        <button type="button" onClick={imUndecided}>Let me think</button>
      </div>
    </div>
  );
}

export default DecisionModal;
```

## 🥞 Stacking Modals And Handling Modal State

If you need to launch a modal from a modal, the modals become (logically) stacked. That means that the `ModalPort` will always render the modal at the top of the modal stack and will return to the previous one as soon as the current one is resolved. Via the resolver functions, data can be passed from the resolving modal to the modal it was launched from.

In case you need to handle state within multiple stacked modal, you can create, access, and update the modal state using the `useModalState` hook. It returns a tuple with the current modal state and a function to update the state. The modal state is always an object holding key-value pairs. Each modal’s modal state will persist until the modal itself is resolved.

In the example below, we’ll ask the user to enter their name and prompt them in a second modal to confirm. We’ll fall back to the first modal with the name previously entered if the user wishes to edit it once more.

```tsx
import React from "react"; 
import ConfirmModal from "./ConfirmModal";

type AskForNameModalProps = {
  provideName: ModalResolver,
};

export const AskForNameModal: React.FC<AskForNameModalProps> = ({
  provideName,
}) => {

  const launchModal = useModal();
  const [ modalState, updateModalState ] = useModalState();
  const onNameChange = (ev) => {
    updateModalState({
      ...modalState,
      name: ev.target.value,
    });
  };

  const onButtonClick = () => {
    launchModal(
      ConfirmModal, 
      {
        // Chain first modal’s resolution to the second one’s
        confirm: () => provideName(modalState.name),
      },
      // Pass the name on to the ConfirmModal for rendering
      {
        name: modalState.name,
      }
    );
  };

  return (
    <div 
      style="background-color: white; border-radius: 0.5rem; padding: 1rem; display: flex; flex-direction: column; align-items: center; gap: 0.5rem;"
      role="dialog"
      aria-modal="true"
      aria-labeledby="modal-title"
      aria-describedby="modal-description"
    >
      <h4 id="modal-title">How should we call you?</h4>
      <div id="modal-description">
        <p>Please enter your firstname or nickname of choice.</p>
      </div>
      <input type="text" value={modalState.name} onChange={onNameChange} style="width: 100%">
      <button type="button" onClick={onButtonClick}>Set name</button>
    </div>
  );

}

```