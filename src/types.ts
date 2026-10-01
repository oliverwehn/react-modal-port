import type { ComponentProps, ComponentType, KeyboardEvent as ReactKeyboardEvent, ReactNode, SyntheticEvent } from 'react';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- needed so any function signature is assignable
type AnyFn = (...args: any[]) => any;

/** Keys of `P` whose (non-nullable) value is a function, optional props included. */
export type FunctionKeys<P> = {
  [K in keyof P]-?: NonNullable<P[K]> extends AnyFn ? K : never;
}[keyof P];

/** The subset of a modal's function props that resolve (and close) it. */
export type Resolvers<P, R extends FunctionKeys<P>> = { [K in R]: P[K] };

/** Everything the modal needs that is not passed as a resolver. */
export type RestProps<P, R extends PropertyKey> = Omit<P, R>;

/** Options that concern the port rather than the modal component itself. */
export type LaunchOptions = {
  /**
   * Called when the modal is dismissed from outside its content (backdrop click,
   * or Escape if your backdrop wires it). Wrapped like a resolver: it closes this
   * modal once it has run, and keeps it open if it throws.
   */
  onDismiss?: (event?: SyntheticEvent | ReactKeyboardEvent | Event) => unknown;
};

/**
 * Arguments after `resolvers`: `props` is required when the modal still has required
 * props left, optional when only optional props are left, and must be empty otherwise.
 */
export type LaunchRest<P, R extends PropertyKey> = [keyof RestProps<P, R>] extends [never]
  ? [props?: Record<string, never>, options?: LaunchOptions]
  : object extends RestProps<P, R>
    ? [props?: RestProps<P, R>, options?: LaunchOptions]
    : [props: RestProps<P, R>, options?: LaunchOptions];

/** Returned by `launchModal`; lets the launcher close the modal programmatically. */
export type ModalHandle = {
  readonly id: number;
  /** Removes this modal without calling any resolver. No-op if it is already gone. */
  close: () => void;
};

/**
 * Launch `render` on top of the modal stack.
 *
 * The modal's props are read from the component `C`. `R` is inferred from the keys of
 * `resolvers`, which must be function props of the modal. The remaining props are type-checked against the modal's props.
 */
export type LaunchModal = <
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- any component; props are read via ComponentProps
  C extends ComponentType<any>,
  R extends FunctionKeys<ComponentProps<C>> = never,
>(
  render: C,
  resolvers: Resolvers<ComponentProps<C>, R>,
  ...rest: LaunchRest<ComponentProps<C>, R>
) => ModalHandle;

export type ModalState = Record<string, unknown>;

export type UpdateModalState<S extends ModalState = ModalState> = (update: S | ((prev: S) => S)) => void;

/** A read-only view of one modal on the stack. */
export type ModalStackEntry = {
  readonly id: number;
  readonly render: ComponentType<never>;
  readonly props: Readonly<Record<string, unknown>>;
  readonly state: Readonly<ModalState>;
};

export type ModalPortRenderProps = {
  children?: ReactNode;
  /** Present only when the current modal can be dismissed (it was launched with `onDismiss`). */
  onBackdropClick?: (event: SyntheticEvent) => void;
  /** Id of the modal currently shown. */
  modalId: number;
  /** Number of modals on the stack, including the one shown. */
  stackSize: number;
};

export type ModalPortProps = {
  /** Component rendered around the current modal, typically a backdrop. */
  backdrop?: ComponentType<ModalPortRenderProps>;
  /** @deprecated Use `backdrop`. */
  render?: ComponentType<ModalPortRenderProps>;
  /** Render into this element through a portal instead of in place. */
  container?: Element | DocumentFragment | null;
  /** Called when the stack goes from empty to non-empty. */
  onModalLaunch?: () => void;
  /** Called when the stack becomes empty. */
  onModalClose?: () => void;
  /** Called with the new stack size whenever a modal is launched or closed. */
  onStackChange?: (stackSize: number) => void;
};

export type ModalContextProperties = {
  readonly stack: readonly ModalStackEntry[];
  launchModal: LaunchModal;
  /** Replaces the state of the top modal. */
  updateState: UpdateModalState;
};

/** @deprecated Type your modal's props directly. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- legacy loose alias
export type ModalProps<P = Record<string, any>> = P;
/** @deprecated Use `Resolvers` or your modal's own prop types. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- legacy loose alias
export type ModalResolver = (...args: any[]) => unknown;
/** @deprecated Use `Resolvers` or your modal's own prop types. */
export type LaunchModalResolvers = Record<string, ModalResolver>;
/** @deprecated Use your modal's own prop types. */
export type LaunchModalProps = Record<string, unknown>;
