import { PropsWithChildren, SyntheticEvent } from "react";

declare global {

  export type ModalResolver = (ev?: SyntheticEvent) => Promise<any>|void;
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

  export type ModalPortRenderProps = PropsWithChildren & {
    onBackdropClick?: (ev: SyntheticEvent) => void;
  };

  export type ModalPortProps = {
    onModalLaunch?: () => void | null;
    onModalClose?: () => void | null;
    render: React.FC<ModalPortRenderProps>;
  };

}