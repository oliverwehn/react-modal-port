import { Fragment, useEffect, useRef, type ComponentType, type SyntheticEvent } from 'react';
import { createPortal } from 'react-dom';
import { ItemContext, useModalItems } from './context';
import type { ModalPortProps, ModalPortRenderProps } from './types';

const NoBackdrop = ({ children }: ModalPortRenderProps) => <Fragment>{children}</Fragment>;

/** Renders the top modal of the stack inside `backdrop`. */
export function ModalPort({
  backdrop,
  render,
  container,
  onModalLaunch,
  onModalClose,
  onStackChange,
}: ModalPortProps) {
  const stack = useModalItems();
  const size = stack.length;
  const previousSize = useRef(0);

  useEffect(() => {
    const previous = previousSize.current;
    if (previous === size) return;
    previousSize.current = size;
    onStackChange?.(size);
    if (previous === 0) onModalLaunch?.();
    else if (size === 0) onModalClose?.();
  }, [size, onModalLaunch, onModalClose, onStackChange]);

  const top = stack.at(-1);
  if (!top) return null;

  const Backdrop = backdrop ?? render ?? NoBackdrop;
  // Props are typed per launch; the stack stores them loosely.
  const Modal = top.render as ComponentType<Record<string, unknown>>;
  const { onDismiss } = top;
  const onBackdropClick = onDismiss
    ? (event: SyntheticEvent) => {
        // Ignore clicks that bubble up from the modal content.
        if (event.currentTarget === event.target) void onDismiss(event);
      }
    : undefined;

  const content = (
    <Backdrop onBackdropClick={onBackdropClick} modalId={top.id} stackSize={size}>
      <ItemContext key={top.id} value={top.id}>
        <Modal {...top.props} {...top.resolvers} />
      </ItemContext>
    </Backdrop>
  );

  return container ? createPortal(content, container) : content;
}
