import { type ModalContextProperties, type LaunchModalResolvers, type ModalState, type UpdateModalState, ModalProps } from './types';
export declare const ModalContext: import("react").Context<ModalContextProperties | null>;
export declare const ModalContextProvider: ({ children }: Readonly<{
    children: React.ReactNode;
}>) => import("react/jsx-runtime").JSX.Element;
/**
 * Get properties from the modal context
 * @returns {ModalContextProperties} Object with the modal context properties
 */
export declare function useModalContext(): ModalContextProperties;
/**
 * Short-hand for `useModalContext().launchModal`
 * @returns {LaunchModal} The launchModal function
 */
export declare function useModal(): <P extends Record<string, any> = Record<string, any>>(render: React.FunctionComponent<ModalProps<P>>, resolvers: LaunchModalResolvers, props?: import("./types").LaunchModalProps) => void;
/**
 * Get access to the current modal state and a function to update it
 * @returns {[ ModalState | null, UpdateModalState ]} A tuple with the current modal state and a function to update it
 */
export declare function useModalState(): [ModalState | null, UpdateModalState];
