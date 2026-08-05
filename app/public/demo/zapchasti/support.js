// GENERATED from dc-runtime/src/*.ts — do not edit. Rebuild with `cd dc-runtime && bun run build`.
"use strict";
(() => {
  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

  // src/react.ts
  function getReact() {
    const R = window.React;
    if (!R) throw new Error("dc-runtime: window.React is not available yet");
    return R;
  }
  function getReactDOM() {
    const RD = window.ReactDOM;
    if (!RD) throw new Error("dc-runtime: window.ReactDOM is not available yet");
    return RD;
  }
  var h = ((...args) => getReact().createElement(
    ...args
  ));

  // src/parse.ts
  function parseDcDocument(doc) {
    const dc = doc.querySelector("x-dc");
    if (!dc) return null;
    const scriptEl = doc.querySelector("script[data-dc-script]");
    const { props, preview } = parseDataProps(
      scriptEl?.getAttribute("data-props") ?? null
    );
    return {
      template: dc.innerHTML,
      js: scriptEl ? scriptEl.textContent || "" : "",
      props,
      preview
    };
  }
  function parseDcText(src) {
    const openMatch = /<x-dc(?:\s[^>]*)?>/.exec(src);
    if (!openMatch) return null;
    const close = src.lastIndexOf("</x-dc>");
    if (close === -1 || close < openMatch.index) return null;
    const template = src.slice(openMatch.index + openMatch[0].length, close);
    const doc = new DOMParser().parseFromString(src, "text/html");
    const scriptEl = doc.querySelector("script[data-dc-script]");
    const { props, preview } = parseDataProps(
      scriptEl?.getAttribute("data-props") ?? null
    );
    return {
      template,
      js: scriptEl ? scriptEl.textContent || "" : "",
      props,
      preview
    };
  }
  function parseDataProps(raw) {
    if (!raw) return { props: null, preview: null };
    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return { props: null, preview: null };
    }
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return { props: null, preview: null };
    }
    const obj = parsed;
    const preview = obj.$preview && typeof obj.$preview === "object" ? obj.$preview : null;
    const rest = {};
    for (const k of Object.keys(obj)) {
      if (k[0] !== "$") rest[k] = obj[k];
    }
    return { props: Object.keys(rest).length ? rest : null, preview };
  }
  function dcNameFromPath(pathname) {
    let p = pathname || "";
    try {
      p = decodeURIComponent(p);
    } catch {
    }
    const base = p.split("/").pop() || "Root";
    return base.replace(/\.dc\.html$/, "").replace(/\.html?$/, "") || "Root";
  }

  // src/boot.ts
  var BASE_CSS = `
    .sc-placeholder{background:color-mix(in srgb,currentColor 8%,transparent);
      border:1px solid color-mix(in srgb,currentColor 50%,transparent);
      border-radius:2px;box-sizing:border-box;overflow:hidden}
    @keyframes sc-shine{0%{background-position:100% 50%}100%{background-position:0% 50%}}
    html.sc-dc-streaming .sc-placeholder,
    html.sc-dc-streaming .sc-interp.sc-missing{position:relative;
      background:color-mix(in srgb,currentColor 5%,transparent);
      border-color:transparent}
    html.sc-dc-streaming .sc-placeholder::before,
    html.sc-dc-streaming .sc-interp.sc-missing::before{content:'';
      position:absolute;inset:0;pointer-events:none;
      background:linear-gradient(90deg,rgba(217,119,87,0) 25%,rgba(247,225,211,.95) 37%,rgba(217,119,87,0) 63%);
      background-size:400% 100%;animation:sc-shine 1.4s ease infinite}
    html.sc-dc-streaming .sc-placeholder:nth-child(n+9 of .sc-placeholder)::before,
    html.sc-dc-streaming .sc-interp.sc-missing:nth-child(n+9 of .sc-interp.sc-missing)::before{animation:none;
      background:color-mix(in srgb,currentColor 8%,transparent)}
    .sc-placeholder-error{padding:4px 8px;font:11px/1.4 ui-monospace,monospace;
      color:color-mix(in srgb,currentColor 70%,transparent);word-break:break-word}
    .sc-interp.sc-missing{display:inline-block;width:2em;height:1em;overflow:hidden;
      vertical-align:text-bottom;background:rgba(255,255,255,.3);border:1px solid rgba(0,0,0,.5);
      border-radius:2px;box-sizing:border-box;color:transparent;
      user-select:none}
    .sc-interp.sc-unresolved{font-family:ui-monospace,monospace;font-size:.85em;
      color:color-mix(in srgb,currentColor 50%,transparent);
      background:color-mix(in srgb,currentColor 10%,transparent);border-radius:3px;
      padding:0 3px}
    .sc-host.sc-has-error{position:relative}
    .sc-logic-error{position:absolute;top:8px;left:8px;z-index:2147483647;max-width:60ch;
      padding:6px 10px;background:#b00020;color:#fff;font:12px/1.4 ui-monospace,monospace;
      border-radius:4px;white-space:pre-wrap;pointer-events:none}
    /* Mirrors PRINT_BASELINE_CSS in apps/web deck-stage-export.ts — keep both
       in sync until dc-runtime regains a build step. */
    @media print {
      @page { margin: 0.5cm; }
      figure, table { break-inside: avoid; }
      #dc-root, #dc-root > .sc-host { height: auto; }
      *, *::before, *::after {
        print-color-adjust: exact; -webkit-print-color-adjust: exact;
        backdrop-filter: none !important; -webkit-backdrop-filter: none !important;
        animation-delay: -99s !important; animation-duration: .001s !important;
        animation-iteration-count: 1 !important; animation-fill-mode: both !important;
        animation-play-state: running !important; transition-duration: 0s !important;
      }
    }
  `;
  var FULL_PAGE_CSS = "html,body{height:100%;margin:0}#dc-root,#dc-root>.sc-host{height:100%}";
  function rootNameForDocument(doc, loc) {
    let bootPath = loc.pathname || "";
    if (!/\.dc\.html?$/i.test(safeDecode(bootPath))) {
      try {
        bootPath = new URL(doc.baseURI || "/").pathname;
      } catch {
      }
    }
    return dcNameFromPath(bootPath);
  }
  function safeDecode(s) {
    try {
      return decodeURIComponent(s);
    } catch {
      return s;
    }
  }
  function boot(runtime, doc = document) {
    const parsed = parseDcDocument(doc);
    if (!parsed) return null;
    const React = getReact();
    const rootName = rootNameForDocument(doc, location);
    runtime.markFetched(rootName);
    runtime.setRootName(rootName);
    runtime.adoptParsed(rootName, parsed);
    if (!window.__resources) {
      fetch(location.href).then((res) => res.ok ? res.text() : "").then((t) => {
        const raw = t ? parseDcText(t) : null;
        if (raw?.template) runtime.updateHtml(rootName, raw.template);
      }).catch(() => {
      });
    }
    const dc = doc.querySelector("x-dc");
    const hostEl = doc.createElement("div");
    hostEl.id = "dc-root";
    dc.replaceWith(hostEl);
    if (!parsed.preview) {
      const s = doc.createElement("style");
      s.textContent = FULL_PAGE_CSS;
      doc.head.appendChild(s);
    }
    const Root = runtime.getDC(rootName);
    const entry = runtime.registry.get(rootName);
    function StandaloneRoot() {
      const [, setTick] = React.useState(0);
      React.useEffect(() => {
        const sub = () => setTick((n) => n + 1);
        entry.subs.add(sub);
        return () => {
          entry.subs.delete(sub);
        };
      }, []);
      const defaults = React.useMemo(() => {
        const d = {};
        for (const k in entry.propsMeta || {}) {
          const v = entry.propsMeta?.[k]?.default;
          if (v !== void 0) d[k] = v;
        }
        return d;
      }, [entry.propsMeta]);
      return h(Root, { ...defaults, ...entry.propOverrides || {} });
    }
    const ReactDOM = getReactDOM();
    if (ReactDOM.createRoot)
      ReactDOM.createRoot(hostEl).render(h(StandaloneRoot));
    else ReactDOM.render(h(StandaloneRoot), hostEl);
    return rootName;
  }

  // src/expr.ts
  var IDENT_RE = /^[A-Za-z_$][A-Za-z0-9_$]*/;
  var NUMBER_RE = /^-?\d+(\.\d+)?$/;
  function resolve(vals, src) {
    const expr = String(src).trim();
    if (!expr) return void 0;
    if (expr[0] === "(" && expr[expr.length - 1] === ")" && parensWrapWhole(expr)) {
      return resolve(vals, expr.slice(1, -1));
    }
    const eq = findTopLevelEquality(expr);
    if (eq) {
      const lv = resolve(vals, expr.slice(0, eq.index));
      const rv = resolve(vals, expr.slice(eq.index + eq.op.length));
      switch (eq.op) {
        case "===":
          return lv === rv;
        case "!==":
          return lv !== rv;
        case "==":
          return lv == rv;
        default:
          return lv != rv;
      }
    }
    if (expr[0] === "!") return !resolve(vals, expr.slice(1));
    if (expr === "true") return true;
    if (expr === "false") return false;
    if (expr === "null") return null;
    if (expr === "undefined") return void 0;
    if (NUMBER_RE.test(expr)) return Number(expr);
    if (expr.length >= 2 && (expr[0] === '"' || expr[0] === "'") && expr[expr.length - 1] === expr[0]) {
      return expr.slice(1, -1);
    }
    return resolvePath(vals, expr);
  }
  function parensWrapWhole(expr) {
    let depth = 0;
    for (let i = 0; i < expr.length - 1; i++) {
      if (expr[i] === "(") depth++;
      else if (expr[i] === ")") {
        depth--;
        if (depth === 0) return false;
      }
    }
    return true;
  }
  function findTopLevelEquality(expr) {
    let depth = 0;
    for (let i = 0; i < expr.length; i++) {
      const c = expr[i];
      if (c === "[" || c === "(") depth++;
      else if (c === "]" || c === ")") depth--;
      else if (depth === 0 && (c === "=" || c === "!") && expr[i + 1] === "=") {
        if (i > 0 && (expr[i - 1] === "=" || expr[i - 1] === "!")) continue;
        if (!expr.slice(0, i).trim()) continue;
        const op = expr[i + 2] === "=" ? c + "==" : c + "=";
        return { index: i, op };
      }
    }
    return null;
  }
  function resolvePath(vals, expr) {
    const head = expr.match(IDENT_RE);
    if (!head) return void 0;
    let cur = vals == null ? void 0 : vals[head[0]];
    let i = head[0].length;
    while (i < expr.length) {
      if (expr[i] === ".") {
        const m = expr.slice(i + 1).match(IDENT_RE) || expr.slice(i + 1).match(/^\d+/);
        if (!m) return void 0;
        cur = cur == null ? void 0 : cur[m[0]];
        i += 1 + m[0].length;
      } else if (expr[i] === "[") {
        let depth = 1;
        let j = i + 1;
        while (j < expr.length && depth > 0) {
          if (expr[j] === "[") depth++;
          else if (expr[j] === "]") {
            depth--;
            if (depth === 0) break;
          }
          j++;
        }
        if (depth !== 0) return void 0;
        const key = resolve(vals, expr.slice(i + 1, j));
        cur = cur == null ? void 0 : cur[key];
        i = j + 1;
      } else {
        return void 0;
      }
    }
    return cur;
  }

  // src/encode.ts
  var CAMEL_ATTR = "sc-camel-";
  var INLINE_TEXT_TAGS = new Set(
    "a abbr b bdi bdo br cite code del dfn em i ins kbd mark q s samp small span strike strong sub sup u var wbr".split(
      " "
    )
  );
  var RAW_WRAP = {
    select: "sc-raw-select",
    table: "sc-raw-table",
    tbody: "sc-raw-tbody",
    thead: "sc-raw-thead",
    tfoot: "sc-raw-tfoot",
    tr: "sc-raw-tr",
    td: "sc-raw-td",
    th: "sc-raw-th",
    caption: "sc-raw-caption"
  };
  var RAW_UNWRAP = Object.fromEntries(
    Object.entries(RAW_WRAP).map(([k, v]) => [v, k])
  );
  var EVENT_MAP = {
    onclick: "onClick",
    onchange: "onChange",
    oninput: "onInput",
    onsubmit: "onSubmit",
    onkeydown: "onKeyDown",
    onkeyup: "onKeyUp",
    onkeypress: "onKeyPress",
    onmousedown: "onMouseDown",
    onmouseup: "onMouseUp",
    onmouseenter: "onMouseEnter",
    onmouseleave: "onMouseLeave",
    onfocus: "onFocus",
    onblur: "onBlur",
    ondoubleclick: "onDoubleClick",
    oncontextmenu: "onContextMenu",
    onmousemove: "onMouseMove",
    onmouseover: "onMouseOver",
    onmouseout: "onMouseOut",
    onpointerdown: "onPointerDown",
    onpointerup: "onPointerUp",
    onpointermove: "onPointerMove",
    onpointerenter: "onPointerEnter",
    onpointerleave: "onPointerLeave",
    onpointercancel: "onPointerCancel",
    onpointerover: "onPointerOver",
    onpointerout: "onPointerOut",
    ongotpointercapture: "onGotPointerCapture",
    onlostpointercapture: "onLostPointerCapture",
    ontouchstart: "onTouchStart",
    ontouchend: "onTouchEnd",
    ontouchmove: "onTouchMove",
    ontouchcancel: "onTouchCancel",
    ondragstart: "onDragStart",
    ondragend: "onDragEnd",
    ondragenter: "onDragEnter",
    ondragleave: "onDragLeave",
    ondragover: "onDragOver",
    onanimationstart: "onAnimationStart",
    onanimationend: "onAnimationEnd",
    onanimationiteration: "onAnimationIteration",
    ontransitionend: "onTransitionEnd"
  };
  var ATTRS = `(?:[^>"']|"[^"]*"|'[^']*')*`;
  var IMPORT_SELF_CLOSE_RE = new RegExp(
    "<(x-import|dc-import)(" + ATTRS + ")/>",
    "gi"
  );
  var CAMEL_ATTR_RE = /(\s)([a-z]+[A-Z][A-Za-z0-9]*)(\s*=)/g;
  function encodeCamelAttrs(html) {
    return html.replace(
      CAMEL_ATTR_RE,
      (_, sp, name, eq) => sp + CAMEL_ATTR + name.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase()) + eq
    );
  }
  function encodeCase(html) {
    html = html.replace(
      IMPORT_SELF_CLOSE_RE,
      (_, t, a) => "<" + t + a + "></" + t + ">"
    );
    html = html.replace(/<helmet(\s|>)/gi, "<sc-helmet$1");
    html = html.replace(/<\/helmet\s*>/gi, "</sc-helmet>");
    html = encodeCamelAttrs(html);
    for (const [real, alias] of Object.entries(RAW_WRAP)) {
      html = html.replace(
        new RegExp("(</?)" + real + "(?=[\\s>])", "gi"),
        "$1" + alias
      );
    }
    return html;
  }
  function kebabToCamel(s) {
    return s.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
  }
  function cssToObj(css) {
    const o = {};
    for (const decl of css.split(";")) {
      const i = decl.indexOf(":");
      if (i < 0) continue;
      const prop = decl.slice(0, i).trim();
      o[prop.startsWith("--") ? prop : kebabToCamel(prop)] = decl.slice(i + 1).trim();
    }
    return o;
  }
  function compileAttr(raw) {
    const whole = raw.match(/^\s*\{\{([\s\S]+?)\}\}\s*$/);
    if (whole) {
      const path = whole[1];
      return (vals) => resolve(vals, path);
    }
    if (raw.includes("{{")) {
      const parts = raw.split(/\{\{([\s\S]+?)\}\}/g);
      return (vals) => parts.map((s, i) => i & 1 ? resolve(vals, s) ?? "" : s).join("");
    }
    return () => raw;
  }

  // src/compile.ts
  function collectProps(node, kind, host) {
    const propGetters = [];
    const pseudoClasses = [];
    let hintSize = null;
    for (const { name, value } of [...node.attributes]) {
      if (name === "sc-name" || name === "data-dc-tpl") continue;
      let key = name;
      if (key.startsWith(CAMEL_ATTR))
        key = kebabToCamel(key.slice(CAMEL_ATTR.length));
      if (key === "hint-size") {
        hintSize = value;
        continue;
      }
      if (key.startsWith("style-")) {
        pseudoClasses.push(host.pseudoClass(key.slice(6), value));
        continue;
      }
      if (kind !== "dom") {
        if (key.includes("-") && !(kind === "x-import" && (key.startsWith("aria-") || key.startsWith("data-"))))
          key = kebabToCamel(key);
      } else {
        if (key === "class") key = "className";
        else if (key === "for") key = "htmlFor";
        else if (key.startsWith("on"))
          key = EVENT_MAP[key] || "on" + key[2].toUpperCase() + key.slice(3);
      }
      propGetters.push([key, compileAttr(value)]);
    }
    return { propGetters, pseudoClasses, hintSize };
  }
  var HOST_STYLE_PROPS = /* @__PURE__ */ new Set([
    "position",
    "left",
    "right",
    "top",
    "bottom",
    "inset",
    "width",
    "height",
    "z-index",
    "transform"
  ]);
  function hostPositionStyle(style) {
    const all = typeof style === "string" ? cssToObj(style) : style != null && typeof style === "object" ? style : null;
    if (!all) return void 0;
    const out = {};
    for (const [k, v] of Object.entries(all)) {
      const kebab = k.replace(/[A-Z]/g, (c) => "-" + c.toLowerCase());
      if (HOST_STYLE_PROPS.has(kebab)) out[k] = v;
    }
    return Object.keys(out).length ? out : void 0;
  }
  function compileTemplate(html, host) {
    const tpl = document.createElement("template");
    //! nosemgrep: direct-inner-html-assignment
    tpl.innerHTML = encodeCase(html);
    let tplN = 0;
    (function stamp(node) {
      if (node.nodeType === Node.ELEMENT_NODE) {
        node.setAttribute("data-dc-tpl", String(tplN++));
      }
      for (const c of node.childNodes) stamp(c);
    })(tpl.content);
    const builders = walkChildren(tpl.content, host);
    const render = ((vals, ctx) => builders.map((b, i) => b(vals || {}, ctx, i)));
    render.__annotated = tpl.innerHTML;
    return render;
  }
  function walkChildren(node, host) {
    return [...node.childNodes].map((c) => walk(c, host)).filter((b) => b != null);
  }
  var SLIDE_ID_VALUE_RE = /^[0-9a-f]{8}$/;
  var DECK_CONTROL_FLOW_RE = /^(sc-if|sc-for|sc-else|dc-import|x-import)$/;
  var DECK_AUX_RE = /^(template|script|style|sc-helmet|helmet)$/;
  function isDeckMountTag(el) {
    if (el.localName === "deck-stage") return true;
    return el.localName === "x-import" && (el.getAttribute("component-from-global-scope") || "") === "deck-stage";
  }
  function walkDeckChildren(el, host) {
    const pairs = [...el.childNodes].map((c) => ({ c, b: walk(c, host) })).filter((p) => p.b !== null);
    const kids = pairs.map((p) => p.b);
    const seen = /* @__PURE__ */ new Set();
    const wsSeen = /* @__PURE__ */ new Map();
    const keys = [];
    const nextSlideId = new Array(pairs.length);
    {
      let upcoming = null;
      for (let j = pairs.length - 1; j >= 0; j--) {
        const n = pairs[j].c;
        if (n.nodeType === Node.ELEMENT_NODE) {
          const t = n.localName;
          upcoming = !DECK_AUX_RE.test(t) && !DECK_CONTROL_FLOW_RE.test(t) ? n.getAttribute("data-om-slide-id") : null;
        }
        nextSlideId[j] = upcoming;
      }
    }
    for (let j = 0; j < pairs.length; j++) {
      const { c } = pairs[j];
      if (c.nodeType === Node.TEXT_NODE) {
        if ((c.nodeValue ?? "").trim() === "") {
          const base = nextSlideId[j] ? "omid-ws:" + nextSlideId[j] : "omid-ws:aux";
          const n = wsSeen.get(base) ?? 0;
          wsSeen.set(base, n + 1);
          keys.push(n === 0 ? base : base + ":" + n);
          continue;
        }
        return { kids, keys: null };
      }
      if (c.nodeType !== Node.ELEMENT_NODE) {
        keys.push(j);
        continue;
      }
      const child = c;
      const tag = child.localName;
      if (DECK_AUX_RE.test(tag)) {
        keys.push(j);
        continue;
      }
      if (DECK_CONTROL_FLOW_RE.test(tag)) return { kids, keys: null };
      const v = child.getAttribute("data-om-slide-id");
      if (!v || !SLIDE_ID_VALUE_RE.test(v) || seen.has(v)) {
        return { kids, keys: null };
      }
      seen.add(v);
      keys.push("omid:" + v);
    }
    return { kids, keys };
  }
  function renderDeckKids(kids, kidKeys, vals, ctx) {
    return kids.map((b, j) => {
      const k = kidKeys ? kidKeys[j] : j;
      const out = b(vals, ctx, k);
      return kidKeys != null && typeof out === "string" ? h(getReact().Fragment, { key: k }, out) : out;
    });
  }
  function walk(node, host) {
    if (node.nodeType === Node.TEXT_NODE) return walkText(node);
    if (node.nodeType !== Node.ELEMENT_NODE) return null;
    const el = node;
    const tag = el.tagName.toLowerCase();
    if (tag === "sc-for") return walkFor(el, host);
    if (tag === "sc-if") return walkIf(el, host);
    if (tag === "x-import") return walkXImport(el, host);
    if (tag === "sc-helmet") return host.helmet(el);
    if (tag === "dc-import") return walkComponent(el, host);
    return walkElement(el, host);
  }
  var warnedHoles = /* @__PURE__ */ new Set();
  function warnUnresolved(ctx, what) {
    const key = (ctx?.__name || "?") + "\0" + what;
    if (warnedHoles.has(key)) return;
    warnedHoles.add(key);
    console.warn("[dc-runtime] " + (ctx?.__name || "template") + ": " + what);
  }
  function walkText(node) {
    const txt = node.nodeValue ?? "";
    if (!txt.includes("{{")) {
      if (!txt.trim() && !txt.includes(" ")) return null;
      return () => txt;
    }
    const parts = txt.split(/\{\{([\s\S]+?)\}\}/g);
    return (vals, ctx, key) => h(
      getReact().Fragment,
      { key },
      ...parts.map((p, i) => {
        if (!(i & 1)) return p;
        const v = resolve(vals, p);
        if (v === void 0) {
          if (!ctx?.__streamingNow) {
            if (document.body?.hasAttribute("data-dc-editor-on")) {
              return h(
                "span",
                { key: i, className: "sc-interp sc-unresolved" },
                "{{ " + p.trim() + " }}"
              );
            }
            warnUnresolved(
              ctx,
              "{{ " + p.trim() + " }} never resolved — rendered as empty"
            );
            return null;
          }
          return h(
            "span",
            { key: i, className: "sc-interp sc-missing" },
            p.trim()
          );
        }
        if (getReact().isValidElement(v) || Array.isArray(v)) {
          return h(getReact().Fragment, { key: i }, v);
        }
        if (v === null || typeof v === "boolean") return null;
        return h("span", { key: i, className: "sc-interp" }, String(v));
      })
    );
  }
  function walkFor(el, host) {
    const listGet = compileAttr(el.getAttribute("list") || "");
    const asName = el.getAttribute("as") || "item";
    const hintN = parseInt(el.getAttribute("hint-placeholder-count") || "0", 10);
    const kids = walkChildren(el, host);
    const listSrc = el.getAttribute("list") || "";
    return (vals, ctx, key) => {
      let list = listGet(vals);
      if (!Array.isArray(list)) {
        if (!ctx?.__streamingNow) {
          if (list !== void 0 && list !== null) {
            warnUnresolved(
              ctx,
              'sc-for list="' + listSrc + '" is not an array (' + typeof list + ")"
            );
          }
          list = [];
        } else {
          list = hintN > 0 ? Array(hintN).fill(void 0) : [];
        }
      }
      return h(
        getReact().Fragment,
        { key },
        list.map((item, i) => {
          const sub = { ...vals, [asName]: item, $index: i };
          return h(
            getReact().Fragment,
            { key: i },
            kids.map((b, j) => b(sub, ctx, j))
          );
        })
      );
    };
  }
  function walkIf(el, host) {
    const valGet = compileAttr(el.getAttribute("value") || "");
    const hintRaw = el.getAttribute("hint-placeholder-val");
    const hintGet = hintRaw != null ? compileAttr(hintRaw) : null;
    const kids = walkChildren(el, host);
    return (vals, ctx, key) => {
      let v = valGet(vals);
      if (v === void 0 && hintGet && ctx?.__streamingNow) v = hintGet(vals);
      return v ? h(
        getReact().Fragment,
        { key },
        kids.map((b, j) => b(vals, ctx, j))
      ) : null;
    };
  }
  function walkComponent(el, host) {
    const name = el.getAttribute("name") || el.getAttribute("component") || "";
    el.removeAttribute("name");
    el.removeAttribute("component");
    const tplId = el.getAttribute("data-dc-tpl");
    const styleRaw = el.getAttribute("style");
    el.removeAttribute("style");
    const styleGet = styleRaw != null ? compileAttr(styleRaw) : null;
    const { propGetters, hintSize } = collectProps(el, "dc-import", host);
    const kids = walkChildren(el, host);
    return (vals, ctx, key) => {
      const props = {
        key,
        __hintSize: hintSize,
        __tplId: tplId,
        __hostStyle: styleGet ? hostPositionStyle(styleGet(vals)) : void 0
      };
      for (const [k, g] of propGetters) {
        const v = g(vals);
        if (k === "dcProps") {
          if (v && typeof v === "object") Object.assign(props, v);
          continue;
        }
        props[k] = v;
      }
      if (kids.length) props.children = kids.map((b, j) => b(vals, ctx, j));
      return h(host.component(name), props);
    };
  }
  function walkXImport(el, host) {
    const globalNameGet = compileAttr(
      el.getAttribute("component-from-global-scope") || ""
    );
    const exportNameGet = compileAttr(
      el.getAttribute("component") || el.getAttribute("name") || ""
    );
    const fromRaw = el.getAttribute("from") || (el.getAttribute("component-from-global-scope") ? "" : el.getAttribute("src") || el.getAttribute("import") || "");
    const urls = fromRaw.trim() ? fromRaw.trim().split(/\s+/) : [];
    const url = urls.length ? urls[urls.length - 1] : "";
    const kindOf = (u) => /\.(jsx|tsx)(\?|#|$)/i.test(u) ? "jsx" : "js";
    const tplId = el.getAttribute("data-dc-tpl");
    const styleRaw = el.getAttribute("style");
    el.removeAttribute("style");
    const styleGet = styleRaw != null ? compileAttr(styleRaw) : null;
    const wrap = tplId != null || styleGet != null;
    const { propGetters, hintSize } = collectProps(el, "x-import", host);
    const hasContent = el.children.length > 0 || !!(el.textContent || "").trim();
    const deckKeyed = hasContent && isDeckMountTag(el) ? walkDeckChildren(el, host) : null;
    const kids = deckKeyed ? deckKeyed.kids : hasContent ? walkChildren(el, host) : [];
    const kidKeys = deckKeyed?.keys ?? null;
    const urlBindable = fromRaw.includes("{{");
    if (urls.length && !urlBindable) {
      let prev;
      for (const u of urls) prev = host.loadExternal(kindOf(u), u, prev);
    }
    const evalName = (g, vals) => {
      const v = g(vals);
      const s = v == null ? "" : String(v);
      return s.includes("{{") ? "" : s;
    };
    return (vals, ctx, key) => {
      const globalName = evalName(globalNameGet, vals);
      const name = globalName || evalName(exportNameGet, vals);
      const C = !name || urlBindable ? null : globalName ? host.resolveExternalGlobal(url, globalName) : host.resolveExternal(url, name);
      const hostStyle = styleGet ? hostPositionStyle(styleGet(vals)) : void 0;
      const wrapper = wrap ? {
        key,
        className: "sc-host-x",
        "data-dc-tpl": tplId,
        style: hostStyle || { display: "contents" }
      } : null;
      if (!C) {
        const error = urlBindable ? "x-import `from` cannot contain {{ … }} — module URLs are resolved at parse time; use a literal URL" : host.resolveExternalError(url, name);
        const ph = host.placeholder({
          key: wrapper ? void 0 : key,
          name,
          hintSize,
          error
        });
        return wrapper ? h("div", wrapper, ph) : ph;
      }
      const props = wrapper ? {} : { key };
      let unresolvedHole = false;
      for (const [k, g] of propGetters) {
        if (k === "component" || k === "componentFromGlobalScope" || k === "from") {
          continue;
        }
        const v = g(vals);
        if (v === void 0) unresolvedHole = true;
        if (k === "dcProps") {
          if (v && typeof v === "object") Object.assign(props, v);
          continue;
        }
        props[k] = v;
      }
      if (unresolvedHole && ctx?.__htmlStreamingNow) {
        const ph = host.placeholder({
          key: wrapper ? void 0 : key,
          name,
          hintSize,
          error: null
        });
        return wrapper ? h("div", wrapper, ph) : ph;
      }
      if (kids.length) {
        props.children = renderDeckKids(kids, kidKeys, vals, ctx);
      }
      return wrapper ? h("div", wrapper, h(C, props)) : h(C, props);
    };
  }
  function contentKey(el) {
    const clone = el.cloneNode(true);
    for (const d of clone.querySelectorAll("*")) {
      while (d.attributes.length) d.removeAttribute(d.attributes[0].name);
    }
    const s = clone.innerHTML;
    let h2 = 5381;
    for (let i = 0; i < s.length; i++) h2 = (h2 << 5) + h2 + s.charCodeAt(i) | 0;
    return s.length + "." + (h2 >>> 0).toString(36);
  }
  var NEVER_CONTENT_KEYED = new Set(
    "script style textarea option title select canvas iframe video audio".split(
      " "
    )
  );
  var NOT_INLINE_SELECTOR = ":not(" + [...INLINE_TEXT_TAGS].join(",") + ")";
  function walkElement(el, host) {
    const realTag = RAW_UNWRAP[el.localName] || el.localName;
    const tplId = el.getAttribute("data-dc-tpl");
    const inlineOnly = el.childNodes.length > 0 && !NEVER_CONTENT_KEYED.has(realTag) && el.querySelector(NOT_INLINE_SELECTOR) === null;
    const keySuffix = inlineOnly ? "|" + contentKey(el) : "";
    const { propGetters, pseudoClasses } = collectProps(el, "dom", host);
    const deckKeyed = isDeckMountTag(el) ? walkDeckChildren(el, host) : null;
    const kids = deckKeyed ? deckKeyed.kids : walkChildren(el, host);
    const kidKeys = deckKeyed?.keys ?? null;
    return (vals, ctx, key) => {
      const props = {
        key: key + keySuffix,
        "data-dc-tpl": tplId
      };
      for (const [k, g] of propGetters) {
        let v = g(vals);
        if (k === "style" && typeof v === "string") v = cssToObj(v);
        if ((k === "value" || k === "checked") && v === void 0) {
          v = k === "checked" ? false : "";
        }
        props[k] = v;
      }
      if (pseudoClasses.length) {
        props.className = [props.className, ...pseudoClasses].filter(Boolean).join(" ");
      }
      return h(realTag, props, ...renderDeckKids(kids, kidKeys, vals, ctx));
    };
  }

  // src/logic.ts
  var StreamableLogic = class {
    constructor(props) {
      __publicField(this, "props");
      __publicField(this, "state", {});
      /** Back-pointer to the wrapper component, installed after construction. */
      __publicField(this, "__host");
      this.props = props || {};
    }
    setState(update, cb) {
      this.__host && this.__host.__setLogicState(update, cb);
    }
    forceUpdate() {
      this.__host && this.__host.forceUpdate();
    }
    componentDidMount() {
    }
    componentDidUpdate(_prevProps) {
    }
    componentWillUnmount() {
    }
    /** The flat object the template renders against (merged over props). */
    renderVals() {
      return {};
    }
  };
  function evalDcLogic(src) {
    //! nosemgrep: eval-and-function-constructor
    const fn = new Function(
      "DCLogic",
      "StreamableLogic",
      "React",
      src + '\n;return (typeof Component!=="undefined"&&Component)||undefined;'
    );
    return fn(StreamableLogic, StreamableLogic, getReact());
  }

  // src/component.ts
  function shallowEqual(a, b) {
    if (!b) return false;
    const ak = Object.keys(a).filter((k) => k !== "children");
    const bk = Object.keys(b).filter((k) => k !== "children");
    if (ak.length !== bk.length) return false;
    for (const k of ak) if (a[k] !== b[k]) return false;
    return true;
  }
  function Placeholder({
    name,
    hintSize,
    streaming,
    error
  }) {
    const [w, hgt] = (hintSize || "100%,60px").split(",");
    return h(
      "div",
      {
        className: "sc-placeholder" + (streaming ? " sc-streaming" : ""),
        style: { width: w.trim(), height: hgt && hgt.trim() },
        title: name
      },
      error ? h(
        "div",
        { className: "sc-placeholder-error" },
        (name ? name + ": " : "") + error
      ) : null
    );
  }
  function hintToMin(hint) {
    if (!hint) return void 0;
    const [w, hgt] = hint.split(",");
    return { minWidth: w.trim(), minHeight: hgt && hgt.trim() };
  }
  function createComponentFactory(registry, ensureFetched) {
    const React = getReact();
    const AncestorContext = React.createContext([]);
    class StreamableComponent extends React.Component {
      constructor(props) {
        super(props);
        __publicField(this, "__name");
        __publicField(this, "__sub");
        __publicField(this, "__needsDidMount", false);
        /** Snapshot of the registry's streaming flags taken at render time —
         *  builders read it off the RenderCtx (this) to pick placeholder vs
         *  render-nothing for unresolved values. */
        __publicField(this, "__streamingNow", false);
        __publicField(this, "__htmlStreamingNow", false);
        /** When a construct throws, remember the (class, registry.ver, props)
         *  triple so render-time reconcile doesn't re-attempt it on every parent
         *  re-render. A registry bump (new class, template, external module
         *  resolving via bumpAll) changes `ver` and breaks the memo so an
         *  env-dependent constructor can self-heal. */
        __publicField(this, "__failedLogic", null);
        __publicField(this, "__failedUserProps", null);
        __publicField(this, "__failedVer", -1);
        /** Per-instance constructor error — kept here (not on the registry entry)
         *  so one instance's successful construct can't hide a sibling's failure,
         *  and a construct can never wipe an eval error `updateJs` recorded on
         *  `r.logicError`. */
        __publicField(this, "__ctorError", null);
        __publicField(this, "logic");
        this.__name = props.__name;
        this.state = { __v: 0, __err: null };
        this.__sub = () => {
          if (this.state.__err) this.setState({ __err: null });
          this.forceUpdate();
        };
        this.__makeLogic(registry.get(this.__name).Logic, null);
        ensureFetched(this.__name);
      }
      /** Error-boundary hook: a render crash anywhere in this DC's subtree
       *  (its own template, an x-import'd component, a child DC without its
       *  own deeper boundary) lands here instead of unmounting the page. */
      static getDerivedStateFromError(e) {
        return { __err: e instanceof Error && e.message ? e.message : String(e) };
      }
      componentDidCatch(e, info) {
        console.error(
          "[dc-runtime] render error in <" + this.__name + ">:",
          e,
          info?.componentStack || ""
        );
      }
      /** Instantiate the logic class (or the no-op base) and adopt `prevState`
       *  over its initial state — used both at mount and on hot-swap. */
      __makeLogic(Logic, prevState) {
        const L = Logic || StreamableLogic;
        try {
          this.logic = new L(this.__userProps());
          this.__failedLogic = null;
          this.__failedUserProps = null;
          this.__ctorError = null;
        } catch (e) {
          console.error(e);
          this.__failedLogic = Logic;
          this.__failedUserProps = this.__userProps();
          this.__failedVer = registry.get(this.__name).ver;
          this.__ctorError = this.__name + ": " + (e instanceof Error && e.message ? e.message : String(e));
          this.logic = new StreamableLogic(
            this.__userProps()
          );
        }
        this.logic.__host = this;
        if (prevState)
          this.logic.state = { ...this.logic.state || {}, ...prevState };
      }
      /** The props the author's logic + template see — internal __-prefixed
       *  wiring stripped. */
      __userProps() {
        const { __name, __hintSize, __tplId, __hostStyle, ...rest } = this.props;
        return rest;
      }
      __setLogicState(update, cb) {
        const prev = this.logic.state;
        const patch = typeof update === "function" ? update(prev) : update;
        this.logic.state = { ...prev, ...patch };
        this.setState((s) => ({ __v: s.__v + 1 }), cb);
      }
      /** Swap the logic instance when the registry's Logic class changed
       *  (streaming completion, hot reload). State carries over; didMount
       *  re-fires after the swap commits so refs exist. */
      __reconcileLogic() {
        const r = registry.get(this.__name);
        const Next = r.Logic;
        const Cur = this.logic.constructor;
        if (Next === Cur || !Next && Cur === StreamableLogic || Next === this.__failedLogic && r.ver === this.__failedVer && shallowEqual(this.__userProps(), this.__failedUserProps)) {
          return;
        }
        if (!this.__needsDidMount) {
          try {
            this.logic.componentWillUnmount();
          } catch (e) {
            console.error(e);
          }
        }
        this.__makeLogic(Next, this.logic.state);
        this.__needsDidMount = true;
      }
      componentDidMount() {
        registry.get(this.__name).subs.add(this.__sub);
        try {
          this.logic.componentDidMount();
        } catch (e) {
          console.error(e);
        }
      }
      componentDidUpdate(prevProps) {
        this.logic.props = this.__userProps();
        if (this.__needsDidMount) {
          if (this.state.__err || !registry.get(this.__name).tpl) return;
          this.__needsDidMount = false;
          try {
            this.logic.componentDidMount();
          } catch (e) {
            console.error(e);
          }
        } else {
          try {
            this.logic.componentDidUpdate(prevProps);
          } catch (e) {
            console.error(e);
          }
        }
      }
      componentWillUnmount() {
        registry.get(this.__name).subs.delete(this.__sub);
        if (!this.__needsDidMount) {
          try {
            this.logic.componentWillUnmount();
          } catch (e) {
            console.error(e);
          }
        }
      }
      render() {
        const r = registry.get(this.__name);
        const cls = "sc-host" + (r.htmlStreaming ? " sc-streaming-html" : "") + (r.jsStreaming ? " sc-streaming-js" : "");
        const hintStyle = r.htmlStreaming ? hintToMin(this.props.__hintSize) : void 0;
        const hostStyle = this.props.__hostStyle || hintStyle ? { ...hintStyle || {}, ...this.props.__hostStyle || {} } : void 0;
        const hostBase = {
          className: cls,
          style: hostStyle,
          "data-sc-name": this.__name,
          "data-dc-tpl": this.props.__tplId
        };
        const chain = Array.isArray(this.context) ? this.context : [];
        if (chain.includes(this.__name)) {
          const cycle = [
            ...chain.slice(chain.indexOf(this.__name)),
            this.__name
          ].join(" → ");
          return h(
            "div",
            { ...hostBase, className: cls + " sc-has-error" },
            h(Placeholder, {
              name: this.__name,
              hintSize: this.props.__hintSize,
              error: "circular import: " + cycle
            })
          );
        }
        if (this.state.__err) {
          return h(
            "div",
            { ...hostBase, className: cls + " sc-has-error" },
            h(
              "div",
              { className: "sc-logic-error", "data-omelette-chrome": "" },
              this.__name + ": " + this.state.__err
            ),
            h(Placeholder, {
              name: this.__name,
              hintSize: this.props.__hintSize,
              error: this.state.__err
            })
          );
        }
        this.__reconcileLogic();
        if (!r.tpl) {
          return h(
            "div",
            hostBase,
            h(Placeholder, { name: this.__name, hintSize: this.props.__hintSize })
          );
        }
        const userProps = this.__userProps();
        this.logic.props = userProps;
        let vals = userProps;
        let renderErr = r.logicError || this.__ctorError;
        try {
          vals = { ...userProps, ...this.logic.renderVals() || {} };
        } catch (e) {
          console.error(e);
          renderErr = this.__name + ".renderVals(): " + (e instanceof Error && e.message ? e.message : String(e));
        }
        this.__streamingNow = !!(r.htmlStreaming || r.jsStreaming);
        this.__htmlStreamingNow = !!r.htmlStreaming;
        return h(
          "div",
          { ...hostBase, className: cls + (renderErr ? " sc-has-error" : "") },
          renderErr && h(
            "div",
            { className: "sc-logic-error", "data-omelette-chrome": "" },
            renderErr
          ),
          h(
            AncestorContext.Provider,
            { value: [...chain, this.__name] },
            r.tpl(vals, this)
          )
        );
      }
    }
    __publicField(StreamableComponent, "contextType", AncestorContext);
    const named = /* @__PURE__ */ new Map();
    function getDC(name) {
      const hit = named.get(name);
      if (hit) return hit;
      function Dispatcher(p) {
        const [, setTick] = React.useState(0);
        React.useEffect(() => {
          const sub = () => setTick((n) => n + 1);
          registry.get(name).subs.add(sub);
          return () => {
            registry.get(name).subs.delete(sub);
          };
        }, []);
        ensureFetched(name);
        return h(StreamableComponent, { ...p, __name: name });
      }
      Dispatcher.displayName = name;
      named.set(name, Dispatcher);
      return Dispatcher;
    }
    return {
      getDC,
      StreamableComponent
    };
  }

  // src/bundled.ts
  function bundledBlob(url) {
    const blobs = window.__resourceBlobs;
    const b = blobs ? blobs[url.split("#")[0]] : void 0;
    return b instanceof Blob ? b : null;
  }

  // src/cdn.ts
  var REACT_URL = "https://unpkg.com/react@18.3.1/umd/react.production.min.js";
  var REACT_SRI = "sha384-DGyLxAyjq0f9SPpVevD6IgztCFlnMF6oW/XQGmfe+IsZ8TqEiDrcHkMLKI6fiB/Z";
  var REACT_DOM_URL = "https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js";
  var REACT_DOM_SRI = "sha384-gTGxhz21lVGYNMcdJOyq01Edg0jhn/c22nsx0kyqP0TxaV5WVdsSH1fSDUf5YJj1";
  var BABEL_URL = "https://unpkg.com/@babel/standalone@7.29.0/babel.min.js";
  var BABEL_SRI = "sha384-m08KidiNqLdpJqLq95G/LEi8Qvjl/xUYll3QILypMoQ65QorJ9Lvtp2RXYGBFj1y";
  function cdnScriptFor(url, sri) {
    const res = window.__resources;
    const v = res ? res[url] : void 0;
    return typeof v === "string" && v ? { src: v } : { src: url, integrity: sri };
  }

  // src/external.ts
  var isCustomElementName = (n) => !n.includes(".") && n.includes("-");
  function isRenderableType(g) {
    if (typeof g === "function") return !isElementClass(g);
    return typeof g === "object" && g !== null && typeof g.$$typeof === "symbol";
  }
  function resolveDottedPath(root, name) {
    let cur = root;
    for (const seg of name.split(".")) {
      if (cur == null) return void 0;
      cur = cur[seg];
    }
    return cur;
  }
  var GLOBAL_POLL_INTERVAL_MS = 50;
  var GLOBAL_POLL_TIMEOUT_MS = 3e4;
  function createExternalModules(onResolved) {
    const cache = /* @__PURE__ */ new Map();
    let babelLoading = null;
    const reportedMissing = /* @__PURE__ */ new Map();
    const polling = /* @__PURE__ */ new Set();
    function ensureBabel() {
      if (window.Babel) return Promise.resolve();
      if (babelLoading) return babelLoading;
      const babel = cdnScriptFor(BABEL_URL, BABEL_SRI);
      babelLoading = new Promise((res, rej) => {
        const s = document.createElement("script");
        s.src = babel.src;
        if (babel.integrity) {
          s.integrity = babel.integrity;
          s.crossOrigin = "anonymous";
        }
        s.onload = () => res();
        s.onerror = rej;
        document.head.appendChild(s);
      });
      return babelLoading;
    }
    const pending = /* @__PURE__ */ new Map();
    function load(kind, url, after) {
      const existing = pending.get(url);
      if (existing) return existing;
      cache.set(url, null);
      console.info("[dc-runtime] x-import: loading", url, "(" + kind + ")");
      const ready = Promise.all([
        kind === "jsx" ? ensureBabel() : Promise.resolve(),
        after ?? Promise.resolve()
      ]);
      const p = ready.then(() => {
        const pre = bundledBlob(url);
        if (pre) return pre.text();
        return fetch(url).then((r) => {
          if (!r.ok) throw new Error("HTTP " + r.status);
          return r.text();
        });
      }).then((src) => {
        const code = kind === "jsx" ? window.Babel.transform(src, {
          filename: url,
          presets: ["react", "typescript"]
        }).code : src;
        const module = { exports: {} };
        const before = new Set(Object.keys(window));
        //! nosemgrep: eval-and-function-constructor
        new Function("React", "module", "exports", "require", code)(
          getReact(),
          module,
          module.exports,
          () => ({})
        );
        const globals = {};
        for (const k of Object.keys(window)) {
          if (!before.has(k) && typeof window[k] === "function") {
            globals[k] = window[k];
          }
        }
        cache.set(url, { mod: module.exports, globals });
        console.info(
          "[dc-runtime] x-import: loaded",
          url,
          "— exports:",
          Object.keys(module.exports),
          "window globals:",
          Object.keys(globals)
        );
        onResolved();
      }).catch((e) => {
        cache.set(url, {
          mod: {},
          globals: {},
          error: "failed to load: " + (e instanceof Error && e.message ? e.message : String(e))
        });
        console.error(
          "[dc-runtime] x-import: FAILED to load",
          url,
          "(" + kind + ")",
          e
        );
        onResolved();
      });
      pending.set(url, p);
      return p;
    }
    function resolve2(url, name) {
      const entry = cache.get(url);
      if (!entry) return null;
      const { mod, globals } = entry;
      const C = mod && mod[name] || globals && globals[name] || typeof window !== "undefined" && window[name] || mod && mod.default;
      if (typeof C === "function") return C;
      const key = url + "\0" + name;
      if (!reportedMissing.has(key)) {
        reportedMissing.set(
          key,
          entry.error || 'no export named "' + name + '" (has: ' + Object.keys(mod).join(", ") + ")"
        );
        console.error(
          "[dc-runtime] x-import: module",
          url,
          "loaded but has no component named",
          JSON.stringify(name),
          "— available exports:",
          Object.keys(mod),
          "window globals:",
          Object.keys(globals),
          ". The module must `module.exports = {" + name + "}` or set `window." + name + "`."
        );
      }
      return null;
    }
    function waitForGlobal(name) {
      if (polling.has(name)) return;
      polling.add(name);
      const started = Date.now();
      const isCE = isCustomElementName(name);
      const tick = () => {
        const found = isCE ? customElements.get(name) : isRenderableType(resolveDottedPath(window, name));
        if (found) {
          polling.delete(name);
          onResolved();
          return;
        }
        if (Date.now() - started >= GLOBAL_POLL_TIMEOUT_MS) {
          console.warn(
            "[dc-runtime] x-import: global",
            JSON.stringify(name),
            "never appeared on window after " + GLOBAL_POLL_TIMEOUT_MS + "ms"
          );
          return;
        }
        setTimeout(tick, GLOBAL_POLL_INTERVAL_MS);
      };
      setTimeout(tick, GLOBAL_POLL_INTERVAL_MS);
    }
    function resolveGlobal(url, name) {
      const isCE = isCustomElementName(name);
      if (!url) {
        if (isCE) {
          if (customElements.get(name)) return name;
          waitForGlobal(name);
          return null;
        }
        const g2 = resolveDottedPath(window, name);
        if (isRenderableType(g2)) return g2;
        waitForGlobal(name);
        return null;
      }
      const entry = cache.get(url);
      if (!entry) return null;
      if (isCE && customElements.get(name)) return name;
      const g = entry.globals[name] ?? resolveDottedPath(window, name);
      if (isRenderableType(g)) return g;
      if (name.includes(".")) return null;
      const key = url + "\0global\0" + name;
      if (!reportedMissing.has(key)) {
        reportedMissing.set(key, null);
        if (isCE && !customElements.get(name)) {
          console.warn(
            "[dc-runtime] x-import:",
            url,
            "loaded but no custom element",
            JSON.stringify(name),
            "is registered and window." + name + " is not a function — rendering <" + name + "> as an unknown element."
          );
        }
      }
      return name;
    }
    function getError(url, name) {
      const entry = cache.get(url);
      if (entry?.error) return entry.error;
      return reportedMissing.get(url + "\0" + name) || null;
    }
    return { load, resolve: resolve2, resolveGlobal, getError };
  }
  function isElementClass(g) {
    try {
      return typeof g === "function" && typeof HTMLElement !== "undefined" && g.prototype instanceof HTMLElement;
    } catch {
      return false;
    }
  }

  // src/atomics.ts
  var ATOMIC_CSS = (
    // layout
    ".fx{display:flex}.col{display:flex;flex-direction:column}.grid{display:grid}.ac{align-items:center}.jc{justify-content:center}.jb{justify-content:space-between}.f1{flex:1}.noshrink{flex-shrink:0}.wrap{flex-wrap:wrap}.fw5{font-weight:500}.fw6{font-weight:600}.fw7{font-weight:700}.fw8{font-weight:800}.fs11{font-size:11px}.fs12{font-size:12px}.fs13{font-size:13px}.fs14{font-size:14px}.fs15{font-size:15px}.fs16{font-size:16px}.fs20{font-size:20px}.fs22{font-size:22px}.upper{text-transform:uppercase}.tc{text-align:center}.nowrap{white-space:nowrap}.gap8{gap:8px}.gap10{gap:10px}.gap12{gap:12px}.gap16{gap:16px}.gap24{gap:24px}.m0{margin:0}.mt8{margin-top:8px}.mt12{margin-top:12px}.mt16{margin-top:16px}.mb8{margin-bottom:8px}.mb12{margin-bottom:12px}.mb16{margin-bottom:16px}.posrel{position:relative}.posabs{position:absolute}.round{border-radius:50%}.ohide{overflow:hidden}.bbox{box-sizing:border-box}.pointer{cursor:pointer}.w100{width:100%}.b0{border:none}"
  );

  // src/helmet.ts
  var DESIGN_DOC_MODE_RE = /<meta\b[^>]*\bname\s*=\s*["']design_doc_mode["'][^>]*\b(?:content|value)\s*=\s*["'](\w+)["']/i;
  var CANVAS_BG_LIGHT = "#f0eee6";
  var CANVAS_BG_DARK = "#2e2c26";
  function createHelmetManager(doc, isStreaming) {
    const mounted = /* @__PURE__ */ new Set();
    const live = /* @__PURE__ */ new Map();
    let designDocMode = null;
    let canvasStyleEl = null;
    let appTheme = "light";
    try {
      const ds = doc.documentElement.dataset.theme;
      appTheme = ds === "dark" || ds === "light" ? ds : new URLSearchParams(doc.defaultView?.location.search ?? "").get(
        "theme"
      ) === "dark" ? "dark" : "light";
    } catch {
    }
    function applyCanvasBg() {
      if (!canvasStyleEl) return;
      const bg = appTheme === "dark" ? CANVAS_BG_DARK : CANVAS_BG_LIGHT;
      canvasStyleEl.textContent = `html,body{background:${bg}}#dc-root>.sc-host{position:relative}`;
    }
    function postDesignMode(mode) {
      if (window.parent === window) return;
      try {
        window.parent.postMessage({ type: "__dc_design_mode", mode }, "*");
      } catch {
      }
    }
    function setDesignDocMode(mode) {
      if (mode === designDocMode) return;
      designDocMode = mode;
      postDesignMode(mode);
      if (mode === "canvas") {
        doc.documentElement.setAttribute("data-dc-canvas", "");
        canvasStyleEl = doc.createElement("style");
        canvasStyleEl.setAttribute("data-dc-canvas", "");
        applyCanvasBg();
        doc.head.appendChild(canvasStyleEl);
      } else {
        doc.documentElement.removeAttribute("data-dc-canvas");
        canvasStyleEl?.remove();
        canvasStyleEl = null;
      }
    }
    window.addEventListener("message", (e) => {
      const type = e.data && e.data.type;
      if (type === "__dc_theme") {
        const t = e.data.theme;
        if (t === "light" || t === "dark") {
          appTheme = t;
          applyCanvasBg();
        }
        return;
      }
      if (!designDocMode || type !== "__dc_probe") return;
      postDesignMode(designDocMode);
    });
    function compile(node) {
      const raw = [...node.children];
      const helmetClosed = node.nextSibling != null || node.parentNode?.nextSibling != null;
      if (node.hasAttribute("data-dc-atomics") && !mounted.has("__dc-atomics")) {
        mounted.add("__dc-atomics");
        const el = doc.createElement("style");
        el.id = "__dc-atomics";
        el.textContent = ATOMIC_CSS;
        doc.head.appendChild(el);
      }
      return (_vals, ctx) => {
        const name = ctx && ctx.__name || "";
        const streaming = !!(name && isStreaming(name));
        for (let i = 0; i < raw.length; i++) {
          const child = raw[i];
          const tag = child.tagName;
          const mayBePartial = streaming && !helmetClosed && i === raw.length - 1;
          if (tag === "SCRIPT") {
            if (mayBePartial) continue;
            const key = "SCRIPT|" + (child.getAttribute("src") || child.textContent || "");
            if (mounted.has(key)) continue;
            mounted.add(key);
            const el = doc.createElement("script");
            for (const { name: an, value } of [...child.attributes])
              el.setAttribute(an, value);
            if (child.textContent) el.textContent = child.textContent;
            doc.head.appendChild(el);
          } else if (tag === "LINK" || tag === "META") {
            if (mayBePartial) continue;
            const key = tag + "|" + (child.getAttribute("href") || child.getAttribute("src") || child.outerHTML);
            if (mounted.has(key)) continue;
            mounted.add(key);
            if (tag === "LINK") {
              const rel = (child.getAttribute("rel") || "").toLowerCase().split(/\s+/);
              const href = (child.getAttribute("href") || "").trim();
              const res = window.__resources;
              const pre = res && rel.includes("stylesheet") && !rel.includes("alternate") ? res[href] : void 0;
              const blob = typeof pre === "string" && pre ? bundledBlob(pre) : null;
              if (blob) {
                const el = doc.createElement("style");
                if (child.hasAttribute("disabled")) {
                  el.setAttribute("media", "not all");
                } else if (child.getAttribute("media")) {
                  el.setAttribute("media", child.getAttribute("media"));
                }
                if (child.getAttribute("title"))
                  el.setAttribute("title", child.getAttribute("title"));
                void blob.text().then((css) => {
                  el.textContent = css;
                });
                doc.head.appendChild(el);
                continue;
              }
            }
            doc.head.appendChild(child.cloneNode(true));
          } else {
            const key = name + "|" + i;
            let el = live.get(key);
            if (!el || el.tagName !== tag) {
              if (el) el.remove();
              el = doc.createElement(tag.toLowerCase());
              live.set(key, el);
              doc.head.appendChild(el);
            }
            for (const { name: an, value } of [...child.attributes]) {
              if (el.getAttribute(an) !== value) el.setAttribute(an, value);
            }
            if (el.textContent !== child.textContent)
              el.textContent = child.textContent;
          }
        }
        return null;
      };
    }
    return { compile, setDesignDocMode };
  }

  // src/pseudo.ts
  function scanUnquotedUrl(css, i) {
    if (css[i] !== "u" && css[i] !== "U" || css.slice(i, i + 4).toLowerCase() !== "url(" || /[a-z0-9_-]/i.test(css[i - 1] ?? "")) {
      return -1;
    }
    let j = i + 4;
    while (j < css.length && /\s/.test(css[j])) j++;
    if (css[j] === '"' || css[j] === "'") return -1;
    while (j < css.length && css[j] !== ")") {
      if (css[j] === "\\") j++;
      j++;
    }
    return j < css.length ? j + 1 : css.length;
  }
  function stripComments(css) {
    let out = "";
    let quote = "";
    for (let i = 0; i < css.length; i++) {
      const c = css[i];
      if (quote) {
        if (c === "\\") {
          out += c + (css[i + 1] ?? "");
          i++;
          continue;
        }
        if (c === quote) quote = "";
        out += c;
      } else if (c === "'" || c === '"') {
        quote = c;
        out += c;
      } else if (c === "/" && css[i + 1] === "*") {
        const end = css.indexOf("*/", i + 2);
        i = end === -1 ? css.length : end + 1;
        out += " ";
      } else {
        const end = scanUnquotedUrl(css, i);
        if (end === -1) out += c;
        else {
          out += css.slice(i, end);
          i = end - 1;
        }
      }
    }
    return out;
  }
  function importantify(css) {
    css = stripComments(css);
    const decls = [];
    let start = 0;
    let depth = 0;
    let quote = "";
    for (let i = 0; i < css.length; i++) {
      const c = css[i];
      if (quote) {
        if (c === "\\") i++;
        else if (c === quote) quote = "";
      } else if (c === "'" || c === '"') quote = c;
      else if (c === "(") depth++;
      else if (c === ")") depth = Math.max(0, depth - 1);
      else if (c === ";" && depth === 0) {
        decls.push(css.slice(start, i));
        start = i + 1;
      } else {
        const end = scanUnquotedUrl(css, i);
        if (end !== -1) i = end - 1;
      }
    }
    decls.push(css.slice(start));
    return decls.map((d) => d.trim()).filter(Boolean).map((d) => /!\s*important$/i.test(d) ? d : d + " !important").join(";");
  }
  function createPseudoSheet(doc) {
    let el = null;
    const cache = /* @__PURE__ */ new Map();
    let n = 0;
    return (pseudo, css) => {
      const k = pseudo + "|" + css;
      const hit = cache.get(k);
      if (hit) return hit;
      if (!el) {
        el = doc.createElement("style");
        doc.head.appendChild(el);
      }
      const cls = "scp" + (n++).toString(36);
      const isPseudoElement = pseudo === "before" || pseudo === "after";
      const sel = isPseudoElement ? "." + cls + "::" + pseudo : "." + cls + ":" + pseudo;
      el.sheet.insertRule(
        sel + "{" + (isPseudoElement ? css : importantify(css)) + "}",
        el.sheet.cssRules.length
      );
      cache.set(k, cls);
      return cls;
    };
  }

  // src/registry.ts
  function createRegistry() {
    const entries = /* @__PURE__ */ Object.create(null);
    function get(name) {
      return entries[name] || (entries[name] = {
        html: "",
        tpl: null,
        Logic: null,
        jsStreaming: false,
        htmlStreaming: false,
        ver: 0,
        subs: /* @__PURE__ */ new Set(),
        fetched: false
      });
    }
    function bump(name) {
      const r = get(name);
      r.ver++;
      for (const fn of r.subs) fn();
    }
    return {
      entries,
      get,
      bump,
      bumpAll() {
        for (const n in entries) bump(n);
      }
    };
  }

  // src/runtime.ts
  var COMPONENT_DIR = ".";
  function createRuntime(doc = document) {
    const registry = createRegistry();
    const pseudoClass = createPseudoSheet(doc);
    const helmet = createHelmetManager(
      doc,
      (name) => registry.get(name).htmlStreaming
    );
    const external = createExternalModules(() => registry.bumpAll());
    const factory = createComponentFactory(registry, ensureFetched);
    const host = {
      component: (name) => factory.getDC(name),
      placeholder: (props) => h(Placeholder, props),
      helmet: (node) => helmet.compile(node),
      loadExternal: (kind, url, after) => external.load(kind, url, after),
      resolveExternal: (url, name) => external.resolve(url, name),
      resolveExternalGlobal: (url, name) => external.resolveGlobal(url, name),
      resolveExternalError: (url, name) => external.getError(url, name),
      pseudoClass
    };
    function ensureFetched(name) {
      const r = registry.get(name);
      if (r.fetched) return;
      r.fetched = true;
      const url = COMPONENT_DIR + "/" + encodeURIComponent(name) + ".dc.html";
      const res = window.__resources;
      const pre = res ? res[url] : void 0;
      const target = typeof pre === "string" && pre ? pre : url;
      const blob = bundledBlob(target);
      (blob ? blob.text() : fetch(target).then((res2) => {
        if (!res2.ok) {
          console.error(
            '[dc-runtime] sibling fetch for "' + name + '" failed:',
            url,
            "returned",
            res2.status,
            "— the reference renders as an empty placeholder."
          );
          return "";
        }
        return res2.text();
      })).then((t) => {
        if (!t) return;
        const parsed = parseDcText(t);
        if (!parsed) {
          console.error(
            '[dc-runtime] sibling fetch for "' + name + '":',
            url,
            "has no <x-dc> block — not a Design Component."
          );
          return;
        }
        if (parsed.props) r.propsMeta = parsed.props;
        if (parsed.preview) r.preview = parsed.preview;
        if (parsed.template && !r.html) updateHtml(name, parsed.template);
        if (parsed.js && !r.Logic) updateJs(name, parsed.js);
      }).catch(
        (e) => console.error(
          '[dc-runtime] sibling fetch for "' + name + '" threw:',
          url,
          e
        )
      );
    }
    let rootName = null;
    function updateHtml(name, html) {
      const r = registry.get(name);
      r.html = html;
      if (name === rootName) {
        const mode = DESIGN_DOC_MODE_RE.exec(html)?.[1] ?? null;
        if (mode || !r.htmlStreaming) helmet.setDesignDocMode(mode);
      }
      try {
        r.tpl = compileTemplate(html, host);
      } catch (e) {
        console.error("[dc-runtime] template compile FAILED for", name, e);
      }
      registry.bump(name);
    }
    function updateJs(name, src) {
      const r = registry.get(name);
      const seq = r.jsSeq = (r.jsSeq || 0) + 1;
      try {
        const Cls = evalDcLogic(src);
        if (r.jsSeq !== seq) return;
        if (typeof Cls !== "function") {
          r.logicError = name + ".dc.html: <script data-dc-script> must define `class Component extends DCLogic`";
        } else {
          r.logicError = null;
          r.Logic = Cls;
        }
      } catch (e) {
        if (r.jsSeq !== seq) return;
        console.error(
          "[dc-runtime] logic class eval FAILED for",
          name,
          "— the template renders with props only.",
          e
        );
        r.logicError = name + ": " + (e instanceof Error && e.message ? e.message : String(e));
      }
      registry.bump(name);
    }
    function setStreaming(name, kind, on) {
      const r = registry.get(name);
      if (kind === "html") r.htmlStreaming = !!on;
      else r.jsStreaming = !!on;
      let any = false;
      for (const n in registry.entries) {
        const e = registry.entries[n];
        if (e && (e.htmlStreaming || e.jsStreaming)) {
          any = true;
          break;
        }
      }
      doc.documentElement.classList.toggle("sc-dc-streaming", any);
      registry.bump(name);
    }
    function dcUpdate(name, kind, content, streaming) {
      if (streaming) registry.get(name).fetched = true;
      if (kind === "html") {
        setStreaming(name, "html", !!streaming);
        updateHtml(name, content);
      } else if (kind === "js") {
        setStreaming(name, "js", !!streaming);
        if (!streaming) updateJs(name, content);
      } else if (kind === "props") {
        const { props, preview } = parseDataProps(content);
        const r = registry.get(name);
        r.propsMeta = props ?? void 0;
        r.preview = preview;
        registry.bump(name);
      }
    }
    function setProps(name, overrides) {
      registry.get(name).propOverrides = overrides && typeof overrides === "object" ? { ...overrides } : null;
      registry.bump(name);
    }
    function adoptParsed(name, parsed) {
      if (!parsed) return;
      const r = registry.get(name);
      if (parsed.props) r.propsMeta = parsed.props;
      if (parsed.preview) r.preview = parsed.preview;
      if (parsed.template) updateHtml(name, parsed.template);
      if (parsed.js) updateJs(name, parsed.js);
    }
    return {
      registry,
      getDC: factory.getDC,
      updateHtml,
      updateJs,
      dcUpdate,
      setProps,
      adoptParsed,
      setRootName: (name) => {
        rootName = name;
      },
      markFetched: (name) => {
        registry.get(name).fetched = true;
      },
      annotatedTemplate: (name) => {
        const r = registry.get(name);
        return r.tpl && r.tpl.__annotated || null;
      },
      templateSource: (name) => registry.get(name).html || null,
      StreamableLogic
    };
  }

  // src/stream-state.ts
  function createStreamTracker(staleMs = 6e4, now = Date.now) {
    const since = /* @__PURE__ */ new Map();
    const liveOne = (n) => {
      const t = since.get(n);
      if (t === void 0) return false;
      if (now() - t > staleMs) {
        since.delete(n);
        return false;
      }
      return true;
    };
    return {
      push(name, streaming, viewportKey) {
        if (viewportKey === "dc-model") return;
        if (streaming) since.set(name, now());
        else since.delete(name);
      },
      live(name) {
        if (name !== void 0) return liveOne(name);
        for (const n of [...since.keys()]) if (liveOne(n)) return true;
        return false;
      }
    };
  }

  // src/index.ts
  function hideRawTemplate() {
    const s = document.createElement("style");
    s.textContent = "x-dc{display:none!important}";
    document.head.appendChild(s);
  }
  function loadScript(src, integrity) {
    return new Promise((resolve2, reject) => {
      //! nosemgrep: create-script-element
      const s = document.createElement("script");
      s.src = src;
      if (integrity) {
        s.integrity = integrity;
        s.crossOrigin = "anonymous";
      }
      s.async = false;
      s.onload = () => resolve2();
      s.onerror = () => reject(new Error(`failed to load ${src}`));
      document.head.appendChild(s);
    });
  }
  function loadReactUmd() {
    const w = window;
    if (w.React && w.ReactDOM) return Promise.resolve();
    const react = cdnScriptFor(REACT_URL, REACT_SRI);
    const reactDom = cdnScriptFor(REACT_DOM_URL, REACT_DOM_SRI);
    return Promise.all([
      loadScript(react.src, react.integrity),
      loadScript(reactDom.src, reactDom.integrity)
    ]).then(() => void 0);
  }
  function init() {
    const runtime = createRuntime(document);
    let rootName = "Root";
    const baseCss = document.createElement("style");
    baseCss.textContent = BASE_CSS;
    document.head.prepend(baseCss);
    const notifyHost = () => {
      if (window.parent === window) return;
      const r = runtime.registry.entries[rootName];
      try {
        window.parent.postMessage(
          {
            type: "__dc_booted",
            rootName,
            propsMeta: r && r.propsMeta || null,
            preview: r && r.preview || null
          },
          "*"
        );
      } catch {
      }
    };
    const streams = createStreamTracker();
    const api = {
      __dcUpdate: (name, kind, content, streaming, viewportKey) => {
        streams.push(name, streaming, viewportKey);
        runtime.dcUpdate(name, kind, content, streaming);
        if (name === rootName && !streaming && kind === "props") notifyHost();
      },
      __dcStreaming: (name) => streams.live(name),
      __dcSetProps: (name, overrides) => runtime.setProps(name, overrides),
      /** Name of the component currently mounted as the page root — DC tools
       *  push their template-stream here when targeting "the open page". */
      __dcRootName: () => rootName,
      /** Editor bridge — the encoded, `data-dc-tpl`-annotated template source.
       *  The host editor parses this into its own template DOM so it can map a
       *  rendered node (carrying the same `data-dc-tpl`) back to the source
       *  node that emitted it. Returns the encoded form (`sc-camel-*` attrs,
       *  `<sc-raw-*>`/`<sc-helmet>` tags); the editor decodes on serialize. */
      __dcAnnotatedTemplate: (name) => runtime.annotatedTemplate(name),
      /** Editor bridge — the *original* (decoded) template source. */
      __dcTemplateSource: (name) => runtime.templateSource(name),
      __dcBoot: () => {
        rootName = boot(runtime, document) ?? rootName;
        notifyHost();
      },
      __dcRegistry: runtime.registry.entries,
      getDC: (name) => runtime.getDC(name),
      // `DCLogic` is the documented base class name; `StreamableLogic` is the
      // implementation alias kept for any project that already references it.
      DCLogic: runtime.StreamableLogic,
      StreamableLogic: runtime.StreamableLogic
    };
    Object.assign(window, api);
    window.__dcContentKeyed = true;
    if (document.readyState !== "loading") api.__dcBoot();
    else document.addEventListener("DOMContentLoaded", () => api.__dcBoot());
  }
  hideRawTemplate();
  loadReactUmd().then(init).catch((err) => {
    console.error("[dc] failed to load React or boot:", err);
    throw err;
  });
})();

