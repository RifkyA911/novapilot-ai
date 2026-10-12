import * as kyselyAdapter from "@better-auth/kysely-adapter";
function _mergeNamespaces(n, m) {
  for (var i = 0; i < m.length; i++) {
    const e = m[i];
    if (typeof e !== "string" && !Array.isArray(e)) {
      for (const k in e) {
        if (k !== "default" && !(k in n)) {
          const d = Object.getOwnPropertyDescriptor(e, k);
          if (d) {
            Object.defineProperty(n, k, d.get ? d : {
              enumerable: true,
              get: () => e[k]
            });
          }
        }
      }
    }
  }
  return Object.freeze(Object.defineProperty(n, Symbol.toStringTag, { value: "Module" }));
}
let building = false;
let prerendering = false;
function set_building() {
  building = true;
}
function set_prerendering() {
  prerendering = true;
}
const index = /* @__PURE__ */ _mergeNamespaces({
  __proto__: null
}, [kyselyAdapter]);
export {
  set_prerendering as a,
  building as b,
  index as i,
  prerendering as p,
  set_building as s
};
