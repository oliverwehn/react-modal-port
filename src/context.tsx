import {
  createContext,
  use,
  useCallback,
  useMemo,
  useReducer,
  type ComponentType,
  type Context,
  type ReactNode,
} from 'react';
import { reducer, type ModalItem, type StateUpdate } from './store';
import type {
  LaunchModal,
  LaunchOptions,
  ModalContextProperties,
  ModalStackEntry,
  ModalState,
  UpdateModalState,
} from './types';

type Actions = {
  launchModal: LaunchModal;
  setState: (id: number, update: StateUpdate) => void;
};

const ActionsContext = createContext<Actions | null>(null);
const StackContext = createContext<readonly ModalItem[] | null>(null);
/** Id of the modal a component is rendered inside, if any. */
export const ItemContext = createContext<number | null>(null);

let nextId = 0;
const warned = new Set<string>();
declare const process: { env: { NODE_ENV?: string } };
// Bundlers replace the literal `process.env.NODE_ENV` but usually do not define `process`,
// so read it directly; unbundled ESM (no `process` at all) falls back to development.
const isProduction = () => {
  try {
    return process.env.NODE_ENV === 'production';
  } catch {
    return false;
  }
};
function warnOnce(key: string, message: string) {
  if (isProduction() || warned.has(key)) return;
  warned.add(key);
  console.warn(`[react-modal-port] ${message}`);
}

type AnyResolver = (...args: unknown[]) => unknown;

export function ModalProvider({ children }: { children?: ReactNode }) {
  const [stack, dispatch] = useReducer(reducer, []);

  const actions = useMemo<Actions>(() => {
    const launchModal = ((
      render: ComponentType<never>,
      resolvers: Record<string, AnyResolver>,
      props: Record<string, unknown> = {},
      options: LaunchOptions = {},
    ) => {
      // Created outside the reducer so StrictMode's double-invoked reducers stay pure.
      const id = ++nextId;
      let settled = false;

      const wrap =
        (fn: AnyResolver) =>
        async (...args: unknown[]) => {
          if (settled) return undefined;
          settled = true;
          try {
            const result = await fn(...args);
            dispatch({ type: 'remove', id });
            return result;
          } catch (error) {
            // Keep the modal open so the user can retry; let the caller handle the error.
            settled = false;
            throw error;
          }
        };

      const { onBackdropClick: legacyDismiss, ...ownResolvers } = resolvers;
      if (legacyDismiss) {
        warnOnce(
          'onBackdropClick',
          'Passing `onBackdropClick` as a resolver is deprecated. Use `launchModal(Modal, resolvers, props, { onDismiss })`.',
        );
      }
      const onDismiss = options.onDismiss ?? legacyDismiss;

      for (const key of Object.keys(props)) {
        if (key in ownResolvers) {
          warnOnce(
            `collision:${key}`,
            `Prop "${key}" has the same name as a resolver and is ignored. Resolvers take precedence.`,
          );
        }
      }

      dispatch({
        type: 'push',
        item: {
          id,
          render,
          props,
          resolvers: Object.fromEntries(Object.entries(ownResolvers).map(([key, fn]) => [key, wrap(fn)])),
          onDismiss: onDismiss ? wrap(onDismiss as AnyResolver) : undefined,
          state: {},
        },
      });

      return {
        id,
        close: () => {
          settled = true;
          dispatch({ type: 'remove', id });
        },
      };
    }) as LaunchModal;

    return {
      launchModal,
      setState: (id, update) => dispatch({ type: 'setState', id, update }),
    };
  }, []);

  return (
    <ActionsContext value={actions}>
      <StackContext value={stack}>{children}</StackContext>
    </ActionsContext>
  );
}

/** @deprecated Use `ModalProvider`. */
export const ModalContextProvider = ModalProvider;

function useRequired<T>(context: Context<T | null>, hook: string): T {
  const value = use(context);
  if (value === null) {
    throw new Error(`${hook} must be used within a <ModalProvider>`);
  }
  return value;
}

/** @internal Full stack items, including wrapped resolvers. Used by `ModalPort`. */
export function useModalItems(hook = 'ModalPort'): readonly ModalItem[] {
  return useRequired(StackContext, hook);
}

function toEntry({ id, render, props, state }: ModalItem): ModalStackEntry {
  return { id, render, props, state };
}

/** Returns the `launchModal` function. Does not re-render when the stack changes. */
export function useModal(): LaunchModal {
  return useRequired(ActionsContext, 'useModal').launchModal;
}

/** A read-only view of the modal stack, bottom first. */
export function useModalStack(): readonly ModalStackEntry[] {
  const items = useModalItems('useModalStack');
  return useMemo(() => items.map(toEntry), [items]);
}

/**
 * State shared by the modal this hook is called in (or the top modal, when called
 * outside any modal). Survives while other modals are stacked on top and is
 * discarded when the modal closes. `null` when there is no such modal.
 */
export function useModalState<S extends ModalState = ModalState>(): [S | null, UpdateModalState<S>] {
  const { setState } = useRequired(ActionsContext, 'useModalState');
  const items = useModalItems('useModalState');
  const ownId = use(ItemContext);
  const item = ownId === null ? items.at(-1) : items.find((entry) => entry.id === ownId);
  const id = item?.id;

  const update = useCallback<UpdateModalState<S>>(
    (next) => {
      if (id !== undefined) setState(id, next as StateUpdate);
    },
    [id, setState],
  );

  return [item ? (item.state as S) : null, update];
}

/**
 * @deprecated Use `useModal`, `useModalStack` and `useModalState`. This hook re-renders
 * on every stack change.
 */
export function useModalContext(): ModalContextProperties {
  const launchModal = useRequired(ActionsContext, 'useModalContext').launchModal;
  const stack = useModalStack();
  const [, updateState] = useModalState();
  return { stack, launchModal, updateState };
}
