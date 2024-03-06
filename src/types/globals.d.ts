import { PropsWithChildren, SyntheticEvent } from "react";

declare global {

  type ModalResolver = (ev?: SyntheticEvent) => Promise<any>|void;
  type LaunchModalResolvers = {
    [key: string]: ModalResolver;
  };

 type ModalStackItem = {
    render: React.FunctionComponent<LaunchModalResolvers>;
    resolvers: LaunchModalResolvers;
    onBackdropClickUse?: string;
    state: ModalState;
  };

  type LaunchModal = (
    render: React.FunctionComponent<LaunchModalResolvers>, 
    resolvers: LaunchModalResolvers,
    onBackdropClickUse?: string,
  ) => void;

  type ModalState = { [key: string]: any };
  type UpdateModalState = (newState: ModalState) => void;

  type ModalContextProperties = {
    stack: ModalStackItem[];
    launchModal: LaunchModal;
    updateStack: (newStack: ModalStackItem[]) => void;
    updateState: (newState: ModalState) => void;
  };

  type ModalPortRenderProps = PropsWithChildren & {
    onBackdropClick?: (ev: SyntheticEvent) => void;
  };

  type ModalPortProps = {
    onModalLaunch?: () => void | null;
    onModalClose?: () => void | null;
    render: React.FC<ModalPortRenderProps>;
  };

}