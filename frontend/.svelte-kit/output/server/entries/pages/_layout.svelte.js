import { g as getContext, s as sanitize_props, a as spread_props, b as slot, k as attr_class, u as unsubscribe_stores, l as derived, m as store_get } from "../../chunks/index.js";
import "clsx";
import "@sveltejs/kit/internal";
import "../../chunks/exports.js";
import "../../chunks/utils.js";
import "@sveltejs/kit/internal/server";
import "../../chunks/root.js";
import "../../chunks/state.svelte.js";
import { I as Icon, S as Shield } from "../../chunks/shield.js";
const getStores = () => {
  const stores = getContext("__svelte__");
  return {
    /** @type {typeof page} */
    page: {
      subscribe: stores.page.subscribe
    },
    /** @type {typeof navigating} */
    navigating: {
      subscribe: stores.navigating.subscribe
    },
    /** @type {typeof updated} */
    updated: stores.updated
  };
};
const page = {
  subscribe(fn) {
    const store = getStores().page;
    return store.subscribe(fn);
  }
};
function Log_in($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  /**
   * @license lucide-svelte v0.469.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const iconNode = [
    ["path", { "d": "M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4" }],
    ["polyline", { "points": "10 17 15 12 10 7" }],
    ["line", { "x1": "15", "x2": "3", "y1": "12", "y2": "12" }]
  ];
  Icon($$renderer, spread_props([
    { name: "log-in" },
    $$sanitized_props,
    {
      /**
       * @component @name LogIn
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTUgM2g0YTIgMiAwIDAgMSAyIDJ2MTRhMiAyIDAgMCAxLTIgMmgtNCIgLz4KICA8cG9seWxpbmUgcG9pbnRzPSIxMCAxNyAxNSAxMiAxMCA3IiAvPgogIDxsaW5lIHgxPSIxNSIgeDI9IjMiIHkxPSIxMiIgeTI9IjEyIiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/log-in
       * @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
       *
       * @param {Object} props - Lucide icons props and any valid SVG attribute
       * @returns {FunctionalComponent} Svelte component
       *
       */
      iconNode,
      children: ($$renderer2) => {
        $$renderer2.push(`<!--[-->`);
        slot($$renderer2, $$props, "default", {});
        $$renderer2.push(`<!--]-->`);
      },
      $$slots: { default: true }
    }
  ]));
}
function Terminal($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  /**
   * @license lucide-svelte v0.469.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const iconNode = [
    ["polyline", { "points": "4 17 10 11 4 5" }],
    ["line", { "x1": "12", "x2": "20", "y1": "19", "y2": "19" }]
  ];
  Icon($$renderer, spread_props([
    { name: "terminal" },
    $$sanitized_props,
    {
      /**
       * @component @name Terminal
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cG9seWxpbmUgcG9pbnRzPSI0IDE3IDEwIDExIDQgNSIgLz4KICA8bGluZSB4MT0iMTIiIHgyPSIyMCIgeTE9IjE5IiB5Mj0iMTkiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/terminal
       * @see https://lucide.dev/guide/packages/lucide-svelte - Documentation
       *
       * @param {Object} props - Lucide icons props and any valid SVG attribute
       * @returns {FunctionalComponent} Svelte component
       *
       */
      iconNode,
      children: ($$renderer2) => {
        $$renderer2.push(`<!--[-->`);
        slot($$renderer2, $$props, "default", {});
        $$renderer2.push(`<!--]-->`);
      },
      $$slots: { default: true }
    }
  ]));
}
function _layout($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    var $$store_subs;
    let { children } = $$props;
    let currentPath = derived(() => store_get($$store_subs ??= {}, "$page", page).url.pathname);
    $$renderer2.push(`<div class="min-h-screen flex flex-col bg-background text-foreground"><header class="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50"><div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between"><div class="flex items-center gap-3"><a href="/" class="flex items-center gap-2.5 group"><div class="h-9 w-9 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold shadow-md shadow-primary/20 group-hover:scale-105 transition-transform">`);
    Shield($$renderer2, { class: "h-5 w-5" });
    $$renderer2.push(`<!----></div> <div class="flex flex-col"><span class="font-bold text-base tracking-tight flex items-center gap-1.5">NovaPilot <span class="text-xs px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20 font-mono">AI</span></span> <span class="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">ChatOps Gatekeeper</span></div></a> <div class="hidden sm:flex items-center gap-2 ml-4 pl-4 border-l border-border/40 text-xs text-muted-foreground"><span class="relative flex h-2 w-2"><span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span> <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span></span> <span class="font-mono text-[11px]">LAN GATEWAY ACTIVE</span></div></div> <nav class="flex items-center gap-1 sm:gap-2"><a href="/"${attr_class(`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors ${currentPath() === "/" ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"}`)}>Overview</a> <a href="/dashboard"${attr_class(`px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-colors flex items-center gap-1.5 ${currentPath().startsWith("/dashboard") ? "bg-secondary text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-secondary/50"}`)}>`);
    Terminal($$renderer2, { class: "h-3.5 w-3.5" });
    $$renderer2.push(`<!----> <span>On-Call Dashboard</span></a> <a href="/auth" class="ml-2 px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm flex items-center gap-1.5">`);
    Log_in($$renderer2, { class: "h-3.5 w-3.5" });
    $$renderer2.push(`<!----> <span>Sign In</span></a></nav></div></header> <main class="flex-1 flex flex-col">`);
    children($$renderer2);
    $$renderer2.push(`<!----></main> <footer class="border-t border-border/40 py-6 text-xs text-muted-foreground bg-card/20"><div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4"><div class="flex items-center gap-2 font-mono text-[11px]"><span>NovaPilot AI v1.0.0</span> <span>•</span> <span>Go 1.22 + SvelteKit 5 + Bun Runtime</span> <span>•</span> <span>Zero Raw SQL Certified</span></div> <div class="flex items-center gap-4 text-[11px]"><span class="text-emerald-400 font-medium">PostgreSQL 18 Local Prototyping</span> <span>•</span> <span>Oracle 11g Enterprise Adapter</span></div></div></footer></div>`);
    if ($$store_subs) unsubscribe_stores($$store_subs);
  });
}
export {
  _layout as default
};
