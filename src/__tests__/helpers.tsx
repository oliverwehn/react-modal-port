import { render, type RenderOptions } from '@testing-library/react';
import type { ReactNode } from 'react';
import { ModalPort, ModalProvider, useModal } from '../index';
import type { LaunchModal, ModalPortProps, ModalPortRenderProps } from '../index';

/** A promise whose settlement the test controls. */
export function deferred<T = void>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

/** Backdrop that does NOT stop propagation, so the library's own target check is exercised. */
export function TestBackdrop({ children, onBackdropClick, modalId, stackSize }: ModalPortRenderProps) {
  return (
    <div
      data-testid="backdrop"
      data-modal-id={modalId}
      data-stack-size={stackSize}
      data-dismissible={onBackdropClick ? 'yes' : 'no'}
      onClick={onBackdropClick}
    >
      {children}
    </div>
  );
}

/** Renders a provider and port, and captures `launchModal` so tests can launch modals imperatively. */
export function renderWithPort(
  options: { port?: Partial<ModalPortProps>; children?: ReactNode; wrapper?: RenderOptions['wrapper'] } = {},
) {
  const api = {} as { launchModal: LaunchModal };
  function Capture() {
    api.launchModal = useModal();
    return null;
  }
  const result = render(
    <ModalProvider>
      <Capture />
      {options.children}
      <ModalPort backdrop={TestBackdrop} {...options.port} />
    </ModalProvider>,
    { wrapper: options.wrapper },
  );
  return { ...result, api };
}
