import { jsx as _jsx } from "react/jsx-runtime";
import { useModalContext } from "./context";
import { useCallback, useEffect, useMemo } from "react";
var ModalPort = function (_a) {
    var onModalLaunch = _a.onModalLaunch, onModalClose = _a.onModalClose, Backdrop = _a.render;
    var stack = useModalContext().stack;
    var currentModal = useMemo(function () { return stack.length > 0 ? stack[stack.length - 1] : null; }, [stack]);
    var onBackdropClick = useCallback(function (ev) {
        if (ev.currentTarget !== ev.target)
            return;
        (currentModal === null || currentModal === void 0 ? void 0 : currentModal.onBackdropClickUse) &&
            currentModal.resolvers[currentModal.onBackdropClickUse](ev);
    }, [currentModal]);
    useEffect(function () {
        if (currentModal) {
            onModalLaunch && onModalLaunch();
        }
        else {
            onModalClose && onModalClose();
        }
    }, [currentModal, onModalLaunch, onModalClose]);
    return currentModal && (_jsx(Backdrop, { onBackdropClick: onBackdropClick, children: currentModal.render(currentModal.resolvers) })) || null;
};
export default ModalPort;
