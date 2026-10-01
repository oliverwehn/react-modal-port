import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { deferred, renderWithPort } from './helpers';

type ConfirmProps = { title: string; onConfirm: () => unknown; onCancel: () => unknown };

function Confirm({ title, onConfirm, onCancel }: ConfirmProps) {
  return (
    <div role="dialog" aria-label={title}>
      <button onClick={() => void onConfirm()}>confirm {title}</button>
      <button onClick={() => void onCancel()}>cancel {title}</button>
    </div>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('launching and resolving', () => {
  it('renders the modal with its props and closes it when a resolver is called', async () => {
    const onConfirm = vi.fn();
    const { api } = renderWithPort();

    act(() => {
      api.launchModal(Confirm, { onConfirm, onCancel: () => {} }, { title: 'A' });
    });
    expect(screen.getByRole('dialog', { name: 'A' })).toBeInTheDocument();

    await userEvent.click(screen.getByText('confirm A'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('passes resolver arguments through and resolves with the resolver result', async () => {
    const seen: unknown[] = [];
    function Asker({ answer }: { answer: (value: number) => number }) {
      return <button onClick={() => seen.push(answer(42))}>answer</button>;
    }
    const answer = vi.fn((value: number) => value * 2);
    const { api } = renderWithPort();
    act(() => {
      api.launchModal(Asker, { answer });
    });

    await userEvent.click(screen.getByText('answer'));
    expect(answer).toHaveBeenCalledWith(42);
    await expect(seen[0]).resolves.toBe(84);
  });

  it('keeps an async resolver’s modal open until its promise settles', async () => {
    const pending = deferred();
    const { api } = renderWithPort();
    act(() => {
      api.launchModal(Confirm, { onConfirm: () => pending.promise, onCancel: () => {} }, { title: 'A' });
    });

    await userEvent.click(screen.getByText('confirm A'));
    expect(screen.getByRole('dialog', { name: 'A' })).toBeInTheDocument();

    await act(async () => {
      pending.resolve();
      await pending.promise;
    });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes the modal the resolver belongs to, even when another modal was stacked meanwhile (B1)', async () => {
    const pending = deferred();
    const { api } = renderWithPort();
    let resolveA!: () => unknown;
    act(() => {
      api.launchModal(
        function A({ done }: { done: () => unknown }) {
          resolveA = done;
          return <p>modal A</p>;
        },
        { done: () => pending.promise },
      );
    });
    act(() => {
      void resolveA();
    });
    act(() => {
      api.launchModal(Confirm, { onConfirm: () => {}, onCancel: () => {} }, { title: 'B' });
    });
    expect(screen.getByRole('dialog', { name: 'B' })).toBeInTheDocument();

    await act(async () => {
      pending.resolve();
      await pending.promise;
    });
    // A is gone, B stays.
    expect(screen.getByRole('dialog', { name: 'B' })).toBeInTheDocument();
    await userEvent.click(screen.getByText('confirm B'));
    expect(screen.queryByText('modal A')).not.toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('resolves a modal only once, even if resolvers are called repeatedly (B2)', async () => {
    const onConfirm = vi.fn();
    const onCancel = vi.fn();
    const { api } = renderWithPort();
    act(() => {
      api.launchModal(Confirm, { onConfirm: () => {}, onCancel: () => {} }, { title: 'A' });
      api.launchModal(Confirm, { onConfirm, onCancel }, { title: 'B' });
    });

    const confirmB = screen.getByText('confirm B');
    const cancelB = screen.getByText('cancel B');
    await act(async () => {
      confirmB.click();
      confirmB.click();
      cancelB.click();
    });

    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(onCancel).not.toHaveBeenCalled();
    expect(screen.getByRole('dialog', { name: 'A' })).toBeInTheDocument();
  });

  it('keeps the modal open and rethrows when a resolver rejects, and allows a retry (B4)', async () => {
    const error = new Error('save failed');
    let attempts = 0;
    const save = () => {
      attempts += 1;
      if (attempts === 1) throw error;
    };
    let call!: () => Promise<unknown>;
    function Saver({ onSave }: { onSave: () => Promise<unknown> }) {
      call = onSave;
      return <p>saver</p>;
    }
    const { api } = renderWithPort();
    act(() => {
      api.launchModal(Saver, { onSave: save as () => Promise<unknown> });
    });

    await act(async () => {
      await expect(call()).rejects.toBe(error);
    });
    expect(screen.getByText('saver')).toBeInTheDocument();

    await act(async () => {
      await call();
    });
    expect(screen.queryByText('saver')).not.toBeInTheDocument();
    expect(attempts).toBe(2);
  });
});

describe('modal handle', () => {
  it('closes its own modal without calling resolvers, and is a no-op afterwards', async () => {
    const onConfirm = vi.fn();
    const { api } = renderWithPort();
    let handleA!: ReturnType<typeof api.launchModal>;
    act(() => {
      handleA = api.launchModal(Confirm, { onConfirm, onCancel: () => {} }, { title: 'A' });
      api.launchModal(Confirm, { onConfirm: () => {}, onCancel: () => {} }, { title: 'B' });
    });
    expect(handleA.id).toEqual(expect.any(Number));

    act(() => {
      handleA.close();
    });
    expect(screen.getByRole('dialog', { name: 'B' })).toBeInTheDocument();
    await userEvent.click(screen.getByText('confirm B'));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();

    act(() => {
      handleA.close();
    });
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('gives every launch a unique id', () => {
    const { api } = renderWithPort();
    const ids = new Set<number>();
    act(() => {
      for (let i = 0; i < 5; i++) ids.add(api.launchModal(Confirm, { onConfirm: () => {}, onCancel: () => {} }, { title: `${i}` }).id);
    });
    expect(ids.size).toBe(5);
  });
});

describe('dev warnings', () => {
  it('warns once when a prop has the same name as a resolver, and the resolver wins', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const onConfirm = vi.fn();
    const { api } = renderWithPort();
    const launchLoose = api.launchModal as unknown as (...args: unknown[]) => void;
    act(() => {
      launchLoose(Confirm, { onConfirm, onCancel: () => {} }, { title: 'A', onConfirm: () => {} });
      launchLoose(Confirm, { onConfirm: () => {}, onCancel: () => {} }, { title: 'B', onConfirm: () => {} });
    });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toMatch(/Prop "onConfirm"/);

    await userEvent.click(screen.getByText('confirm B'));
    await userEvent.click(screen.getByText('confirm A'));
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('does not warn in production', () => {
    vi.stubEnv('NODE_ENV', 'production');
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { api } = renderWithPort();
    const launchLoose = api.launchModal as unknown as (...args: unknown[]) => void;
    act(() => {
      launchLoose(Confirm, { onCancel: () => {} }, { title: 'A', onCancel: 1 });
    });
    expect(warn).not.toHaveBeenCalled();
    vi.unstubAllEnvs();
  });
});
