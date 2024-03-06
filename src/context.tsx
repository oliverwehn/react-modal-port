import React, { 
  createContext, 
  useContext, 
  useState, 
  type SyntheticEvent 
} from 'react';
import { 
  type ModalStackItem,
  type ModalContextProperties,
  type LaunchModal,
  type LaunchModalResolvers,
  type ModalState,
  type UpdateModalState,
} from '../types';

export const ModalContext = createContext<ModalContextProperties>({
  stack: [],
  launchModal: () => {},
  updateStack: () => {},
  updateState: () => {},
});

export const ModalContextProvider = ({ children }: Readonly<{ children: React.ReactNode }>) => {

  const [ stack, updateStack ] = useState<ModalStackItem[]>([]);

  const launchModal: LaunchModal = (render, resolvers, onBackdropClickUse) => {
    // Wrap resolvers to update the stack
    const wrappedResovers = Object.keys(resolvers).reduce((acc, key) => {
      const resolver = resolvers[key];
      acc[key] = async (ev?: SyntheticEvent) => {
        const result = await resolver(ev);
        updateStack(stack.slice(0, -1));
        return result;
      };
      return acc;
    }, {} as LaunchModalResolvers);
    updateStack([
      ...stack,
      {
        render,
        resolvers: wrappedResovers,
        onBackdropClickUse,
        state: {},
      },
    ]);
  };

  const updateState = (newState: ModalState) => {
    const updatedStack = [
      ...stack,
    ];
    updatedStack[stack.length - 1].state = { ...newState };
    updateStack(updatedStack);
  };

  const contextProperties: ModalContextProperties = {
    stack,
    launchModal,
    updateStack,
    updateState,
  };

  return <ModalContext.Provider value={contextProperties}>{children}</ModalContext.Provider>;

};

/**
 * Get properties from the modal context
 * @returns {ModalContextProperties} Object with the modal context properties
 */
export function useModalContext(): ModalContextProperties {
  return useContext(ModalContext);
}

/**
 * Short-hand for `useModalContext().launchModal`
 * @returns {LaunchModal} The launchModal function
 */
export function useModal(): LaunchModal {
  const { launchModal } = useModalContext();
  return launchModal;
}

/**
 * Get access to the current modal state and a function to update it
 * @returns {[ ModalState, UpdateModalState ]} A tuple with the current modal state and a function to update it
 */
export function useModalState(): [ ModalState, UpdateModalState ] {
  const { stack, updateState } = useModalContext();
  if (stack.length === 0) 
    throw new Error('Trying to access modal state while no modal is open');
  const state = stack[stack.length - 1].state;
  return [ state, updateState ];
}
