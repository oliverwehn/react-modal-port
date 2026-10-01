import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useEffect, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ModalContextProvider, ModalPort, ModalProvider, type ModalPortRenderProps } from '../index';
import { renderWithPort } from './helpers';

function Note({ text, onClose }: { text: string; onClose: () => void }) {
  return (
    <div role="dialog" aria-label={text}>
      <span>{text}</span>
      <button onClick={onClose}>close {text}</button>
    </div>
  );
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('ModalPort rendering', () => {
  it('renders nothing while the stack is empty', () => {
    renderWithPort();
    expect(screen.queryByTestId('backdrop')).not.toBeInTheDocument();
  });

  it('renders only the top modal and returns to the previous one when it closes', async () => {
    const { api } = renderWithPort();
    act(() => {
      api.launchModal(Note, { onClose: () => {} }, { text: 'A' });
      api.launchModal(Note, { onClose: () => {} }, { text: 'B' });
    });
    expect(screen.queryByText('A')).not.toBeInTheDocument();
    expect(screen.getByText('B')).toBeInTheDocument();
    expect(screen.getByTestId('backdrop')).toHaveAttribute('data-stack-size', '2');

    await userEvent.click(screen.getByText('close B'));
    expect(screen.getByText('A')).toBeInTheDocument();
    expect(screen.getByTestId('backdrop')).toHaveAttribute('data-stack-size', '1');
  });

  it('passes the id of the shown modal to the backdrop', () => {
    const { api } = renderWithPort();
    let id = 0;
    act(() => {
      id = api.launchModal(Note, { onClose: () => {} }, { text: 'A' }).id;
    });
    expect(screen.getByTestId('backdrop')).toHaveAttribute('data-modal-id', String(id));
  });

  it('remounts when the same component is stacked on itself (B3)', async () => {
    const mounts = vi.fn();
    function Counter({ label, onClose }: { label: string; onClose: () => void }) {
      const [count, setCount] = useState(0);
      useEffect(() => {
        mounts(label);
      }, [label]);
      return (
        <div>
          <span>
            {label}:{count}
          </span>
          <button onClick={() => setCount((c) => c + 1)}>inc {label}</button>
          <button onClick={onClose}>close {label}</button>
        </div>
      );
    }
    const { api } = renderWithPort();
    act(() => {
      api.launchModal(Counter, { onClose: () => {} }, { label: 'A' });
    });
    await userEvent.click(screen.getByText('inc A'));
    expect(screen.getByText('A:1')).toBeInTheDocument();

    act(() => {
      api.launchModal(Counter, { onClose: () => {} }, { label: 'B' });
    });
    expect(screen.getByText('B:0')).toBeInTheDocument();
    expect(mounts).toHaveBeenCalledTimes(2);

    // Coming back to A mounts it again; its *modal* state survives, its local state does not.
    await userEvent.click(screen.getByText('close B'));
    expect(screen.getByText('A:0')).toBeInTheDocument();
  });

  it('works without a backdrop', () => {
    const { api } = renderWithPort({ port: { backdrop: undefined } });
    act(() => {
      api.launchModal(Note, { onClose: () => {} }, { text: 'bare' });
    });
    expect(screen.getByText('bare')).toBeInTheDocument();
    expect(screen.queryByTestId('backdrop')).not.toBeInTheDocument();
  });

  it('accepts the deprecated `render` prop and `ModalContextProvider` alias', () => {
    function Legacy({ children }: ModalPortRenderProps) {
      return <section data-testid="legacy">{children}</section>;
    }
    render(
      <ModalContextProvider>
        <ModalPort render={Legacy} />
      </ModalContextProvider>,
    );
    expect(screen.queryByTestId('legacy')).not.toBeInTheDocument();
  });

  it('renders into `container` through a portal', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const { api, container: root } = renderWithPort({ port: { container } });
    act(() => {
      api.launchModal(Note, { onClose: () => {} }, { text: 'portaled' });
    });
    expect(container).toHaveTextContent('portaled');
    expect(root).not.toHaveTextContent('portaled');
    container.remove();
  });
});

