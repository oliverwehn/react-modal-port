import{jsx as n}from"react/jsx-runtime";import{createContext as t,useState as r,useContext as e,useMemo as o,useCallback as a,useEffect as c}from"react";function u(){return u=Object.assign?Object.assign.bind():function(n){for(var t=1;t<arguments.length;t++){var r=arguments[t];for(var e in r)Object.prototype.hasOwnProperty.call(r,e)&&(n[e]=r[e])}return n},u.apply(this,arguments)}var i=t({stack:[],launchModal:function(){},updateStack:function(){},updateState:function(){}}),l=function(t){var e=t.children,o=r([]),a=o[0],c=o[1];return n(i.Provider,{value:{stack:a,launchModal:function(n,t,r){var e=Object.keys(t).reduce(function(n,r){var e=t[r];return n[r]=function(n){try{return Promise.resolve(e(n)).then(function(n){return c(a.slice(0,-1)),n})}catch(n){return Promise.reject(n)}},n},{});c([].concat(a,[{render:n,resolvers:e,onBackdropClickUse:r,state:{}}]))},updateStack:c,updateState:function(n){var t=[].concat(a);t[a.length-1].state=u({},n),c(t)}},children:e})};function s(){return e(i)}function d(){return s().launchModal}function f(){var n=s(),t=n.stack,r=n.updateState;if(0===t.length)throw new Error("Trying to access modal state while no modal is open");return[t[t.length-1].state,r]}var h=function(t){var r=t.onModalLaunch,e=t.onModalClose,u=t.render,i=s().stack,l=o(function(){return i.length>0?i[i.length-1]:null},[i]),d=a(function(n){n.currentTarget===n.target&&(null==l?void 0:l.onBackdropClickUse)&&l.resolvers[l.onBackdropClickUse](n)},[l]);return c(function(){l?r&&r():e&&e()},[l,r,e]),l&&n(u,{onBackdropClick:d,children:l.render(l.resolvers)})||null};export{l as ModalContextProvider,h as ModalPort,d as useModal,s as useModalContext,f as useModalState};
//# sourceMappingURL=index.mjs.map