import { 
  createContext, 
  useContext, 
  useState, 
  useCallback,
  type SyntheticEvent 
} from 'react';
import { 
  type ModalStackItem,
  type ModalContextProperties,
  type LaunchModal,
  type LaunchModalResolvers,
  type ModalState,
  type UpdateModalState,
  ModalProps,
} from './types';

export const ModalContext = createContext<ModalContextProperties | null>(null);

export const ModalContextProvider = ({ children }: Readonly<{ children: React.ReactNode }>) => {

  const [ stack, updateStack ] = useState<ModalStackItem<any>[]>([]);

  const launchModal = useCallback(<P extends Record<string, any> = Record<string, any>>(
    render: React.FunctionComponent<ModalProps<P>>, 
    resolvers: LaunchModalResolvers,
    props: any = {}
  ) => {
    // Wrap resolvers to update the stack
    const wrappedResovers = Object.keys(resolvers).reduce((acc, key) => {
      const resolver = resolvers[key];
      acc[key] = async (...args: any[]) => {
        const result = await resolver(...args);
        // update stack with an array containing all the items in the stack except the last one
        updateStack(currStack => currStack.slice(0, -1));
        return result;
      };
      return acc;
    }, {} as LaunchModalResolvers);

    updateStack(prevStack => [
      ...prevStack,
      {
        render,
        resolvers: wrappedResovers,
        props,
        state: {},
      },
    ]);
  }, []);

  const updateState = useCallback((newState: ModalState) => {
    updateStack(prevStack => {
      const updatedStack = [...prevStack];
      if (updatedStack.length > 0) {
        updatedStack[updatedStack.length - 1] = {
          ...updatedStack[updatedStack.length - 1],
          state: { ...newState }
        };
      }
      return updatedStack;
    });
  }, []);

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
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModalContext must be used within a ModalContextProvider');
  }
  return context;
}

/**
 * Short-hand for `useModalContext().launchModal`
 * @returns {LaunchModal} The launchModal function
 */
export function useModal() {
  const { launchModal } = useModalContext();
  return launchModal;
}

/**
 * Get access to the current modal state and a function to update it
 * @returns {[ ModalState | null, UpdateModalState ]} A tuple with the current modal state and a function to update it
 */
export function useModalState(): [ ModalState | null, UpdateModalState ] {
  const { stack, updateState } = useModalContext();
  if (stack.length === 0) {
    return [null, updateState];
  }
  const state = stack[stack.length - 1].state;
  return [ state, updateState ];
}
