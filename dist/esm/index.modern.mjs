import{jsx as t}from"react/jsx-runtime";import{createContext as e,useState as r,useContext as n,useMemo as c,useCallback as o,useEffect as a}from"react";function l(){return l=Object.assign?Object.assign.bind():function(t){for(var e=1;e<arguments.length;e++){var r=arguments[e];for(var n in r)Object.prototype.hasOwnProperty.call(r,n)&&(t[n]=r[n])}return t},l.apply(this,arguments)}const s=e({stack:[],launchModal:()=>{},updateStack:()=>{},updateState:()=>{}}),u=({children:e})=>{const[n,c]=r([]);return t(s.Provider,{value:{stack:n,launchModal:(t,e,r)=>{const o=Object.keys(e).reduce((t,r)=>{const o=e[r];return t[r]=async t=>{const e=await o(t);return c(n.slice(0,-1)),e},t},{});c([...n,{render:t,resolvers:o,onBackdropClickUse:r,state:{}}])},updateStack:c,updateState:t=>{const e=[...n];e[n.length-1].state=l({},t),c(e)}},children:e})};function d(){return n(s)}function i(){const{launchModal:t}=d();return t}const p=({onModalLaunch:e,onModalClose:r,render:n})=>{const{stack:l}=d(),s=c(()=>l.length>0?l[l.length-1]:null,[l]),u=o(t=>{t.currentTarget===t.target&&(null==s?void 0:s.onBackdropClickUse)&&s.resolvers[s.onBackdropClickUse](t)},[s]);return a(()=>{s?e&&e():r&&r()},[s,e,r]),s&&t(n,{onBackdropClick:u,children:s.render(s.resolvers)})||null};export{u as ModalContextProvider,p as ModalPort,i as useModal,d as useModalContext};
//# sourceMappingURL=index.modern.mjs.map