/* ---- catalog data (moved out of .dc.html) ---- */
window.CATS = [["dvig", "Двигатель и его системы", "M3 12h3V9h3V7h6v3h3l3 3v5H3zM9 7V5h6v2"], ["rashod", "Расходные материалы", "M4 6h16M4 12h10M4 18h16M17 10l3 3-3 3"], ["podvesk", "Подвеска", "M8 3v6l-3 3v9M16 3v6l3 3v9M8 12h8M6 15h12"], ["kuzov", "Кузов автомобиля", "M3 16l2-6h14l2 6zM6 16v3M18 16v3M8 10l1-4h6l1 4"], ["elektr", "Электрооборудование", "M3 8h18v10H3zM7 8V5h4v3M14 12h4M16 10v4"], ["tormoz", "Тормозная система", "M12 2a10 10 0 100 20 10 10 0 000-20M12 8a4 4 0 100 8 4 4 0 000-8"], ["instr", "Инструмент", "M14 7l3 3-7 7-3-3zM17 10l4-4-3-3-4 4M3 21l4-1 1-4"], ["kpp", "КПП и трансмиссия", "M12 3a9 9 0 100 18 9 9 0 000-18M12 8a4 4 0 100 8 4 4 0 000-8M12 3v5M21 12h-5"], ["svet", "Автосвет", "M9 18h6M10 21h4M12 3a6 6 0 00-4 10c1 1 1 2 1 3h6c0-1 0-2 1-3a6 6 0 00-4-10z"], ["masla", "Масла и жидкости", "M6 8h9l4 4v6H6zM9 4h4v4H9zM3 12h3"]];
window.CATNAME = {}; window.CATICON = {};
window.CATS.forEach(function(c){ window.CATNAME[c[0]]=c[1]; window.CATICON[c[0]]=c[2]; });
window.CATCOUNT = {"dvig": 9187, "rashod": 6641, "podvesk": 4976, "kuzov": 4357, "elektr": 4316, "tormoz": 3361, "instr": 2691, "kpp": 2611, "svet": 1667, "masla": 197};
// [id,cat,brand,name,oem,price,old,stock,days,side,type,warranty,orig,pop,desc,specs,appl]
window.RAW = [
 ["p1", "dvig", "TRIALLI", "Ремень приводной поликлиновой для Skoda TRIALLI 6PK1548", "6PK1548", 1055, 0, 12, 0, "—", "Ремни привода навесных агрегатов", "12 мес", "Аналог", 96, "Ремень - это бесконечная лента, выполняющая передачу мощности от ведущего к одному или нескольким ведомым валам.", [["Серия", "black"], ["Комплектация", "количество ребер-6"], ["Гарантийный срок", "2 года / 60 000 км"], ["Длина, мм", "1548"], ["Материал", "epdm"]], "ALPINA B7 (E65) 4.4 2003 - 2008 BMW 1 (E81) 116 d 2008 - 2011 BMW 1 (E81) 118 d 2006 - 2011 BMW 1 (E81) 120 d 2006 - 2011 BMW 1 (E"],
 ["p2", "dvig", "MANN-FILTER", "Масляный фильтр MANN-FILTER W92021", "W92021", 486, 0, 5, 0, "—", "Фильтры масляные", "12 мес", "Аналог", 92, "Фильтр MANN-FILTER имеет значительно большую площадь поверхности фильтровального материала по сравнению с аналогами за счет большего количества складок и их глубины. Благодаря большей поверхности материала обеспечивается лучшая грязеемкость", [["Тип транспортного средства", "легковые"], ["Фильтрующий элемент", "фильтровальная бумага"], ["Давление открытия обгонного клапан", "0,8 бар"], ["Внутренний диаметр 1", "62 мм"], ["Внутренний диаметр 2", "71 мм"]], "Lada 2101-07, 21213; UAZ 31512-31625; Nissan Trade"],
 ["p3", "dvig", "MASUMA", "Воздушный фильтр для Hyundai MASUMA MFAK345 MASUMA MFA-K345", "MFA-K345", 491, 560, 24, 0, "—", "Фильтры воздушные", "24 мес", "Аналог", 88, "Все воздушные фильтры Masuma производятся согласно спецификациям производителей оригинальных автомобилей. Отличительной особенностью воздушных фильтров Masuma по сравнению с обычными бумажными фильтрами является фильтрующий элемент, выполня", [["Длина, мм", "256"], ["Фильтрующий элемент", "фильтровальная бумага"], ["Тип продукта", "фильтр воздушный"], ["Высота, мм", "53"], ["Ширина, мм", "145"]], "Hyundai Solaris 10-17, Kia Rio 11-17, Soul 09-"],
 ["p4", "dvig", "BIG FILTER", "Воздушный фильтр для Mitsubishi BIG FILTER GB931", "GB931", 667, 0, 3, 0, "—", "Фильтры воздушные", "12 мес", "Аналог", 84, "Воздушные фильтры производятся на самом современном оборудовании. В производстве используется бумага высшего качества, что позволяет фильтрам отвечать требованиям мировых стандартов. Практически весь процесс производства полностью автоматиз", [["Длина, мм", "250"], ["Фильтрующий элемент", "фильтровальная бумага"], ["Тип продукта", "фильтр воздушный"], ["Высота, мм", "57"], ["Тип фильтра", "Панельный"]], "Mitsubishi Colt (Z30); SMART Forfour (454)"],
 ["p5", "dvig", "LADA", "Комплект поршней поршень+палец+поршневые кольца Класс А LADA 11194100401557", "11194100401557", 5238, 5971, 12, 0, "—", "Поршни", "12 мес", "Оригинал", 80, "КОМПЛЕКТ ПОРШНЕЙ 11194 (", [["Штрихкод для маркетплейсов", "0"], ["Тип продукта", "комплект поршней"]], "LADA Kalina 16-клапанный двигатель"],
 ["p6", "rashod", "Nissan", "Кольцо стопорное Nissan 0092213500", "0092213500", 172, 0, 15, 0, "—", "Крепежные элементы", "12 мес", "Оригинал", 96, "Кольцо стопорное Nissan 0092213500", [["Тип продукта", "стопор"]], ""],
 ["p7", "rashod", "Nissan", "Саморез Nissan 0145100Q0M", "0145100Q0M", 134, 0, 8, 0, "—", "Крепежные элементы", "24 мес", "Оригинал", 92, "Саморез Nissan 0145100Q0M", [["Тип продукта", "саморез"]], "Nissan New Almera (G15RA); Nissan Terrano (D10)"],
 ["p8", "rashod", "Сызрань-Пластик", "Пистон обивки потолка Сызрань-пластик 21035004028", "21035004028", 2, 0, 0, 3, "—", "Крепежные элементы", "12 мес", "Аналог", 88, "Новая запасная часть, соответствующая оригиналу, установленному на автомобиле. Выполнена из высококачественных материалов.", [["Тип продукта", "пистон"]], "Lada 2103"],
 ["p9", "rashod", "Nissan", "Болт Nissan 876N91LB5A", "876N91LB5A", 275, 0, 6, 0, "—", "Крепежные элементы", "12 мес", "Оригинал", 84, "Болт Nissan 876N91LB5A", [["Тип продукта", "болт"]], ""],
 ["p10", "rashod", "LADA", "Крышка задней левой опоры рейлинга для LADA Vesta LADA 8450038062", "8450038062", 823, 0, 0, 3, "Задняя левая", "Пробки, крышки и заглушки", "24 мес", "Оригинал", 80, "Пластмассовый", [["Тип продукта", "крышка"]], "LADA VESTA"],
 ["p11", "podvesk", "CTR", "Стойка стабилизатора переднего правая левая CTR CLSU4", "CLSU4", 1972, 0, 6, 0, "Передняя левая правая", "Стойки стабилизатора", "12 мес", "Аналог", 96, "Предназначение амортизационной стойки – удержать вес автомобиля передать силу сцепления с дорогой кузову автотранспортного средства поддержать нужное положение кузова относительно колёс.", [["Тип продукта", "стойка стабилизатора"]], "SUBARU OUTBACK 10- FR"],
 ["p12", "podvesk", "MARSHALL", "Амортизатор задний MARSHALL M8011610", "M8011610", 2519, 0, 2, 0, "Задняя", "Амортизаторы подвески", "24 мес", "Аналог", 92, "Амортизатор — устройство для гашения колебаний (демпфирования) и поглощения толчков и ударов подвижных элементов (подвески, колёс), а также корпуса самого транспортного средства, посредством превращения механической энергии движения (колеба", [["Тип продукта", "амортизатор"]], "VAG Octavia Combi I 98-/Roomster 06-/Bora Variant 99-/Golf IV Variant 99- (M8011610)"],
 ["p13", "podvesk", "LECAR", "Стойка стабилизатора LECAR LECAR000727802", "LECAR000727802", 464, 0, 12, 0, "—", "Стойки стабилизатора", "12 мес", "Оригинал", 88, "<p><b>Стойка стабилизатора</b> — это элемент подвески, предназначенный для передачи усилия от стабилизатора поперечной устойчивости к элементам подвески автомобиля. Обеспечивает снижение кренов кузова при поворотах и поддержание устойчивост", [["Размер резьбы 2", "M10x1.25"], ["Размер резьбы 1", "M10x1.25"], ["Тип крепления", "шаровой шарнир с резьбовым пальцем"], ["Длина, мм", "150"], ["Ось установки", "задняя"]], "Mazda CX-5 11-"],
 ["p14", "podvesk", "TRIALLI", "Амортизатор задний газовый TRIALLI AG 08515", "AG 08515", 2640, 3010, 0, 3, "Задняя", "Амортизаторы подвески", "12 мес", "Аналог", 84, "Амортизаторы Trialli представлены двумя линейками продукции: серия linea Qualita – масляные двухтрубные амортизаторы, серия linea Superiore - масляные двухтрубные амортизаторы с газовым подпором низкого давления. Амортизаторы Trialli произв", [["Комплектация", "гайка крепежная-1; амортизатор задний-1; шарни"], ["Размер резьбы штока, мм", "m10x1.25"], ["Ось (сторона установки)", "сзади, слева/справа"], ["Серия", "black"], ["Резьба штока", "M10x1.25"]], "KIA PICANTO (BA) 1.0 2004 - н.в. KIA PICANTO (BA) 1.1 2004 - н.в. KIA PICANTO (BA) 1.1 CRDi 2005 - н.в."],
 ["p15", "podvesk", "TRT", "Тяга стабилизатора п TRT R4078F", "R4078F", 733, 836, 24, 0, "—", "Стойки стабилизатора", "12 мес", "Аналог", 80, "Тяга стабилизатора п TRT R4078F", [["Тип продукта", "стойка стабилизатора"]], "Toyota Avensis T27 09-, Rav-4 05-, Auris 06-"],
 ["p16", "kuzov", "RIVAL", "Защита топливного бака AL 6MM SKID PLATE FOR Toyota HILUX REVO FUEL TANK 2.7, 2.4TD, 2.8", "2333950516", 28015, 0, 2, 0, "—", "Защиты картера и КПП", "6 мес", "Аналог", 96, "Защита топливного бака Rival для Toyota Hilux VIII (V - 2.4D 2.8D) 4WD 2015-2018/Toyota Hilux VIII рестайлинг (V - 2.8D) 4WD 2018-2020 2020-н.в., штампованная, алюминий 6 мм, с крепежом, 2333.9505.1.6 Защита топливного бака Rival подходит д", [["Тип продукта", "Защита картера и КПП"]], "Toyota Hilux VIII (V - 2.4D; 2.8D) 4WD 2015-2018/Toyota Hilux VIII рестайлинг (V - 2.8D) 4WD 2018-2020 2020-н.в."],
 ["p17", "kuzov", "O.E.M.", "Подкрылок задний левый Toyota Camry 7 XV50 фетровые, 2011-2014,", "OEM0027PKZL", 1400, 0, 3, 0, "Задняя левая", "Подкрылки", "12 мес", "Аналог", 92, "Характеристики: 2011-2014 фетровые Китай Дополнительные оригинальные номера: 6563833050 Данная запчасть устанавливается на модельный ряд автомобилей следующих годов выпуска: 2011 2012 2013 2014 2015 2016 2017 2018 Номер ОЕМ: OEM0027PKZL Сос", [["Ось установки", "задняя"], ["Сторона установки", "левая"], ["Материал полотна", "пластик"], ["Тип продукта", "Подкрылок"]], "Toyota Camry 2011 - 2018"],
 ["p18", "kuzov", "LADA", "Петля капота левая в сборе LADA 8450008287", "8450008287", 1371, 0, 12, 0, "левая", "Петли капота", "12 мес", "Оригинал", 88, "ШАРНИР Л КАПОТА", [["Тип продукта", "капот"]], "LADA VESTA"],
 ["p19", "kuzov", "RIVAL", "Защита картера КПП и РК PORSCHE Cayenne III 17- алюминий 4мм RIVAL", "K33346151", 78140, 0, 4, 0, "—", "Защиты картера и КПП", "12 мес", "Аналог", 84, "Защита картера, КПП и РК Rival (черная) для Porsche Cayenne III (V - 2.9T (440 л.с.) 3.0 (340 л.с.) 4.0T (550 л.с.)) 2017-н.в., штампованная, алюминий 4 мм, с крепежом, 3 части, K333.4615.1 Защита картера, КПП и РК Rival подходит для: Porsc", [["Материал", "алюминий"], ["Тип продукта", "Защита картера и КПП"]], "Porsche Cayenne III (V - 2.9T (440 л.с.); 3.0 (340 л.с.); 4.0T (550 л.с.)) 2017-н.в."],
 ["p20", "kuzov", "LADA", "Облицовка перед бампера лев в LADA 21920280305100", "21920280305100", 854, 0, 12, 0, "левая", "Бамперы", "12 мес", "Оригинал", 80, "Облицовка предназначена для увеличения привлекательности авто и придания ему определенного стиля; в качестве защиты от механических повреждений и воздействия солнечных лучей; для повышения общей эстетики интерьера.", [["Тип продукта", "бампер передний"]], "LADA Kalina II"],
 ["p21", "elektr", "STARTVOLT", "Регулятор напряжения генератора STARTVOLT VRR08L5", "VRR08L5", 2261, 0, 0, 4, "—", "Комплектующие генератора", "24 мес", "Аналог", 96, "Регуляторы напряжение генератора работает в составе генератора - основного элемента электропитания авто. Регулятор измеряет напряжение бортовой сети и отключает возбуждение генератора в момент достижения бортовой сети напряжения 14,2-14,6 В", [["Штрихкод для маркетплейсов", "0"]], "Hyundai Solaris (10-)/KIA Rio (11-) 1.4i/1.6i"],
 ["p22", "elektr", "AIRLINE", "Предохранители мини 15A в пакете AFU-M-15 AIRLINE AFUM15", "AFUM15", 191, 218, 24, 0, "—", "Предохранители и реле", "6 мес", "Аналог", 92, "Предохранитель представляет собой эффективное средство защиты автомобиля от короткого замыкания. Набор предохранителей служит для защиты электропроводки автотранспорта от перегорания.", [["Тип продукта", "Комплект предохранителей"]], "Универсальный товар"],
 ["p23", "elektr", "PORSCHE", "Аккумулятор PORSCHE обратная полярность 60 Ач 580 А 12 В 9Y0915107RY", "9Y0915107RY", 248060, 0, 3, 0, "—", "АКБ", "12 мес", "Аналог", 88, "Автомобильный аккумулятор — тип электрической аккумуляторной батареи, применяемый на автомобильном или мототранспорте. Используется в качестве вспомогательного источника электроэнергии в бортовой сети при неработающем двигателе и для запуск", [["Тип продукта", "аккумулятор"], ["Полярность", "обратная"], ["Тип корпуса", "европейский"], ["Емкость, Ач", "60"], ["Пусковой ток, А", "580"]], "универсальный товар"],
 ["p24", "elektr", "MASUMA", "Лямбда-зонд TOYOTA 4RUNNER/LC PRADO", "MOE1008", 2543, 0, 12, 0, "—", "Датчики кислородные", "12 мес", "Аналог", 84, "Лямбда-зонд TOYOTA 4RUNNER/LC PRADO", [["Тип продукта", "датчик кислорода"]], ""],
 ["p25", "elektr", "AVS", "Щетка стеклоочистителя бескаркасная 25/630 мм Maximal Line 10 адаптеpов AVS A07784S", "A07784S", 288, 0, 0, 3, "—", "Щетки стеклоочистителей", "12 мес", "Аналог", 80, "Стеклоочистители Maximal Line подходят более чем на 98% автомобилей, доступных на Российском рынке. Использование современных технологий и высококачественных материалов обеспечивает высочайшее качество. Аэродинамическая конструкция обеспечи", [["Серия", "Maximal Line"], ["Количество в упаковке, шт", "1"], ["Материал напыления рабочей кромки", "графитовое"], ["Индикатор износа", "нет"], ["Тип продукта", "щетка стеклоочистителя"]], "универсальнаый товар"],
 ["p26", "tormoz", "MASUMA", "Шланг тормозной передний MASUMA BH-223", "BH-223", 1211, 0, 12, 0, "Передняя", "Тормозные шланги и трубки", "12 мес", "Аналог", 96, "Masuma — крупный мировой бренд качественных и надёжных запчастей для автомобилей, который специализируется на деталях для дополнительного обслуживания техники после окончания гарантийного срока. Компания предлагает широкий ассортимент: от х", [["Длина, мм", "510"], ["Тип продукта", "шланг тормозной"], ["Сторона установки", "передняя"]], "Toyota Chaser"],
 ["p27", "tormoz", "CHERY", "Тормозные колодки ручного тормоза CHERY M113502210", "M113502210", 1477, 1684, 4, 0, "—", "Колодки тормозные", "12 мес", "Аналог", 92, "В компании CHERRY работает около 400 человек на производственных предприятиях и в корпоративных филиалах в Германии, Франции, Великобритании, Китае и США. Компания CHERRY, основанная в 1953 году, олицетворяет немецкое качество продукции, ра", [["Сторона установки", "задняя ось"], ["Количество тормозных колодок", "4"], ["Тип продукта", "тормозные колодки"], ["Тип", "барабанные"], ["Материал", "полуметаллические"]], "Chery Indis (11-13)/ M11/M12 (10-13)"],
 ["p28", "tormoz", "TRW", "Диск тормозной передний TRW DF6108S", "DF6108S", 4501, 0, 5, 0, "Передняя", "Диски тормозные", "12 мес", "Аналог", 88, "Тормозной диск - это часть гидравлического тормозного узла, представляющая собой диск из металла, который крутится вместе с колесом и с такой же скоростью и прижимается тормозными колодками при нажатии на педаль тормоза водителем автомобиля", [["Толщина диска, мм", "28"], ["Тип диска", "вентилируемые"], ["Тип продукта", "диск тормозной"], ["Расположение", "передний"]], "HYUNDAI ix35, Sonata V, Tucson; KIA Sportage"],
 ["p29", "tormoz", "MASUMA", "Шланг тормозной задний MASUMA BH-243", "BH-243", 819, 0, 3, 0, "Задняя", "Тормозные шланги и трубки", "12 мес", "Аналог", 84, "Тормозные шланги Masuma состоят из трёх слоев: внутренней герметичной химически стойкой трубки (мембраны), двухслойной капроновой оплётки для удержания высокого давления и наружной резиновой оболочки с продольной меткой, позволяющей визуаль", [["Длина, мм", "340"], ["Тип продукта", "шланг тормозной"], ["Сторона установки", "задняя"]], "Toyota Land Cruiser"],
 ["p30", "tormoz", "K&K", "Шланг тормозной VW Touareg 7P5,7P6 2010- задний K&K FT0360", "FT0360", 747, 0, 12, 0, "Задняя", "Тормозные шланги и трубки", "24 мес", "Аналог", 80, "Шланг тормозной VW Touareg 7P5,7P6 2010- задний K&K FT0360", [["Тип продукта", "шланг тормозной"], ["Сторона установки", "задняя"]], ""],
 ["p31", "instr", "Сервис ключ", "Набор ключей комбинированных 6 предметов Индия Сервис ключ 70011", "70011", 454, 0, 0, 4, "—", "Ключи гаечные", "12 мес", "Аналог", 96, "Набор ключей 6 предметов (8, 10, 12, 13, 14, 17 мм) ИНДИЯ. Хром-ванадиевая сталь 31. При помощи набора можно без труда работать с типовыми размерами шестигранного крепежа. Прочная сталь и надежное защитное покрытие обеспечивают длинный срок", [["Тип продукта", "Набор ключей"]], "Универсальный товар"],
 ["p32", "instr", "ROSSVIK", "Головка глубокая 1/2 15 мм 6 гр. ROSSVIK ROSSVIK SD061215", "SD061215", 151, 0, 15, 0, "—", "Головки торцевые", "12 мес", "Аналог", 92, "Головка глубокая-инструмент для работы с разнообразным крепежом (в основном с болтами и гайками).", [["Тип продукта", "Головка торцевая"]], "Универсальное"],
 ["p33", "instr", "Русский Мастер", "Круг шлифовальный лепестковый торцевой Р 40 125 х 22 мм Русский мастер Русский Мастер PM", "PM90320", 125, 0, 8, 0, "—", "Абразивы", "6 мес", "Аналог", 88, "Лепестковые круги веполнены в форме тарелки, из абразивных полосок на тканевой основе. Абразивное зерно- оксид циркония. Основание тарелки изготовлено из стекловолокна. Благодаря веерному расположению лепестков, достигается высокая эластичн", [["Тип продукта", "Круг шлифовальный"]], "Инструменты"],
 ["p34", "instr", "AIRLINE", "Домкрат подкатной AIRLINE AJ23F350PK 2,3т. 140-350мм. со штоком", "AJ23F350PK", 5108, 0, 4, 0, "—", "Домкраты", "6 мес", "Аналог", 84, "Домкрат с улучшенными тех.характеристиками: повышенной грузоподъемности (2,3 т) и повышенным уровнем подъема грузов (350 мм.) В домкрате используется морозостойкое масло. Домкрат снабжен ремкомплектом поршневых колец и пластиковым кейсом дл", [["Количество в упаковке, шт", "1"], ["Вид упаковки", "кейс"], ["Вес", "9560"], ["Высота подъема, мм", "350"], ["Грузоподъемность, т", "2,3"]], "Универсальный товар"],
 ["p35", "instr", "SPARTA", "Скребок 51 мм, фиксированное лезвие SPARTA 795405", "795405", 67, 76, 0, 3, "—", "Ручной инструмент", "6 мес", "Аналог", 80, "Скребок Sparta 795405 с фиксированным лезвием шириной 51 мм — приспособление для удаления со стеклянных, керамических и других гладких поверхностей загрязнений, остатков лакокрасочных покрытий и строительных смесей. Его используют для ремон", [["Тип лезвия", "фиксированное"], ["Материал рукоятки", "пластик"], ["Ширина лезвия, мм", "51"]], "Универсальный товар"],
 ["p36", "kpp", "Автодетальсервис", "Цилиндр сцепления главный АДС 42000496284000175 Автодетальсервис 42000496284000175", "42000496284000175", 2538, 0, 8, 0, "—", "Главные цилиндры сцепления", "6 мес", "Аналог", 96, "Главный цилиндр сцепления (ГЦС) — узел гидравлического привода включения и выключения сцепления трансмиссий с ручным управлением (механических коробок передач); гидравлический цилиндр, преобразующий усилие от ноги водителя в давление рабоче", [["Штрихкод для маркетплейсов", "0"], ["Тип продукта", "Цилиндр сцепления главный"]], "Г-3302(Бизнес)"],
 ["p37", "kpp", "Riginal", "Блок шестерен Riginal RG31101701310", "RG31101701310", 7148, 0, 0, 2, "—", "Шестерни КПП", "12 мес", "Аналог", 92, "Riginal представляет на автомобильном рынке обширный ассортимент, насчитывающий более 4000 позиций, обеспечивая миллионы покупателей качественными товарами. Продукция производится на заводах и собственном сборочном предприятии по трём напра", [["Штрихкод для маркетплейсов", "0"]], "ГАЗ 3110,31105, 3302 дв.Cummins (35 зубов)"],
 ["p38", "kpp", "TRIALLI", "Привод для автомобилей передний правый TRIALLI AR 0811", "AR 0811", 10967, 0, 2, 0, "Передняя правая", "Приводы колес", "24 мес", "Аналог", 88, "Передний привод — это тип трансмиссии, при котором усилие от двигателя передается только на передние колеса, которые одновременно являются управляемыми, т.е. поворачиваются с помощью рулевого механизма.", [["Комплектация", "гарантийный талон-1; гайка-1шт; количество зуб"], ["Внешнее зубчатое соединение со сто", "27"], ["Внешнее зубчатое соединение со сто", "25"], ["Тип КПП", "6at"], ["Серия", "black"]], "KIA RIO III (UB) 1.6 CVVT 2012 - н.в. KIA RIO III Saloon (UB) 1.6 CVVT 2012 - н.в."],
 ["p39", "kpp", "LADA", "Подшипник выжимной", "30", 1491, 0, 24, 0, "—", "Подшипники выжимные", "6 мес", "Оригинал", 84, "Подшипник выжимной", [["Тип продукта", "подшипник"]], ""],
 ["p40", "kpp", "LADA", "Дифференциал переднего моста в сборе LADA 21800230301020", "21800230301020", 4807, 0, 8, 0, "Передняя", "Дифференциалы", "12 мес", "Оригинал", 80, "узловая деталь", [["Тип продукта", "дифференциал"]], "LADA GRANTA / LADA LARGUS / LADA VESTA / LADA X-RAY"],
 ["p41", "svet", "LECAR", "Лампа автомобильная светодиодная 1156/1157, 1 диод, BAU15s, 3 Вт,", "LECAR000471301", 166, 0, 15, 0, "—", "Лампы автомобильные", "12 мес", "Оригинал", 96, "Лампы головного освещения предназначены для езды в тёмное время суток. Сигнальные лампы используют, чтобы обозначать на дороге автомобиль и его манёвры.", [["Количество светодиодов", "1"], ["Тип продукта", "Лампа автомобильная"], ["Вид лампы", "светодиодная"], ["Монтажный цоколь", "BAU15s"], ["Мощность лампы, Вт", "3"]], "Универсальный товар"],
 ["p42", "svet", "SkyWay", "Лампа автомобильная диодная T5 W1,2W, 12V SkyWay S08201382", "S08201382", 9, 0, 2, 0, "—", "Лампы автомобильные", "24 мес", "Аналог", 92, "Светодиодные лампы являются долговечным и наиболее практичным источником света. Лампа отличается от обычных более длительным сроком службы за счет качественной пайки элементов, ярким освещением. Данная модель сделана из экологически чистого", [["Тип продукта", "автолампа"], ["Вид лампы", "светодиодная"]], "Универсальный товар"],
 ["p43", "svet", "KRAFT", "Лампа 12V SV8,5-36 С10W освещения салона, светодиодная 2 диода LED White KRAFT KT700058", "KT700058", 232, 0, 0, 3, "—", "Лампы автомобильные", "12 мес", "Аналог", 88, "Автомобильная светодиодная белая лампа KT 700058 C10 c цоколем SV8,5 - это современная энергоэффективная и надежная альтернатива традиционным лампам накаливания. Основными преимуществами светодиодов являются: Пониженное энергопотребление и ", [["Место монтажа", "Для освещения салона"], ["Тип продукта", "автолампа"], ["Вид лампы", "светодиодная"], ["Монтажный цоколь", "SV8.5"], ["Мощность лампы, Вт", "10"]], "Универсальный товар"],
 ["p44", "svet", "LECAR", "Автомобильная лампа LECAR LECAR000071301 накаливания C5W 5Вт/12В цоколь SV8,5", "LECAR000071301", 15, 0, 4, 0, "—", "Лампы автомобильные", "6 мес", "Оригинал", 84, "<p><b>Лампа накаливания C5W</b> — 12 В/5 Вт с цоколем SV8,5, применяется в автомобильных системах освещения салона, бардачка, багажника, а также в габаритных огнях и номерных знаках. Компактная цилиндрическая форма и стандартный цоколь обес", [["Световой поток, Лм", "45±20"], ["Температура света, К", "2800"], ["Мощность, Вт", "5"], ["Источник света", "Теплый белый"], ["Тип продукта", "Лампа автомобильная"]], "Универсальный товар"],
 ["p45", "svet", "OSRAM", "Лампа автомобильная галогенная TRUCKSTAR PRO H1, 24V, 70W, 2 шт", "64155TSPHCB", 900, 0, 4, 0, "—", "Лампы автомобильные", "6 мес", "Аналог", 80, "Откройте для себя TRUCKSTAR PRO – самые яркие сигнальные лампы OSRAM для коммерческого транспорта с оптимальным соотношением цены и качества. Это идеальное решение для профессионалов: на 100% больше света по сравнению со стандартными галоге", [["Вид лампы", "Галогенная"], ["Монтажный цоколь", "P14,5S"], ["Мощность лампы, Вт", "70"], ["Типоразмер автолампы", "H1"]], "Универсальный товар"],
 ["p46", "masla", "ARNEZI", "Жидкость омывателя летняя ПЭТ бабл гам 5 л ARNEZI AR1501", "AR1501", 190, 0, 3, 0, "—", "Жидкости омывателя", "12 мес", "Аналог", 96, "Летняя жидкость стеклоомывателя AR1501 ARNEZI очищает с лобового стекла дорожную грязь и стойкие органические загрязнения: копоть, смолу, следы от мошек, птичий помет, пыльцу растений и прочий мелкий мусор. Не оставляет следов и разводов на", [["Вид упаковки", "Бутылка"], ["Тип продукта", "Жидкость стеклоомывателя"], ["Объем, л", "5"], ["Сезон использования", "лето"]], "Универсальный товар"],
 ["p47", "masla", "DEVON", "Масло моторное полусинтетическое Devon Classic 10W-40 API SG/CD 1 л", "338661356", 369, 0, 2, 0, "—", "Моторные масла", "12 мес", "Аналог", 92, "Моторные масла - масла, применяемые главным образом для снижения трения между движущимися деталями поршневых и роторных двигателей внутреннего сгорания. Все современные моторные масла состоят из базовых масел и улучшающих их свойства присад", [["Срок годности", "5 лет"], ["Тип продукта", "масло моторное"], ["Вязкость по SAE", "10W-40"], ["Основа масла", "полусинтетическое"], ["Спецификация по API", "CD"]], "универсальный товар"],
 ["p48", "masla", "AIRLINE", "Канистра пластиковая крышка с защитой от детей 10 л AIRLINE ACF10S", "ACF10S", 808, 0, 8, 0, "—", "Канистры и воронки", "12 мес", "Аналог", 88, "Канистра поможет обеспечить безопасную транспортировку и надежное хранение воспламеняющихся жидкостей, таких как бензин и масло. Канистра из пластика - самый бюджетный и легкий вариант хранения и транспортировки топлива. Изготовлена из перв", [["Объем, л", "10"], ["Цвет", "красный"], ["Тип продукта", "канистра"], ["Материал", "пластик"]], "универсальный товар"],
 ["p49", "masla", "LADA", "Масло трансмиссионное полусинтетическое в МКПП, редуктор, раздаточную коробку G-Box Expe", "8888GB47590004", 2362, 2693, 3, 0, "—", "Трансмиссионные масла", "12 мес", "Оригинал", 84, "Масло трансмиссионное полусинтетическое LADA G-Box Expert 8888GB47590004 в МКПП/Редуктор/Раздаточная коробка GL-4 75W-90 4 л обеспечивает стабильную и плавную работу коробки передач, уменьшает трение и износ шестеренок. Его формула предотвр", [["Тип ёмкости", "канистра"], ["Серия", "G-Box Expert"], ["Тип продукта", "масло трансмиссионное"], ["Тип узла", "мкпп"], ["Тип узла", "редуктор"]], "Универсальный товар"],
 ["p50", "masla", "NORD OIL", "Масло моторное полусинтетическое Nord Oil Super 10W-40 API SG/CD 4 л", "NRL038", 932, 0, 4, 0, "—", "Моторные масла", "24 мес", "Аналог", 80, "API SG/CD", [["Сезон использования", "всесезонное"], ["Тип продукта", "масло моторное"], ["Вязкость по SAE", "10W-40"], ["Основа масла", "полусинтетическое"], ["Спецификация по API", "CI-4"]], "универсальный товар"],
];
window.FITS = {"dvig": [["ALPINA", "B7 (E65) 4.4 2003 - 2008 BMW 1", "2003+", "—"], ["Lada", "2101-07", "—", "—"], ["21213", "—", "—", "—"], ["UAZ", "31512-31625", "—", "—"], ["Nissan", "Trade", "—", "—"]], "rashod": [["Nissan", "New Almera (G15RA)", "—", "—"], ["Nissan", "Terrano (D10)", "—", "—"], ["Lada", "2103", "—", "—"], ["LADA", "VESTA", "—", "—"]], "podvesk": [["SUBARU", "OUTBACK 10- FR", "—", "—"], ["VAG", "Octavia Combi I 98-/Roomster 0", "—", "—"], ["Mazda", "CX-5 11-", "—", "—"], ["KIA", "PICANTO (BA) 1.0 2004 - н.в. K", "2004+", "—"], ["Toyota", "Avensis T27 09-", "—", "—"]], "kuzov": [["Toyota", "Hilux VIII (V - 2.4D", "—", "—"], ["2.8D)", "4WD 2015-2018/Toyota Hilux VII", "2015+", "—"], ["Toyota", "Camry 2011 - 2018", "2011+", "—"], ["LADA", "VESTA", "—", "—"], ["Porsche", "Cayenne III (V - 2.9T (440 л.с", "—", "—"]], "elektr": [["Hyundai", "Solaris (10-)/KIA Rio (11-) 1.", "—", "—"], ["Универсальный", "товар", "—", "—"], ["универсальный", "товар", "—", "—"], ["универсальнаый", "товар", "—", "—"]], "tormoz": [["Toyota", "Chaser", "—", "—"], ["Chery", "Indis (11-13)/ M11/M12 (10-13)", "—", "—"], ["HYUNDAI", "ix35", "—", "—"], ["Sonata", "V", "—", "—"], ["Tucson", "—", "—", "—"]], "instr": [["Универсальный", "товар", "—", "—"], ["Универсальное", "—", "—", "—"], ["Инструменты", "—", "—", "—"]], "kpp": [["Г-3302(Бизнес)", "—", "—", "—"], ["ГАЗ", "3110", "—", "—"], ["31105", "—", "—", "—"], ["3302", "дв.Cummins (35 зубов)", "—", "—"], ["KIA", "RIO III (UB) 1.6 CVVT 2012 - н", "2012+", "—"]], "svet": [["Универсальный", "товар", "—", "—"]], "masla": [["Универсальный", "товар", "—", "—"], ["универсальный", "товар", "—", "—"]]};
window.DESC = {"dvig": "Фильтр MANN-FILTER имеет значительно большую площадь поверхности фильтровального материала по сравнению с аналогами за счет большего количества складок и их глубины. Благодаря большей поверхности материала обеспечивается лучшая грязеемкость", "rashod": "Новая запасная часть, соответствующая оригиналу, установленному на автомобиле. Выполнена из высококачественных материалов.", "podvesk": "Амортизатор — устройство для гашения колебаний (демпфирования) и поглощения толчков и ударов подвижных элементов (подвески, колёс), а также корпуса самого транспортного средства, посредством превращения механической энергии движения (колеба", "kuzov": "Защита топливного бака Rival для Toyota Hilux VIII (V - 2.4D 2.8D) 4WD 2015-2018/Toyota Hilux VIII рестайлинг (V - 2.8D) 4WD 2018-2020 2020-н.в., штампованная, алюминий 6 мм, с крепежом, 2333.9505.1.6 Защита топливного бака Rival подходит д", "elektr": "Регуляторы напряжение генератора работает в составе генератора - основного элемента электропитания авто. Регулятор измеряет напряжение бортовой сети и отключает возбуждение генератора в момент достижения бортовой сети напряжения 14,2-14,6 В", "tormoz": "Masuma — крупный мировой бренд качественных и надёжных запчастей для автомобилей, который специализируется на деталях для дополнительного обслуживания техники после окончания гарантийного срока. Компания предлагает широкий ассортимент: от х", "instr": "Набор ключей 6 предметов (8, 10, 12, 13, 14, 17 мм) ИНДИЯ. Хром-ванадиевая сталь 31. При помощи набора можно без труда работать с типовыми размерами шестигранного крепежа. Прочная сталь и надежное защитное покрытие обеспечивают длинный срок", "kpp": "Главный цилиндр сцепления (ГЦС) — узел гидравлического привода включения и выключения сцепления трансмиссий с ручным управлением (механических коробок передач); гидравлический цилиндр, преобразующий усилие от ноги водителя в давление рабоче", "svet": "Светодиодные лампы являются долговечным и наиболее практичным источником света. Лампа отличается от обычных более длительным сроком службы за счет качественной пайки элементов, ярким освещением. Данная модель сделана из экологически чистого", "masla": "Летняя жидкость стеклоомывателя AR1501 ARNEZI очищает с лобового стекла дорожную грязь и стойкие органические загрязнения: копоть, смолу, следы от мошек, птичий помет, пыльцу растений и прочий мелкий мусор. Не оставляет следов и разводов на"};
window.TIPS = {"dvig": "Сверяйте артикул и применимость по VIN — позиции раздела «Двигатель и его системы» подбираем под ваш автомобиль.", "rashod": "Сверяйте артикул и применимость по VIN — позиции раздела «Расходные материалы» подбираем под ваш автомобиль.", "podvesk": "Сверяйте артикул и применимость по VIN — позиции раздела «Подвеска» подбираем под ваш автомобиль.", "kuzov": "Сверяйте артикул и применимость по VIN — позиции раздела «Кузов автомобиля» подбираем под ваш автомобиль.", "elektr": "Сверяйте артикул и применимость по VIN — позиции раздела «Электрооборудование» подбираем под ваш автомобиль.", "tormoz": "Сверяйте артикул и применимость по VIN — позиции раздела «Тормозная система» подбираем под ваш автомобиль.", "instr": "Сверяйте артикул и применимость по VIN — позиции раздела «Инструмент» подбираем под ваш автомобиль.", "kpp": "Сверяйте артикул и применимость по VIN — позиции раздела «КПП и трансмиссия» подбираем под ваш автомобиль.", "svet": "Сверяйте артикул и применимость по VIN — позиции раздела «Автосвет» подбираем под ваш автомобиль.", "masla": "Сверяйте артикул и применимость по VIN — позиции раздела «Масла и жидкости» подбираем под ваш автомобиль."};
window.SUGGEST = ["AVS", "CTR", "K&K", "TRT", "TRW", "АКБ", "LADA", "CHERY", "DEVON", "KRAFT", "LECAR", "OSRAM", "RIVAL", "ARNEZI", "MASUMA", "Nissan", "O.E.M", "SPARTA", "SkyWay", "Поршни", "AIRLINE", "PORSCHE", "ROSSVIK", "Riginal", "TRIALLI", "Бамперы", "MARSHALL", "NORD OIL", "Абразивы", "Автосвет", "Домкраты", "Подвеска", "STARTVOLT", "Лампа 12V", "Подкрылки", "BIG FILTER", "Инструмент", "Привод для", "Скребок 51", "MANN-FILTER", "Болт Nissan", "Сервис ключ", "Набор ключей", "Петли капота", "Петля капота", "Шестерни КПП", "Блок шестерен", "Дифференциалы", "Ключи гаечные", "Крышка задней", "Пистон обивки", "Приводы колес", "Диск тормозной", "Защита картера", "Масло моторное", "Моторные масла", "Русский Мастер", "Саморез Nissan", "Скребок 51 мм", "Диски тормозные", "Масляный фильтр", "Облицовка перед", "Сызрань-Пластик", "Шланг тормозной", "Автодетальсервис", "Воздушный фильтр", "Головка глубокая", "Головки торцевые", "Кольцо стопорное", "Комплект поршней", "Кузов автомобиля", "Масла и жидкости", "Подкрылок задний", "Ремень приводной", "Фильтры масляные", "Домкрат подкатной", "Защита топливного", "КПП и трансмиссия", "Колодки тормозные", "Круг шлифовальный"];
