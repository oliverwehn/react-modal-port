"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var jsx_runtime_1 = require("react/jsx-runtime");
var context_1 = require("./context");
var react_1 = require("react");
var ModalPort = function (_a) {
    var onModalLaunch = _a.onModalLaunch, onModalClose = _a.onModalClose, Backdrop = _a.render;
    var stack = (0, context_1.useModalContext)().stack;
    var currentModal = (0, react_1.useMemo)(function () { return stack.length > 0 ? stack[stack.length - 1] : null; }, [stack]);
    var onBackdropClick = (0, react_1.useCallback)(function (ev) {
        if (ev.currentTarget !== ev.target)
            return;
        (currentModal === null || currentModal === void 0 ? void 0 : currentModal.onBackdropClickUse) &&
            currentModal.resolvers[currentModal.onBackdropClickUse](ev);
    }, [currentModal]);
    (0, react_1.useEffect)(function () {
        if (currentModal) {
            onModalLaunch && onModalLaunch();
        }
        else {
            onModalClose && onModalClose();
        }
    }, [currentModal, onModalLaunch, onModalClose]);
    return currentModal && ((0, jsx_runtime_1.jsx)(Backdrop, { onBackdropClick: onBackdropClick, children: currentModal.render(currentModal.resolvers) })) || null;
};
exports.default = ModalPort;