describe('dismissing', () => {
  it('calls onDismiss on a backdrop click and closes the modal', async () => {
    const onDismiss = vi.fn();
    const { api } = renderWithPort();
    act(() => {
      api.launchModal(Note, { onClose: () => {} }, { text: 'A' }, { onDismiss });
    });
    expect(screen.getByTestId('backdrop')).toHaveAttribute('data-dismissible', 'yes');

    await userEvent.click(screen.getByTestId('backdrop'));
    expect(onDismiss).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('A')).not.toBeInTheDocument();
  });

  it('ignores clicks that bubble up from the modal content', async () => {
    const onDismiss = vi.fn();
    const { api } = renderWithPort();
    act(() => {
      api.launchModal(Note, { onClose: () => {} }, { text: 'A' }, { onDismiss });
    });
    await userEvent.click(screen.getByText('A'));
    expect(onDismiss).not.toHaveBeenCalled();
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('gives the backdrop no click handler when the modal is not dismissible', async () => {
    const { api } = renderWithPort();
    act(() => {
      api.launchModal(Note, { onClose: () => {} }, { text: 'A' });
    });
    expect(screen.getByTestId('backdrop')).toHaveAttribute('data-dismissible', 'no');
    await userEvent.click(screen.getByTestId('backdrop'));
    expect(screen.getByText('A')).toBeInTheDocument();
  });

  it('still supports the deprecated onBackdropClick resolver, with a one-time warning', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const onBackdropClick = vi.fn();
    const received = vi.fn();
    function Spy(props: Record<string, unknown>) {
      received(Object.keys(props));
      return <p>legacy</p>;
    }
    const { api } = renderWithPort();
    // Untyped on purpose: 0.x callers passed onBackdropClick among the resolvers.
    const launchLegacy = api.launchModal as unknown as (...args: unknown[]) => void;
    act(() => {
      launchLegacy(Spy, { onBackdropClick });
      launchLegacy(Spy, { onBackdropClick: () => {} });
    });
    expect(warn).toHaveBeenCalledTimes(1);
    expect(warn.mock.calls[0]?.[0]).toMatch(/onBackdropClick/);
    // The modal itself does not receive the port-level handler.
    expect(received).toHaveBeenLastCalledWith([]);

    await userEvent.click(screen.getByTestId('backdrop'));
    await userEvent.click(screen.getByTestId('backdrop'));
    expect(onBackdropClick).toHaveBeenCalledTimes(1);
    expect(screen.queryByText('legacy')).not.toBeInTheDocument();
  });
});

describe('lifecycle callbacks', () => {
  it('fires onModalLaunch/onModalClose only on empty ↔ non-empty, onStackChange on every change', async () => {
    const onModalLaunch = vi.fn();
    const onModalClose = vi.fn();
    const onStackChange = vi.fn();
    const { api } = renderWithPort({ port: { onModalLaunch, onModalClose, onStackChange } });
    expect(onStackChange).not.toHaveBeenCalled();

    act(() => {
      api.launchModal(Note, { onClose: () => {} }, { text: 'A' });
    });
    act(() => {
      api.launchModal(Note, { onClose: () => {} }, { text: 'B' });
    });
    expect(onModalLaunch).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByText('close B'));
    expect(onModalClose).not.toHaveBeenCalled();
    await userEvent.click(screen.getByText('close A'));

    expect(onModalLaunch).toHaveBeenCalledTimes(1);
    expect(onModalClose).toHaveBeenCalledTimes(1);
    expect(onStackChange.mock.calls).toEqual([[1], [2], [1], [0]]);
  });

  it('throws when rendered outside a provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => render(<ModalPort />)).toThrow('ModalPort must be used within a <ModalProvider>');
  });

  it('can be placed anywhere inside the provider', () => {
    render(
      <ModalProvider>
        <main>
          <ModalPort />
        </main>
      </ModalProvider>,
    );
    expect(screen.getByRole('main')).toBeEmptyDOMElement();
  });
});
