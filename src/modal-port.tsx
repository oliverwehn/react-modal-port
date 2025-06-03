import { 
  ModalProps,
  type ModalPortProps, 
  type ModalStackItem 
} from "./types";
import { useModalContext } from "./context";
import { 
  type SyntheticEvent, 
  useCallback, 
  useEffect, 
  useMemo,
  useRef,
  type ReactElement
} from "react";

const ModalPort: React.FC<ModalPortProps> = ({
  onModalLaunch,
  onModalClose,
  render: Backdrop
}) => {

  const { stack } = useModalContext();
  const currentModal: ModalStackItem<ModalProps> | null = useMemo(
    () => stack.length > 0 ? stack[stack.length - 1] : null,
    [ stack ]
  );
  
  const previousModalRef = useRef<ModalStackItem<ModalProps> | null>(null);
  
  const onBackdropClick = useCallback((ev: SyntheticEvent) => {
    if (ev.currentTarget !== ev.target) return;
    if (currentModal?.resolvers.onBackdropClick) {
      currentModal.resolvers.onBackdropClick(ev);
    }
  }, [ currentModal ]);

  useEffect(() => {
    const previousModal = previousModalRef.current;
    
    // Modal was launched (went from no modal to having a modal)
    if (!previousModal && currentModal) {
      onModalLaunch?.();
    }
    // Modal was closed (went from having a modal to no modal)
    else if (previousModal && !currentModal) {
      onModalClose?.();
    }
    
    // Update the ref for next time
    previousModalRef.current = currentModal;
  }, [ currentModal, onModalLaunch, onModalClose ]);

  const ModalContent = currentModal?.render;

  return (
    <>
      {ModalContent && (
        <Backdrop onBackdropClick={onBackdropClick}>
          <ModalContent
            {...currentModal.resolvers}
            {...currentModal.props}
          />
        </Backdrop>
      ) || null}
    </>
  );
};

export default ModalPort;
export { ModalPort };
