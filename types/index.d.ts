/// <reference types="react" />

export type ModalResolver = (...args: any[]) => Promise<void>|void;


export type LaunchModalResolvers = {
  [key: string]: ModalResolver;
};

export type ModalStackItem = {
  render: React.FunctionComponent<LaunchModalResolvers>;
  resolvers: LaunchModalResolvers;
  onBackdropClickUse?: string;
  state: ModalState;
};

export type LaunchModal = (
  render: React.FunctionComponent<LaunchModalResolvers>, 
  resolvers: LaunchModalResolvers,
  onBackdropClickUse?: string,
) => void;

export type ModalState = { [key: string]: any };
export type UpdateModalState = (newState: ModalState) => void;

export type ModalContextProperties = {
  stack: ModalStackItem[];
  launchModal: LaunchModal;
  updateStack: (newStack: ModalStackItem[]) => void;
  updateState: (newState: ModalState) => void;
};

export type ModalPortRenderProps = React.PropsWithChildren & {
  onBackdropClick?: (ev: React.SyntheticEvent) => void;
};

export type ModalPortProps = {
  onModalLaunch?: () => void | null;
  onModalClose?: () => void | null;
  render: React.FC<ModalPortRenderProps>;
};

declare module 'react-modal-port' {

  const ModalContextProvider: React.FC<PropsWithChildren>;
  const useModalContext: () => ModalContextProperties;
  const useModal: () => ModalContextProperties['launchModal'];
  const useModalState: () => ModalState;
  const ModalPort: React.FC<ModalPortProps>;

}
    