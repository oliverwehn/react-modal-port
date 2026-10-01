import type { ComponentType } from 'react';
import type { ModalState } from './types';

export type ModalItem = {
  readonly id: number;
  readonly render: ComponentType<never>;
  /** Resolvers, already wrapped so that they close this item. */
  readonly resolvers: Readonly<Record<string, (...args: unknown[]) => Promise<unknown>>>;
  readonly props: Readonly<Record<string, unknown>>;
  readonly onDismiss: ((...args: unknown[]) => Promise<unknown>) | undefined;
  readonly state: ModalState;
};

export type StateUpdate = ModalState | ((prev: ModalState) => ModalState);

export type Action =
  | { type: 'push'; item: ModalItem }
  | { type: 'remove'; id: number }
  | { type: 'setState'; id: number; update: StateUpdate };

/** Pure stack reducer. Ids are created by the caller, so this stays StrictMode-safe. */
export function reducer(stack: readonly ModalItem[], action: Action): readonly ModalItem[] {
  switch (action.type) {
    case 'push':
      return [...stack, action.item];
    case 'remove':
      return stack.some((item) => item.id === action.id)
        ? stack.filter((item) => item.id !== action.id)
        : stack;
    case 'setState': {
      const { id, update } = action;
      if (!stack.some((item) => item.id === id)) return stack;
      return stack.map((item) =>
        item.id === id
          ? { ...item, state: typeof update === 'function' ? update(item.state) : { ...update } }
          : item,
      );
    }
  }
}
