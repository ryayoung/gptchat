var O=Object.defineProperty;var q=(t,e,n)=>e in t?O(t,e,{enumerable:!0,configurable:!0,writable:!0,value:n}):t[e]=n;var f=(t,e,n)=>(q(t,typeof e!="symbol"?e+"":e,n),n);function G(){}function I(t,e){for(const n in e)t[n]=e[n];return t}function z(t){return t()}function nt(){return Object.create(null)}function F(t){t.forEach(z)}function it(t){return typeof t=="function"}function lt(t,e){return t!=t?e==e:t!==e||t&&typeof t=="object"||typeof t=="function"}function ct(t){return Object.keys(t).length===0}function L(t,...e){if(t==null){for(const i of e)i(void 0);return G}const n=t.subscribe(...e);return n.unsubscribe?()=>n.unsubscribe():n}function rt(t){let e;return L(t,n=>e=n)(),e}function st(t,e,n){t.$$.on_destroy.push(L(e,n))}function ot(t,e,n,i){if(t){const l=M(t,e,n,i);return t[0](l)}}function M(t,e,n,i){return t[1]&&i?I(n.ctx.slice(),t[1](i(e))):n.ctx}function ut(t,e,n,i){if(t[2]&&i){const l=t[2](i(n));if(e.dirty===void 0)return l;if(typeof l=="object"){const s=[],c=Math.max(e.dirty.length,l.length);for(let o=0;o<c;o+=1)s[o]=e.dirty[o]|l[o];return s}return e.dirty|l}return e.dirty}function at(t,e,n,i,l,s){if(l){const c=M(e,n,i,s);t.p(c,l)}}function ft(t){if(t.ctx.length>32){const e=[],n=t.ctx.length/32;for(let i=0;i<n;i++)e[i]=-1;return e}return-1}function _t(t,e,n){return t.set(n),e}let p=!1;function dt(){p=!0}function ht(){p=!1}function R(t,e,n,i){for(;t<e;){const l=t+(e-t>>1);n(l)<=i?t=l+1:e=l}return t}function U(t){if(t.hydrate_init)return;t.hydrate_init=!0;let e=t.childNodes;if(t.nodeName==="HEAD"){const r=[];for(let u=0;u<e.length;u++){const a=e[u];a.claim_order!==void 0&&r.push(a)}e=r}const n=new Int32Array(e.length+1),i=new Int32Array(e.length);n[0]=-1;let l=0;for(let r=0;r<e.length;r++){const u=e[r].claim_order,a=(l>0&&e[n[l]].claim_order<=u?l+1:R(1,l,D=>e[n[D]].claim_order,u))-1;i[r]=n[a]+1;const w=a+1;n[w]=r,l=Math.max(w,l)}const s=[],c=[];let o=e.length-1;for(let r=n[l]+1;r!=0;r=i[r-1]){for(s.push(e[r-1]);o>=r;o--)c.push(e[o]);o--}for(;o>=0;o--)c.push(e[o]);s.reverse(),c.sort((r,u)=>r.claim_order-u.claim_order);for(let r=0,u=0;r<c.length;r++){for(;u<s.length&&c[r].claim_order>=s[u].claim_order;)u++;const a=u<s.length?s[u]:null;t.insertBefore(c[r],a)}}function W(t,e){if(p){for(U(t),(t.actual_end_child===void 0||t.actual_end_child!==null&&t.actual_end_child.parentNode!==t)&&(t.actual_end_child=t.firstChild);t.actual_end_child!==null&&t.actual_end_child.claim_order===void 0;)t.actual_end_child=t.actual_end_child.nextSibling;e!==t.actual_end_child?(e.claim_order!==void 0||e.parentNode!==t)&&t.insertBefore(e,t.actual_end_child):t.actual_end_child=e.nextSibling}else(e.parentNode!==t||e.nextSibling!==null)&&t.appendChild(e)}function J(t,e,n){t.insertBefore(e,n||null)}function K(t,e,n){p&&!n?W(t,e):(e.parentNode!==t||e.nextSibling!=n)&&t.insertBefore(e,n||null)}function x(t){t.parentNode&&t.parentNode.removeChild(t)}function mt(t,e){for(let n=0;n<t.length;n+=1)t[n]&&t[n].d(e)}function H(t){return document.createElement(t)}function j(t){return document.createElementNS("http://www.w3.org/2000/svg",t)}function E(t){return document.createTextNode(t)}function pt(){return E(" ")}function gt(){return E("")}function yt(t,e,n,i){return t.addEventListener(e,n,i),()=>t.removeEventListener(e,n,i)}function bt(t,e,n){n==null?t.removeAttribute(e):t.getAttribute(e)!==n&&t.setAttribute(e,n)}function xt(t){return t.dataset.svelteH}function vt(t){return Array.from(t.childNodes)}function P(t){t.claim_info===void 0&&(t.claim_info={last_index:0,total_claimed:0})}function S(t,e,n,i,l=!1){P(t);const s=(()=>{for(let c=t.claim_info.last_index;c<t.length;c++){const o=t[c];if(e(o)){const r=n(o);return r===void 0?t.splice(c,1):t[c]=r,l||(t.claim_info.last_index=c),o}}for(let c=t.claim_info.last_index-1;c>=0;c--){const o=t[c];if(e(o)){const r=n(o);return r===void 0?t.splice(c,1):t[c]=r,l?r===void 0&&t.claim_info.last_index--:t.claim_info.last_index=c,o}}return i()})();return s.claim_order=t.claim_info.total_claimed,t.claim_info.total_claimed+=1,s}function C(t,e,n,i){return S(t,l=>l.nodeName===e,l=>{const s=[];for(let c=0;c<l.attributes.length;c++){const o=l.attributes[c];n[o.name]||s.push(o.name)}s.forEach(c=>l.removeAttribute(c))},()=>i(e))}function Et(t,e,n){return C(t,e,n,H)}function Tt(t,e,n){return C(t,e,n,j)}function Q(t,e){return S(t,n=>n.nodeType===3,n=>{const i=""+e;if(n.data.startsWith(i)){if(n.data.length!==i.length)return n.splitText(i.length)}else n.data=i},()=>E(e),!0)}function wt(t){return Q(t," ")}function N(t,e,n){for(let i=n;i<t.length;i+=1){const l=t[i];if(l.nodeType===8&&l.textContent.trim()===e)return i}return-1}function Nt(t,e){const n=N(t,"HTML_TAG_START",0),i=N(t,"HTML_TAG_END",n+1);if(n===-1||i===-1)return new g(e);P(t);const l=t.splice(n,i-n+1);x(l[0]),x(l[l.length-1]);const s=l.slice(1,l.length-1);if(s.length===0)return new g(e);for(const c of s)c.claim_order=t.claim_info.total_claimed,t.claim_info.total_claimed+=1;return new g(e,s)}function At(t,e){e=""+e,t.data!==e&&(t.data=e)}function kt(t,e,n,i){n==null?t.style.removeProperty(e):t.style.setProperty(e,n,i?"important":"")}function Lt(t,e,n){t.classList.toggle(e,!!n)}function V(t,e,{bubbles:n=!1,cancelable:i=!1}={}){return new CustomEvent(t,{detail:e,bubbles:n,cancelable:i})}class X{constructor(e=!1){f(this,"is_svg",!1);f(this,"e");f(this,"n");f(this,"t");f(this,"a");this.is_svg=e,this.e=this.n=null}c(e){this.h(e)}m(e,n,i=null){this.e||(this.is_svg?this.e=j(n.nodeName):this.e=H(n.nodeType===11?"TEMPLATE":n.nodeName),this.t=n.tagName!=="TEMPLATE"?n:n.content,this.c(e)),this.i(i)}h(e){this.e.innerHTML=e,this.n=Array.from(this.e.nodeName==="TEMPLATE"?this.e.content.childNodes:this.e.childNodes)}i(e){for(let n=0;n<this.n.length;n+=1)J(this.t,this.n[n],e)}p(e){this.d(),this.h(e),this.i(this.a)}d(){this.n.forEach(x)}}class g extends X{constructor(n=!1,i){super(n);f(this,"l");this.e=this.n=null,this.l=i}c(n){this.l?this.n=this.l:super.c(n)}i(n){for(let i=0;i<this.n.length;i+=1)K(this.t,this.n[i],n)}}function Mt(t,e){return new t(e)}let m;function y(t){m=t}function T(){if(!m)throw new Error("Function called outside component initialization");return m}function Ht(t){T().$$.on_mount.push(t)}function jt(t){T().$$.after_update.push(t)}function Pt(){const t=T();return(e,n,{cancelable:i=!1}={})=>{const l=t.$$.callbacks[e];if(l){const s=V(e,n,{cancelable:i});return l.slice().forEach(c=>{c.call(t,s)}),!s.defaultPrevented}return!0}}const h=[],A=[];let d=[];const k=[],B=Promise.resolve();let v=!1;function Y(){v||(v=!0,B.then($))}function St(){return Y(),B}function Z(t){d.push(t)}const b=new Set;let _=0;function $(){if(_!==0)return;const t=m;do{try{for(;_<h.length;){const e=h[_];_++,y(e),tt(e.$$)}}catch(e){throw h.length=0,_=0,e}for(y(null),h.length=0,_=0;A.length;)A.pop()();for(let e=0;e<d.length;e+=1){const n=d[e];b.has(n)||(b.add(n),n())}d.length=0}while(h.length);for(;k.length;)k.pop()();v=!1,b.clear(),y(t)}function tt(t){if(t.fragment!==null){t.update(),F(t.before_update);const e=t.dirty;t.dirty=[-1],t.fragment&&t.fragment.p(t.ctx,e),t.after_update.forEach(Z)}}function Ct(t){const e=[],n=[];d.forEach(i=>t.indexOf(i)===-1?e.push(i):n.push(i)),n.forEach(i=>i()),d=e}export{F as A,rt as B,yt as C,it as D,Pt as E,j as F,Tt as G,xt as H,_t as I,Lt as J,g as K,Nt as L,mt as M,nt as N,$ as O,ct as P,Z as Q,Ct as R,m as S,y as T,z as U,h as V,Y as W,dt as X,ht as Y,pt as a,jt as b,wt as c,x as d,gt as e,H as f,Et as g,vt as h,K as i,bt as j,kt as k,E as l,Q as m,At as n,Ht as o,A as p,Mt as q,ot as r,lt as s,St as t,at as u,ft as v,ut as w,W as x,G as y,st as z};