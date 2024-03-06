# react-modal-port

This small but neat package allows you to:
* Launch modals flexibly from anywhere in your React app.
* Render them at a clearly defined place in your DOM.
* Fully control how your modals appear and behave.

## Installation

```bash
$ npm install react-modal-port
```

## 🧩 Components

### ModalContextProvider

The `ModalContextProvider` wraps your app to allow your app’s components to launch or render modals.

### ModalPort

The `ModalPort` handles the rendering of your modals. It leaves the *how* you want to render your modals fully up to you. It simply requires a `React.FunctionComponent` to be passed to it via its `render` prop. This component allows you to wrap any rendered modal in, for example, a backdrop component.

Besides `children` a prop `onBackdropClick` is passed to `render`. It holds, if provided to the modal on launch, the click handler function that should be called if the backdrop is clicked, e.g. to dismiss the modal.


```tsx
import React from 'react';
import { ModalContextProvider } from 'react-modal-port';

const Backdrop: React.FC<ModalPortRenderProps> = ({ children, onBackdropClick }) => (
  <div
    className="
      fixed inset-0 z-1000
      flex justify-center items-center
      bg-neutral-900 bg-opacity-50
      top-0 right-0 bottom-0 left-0
    "
    onClick={onBackdropClick}
  >
    {children}
  </div>
);

const App:React.FC<PropsWithChildren> = ({ children }) => (
  <ModalContextProvider>
    {children}
    <ModalPort render={Backdrop} />
  </ModalContextProvider>
);
```

## 🚀 Launching Modals

Launching modals makes use of the `userModal` hook that provides you with the `launchModal` function.

```tsx
import React from 'react';
import { useModal } from 'react-modal-port';
import DecisionModal from './modals/decision';

const Page: React.FC = () => {

  const launchModal = userModal();
  const [ decision, setDecision ] = useState<boolean|null>(null);

  const onClick = () => {
    launchModal(
      // Modal component
      DecisionModal, 
      // Modal resolvers
      {
        decideYay: () => setDecision(true),
        decideNay: () => setDecision(false),
        leaveMeAlone: () => {},
      },
      // Optional name of the `onBackdropClick` resolver
      "leaveMeAlone"
    );
  }

  return (
    <div className="p-4">
      <h1>Welcome</h1>
      {decision === null && (
      <p>Make your decision!</p>
      ) || (
      <p>Your decision is: {decision && "Yay" || "Nay"}</p>
      )}
      
      <div className="flex flex-row gap-2">
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
| resolvers | `{ [key: string]: (ev?: SyntheticEvent) => Promise<any>\|void }` | An object of resolver functions that will be passed as props to `render`. |
| onBackdropClickUse | `string` | Optional: The key of the resolver function in the `resolvers` object that should be passed to the backdrop component’s `onBackdropClick` prop. |

Modals can be created and designed to fully fit your needs. The only requirement is to define the functions to resolve them, for example, when clicking a button. The modal component for the example above could look like this:

```tsx
import React from 'react';

type DecisionModalProps = {
  decideYay: () => void;
  decideNay: () => void;
  leaveMeAlone?: () => void;
};

const DecisionModal: React.FC<DecisionModalProps> = ({
  decideYay,
  decideNay,
}) => (
  <div className="bg-white rounded p-4 flex flex-column gap-2 items-center">
    <p>How do you decide?</p>
    <div className="flex flex-row gap-1 justify-center">
      <button type="button" onClick={decideYay}>Yay</button>
      <button type="button" onClick={decideNay}>Nay</button>
    </div>
  </div>
)

export default DecisionModal;
```

## 🔂 Asynchronous Resolution

Modals can be simple like the one above or highly complex like a full wizard experience or questionnaire. It is also possible to trigger asynchronous operations within a resolver function. As long as the resolver function returns a promise, the modal won’t close until the promise is resolved.

So you could adapt the `onClick` handler in our example as follows:
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
      // Optional name of the `onBackdropClick` resolver
      "leaveMeAlone"
    );
  }

  // ...
```

It then could cater the following modal functionality:


```tsx
import React from 'react';

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
    <div className="bg-white rounded p-4 flex flex-column gap-2 items-center">
      <p>How do you decide?</p>
      <div className="flex flex-row gap-1 justify-center">
        <button type="button" onClick={decideYay}>Yay</button>
        <button type="button" onClick={decideNay}>Nay</button>
        <button type="button" onClick={imUndecided}>Let me think</button>
      </div>
    </div>
  );
}

export default DecisionModal;
```

## 🥞 Stacking Modals

If you need to launch a modal from a modal, the modals become (logically) stacked. That means that the `ModalPort` will always render the modal at the top of the modal stack and will return to the previous one as soon as the current one is resolved. Via the resolver functions, data can be passed from the resolving modal to the modal it was launched from.

```tsx
// Add example here

```

## 🔢 Handle And Preserve Modal State

In case you need to handle state within the modal, e.g., when modals are stacked, you can access and update modal state using the `useModalState` hook. It returns a tuple with the current modal state and a function to update the state. The modal state is always an object holding key-value pairs.

```tsx
import React from "react"; 
import ConfirmModal from "./ConfirmModal";

type AskForNameModalProps = {
  confirmName: ModalResolver,
};

export const AskForNameModal: React.FC<AskForNameModalProps> = ({
  confirmName,
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
    launchModal(ConfirmModal, {
      confirmModal,
     });
  };

  return (
    <div className="bg-white rounded p-4 flex flex-column gap-2 items-center">
      <p>What’s your name?</p>
      <input type="text" value={modalState.name} onChange={onNameChange} className="w-full">
      <button type="button" onClick={onButtonClick}>Set name</button>
    </div>
  );

}

```