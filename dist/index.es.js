import n,{useState as e,useContext as r,createContext as t,useMemo as o,useCallback as c,useEffect as l}from"react";function a(n,e,r,t){return new(r||(r=Promise))((function(o,c){function l(n){try{u(t.next(n))}catch(n){c(n)}}function a(n){try{u(t.throw(n))}catch(n){c(n)}}function u(n){var e;n.done?o(n.value):(e=n.value,e instanceof r?e:new r((function(n){n(e)}))).then(l,a)}u((t=t.apply(n,e||[])).next())}))}function u(n,e){var r,t,o,c,l={label:0,sent:function(){if(1&o[0])throw o[1];return o[1]},trys:[],ops:[]};return c={next:a(0),throw:a(1),return:a(2)},"function"==typeof Symbol&&(c[Symbol.iterator]=function(){return this}),c;function a(a){return function(u){return function(a){if(r)throw new TypeError("Generator is already executing.");for(;c&&(c=0,a[0]&&(l=0)),l;)try{if(r=1,t&&(o=2&a[0]?t.return:a[0]?t.throw||((o=t.return)&&o.call(t),0):t.next)&&!(o=o.call(t,a[1])).done)return o;switch(t=0,o&&(a=[2&a[0],o.value]),a[0]){case 0:case 1:o=a;break;case 4:return l.label++,{value:a[1],done:!1};case 5:l.label++,t=a[1],a=[0];continue;case 7:a=l.ops.pop(),l.trys.pop();continue;default:if(!(o=l.trys,(o=o.length>0&&o[o.length-1])||6!==a[0]&&2!==a[0])){l=0;continue}if(3===a[0]&&(!o||a[1]>o[0]&&a[1]<o[3])){l.label=a[1];break}if(6===a[0]&&l.label<o[1]){l.label=o[1],o=a;break}if(o&&l.label<o[2]){l.label=o[2],l.ops.push(a);break}o[2]&&l.ops.pop(),l.trys.pop();continue}a=e.call(n,l)}catch(n){a=[6,n],t=0}finally{r=o=0}if(5&a[0])throw a[1];return{value:a[0]?a[1]:void 0,done:!0}}([a,u])}}}function i(n,e,r){if(r||2===arguments.length)for(var t,o=0,c=e.length;o<c;o++)!t&&o in e||(t||(t=Array.prototype.slice.call(e,0,o)),t[o]=e[o]);return n.concat(t||Array.prototype.slice.call(e))}"function"==typeof SuppressedError&&SuppressedError;var s=t({stack:[],launchModal:null}),f=function(r){var t=r.children,o=e([]),c=o[0],l=o[1],f={stack:c,launchModal:function(n,e,r){var t=Object.keys(e).reduce((function(n,r){var t=e[r];return n[r]=function(n){return a(void 0,void 0,void 0,(function(){var e;return u(this,(function(r){switch(r.label){case 0:return[4,t(n)];case 1:return e=r.sent(),l(c.slice(0,-1)),[2,e]}}))}))},n}),{});l(i(i([],c,!0),[{render:n,resolvers:t,onBackdropClickUse:r}],!1))}};return n.createElement(s.Provider,{value:f},t)};function p(){var n;return null!==(n=r(s))&&void 0!==n?n:{}}function d(){return p().launchModal}var v=function(n){var e=n.onModalLaunch,r=n.onModalClose,t=n.render,a=p().stack,u=o((function(){return a.length>0?a[a.length-1]:null}),[a]),i=c((function(n){n.currentTarget===n.target&&(null==u?void 0:u.onBackdropClickUse)&&u.resolvers[u.onBackdropClickUse](n)}),[u]);return l((function(){u?e&&e():r&&r()}),[u,e,r]),u&&React.createElement(t,{onBackdropClick:i},u.render(u.resolvers))||null};export{f as ModalContextProvider,v as ModalPort,d as useModal,p as useModalContext};