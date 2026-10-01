import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode } from 'react';
import { describe, expect, it } from 'vitest';
import { useModalState } from '../index';
import { deferred, renderWithPort } from './helpers';

function Step({ label, next, onClose }: { label: string; next: () => unknown; onClose: () => unknown }) {
  const [state, setState] = useModalState<{ visits: number }>();
  return (
    <div role="dialog" aria-label={label}>
      <span>visits {state?.visits ?? 0}</span>
      <button onClick={() => setState((s) => ({ visits: (s.visits ?? 0) + 1 }))}>visit {label}</button>
      <button onClick={() => void next()}>next {label}</button>
      <button onClick={() => void onClose()}>close {label}</button>
    </div>
  );
}

describe('under <StrictMode>', () => {
  it('pushes each modal exactly once and resolves the right one', async () => {
    const pending = deferred();
    const { api } = renderWithPort({ wrapper: StrictMode });
    const ids: number[] = [];

    act(() => {
      ids.push(api.launchModal(Step, { next: () => pending.promise, onClose: () => {} }, { label: 'A' }).id);
    });
    await userEvent.click(screen.getByText('visit A'));
    expect(screen.getByText('visits 1')).toBeInTheDocument();
    await userEvent.click(screen.getByText('next A'));

    act(() => {
      ids.push(api.launchModal(Step, { next: () => {}, onClose: () => {} }, { label: 'B' }).id);
    });
    expect(screen.getByTestId('backdrop')).toHaveAttribute('data-stack-size', '2');
    expect(new Set(ids).size).toBe(2);

    await act(async () => {
      pending.resolve();
      await pending.promise;
    });
    expect(screen.getByTestId('backdrop')).toHaveAttribute('data-stack-size', '1');
    expect(screen.getByRole('dialog', { name: 'B' })).toBeInTheDocument();

    await userEvent.click(screen.getByText('close B'));
    expect(screen.queryByTestId('backdrop')).not.toBeInTheDocument();
  });
});
