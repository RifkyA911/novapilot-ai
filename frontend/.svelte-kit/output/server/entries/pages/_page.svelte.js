import "clsx";
import { A as Arrow_right } from "../../chunks/arrow-right.js";
import { s as sanitize_props, a as spread_props, b as slot } from "../../chunks/index.js";
import { I as Icon, S as Shield } from "../../chunks/shield.js";
function Bot($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  /**
   * @license lucide-svelte v0.469.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const iconNode = [
    ["path", { "d": "M12 8V4H8" }],
    [
      "rect",
      { "width": "16", "height": "12", "x": "4", "y": "8", "rx": "2" }
    ],
    ["path", { "d": "M2 14h2" }],
    ["path", { "d": "M20 14h2" }],
    ["path", { "d": "M15 13v2" }],
    ["path", { "d": "M9 13v2" }]
  ];
  Icon($$renderer, spread_props([
    { name: "bot" },
    $$sanitized_props,
    {
      /**
       * @component @name Bot
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNMTIgOFY0SDgiIC8+CiAgPHJlY3Qgd2lkdGg9IjE2IiBoZWlnaHQ9IjEyIiB4PSI0IiB5PSI4IiByeD0iMiIgLz4KICA8cGF0aCBkPSJNMiAxNGgyIiAvPgogIDxwYXRoIGQ9Ik0yMCAxNGgyIiAvPgogIDxwYXRoIGQ9Ik0xNSAxM3YyIiAvPgogIDxwYXRoIGQ9Ik05IDEzdjIiIC8+Cjwvc3ZnPgo=) - https://lucide.dev/icons/bot
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
function Lock($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  /**
   * @license lucide-svelte v0.469.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const iconNode = [
    [
      "rect",
      {
        "width": "18",
        "height": "11",
        "x": "3",
        "y": "11",
        "rx": "2",
        "ry": "2"
      }
    ],
    ["path", { "d": "M7 11V7a5 5 0 0 1 10 0v4" }]
  ];
  Icon($$renderer, spread_props([
    { name: "lock" },
    $$sanitized_props,
    {
      /**
       * @component @name Lock
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cmVjdCB3aWR0aD0iMTgiIGhlaWdodD0iMTEiIHg9IjMiIHk9IjExIiByeD0iMiIgcnk9IjIiIC8+CiAgPHBhdGggZD0iTTcgMTFWN2E1IDUgMCAwIDEgMTAgMHY0IiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/lock
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
function Radio($$renderer, $$props) {
  const $$sanitized_props = sanitize_props($$props);
  /**
   * @license lucide-svelte v0.469.0 - ISC
   *
   * This source code is licensed under the ISC license.
   * See the LICENSE file in the root directory of this source tree.
   */
  const iconNode = [
    ["path", { "d": "M4.9 19.1C1 15.2 1 8.8 4.9 4.9" }],
    ["path", { "d": "M7.8 16.2c-2.3-2.3-2.3-6.1 0-8.5" }],
    ["circle", { "cx": "12", "cy": "12", "r": "2" }],
    ["path", { "d": "M16.2 7.8c2.3 2.3 2.3 6.1 0 8.5" }],
    ["path", { "d": "M19.1 4.9C23 8.8 23 15.1 19.1 19" }]
  ];
  Icon($$renderer, spread_props([
    { name: "radio" },
    $$sanitized_props,
    {
      /**
       * @component @name Radio
       * @description Lucide SVG icon component, renders SVG Element with children.
       *
       * @preview ![img](data:image/svg+xml;base64,PHN2ZyAgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIgogIHdpZHRoPSIyNCIKICBoZWlnaHQ9IjI0IgogIHZpZXdCb3g9IjAgMCAyNCAyNCIKICBmaWxsPSJub25lIgogIHN0cm9rZT0iIzAwMCIgc3R5bGU9ImJhY2tncm91bmQtY29sb3I6ICNmZmY7IGJvcmRlci1yYWRpdXM6IDJweCIKICBzdHJva2Utd2lkdGg9IjIiCiAgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIgogIHN0cm9rZS1saW5lam9pbj0icm91bmQiCj4KICA8cGF0aCBkPSJNNC45IDE5LjFDMSAxNS4yIDEgOC44IDQuOSA0LjkiIC8+CiAgPHBhdGggZD0iTTcuOCAxNi4yYy0yLjMtMi4zLTIuMy02LjEgMC04LjUiIC8+CiAgPGNpcmNsZSBjeD0iMTIiIGN5PSIxMiIgcj0iMiIgLz4KICA8cGF0aCBkPSJNMTYuMiA3LjhjMi4zIDIuMyAyLjMgNi4xIDAgOC41IiAvPgogIDxwYXRoIGQ9Ik0xOS4xIDQuOUMyMyA4LjggMjMgMTUuMSAxOS4xIDE5IiAvPgo8L3N2Zz4K) - https://lucide.dev/icons/radio
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
function _page($$renderer) {
  $$renderer.push(`<div class="flex-1 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full"><div class="text-center space-y-6 max-w-4xl mx-auto pt-6 pb-12"><div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/80 border border-border/60 text-xs font-mono text-muted-foreground shadow-sm"><span class="flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span> <span>Human-in-the-Loop Operations Copilot</span> <span class="text-border">|</span> <span class="text-primary font-semibold">Ready for On-Call Shifts</span></div> <h1 class="text-4xl sm:text-6xl font-extrabold tracking-tight text-foreground leading-[1.1]">Autonomous ChatOps with a <br class="hidden sm:inline"/> <span class="bg-gradient-to-r from-primary via-slate-300 to-slate-500 bg-clip-text text-transparent">Strict Human Approval Gate</span></h1> <p class="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">Eliminate manual VPN logins, DBeaver typing, and on-call burnout. NovaPilot ingests chaotic WhatsApp branch requests, verifies against production databases, and lets you review &amp; commit mutations with <strong>one click from your phone</strong>.</p> <div class="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"><a href="/dashboard" class="w-full sm:w-auto px-6 py-3 rounded-lg bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/10 hover:bg-primary/90 transition-all flex items-center justify-center gap-2 group"><span>Open On-Call Dashboard</span> `);
  Arrow_right($$renderer, {
    class: "h-4 w-4 group-hover:translate-x-1 transition-transform"
  });
  $$renderer.push(`<!----></a> <a href="/auth" class="w-full sm:w-auto px-6 py-3 rounded-lg bg-secondary text-secondary-foreground font-semibold text-sm hover:bg-secondary/80 border border-border/40 transition-colors flex items-center justify-center gap-2">`);
  Lock($$renderer, { class: "h-4 w-4 text-muted-foreground" });
  $$renderer.push(`<!----> <span>Authenticate via Better Auth</span></a></div></div> <div class="grid grid-cols-2 md:grid-cols-4 gap-4 py-8 border-y border-border/40 my-8"><div class="p-4 rounded-xl bg-card/40 border border-border/30 text-center space-y-1"><div class="text-2xl sm:text-3xl font-extrabold font-mono text-emerald-400">30s</div> <div class="text-xs text-muted-foreground">Average Ticket Turnaround</div></div> <div class="p-4 rounded-xl bg-card/40 border border-border/30 text-center space-y-1"><div class="text-2xl sm:text-3xl font-extrabold font-mono text-foreground">100%</div> <div class="text-xs text-muted-foreground">Parameterized Query Safety</div></div> <div class="p-4 rounded-xl bg-card/40 border border-border/30 text-center space-y-1"><div class="text-2xl sm:text-3xl font-extrabold font-mono text-foreground">0</div> <div class="text-xs text-muted-foreground">Unchecked AI Mutations</div></div> <div class="p-4 rounded-xl bg-card/40 border border-border/30 text-center space-y-1"><div class="text-2xl sm:text-3xl font-extrabold font-mono text-primary">Postgres/11g</div> <div class="text-xs text-muted-foreground">Dual Database Adapter</div></div></div> <div class="grid md:grid-cols-3 gap-6 py-8"><div class="p-6 rounded-2xl bg-card border border-border/50 shadow-sm space-y-4 hover:border-border transition-colors"><div class="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">`);
  Radio($$renderer, { class: "h-5 w-5" });
  $$renderer.push(`<!----></div> <h3 class="text-lg font-bold">Passive WhatsApp Ingestion</h3> <p class="text-sm text-muted-foreground leading-relaxed">Listens exclusively to authorized branch support groups. Employs zero spamming and single-reply confirmation to comply with Meta WhatsApp ToS.</p></div> <div class="p-6 rounded-2xl bg-card border border-border/50 shadow-sm space-y-4 hover:border-border transition-colors"><div class="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">`);
  Bot($$renderer, { class: "h-5 w-5" });
  $$renderer.push(`<!----></div> <h3 class="text-lg font-bold">Active Learning AI Agent</h3> <p class="text-sm text-muted-foreground leading-relaxed">Extracts invoice numbers and requested customer revisions from informal Indonesian branch chat. Human corrections in WebUI automatically feed future few-shot contexts.</p></div> <div class="p-6 rounded-2xl bg-card border border-border/50 shadow-sm space-y-4 hover:border-border transition-colors"><div class="h-10 w-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">`);
  Shield($$renderer, { class: "h-5 w-5" });
  $$renderer.push(`<!----></div> <h3 class="text-lg font-bold">Safe Human-in-the-Loop Gate</h3> <p class="text-sm text-muted-foreground leading-relaxed">Zero direct mutation by AI. On-call engineers review side-by-side diffs and tap 'Approve' to trigger transactional prepared statements with complete audit logging.</p></div></div></div>`);
}
export {
  _page as default
};
