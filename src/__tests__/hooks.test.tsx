import { act, render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ModalProvider, useModal, useModalContext, useModalStack, useModalState } from '../index';
import { renderWithPort } from './helpers';

type NameState = { name: string };

function NameInput({ label, onDone }: { label: string; onDone: () => void }) {
  const [state, setState] = useModalState<NameState>();
  return (
    <div>
      <input
        aria-label={label}
        value={state?.name ?? ''}
        onChange={(event) => {
          const name = event.target.value;
          setState((prev) => ({ ...prev, name }));
        }}
      />
      <span data-testid={`state-${label}`}>{JSON.stringify(state)}</span>
      <button onClick={onDone}>done {label}</button>
    </div>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('useModalState', () => {
  it('starts empty and is scoped to the modal it is used in', async () => {
    const { api } = renderWithPort();
    act(() => {
      api.launchModal(NameInput, { onDone: () => {} }, { label: 'A' });
    });
    expect(screen.getByTestId('state-A')).toHaveTextContent('{}');

    await userEvent.type(screen.getByLabelText('A'), 'Ada');
    expect(screen.getByTestId('state-A')).toHaveTextContent('{"name":"Ada"}');

    act(() => {
      api.launchModal(NameInput, { onDone: () => {} }, { label: 'B' });
    });
    expect(screen.getByTestId('state-B')).toHaveTextContent('{}');
    await userEvent.type(screen.getByLabelText('B'), 'Bo');

    // A's state survived while B was on top and was not touched by B.
    await userEvent.click(screen.getByText('done B'));
    expect(screen.getByLabelText('A')).toHaveValue('Ada');
  });

  it('applies functional updates in order (no lost keystrokes)', async () => {
    const { api } = renderWithPort();
    act(() => {
      api.launchModal(NameInput, { onDone: () => {} }, { label: 'A' });
    });
    await userEvent.type(screen.getByLabelText('A'), 'abcdef');
    expect(screen.getByLabelText('A')).toHaveValue('abcdef');
  });

  it('outside a modal, reads and updates the top modal, or returns null when there is none', () => {
    let captured: ReturnType<typeof useModalState> | undefined;
    function Outside() {
      captured = useModalState();
      return null;
    }
    const { api } = renderWithPort({ children: <Outside /> });
    expect(captured?.[0]).toBeNull();
    act(() => {
      captured?.[1]({ ignored: true });
    });
    expect(captured?.[0]).toBeNull();

    act(() => {
      api.launchModal(NameInput, { onDone: () => {} }, { label: 'A' });
    });
    expect(captured?.[0]).toEqual({});
    act(() => {
      captured?.[1]({ name: 'from outside' });
    });
    expect(screen.getByLabelText('A')).toHaveValue('from outside');
  });

  it('discards state when the modal closes', async () => {
    const { api } = renderWithPort();
    act(() => {
      api.launchModal(NameInput, { onDone: () => {} }, { label: 'A' });
    });
    await userEvent.type(screen.getByLabelText('A'), 'x');
    await userEvent.click(screen.getByText('done A'));
    act(() => {
      api.launchModal(NameInput, { onDone: () => {} }, { label: 'A' });
    });
    expect(screen.getByLabelText('A')).toHaveValue('');
  });
});

describe('useModalStack', () => {
  it('exposes a read-only view without resolvers', () => {
    let stack: ReturnType<typeof useModalStack> = [];
    function Watch() {
      stack = useModalStack();
      return null;
    }
    const { api } = renderWithPort({ children: <Watch /> });
    let id = 0;
    act(() => {
      id = api.launchModal(NameInput, { onDone: () => {} }, { label: 'A' }).id;
    });
    expect(stack).toHaveLength(1);
    expect(stack[0]).toEqual({ id, render: NameInput, props: { label: 'A' }, state: {} });
  });
});

describe('useModalContext (deprecated)', () => {
  it('still exposes stack, launchModal and updateState', () => {
    const { result } = renderHook(() => useModalContext(), { wrapper: ModalProvider });
    expect(result.current.stack).toEqual([]);
    expect(typeof result.current.launchModal).toBe('function');
    expect(typeof result.current.updateState).toBe('function');
    expect(result.current).not.toHaveProperty('updateStack');
  });
});

describe('outside a provider', () => {
  it.each([
    ['useModal', () => useModal()],
    ['useModalStack', () => useModalStack()],
    ['useModalState', () => useModalState()],
    ['useModalContext', () => useModalContext()],
  ])('%s throws a descriptive error', (name, hook) => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    function Broken() {
      hook();
      return null;
    }
    expect(() => render(<Broken />)).toThrow(`${name} must be used within a <ModalProvider>`);
  });
});
