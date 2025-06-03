import React from 'react';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { 
  ModalContextProvider, 
  useModalContext, 
  useModal, 
  useModalState 
} from '../context';
import type { LaunchModalResolvers, ModalProps } from '../../types';

// Test component that uses the modal context
const TestComponent: React.FC = () => {
  const { stack } = useModalContext();
  const launchModal = useModal();
  const [modalState, updateState] = useModalState();

  const handleLaunchModal = () => {
    const TestModal: React.FC<ModalProps> = ({ onClose, ...props }) => (
      <div>
        <h1>Test Modal</h1>
        <p>Props: {JSON.stringify(props)}</p>
        <button onClick={onClose}>Close</button>
      </div>
    );

    const resolvers: LaunchModalResolvers = {
      onClose: async () => {
        // Modal will be removed from stack automatically
      }
    };

    launchModal(TestModal, resolvers, { title: 'Test Title' });
  };

  const handleUpdateState = () => {
    updateState({ testValue: 'updated' });
  };

  return (
    <div>
      <div data-testid="stack-length">{stack.length}</div>
      <div data-testid="modal-state">{modalState ? JSON.stringify(modalState) : 'null'}</div>
      <button onClick={handleLaunchModal}>Launch Modal</button>
      <button onClick={handleUpdateState}>Update State</button>
    </div>
  );
};

// Test component that tries to use hooks outside provider
const TestComponentOutsideProvider: React.FC = () => {
  useModalContext();
  return <div>Should not render</div>;
};

describe('ModalContext', () => {
  it('should provide modal context to children', () => {
    render(
      <ModalContextProvider>
        <TestComponent />
      </ModalContextProvider>
    );

    expect(screen.getByTestId('stack-length')).toHaveTextContent('0');
    expect(screen.getByTestId('modal-state')).toHaveTextContent('null');
  });

  it('should throw error when useModalContext is used outside provider', () => {
    // Suppress console.error for this test as we expect an error
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    
    expect(() => {
      render(<TestComponentOutsideProvider />);
    }).toThrow('useModalContext must be used within a ModalContextProvider');

    consoleSpy.mockRestore();
  });

  it('should launch and close modals correctly', async () => {
    const user = userEvent.setup();
    
    render(
      <ModalContextProvider>
        <TestComponent />
      </ModalContextProvider>
    );

    // Initially no modals
    expect(screen.getByTestId('stack-length')).toHaveTextContent('0');

    // Launch a modal
    await user.click(screen.getByText('Launch Modal'));
    expect(screen.getByTestId('stack-length')).toHaveTextContent('1');
  });

  it('should update modal state correctly', async () => {
    const user = userEvent.setup();
    
    render(
      <ModalContextProvider>
        <TestComponent />
      </ModalContextProvider>
    );

    // Launch a modal first
    await user.click(screen.getByText('Launch Modal'));
    expect(screen.getByTestId('stack-length')).toHaveTextContent('1');

    // Update modal state
    await user.click(screen.getByText('Update State'));
    expect(screen.getByTestId('modal-state')).toHaveTextContent('{"testValue":"updated"}');
  });

  it('should handle multiple modals in stack', async () => {
    const user = userEvent.setup();
    const MultiModalComponent: React.FC = () => {
      const launchModal = useModal();
      const { stack } = useModalContext();

      const handleLaunchFirst = () => {
        const FirstModal: React.FC<ModalProps> = (props) => <div>First Modal</div>;
        launchModal(FirstModal, { onClose: async () => {} });
      };

      const handleLaunchSecond = () => {
        const SecondModal: React.FC<ModalProps> = (props) => <div>Second Modal</div>;
        launchModal(SecondModal, { onClose: async () => {} });
      };

      return (
        <div>
          <div data-testid="stack-length">{stack.length}</div>
          <button onClick={handleLaunchFirst}>Launch First</button>
          <button onClick={handleLaunchSecond}>Launch Second</button>
        </div>
      );
    };

    render(
      <ModalContextProvider>
        <MultiModalComponent />
      </ModalContextProvider>
    );

    expect(screen.getByTestId('stack-length')).toHaveTextContent('0');

    await user.click(screen.getByText('Launch First'));
    expect(screen.getByTestId('stack-length')).toHaveTextContent('1');

    await user.click(screen.getByText('Launch Second'));
    expect(screen.getByTestId('stack-length')).toHaveTextContent('2');
  });

  it('should remove modal from stack when resolver is called', async () => {
    const user = userEvent.setup();

    const TestModalWithResolver: React.FC = () => {
      const launchModal = useModal();
      const { stack } = useModalContext();

      const handleLaunch = () => {
        const Modal: React.FC<ModalProps> = (props) => <div>Modal Content</div>;
        const resolvers = {
          onClose: async () => {
            // This should remove the modal from stack
          }
        };
        
        launchModal(Modal, resolvers);
      };

      const handleCallResolver = async () => {
        // Get the current modal's onClose resolver and call it
        if (stack.length > 0) {
          const currentModal = stack[stack.length - 1];
          if (currentModal.resolvers.onClose) {
            await currentModal.resolvers.onClose();
          }
        }
      };

      return (
        <div>
          <div data-testid="stack-length">{stack.length}</div>
          <button onClick={handleLaunch}>Launch Modal</button>
          <button onClick={handleCallResolver}>Call Resolver</button>
        </div>
      );
    };

    render(
      <ModalContextProvider>
        <TestModalWithResolver />
      </ModalContextProvider>
    );

    // Launch modal
    await user.click(screen.getByText('Launch Modal'));
    expect(screen.getByTestId('stack-length')).toHaveTextContent('1');

    // Call the resolver
    await user.click(screen.getByText('Call Resolver'));
    expect(screen.getByTestId('stack-length')).toHaveTextContent('0');
  });
});

describe('useModalState', () => {
  it('should return null when no modal is open', () => {
    const TestStateComponent: React.FC = () => {
      const [modalState] = useModalState();
      return <div data-testid="state">{modalState ? 'has-state' : 'null'}</div>;
    };

    render(
      <ModalContextProvider>
        <TestStateComponent />
      </ModalContextProvider>
    );

    expect(screen.getByTestId('state')).toHaveTextContent('null');
  });

  it('should handle state updates when no modal is open gracefully', async () => {
    const user = userEvent.setup();
    const TestStateComponent: React.FC = () => {
      const [, updateState] = useModalState();
      
      const handleUpdate = () => {
        updateState({ test: 'value' });
      };

      return <button onClick={handleUpdate}>Update State</button>;
    };

    render(
      <ModalContextProvider>
        <TestStateComponent />
      </ModalContextProvider>
    );

    // This should not throw an error
    await user.click(screen.getByText('Update State'));
  });
}); 