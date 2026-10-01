import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { useModal, useModalState } from '../index';
import type { LaunchModal } from '../index';
import { renderWithPort } from './helpers';

function Typing({ onDone }: { onDone: () => void }) {
  const [state, setState] = useModalState<{ text: string }>();
  return (
    <>
      <input aria-label="text" value={state?.text ?? ''} onChange={(e) => setState({ text: e.target.value })} />
      <button onClick={onDone}>done</button>
    </>
  );
}

describe('render isolation', () => {
  it('does not re-render useModal() consumers on stack or modal-state changes', async () => {
    let renders = 0;
    const seen = new Set<LaunchModal>();
    function Launcher() {
      renders += 1;
      seen.add(useModal());
      return null;
    }
    const { api } = renderWithPort({ children: <Launcher /> });
    const initialRenders = renders;

    act(() => {
      api.launchModal(Typing, { onDone: () => {} });
    });
    await userEvent.type(screen.getByLabelText('text'), 'hello');
    await userEvent.click(screen.getByText('done'));

    expect(renders).toBe(initialRenders);
    expect(seen.size).toBe(1);
  });

  it('keeps the state updater stable across renders of the same modal', async () => {
    const updaters = new Set<unknown>();
    function Modal() {
      const [state, setState] = useModalState<{ n: number }>();
      updaters.add(setState);
      return <button onClick={() => setState((s) => ({ n: (s.n ?? 0) + 1 }))}>n={state?.n ?? 0}</button>;
    }
    const { api } = renderWithPort();
    act(() => {
      api.launchModal(Modal, {});
    });
    await userEvent.click(screen.getByText('n=0'));
    await userEvent.click(screen.getByText('n=1'));
    expect(screen.getByText('n=2')).toBeInTheDocument();
    expect(updaters.size).toBe(1);
  });
});
