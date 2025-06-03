import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ModalContextProvider, useModal } from '../context';
import { ModalPort } from '../modal-port';
import type { ModalProps, LaunchModalResolvers, ModalPortRenderProps } from '../types';

// Test modal component
const TestModal: React.FC<ModalProps> = ({ onClose, ...props }) => (
  <div data-testid="test-modal">
    <h1>Test Modal</h1>
    <p>Props: {JSON.stringify(props)}</p>
    <button onClick={onClose} data-testid="modal-close">Close</button>
  </div>
);

// Test backdrop component
const TestBackdrop: React.FC<ModalPortRenderProps> = ({ children, onBackdropClick }) => (
  <div 
    className="backdrop" 
    onClick={onBackdropClick}
    data-testid="backdrop"
  >
    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
      {children}
    </div>
  </div>
);

// Component to launch modals for testing
const ModalLauncher: React.FC = () => {
  const launchModal = useModal();

  const handleLaunchModal = () => {
    const resolvers: LaunchModalResolvers = {
      onClose: async () => {
        // Modal will be closed automatically
      },
      onSave: async () => {
        // Custom save action
      }
    };

    launchModal(TestModal, resolvers, { title: 'Test Title', value: 42 });
  };

  const handleLaunchModalWithBackdrop = () => {
    const resolvers: LaunchModalResolvers = {
      onClose: async () => {},
      onBackdropClick: async () => {
        // Close on backdrop click
      }
    };

    launchModal(TestModal, resolvers, { title: 'Backdrop Test' });
  };

  return (
    <div>
      <button onClick={handleLaunchModal} data-testid="launch-modal">
        Launch Modal
      </button>
      <button onClick={handleLaunchModalWithBackdrop} data-testid="launch-backdrop-modal">
        Launch Modal with Backdrop
      </button>
    </div>
  );
};

describe('ModalPort', () => {
  it('should render nothing when no modal is open', () => {
    render(
      <ModalContextProvider>
        <ModalPort render={TestBackdrop} />
        <ModalLauncher />
      </ModalContextProvider>
    );

    // ModalPort should render nothing, but ModalLauncher will still be in the DOM
    expect(screen.queryByTestId('backdrop')).not.toBeInTheDocument();
    expect(screen.queryByTestId('test-modal')).not.toBeInTheDocument();
  });

  it('should render modal when one is launched', async () => {
    const user = userEvent.setup();
    
    render(
      <ModalContextProvider>
        <ModalPort render={TestBackdrop} />
        <ModalLauncher />
      </ModalContextProvider>
    );

    // Launch modal
    await user.click(screen.getByTestId('launch-modal'));

    // Modal should be rendered
    expect(screen.getByTestId('test-modal')).toBeInTheDocument();
    expect(screen.getByTestId('backdrop')).toBeInTheDocument();
    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Props: {"title":"Test Title","value":42}')).toBeInTheDocument();
  });

  it('should close modal when close button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <ModalContextProvider>
        <ModalPort render={TestBackdrop} />
        <ModalLauncher />
      </ModalContextProvider>
    );

    // Launch modal
    await user.click(screen.getByTestId('launch-modal'));
    expect(screen.getByTestId('test-modal')).toBeInTheDocument();

    // Close modal
    await user.click(screen.getByTestId('modal-close'));
    expect(screen.queryByTestId('test-modal')).not.toBeInTheDocument();
  });

  it('should handle backdrop clicks', async () => {
    const user = userEvent.setup();
    
    render(
      <ModalContextProvider>
        <ModalPort render={TestBackdrop} />
        <ModalLauncher />
      </ModalContextProvider>
    );

    // Launch modal with backdrop handler
    await user.click(screen.getByTestId('launch-backdrop-modal'));
    expect(screen.getByTestId('test-modal')).toBeInTheDocument();

    // Click backdrop (should close modal)
    await user.click(screen.getByTestId('backdrop'));
    expect(screen.queryByTestId('test-modal')).not.toBeInTheDocument();
  });

  it('should not close modal when clicking modal content', async () => {
    const user = userEvent.setup();
    
    render(
      <ModalContextProvider>
        <ModalPort render={TestBackdrop} />
        <ModalLauncher />
      </ModalContextProvider>
    );

    // Launch modal
    await user.click(screen.getByTestId('launch-backdrop-modal'));
    expect(screen.getByTestId('test-modal')).toBeInTheDocument();

    // Click modal content (should not close modal)
    await user.click(screen.getByTestId('test-modal'));
    expect(screen.getByTestId('test-modal')).toBeInTheDocument();
  });

  it('should call onModalLaunch when modal is launched', async () => {
    const user = userEvent.setup();
    const onModalLaunch = jest.fn();
    
    render(
      <ModalContextProvider>
        <ModalPort render={TestBackdrop} onModalLaunch={onModalLaunch} />
        <ModalLauncher />
      </ModalContextProvider>
    );

    await user.click(screen.getByTestId('launch-modal'));
    expect(onModalLaunch).toHaveBeenCalledTimes(1);
  });

  it('should call onModalClose when modal is closed', async () => {
    const user = userEvent.setup();
    const onModalClose = jest.fn();
    
    render(
      <ModalContextProvider>
        <ModalPort render={TestBackdrop} onModalClose={onModalClose} />
        <ModalLauncher />
      </ModalContextProvider>
    );

    // Launch modal
    await user.click(screen.getByTestId('launch-modal'));
    
    // Close modal
    await user.click(screen.getByTestId('modal-close'));
    
    // onModalClose should be called when modal is closed
    expect(onModalClose).toHaveBeenCalledTimes(1);
  });

  it('should handle multiple modals correctly', async () => {
    const user = userEvent.setup();
    
    const MultiModalLauncher: React.FC = () => {
      const launchModal = useModal();

      const handleLaunchFirst = () => {
        const FirstModal: React.FC<ModalProps> = ({ onClose }) => (
          <div data-testid="first-modal">
            <h1>First Modal</h1>
            <button onClick={onClose}>Close First</button>
          </div>
        );
        launchModal(FirstModal, { onClose: async () => {} });
      };

      const handleLaunchSecond = () => {
        const SecondModal: React.FC<ModalProps> = ({ onClose }) => (
          <div data-testid="second-modal">
            <h1>Second Modal</h1>
            <button onClick={onClose}>Close Second</button>
          </div>
        );
        launchModal(SecondModal, { onClose: async () => {} });
      };

      return (
        <div>
          <button onClick={handleLaunchFirst} data-testid="launch-first">Launch First</button>
          <button onClick={handleLaunchSecond} data-testid="launch-second">Launch Second</button>
        </div>
      );
    };

    render(
      <ModalContextProvider>
        <ModalPort render={TestBackdrop} />
        <MultiModalLauncher />
      </ModalContextProvider>
    );

    // Launch first modal
    await user.click(screen.getByTestId('launch-first'));
    expect(screen.getByTestId('first-modal')).toBeInTheDocument();

    // Launch second modal (should show second, first should be in background)
    await user.click(screen.getByTestId('launch-second'));
    expect(screen.getByTestId('second-modal')).toBeInTheDocument();
    expect(screen.queryByTestId('first-modal')).not.toBeInTheDocument();
  });
}); 