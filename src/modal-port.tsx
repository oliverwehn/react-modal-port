import { 
  type ModalPortProps, 
  type ModalStackItem 
} from "../types";
import { useModalContext } from "./context";
import { 
  type SyntheticEvent, 
  useCallback, 
  useEffect, 
  useMemo
} from "react";

const ModalPort: React.FC<ModalPortProps> = ({
  onModalLaunch,
  onModalClose,
  render: Backdrop
}) => {

  const { stack } = useModalContext();
  const currentModal: ModalStackItem | null = useMemo(
    () => stack.length > 0 ? stack[stack.length - 1] : null,
    [ stack ]
  );
  const onBackdropClick = useCallback((ev: SyntheticEvent) => {
    if (ev.currentTarget !== ev.target) return;
    currentModal?.onBackdropClickUse &&
    currentModal.resolvers[currentModal.onBackdropClickUse](ev);
  }, [ currentModal ]);

  useEffect(() => {
    if (currentModal) {
      onModalLaunch && onModalLaunch();
    } else {
      onModalClose && onModalClose();
    }
  }, [ currentModal, onModalLaunch, onModalClose ]);

  return currentModal && (
    <Backdrop onBackdropClick={onBackdropClick}>
      {currentModal.render(currentModal.resolvers)}
    </Backdrop>
  ) || null;
};

export default ModalPort;
