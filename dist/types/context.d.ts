import React from 'react';
export declare const ModalContext: React.Context<ModalContextProperties>;
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
export declare function useModal(): LaunchModal;
/**
 * Get access to the current modal state and a function to update it
 * @returns {[ ModalState, UpdateModalState ]} A tuple with the current modal state and a function to update it
 */
export declare function useModalState(): [ModalState, UpdateModalState];
