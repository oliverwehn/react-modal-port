import React, { 
  createContext, 
  useContext, 
  useState, 
  SyntheticEvent 
} from 'react';

export const ModalContext = createContext<{
  stack: ModalStackItem[],
  launchModal: LaunchModal | null;
}>({
  stack: [],
  launchModal: null,
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
      },
    ]);
  };

  const contextProperties: ModalContextProperties = {
    stack,
    launchModal,
  };

  return <ModalContext.Provider value={contextProperties}>{children}</ModalContext.Provider>;

};

/**
 * Get properties from the modal context
 * @returns {ModalContextProperties} Object with the modal context properties
 */
export function useModalContext() {
  return useContext(ModalContext) ?? {};
}

/**
 * Short-hand for `useModalContext().launchModal`
 * @returns {LaunchModal} The launchModal function
 */
export function useModal() {
  const { launchModal } = useModalContext();
  return launchModal;
}
