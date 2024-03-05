import { PropsWithChildren, SyntheticEvent } from "react";

declare global {

  type LaunchModalResolvers = {
    [key: string]: (ev?: SyntheticEvent) => Promise<any>;
  };

 type ModalStackItem = {
    render: React.FunctionComponent<LaunchModalResolvers>;
    resolvers: LaunchModalResolvers;
    onBackdropClickUse?: string;
  };

  type LaunchModal = (
    render: React.FunctionComponent<LaunchModalResolvers>, 
    resolvers: LaunchModalResolvers,
    onBackdropClickUse?: string,
  ) => void;

  type ModalContextProperties = {
    launchModal: LaunchModal;
    stack: ModalStackItem[];
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