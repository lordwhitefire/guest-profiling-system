// TASK-009 — capture the states discovered during the click pass and merge them into the map.
// New scopes: login-help, guest-view, directory-view, guest-edit.
import fs from "node:fs";
import { attach, detach } from "/home/lordwhitefire/.agents/skills/browser-attach/scripts/attach.mjs";

const BASE = process.env.CS_BASE || "http://localhost:3100";
const OUT = "/home/lordwhitefire/current-project/guest-profiling-system-builder-bundle/developer-workspace/parity/clickability";
const mapPath = `${OUT}/map.json`;

function collectFn({ scope, route, rootSelector }) {
    const root = rootSelector ? document.querySelector(rootSelector) : document;
    if (!root) return [];
    const all = [...root.querySelectorAll("*")].filter((el) => {
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return r.width > 1 && r.height > 1 && cs.visibility !== "hidden" && cs.display !== "none";
    });
    const handlers = (el) => {
      const k = Object.getOwnPropertyNames(el).find((k) => k.startsWith("__reactProps$"));
      const p = k ? el[k] : null;
      return p
        ? Object.keys(p).filter(
            (x) => /^on(Click|Change|Submit|Input|KeyDown|MouseDown|PointerDown)$/.test(x) && typeof p[x] === "function",
          )
        : [];
    };
    const handlerSource = (el) => {
      const k = Object.getOwnPropertyNames(el).find((k) => k.startsWith("__reactProps$"));
      const p = k ? el[k] : null;
      if (!p) return "";
      for (const h of ["onClick", "onSubmit", "onChange"]) {
        if (typeof p[h] === "function") return String(p[h]).replace(/\s+/g, " ").slice(0, 220);
      }
      return "";
    };
    const roleOf = (el) => {
      const explicit = el.getAttribute("role");
      if (explicit) return explicit;
      const tag = el.tagName.toLowerCase();
      if (tag === "button") return "button";
      if (tag === "a") return el.hasAttribute("href") ? "link" : "";
      if (tag === "select") return "combobox";
      if (tag === "textarea") return "textbox";
      if (tag === "input") {
        const t = (el.getAttribute("type") || "text").toLowerCase();
        if (["checkbox", "radio", "range", "file"].includes(t)) return t;
        return t === "search" ? "searchbox" : "textbox";
      }
      if (tag === "summary") return "button";
      return "";
    };
    const nativeTags = ["button", "a", "select", "input", "textarea"];
    const interactiveRole =
      /^(button|link|menuitem|menuitemcheckbox|menuitemradio|tab|switch|checkbox|radio|combobox|textbox|searchbox|slider|spinbutton|option)$/;
    const isControl = (el) => {
      const tag = el.tagName.toLowerCase();
      if (tag === "form") return false;
      return Boolean(el.hasAttribute("href")) || handlers(el).length > 0 || nativeTags.includes(tag) || interactiveRole.test(roleOf(el));
    };
    const roots = all.filter((el) => {
      if (!isControl(el)) return false;
      let a = el.parentElement;
      while (a && a !== root) {
        if (isControl(a)) return false;
        a = a.parentElement;
      }
      return true;
    });
    const statusOf = (r) => {
      if (r.disabled) return "DISABLED";
      if (r.href) return "WIRED (href)";
      if (r.handlerKeys) return "WIRED (handler)";
      if (r.formSubmit) return "WIRED (form submit)";
      if (r.tag === "select") return "NATIVE (no effect)";
      if (r.type === "checkbox") return "NATIVE (no state wiring)";
      if (r.tag === "input" || r.tag === "textarea") return "INPUT";
      if (r.tag === "button" || interactiveRole.test(r.role)) return "DEAD (no handler)";
      return "STATIC";
    };
    const expectedOf = (r) => {
      const t = (r.label || "").toLowerCase();
      if (r.href) return `navigate to ${r.href}`;
      if (r.tag === "input" || r.tag === "textarea") return "enter/edit a value";
      if (r.tag === "select") return "change the selected option";
      if (r.type === "checkbox") return "toggle selection";
      if (/close|×/.test(t)) return "close the panel";
      if (t.includes("mailto")) return "open the mail client";
      return "perform the labelled action";
    };
    return roots.map((el, i) => {
      const tag = el.tagName.toLowerCase();
      const type = (el.getAttribute("type") || "").toLowerCase();
      const label = (
        el.innerText || el.getAttribute("aria-label") || el.getAttribute("title") || el.getAttribute("placeholder") || (el.textContent || "").trim()
      )
        .replace(/\s+/g, " ")
        .trim()
        .slice(0, 80);
      const hs = handlers(el);
      const base = {
        id: `${scope}-${i}`, route, scope, tag, type, role: roleOf(el), label,
        href: el.getAttribute("href") || "", tabIndex: el.tabIndex,
        cursor: getComputedStyle(el).cursor, handlerKeys: hs, handlerSource: handlerSource(el),
        disabled: Boolean(el.disabled) || el.getAttribute("aria-disabled") === "true",
        checked: type === "checkbox" ? Boolean(el.checked) : null,
        optionCount: tag === "select" ? el.options.length : null,
        inForm: Boolean(el.form),
        formSubmit: tag === "button" && (type === "" || type === "submit") && Boolean(el.form),
        inSidebar: false, inTopbar: false,
        hasChevron: /chevron|ellipsis|more-horizontal|more-vertical/i.test(el.innerHTML),
        cls: (typeof el.className === "string" ? el.className : "").slice(0, 100),
        visible: true,
      };
      return { ...base, status: statusOf(base), expected: expectedOf(base) };
    });
}

