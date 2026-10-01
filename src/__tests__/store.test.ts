import { describe, expect, it } from 'vitest';
import { reducer, type ModalItem } from '../store';

const item = (id: number, state = {}): ModalItem =>
  Object.freeze({ id, render: () => null, resolvers: {}, props: {}, onDismiss: undefined, state });

describe('reducer', () => {
  it('pushes items on top', () => {
    const stack = Object.freeze([item(1)]);
    expect(reducer(stack, { type: 'push', item: item(2) }).map((i) => i.id)).toEqual([1, 2]);
  });

  it('removes an item by id, wherever it sits', () => {
    const stack = Object.freeze([item(1), item(2), item(3)]);
    expect(reducer(stack, { type: 'remove', id: 2 }).map((i) => i.id)).toEqual([1, 3]);
  });

  it('returns the same stack when removing an unknown id', () => {
    const stack = Object.freeze([item(1)]);
    expect(reducer(stack, { type: 'remove', id: 99 })).toBe(stack);
  });

  it('replaces state with a copy of the given object', () => {
    const stack = Object.freeze([item(1), item(2)]);
    const next = { a: 1 };
    const result = reducer(stack, { type: 'setState', id: 1, update: next });
    expect(result[0]?.state).toEqual({ a: 1 });
    expect(result[0]?.state).not.toBe(next);
    expect(result[1]).toBe(stack[1]);
  });

  it('applies functional updates to the previous state', () => {
    const stack = Object.freeze([item(1, { n: 1 })]);
    const result = reducer(stack, {
      type: 'setState',
      id: 1,
      update: (prev) => ({ n: (prev.n as number) + 1 }),
    });
    expect(result[0]?.state).toEqual({ n: 2 });
  });

  it('returns the same stack when setting state for an unknown id', () => {
    const stack = Object.freeze([item(1)]);
    expect(reducer(stack, { type: 'setState', id: 5, update: {} })).toBe(stack);
  });
});
