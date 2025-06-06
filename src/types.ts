/// <reference types="react" />

import { type SyntheticEvent } from "react";

export type ModalResolver = (...args: any[]) => Promise<void>|void;

export type LaunchModalResolvers = {
  [key: string]: ModalResolver;
};

export type LaunchModalProps = {
  [key: string]: any;
};

export type ModalProps<P = Record<string, any>> = P;

export type ModalStackItem<P extends Record<string, any> = Record<string, any>> = {
  render: React.FunctionComponent<ModalProps<P>>;
  resolvers: LaunchModalResolvers;
  props: LaunchModalProps;
  state: ModalState;
};

export type LaunchModal<P extends Record<string, any> = Record<string, any>> = (
  render: React.FunctionComponent<ModalProps<P>>, 
  resolvers: LaunchModalResolvers,
  props?: LaunchModalProps,
) => void;

export type ModalState = { [key: string]: any };
export type UpdateModalState = (newState: ModalState) => void;

export type ModalContextProperties = {
  stack: ModalStackItem<any>[];
  launchModal: <P extends Record<string, any> = Record<string, any>>(
    render: React.FunctionComponent<ModalProps<P>>, 
    resolvers: LaunchModalResolvers,
    props?: LaunchModalProps,
  ) => void;
  updateStack: (newStack: ModalStackItem<any>[]) => void;
  updateState: (newState: ModalState) => void;
};

export type ModalPortRenderProps = React.PropsWithChildren & {
  onBackdropClick?: (ev: SyntheticEvent) => void;
};

export type ModalPortProps = {
  onModalLaunch?: () => void | null;
  onModalClose?: () => void | null;
  render: React.FC<ModalPortRenderProps>;
}; 