const browser = await attach();
const page = await browser.contexts()[0].newPage();
const login = async () => {
  const r = await page.request.post(`${BASE}/api/auth/login`, { data: { email: "admin@grandvista.test", password: "Admin123!" } });
  return r.status() === 200;
};
try {
  await login();
  const MAP = JSON.parse(fs.readFileSync(mapPath, "utf8"));
  const routes = {
    "/workspace/guest-search": [{ scope: "guest-view", open: () => page.getByRole("button", { name: /Adebola Kamal/ }).first().click({ timeout: 2500 }) }],
    "/workspace/directory": [{ scope: "directory-view", open: () => page.locator(".gps-row-action").first().click({ timeout: 2500 }) }],
    "/workspace/guest-profile": [{ scope: "guest-edit", open: () => page.getByRole("button", { name: "Edit Profile" }).first().click({ timeout: 2500 }) }],
  };
  for (const [route, states] of Object.entries(routes)) {
    await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded" });
    await page.waitForSelector("main", { timeout: 6000 }).catch(() => {});
    await page.waitForTimeout(900);
    for (const st of states) {
      try {
        await st.open();
      } catch (e) {
        console.log(`${st.scope}: could not open (${e.message.slice(0, 60)})`);
        continue;
      }
      await page.waitForTimeout(700);
      const rootCount = await page.evaluate(() => document.querySelectorAll(".gps-modal, .gps-popover").length);
      const rows = await page.evaluate(collectFn, { scope: st.scope, route, rootSelector: ".gps-modal, .gps-popover" }).catch((e) => { console.log("collect error", e.message); return []; });
      console.log(`  root .gps-modal/.gps-popover count: ${rootCount}`);
      console.log(`${route} :: ${st.scope} -> ${rows.length} controls`);
      MAP.pages.push(...rows);
    }
  }
  // Login help panel (anonymous).
  await page.context().clearCookies();
  await page.goto(`${BASE}/login`, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(1200);
  await page.getByRole("button", { name: "Forgot password?" }).click({ timeout: 2500 });
  await page.waitForTimeout(500);
  const loginRoot = await page.evaluate(() => document.querySelectorAll(".gps-login-help").length);
  console.log("login-help root count", loginRoot);
  const helpRows = await page.evaluate(collectFn, { scope: "login-help", route: "/login", rootSelector: ".gps-login-help" }).catch((e) => { console.log("help collect error", e.message); return []; });
  console.log(`/login :: login-help -> ${helpRows.length} controls`);
  MAP.pages.push(...helpRows);

  // Preserve duplicate controls: two "Edit" buttons on two rows are two rows.
  // Only remove an exact re-run of the same captured scope id.
  const seenIds = new Set();
  MAP.pages = MAP.pages.filter((r) => {
    if (!r.id) return true;
    const k = [r.route, r.scope, r.id].join("|");
    if (seenIds.has(k)) return false;
    seenIds.add(k);
    return true;
  });
  MAP.capturedStates = ["login-help", "guest-view", "directory-view", "guest-edit"];
  fs.writeFileSync(mapPath, JSON.stringify(MAP, null, 2) + "\n");
  console.log("merged into map.json; total pages:", MAP.pages.length);
} finally {
  await page.close().catch(() => {});
  await detach(browser);
}
