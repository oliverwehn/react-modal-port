"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ModalPort = exports.useModal = exports.useModalContext = exports.ModalContextProvider = void 0;
var context_1 = require("./context");
Object.defineProperty(exports, "ModalContextProvider", { enumerable: true, get: function () { return context_1.ModalContextProvider; } });
Object.defineProperty(exports, "useModalContext", { enumerable: true, get: function () { return context_1.useModalContext; } });
Object.defineProperty(exports, "useModal", { enumerable: true, get: function () { return context_1.useModal; } });
var modal_port_1 = require("./modal-port");
Object.defineProperty(exports, "ModalPort", { enumerable: true, get: function () { return __importDefault(modal_port_1).default; } });
