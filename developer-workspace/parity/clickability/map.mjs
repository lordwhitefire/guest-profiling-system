// TASK-009 — build the "supposed to be clickable" map for every page.
// Method: PROCEDURE.md in this folder. Production build only. Reuses browser-attach.
import fs from "node:fs";
import path from "node:path";
import { attach, detach, takeTabs } from "/home/lordwhitefire/.agents/skills/browser-attach/scripts/attach.mjs";

const BASE = process.env.MAP_BASE || "http://localhost:3100";
const OUT = "/home/lordwhitefire/current-project/guest-profiling-system-builder-bundle/developer-workspace/parity/clickability";
fs.mkdirSync(OUT, { recursive: true });

const WORKSPACE = [
  "dashboard", "guest-search", "directory", "guest-profile", "visit-history",
  "registration", "pms-sync", "data-requests", "audit-logs", "users",
  "tenants", "settings", "hotel-settings", "analytics", "processing", "error",
];

// Collected inside the page. `scope` limits the search to a modal/popover.
const COLLECT = ({ scope, rootSelector }) => {
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
  const interactiveRole = /^(button|link|menuitem|menuitemcheckbox|menuitemradio|tab|switch|checkbox|radio|combobox|textbox|searchbox|slider|spinbutton|option)$/;
  const isControl = (el) => {
    const tag = el.tagName.toLowerCase();
    // A <form> is a container, not a clickable control: its inputs and buttons are.
    if (tag === "form") return false;
    return (
      Boolean(el.hasAttribute("href")) ||
      handlers(el).length > 0 ||
      nativeTags.includes(tag) ||
      interactiveRole.test(roleOf(el))
    );
  };

  const roots = all.filter((el) => {
    if (!isControl(el)) return false;
    let a = el.parentElement;
    while (a && a !== root.parentElement) {
      if (isControl(a)) return false;
      a = a.parentElement;
    }
    return true;
  });

  return roots.map((el, i) => {
    const id = `${scope}-${i}`;
    el.setAttribute("data-map-id", id);
    const tag = el.tagName.toLowerCase();
    const type = (el.getAttribute("type") || "").toLowerCase();
    const label = (
      el.innerText ||
      el.getAttribute("aria-label") ||
      el.getAttribute("title") ||
      el.getAttribute("placeholder") ||
      (el.textContent || "").trim()
    )
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 80);
    const hs = handlers(el);
    const cls = typeof el.className === "string" ? el.className : "";
    return {
      id, scope, tag, type, role: roleOf(el), label,
      href: el.getAttribute("href") || "",
      tabIndex: el.tabIndex,
      cursor: getComputedStyle(el).cursor,
      handlerKeys: hs,
      handlerSource: handlerSource(el),
      disabled: Boolean(el.disabled) || el.getAttribute("aria-disabled") === "true",
      checked: type === "checkbox" ? Boolean(el.checked) : null,
      optionCount: tag === "select" ? el.options.length : null,
      inForm: Boolean(el.form),
      formSubmit: tag === "button" && (type === "" || type === "submit") && Boolean(el.form),
      inSidebar: Boolean(el.closest(".gps-sidebar")),
      inTopbar: Boolean(el.closest(".gps-topbar")),
      hasChevron: /chevron|ellipsis|more-horizontal|more-vertical/i.test(el.innerHTML),
      cls: cls.slice(0, 100),
      visible: true,
    };
  });
};

function expectedOf(r) {
  const t = (r.label || "").toLowerCase();
  if (r.expectedOverride) return r.expectedOverride;
  if (r.href) return `navigate to ${r.href}`;
  if (r.tag === "input" || r.tag === "textarea") return "enter/edit a value";
  if (r.tag === "select") return "change the selected option";
  if (r.type === "checkbox") return "toggle selection";
  if (t.includes("sign out") || t.includes("log out")) return "end the session";
  if (t.includes("save")) return "persist the change";
  if (/export|download|report/.test(t)) return "produce a file";
  if (/sync now|test connection|retry|refresh/.test(t)) return "run the operation";
  if (/cancel|close/.test(t)) return "close or reset";
  if (/add |invite|new |create/.test(t)) return "open a form";
  if (/edit|pencil/.test(t)) return "open an editor";
  if (/notification|bell/.test(t)) return "open notifications";
  if (r.hasChevron) return "open a menu";
  if (r.handlerKeys.length) return "run the handler";
  return "perform the labelled action";
}

function statusOf(r) {
  if (r.disabled) return "DISABLED";
  if (r.href) return "WIRED (href)";
  if (r.handlerKeys.length) return "WIRED (handler)";
  if (r.formSubmit) return "WIRED (form submit)";
  if (r.inForm && (r.tag === "select" || r.tag === "input" || r.tag === "textarea")) return "INPUT";
  if (r.route === "/design-system" && r.tag === "button") return "STATIC (demo)";
  if (r.type === "checkbox") return "NATIVE (no state wiring)";
  if (r.tag === "select") return "NATIVE (no effect)";
  if (r.tag === "input" || r.tag === "textarea") return "INPUT";
  if (r.tag === "button" || /^(button|link|menuitem|tab|switch|checkbox|radio|combobox|textbox|searchbox|slider|spinbutton)$/.test(r.role))
    return "DEAD (no handler)";
  return "STATIC";
}

function suspiciousToast(r) {
  const s = (r.handlerSource || "").toLowerCase();
  return /toast|opened|started|queued|prepared|success|being prepared|export/.test(s);
}

const browser = await attach();
const rows = [];
const routeSummary = [];
try {
  const { ref: page } = await takeTabs(browser, ["ref"]);
  const login = async () =>
    page.request.post(`${BASE}/api/auth/login`, { data: { email: "admin@grandvista.test", password: "Admin123!" } });
  if ((await login()).status() !== 200) throw new Error("login failed");

  // Resolve a real guest id for the profile page.
  const g = await page.request.get(`${BASE}/api/guests?limit=1`);
  const gj = await g.json().catch(() => ({}));
  const guestId = gj?.data?.[0]?.guestId || gj?.guests?.[0]?.guestId || "";

  const routes = [
    { url: "/design-system", scope: "page", auth: true },
    { url: "/search", scope: "page", auth: true },
    ...WORKSPACE.map((r) => ({ url: `/workspace/${r}`, scope: "page", auth: true })),
    ...(guestId ? [{ url: `/profile/${guestId}`, scope: "page", auth: true }] : []),
    { url: "/login", scope: "page", auth: false },
  ];

  const addRows = (list) => {
    for (const r of list) {
      const row = { ...r, expected: expectedOf(r), status: statusOf(r), suspectedToast: suspiciousToast(r) };
      rows.push(row);
    }
  };

  for (const route of routes) {
    if (!route.auth) {
      await page.context().clearCookies();
    } else {
      await login();
    }
    await page.goto(`${BASE}${route.url}`, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1100);
    const finalUrl = new URL(page.url()).pathname;
    const baseRows = await page.evaluate(COLLECT, { scope: "page", rootSelector: null });
    for (const r of baseRows) r.route = route.url;
    addRows(baseRows);

    // Declared affordances that no handler scan will find.
    const contract = await page.evaluate(() => {
      const out = [];
      const add = (sel, label, expected) => {
        const el = document.querySelector(sel);
        if (!el) return;
        const r = el.getBoundingClientRect();
        if (r.width < 2 || r.height < 2) return;
        const k = Object.getOwnPropertyNames(el).find((k) => k.startsWith("__reactProps$"));
        const p = k ? el[k] : null;
        const hs = p ? Object.keys(p).filter((x) => /^on/.test(x) && typeof p[x] === "function") : [];
        out.push({
          tag: el.tagName.toLowerCase(), label, expectedOverride: expected,
          role: el.getAttribute("role") || "", href: el.getAttribute("href") || "",
          tabIndex: el.tabIndex, cursor: getComputedStyle(el).cursor, handlerKeys: hs,
          handlerSource: "", disabled: false, type: "", optionCount: null, inForm: false,
          formSubmit: false, inSidebar: true, inTopbar: false, hasChevron: true, cls: el.className,
          statusOverride: hs.length || el.hasAttribute("href") ? "WIRED" : "DEAD (contract)",
        });
      };
      add(".gps-hotel-badge", "Grand Vista Hotel + chevron", "open the hotel switcher");
      add(".gps-sidebar-user", "Admin Operator + three dots", "open the user menu");
      return out;
    }).catch(() => []);
    for (const r of contract) {
      r.route = route.url;
      rows.push({ ...r, status: r.statusOverride, expected: r.expectedOverride, source: "contract", suspectedToast: false });
    }

    routeSummary.push({ route: route.url, finalUrl, controls: baseRows.length, contract: contract.length });
    console.log(`${route.url}: ${baseRows.length} controls${contract.length ? " + " + contract.length + " contract" : ""}`);

    // Modal / popover states: the controls inside them are part of the map too.
    const states = [];
    if (route.url === "/workspace/directory") states.push({ name: "add-guest", opener: "text=Add Guest" });
    if (route.url === "/workspace/users") states.push({ name: "invite-user", opener: "text=Invite User" });
    if (route.url === "/workspace/tenants") states.push({ name: "add-hotel", opener: "text=Add Hotel" });
    if (route.url === "/workspace/data-requests") states.push({ name: "new-request", opener: "text=New Request" });
    if (route.url === "/workspace/dashboard") {
      states.push({ name: "account-menu", opener: ".gps-profile-button" });
      states.push({ name: "notifications", opener: ".gps-icon-button" });
    }
    for (const st of states) {
      const opened = await page.locator(st.opener).first().click({ timeout: 3000 }).then(() => true).catch(() => false);
      await page.waitForTimeout(600);
      if (!opened) continue;
      const scoped = await page.evaluate(COLLECT, { scope: st.name, rootSelector: ".gps-modal, .gps-popover" });
      for (const r of scoped) r.route = route.url;
      addRows(scoped);
      console.log(`  + ${st.name}: ${scoped.length} controls`);
      await page.keyboard.press("Escape").catch(() => {});
      await page.locator(".gps-modal button[aria-label], .gps-popover button").first().click({ timeout: 500 }).catch(() => {});
      if ((await page.locator(".gps-modal").count()) > 0) {
        await page.goto(`${BASE}${route.url}`, { waitUntil: "domcontentloaded" });
        await page.waitForTimeout(500);
      }
    }
  }

  // Restore auth for the next run.
  await page.context().clearCookies();
  await login();
} finally {
  await detach(browser);
}

// Dedupe the shared shell across routes.
const shell = new Map();
const pageRows = [];
for (const r of rows) {
  if (r.inSidebar || r.inTopbar) {
    const key = [r.tag, r.label, r.href, r.handlerKeys.join()].join("|");
    if (!shell.has(key)) shell.set(key, { ...r, routes: [r.route], scope: "shell" });
    else if (!shell.get(key).routes.includes(r.route)) shell.get(key).routes.push(r.route);
  } else {
    pageRows.push(r);
  }
}

const all = [...shell.values(), ...pageRows];
const counts = all.reduce((m, r) => {
  const s = r.status.split(" ")[0];
  m[s] = (m[s] || 0) + 1;
  return m;
}, {});

const md = [];
md.push("# Supposed-to-be-clickable map", "");
md.push(`Base: ${BASE} (production build)`);
md.push(`Captured: ${new Date().toISOString()}`);
md.push("");
md.push("## Counts", "", "```", JSON.stringify(counts, null, 2), "```", "");
md.push("## Shared shell", "", "| Control | Tag / role | Handlers | Expected | Status | Routes |", "|---|---|---|---|---|---|");
for (const r of shell.values()) {
  md.push(`| ${r.label || "(icon)"} | ${r.tag}${r.role ? "/" + r.role : ""} | ${r.handlerKeys.join(", ") || "—"} | ${r.expected} | **${r.status}** | ${r.routes.length} |`);
}
md.push("", "## Per-page controls", "");
let current = "";
for (const r of pageRows) {
  if (r.route !== current) {
    current = r.route;
    md.push("", `### ${r.route}`, "", "| Control | Tag / role | Handlers | Expected | Status |", "|---|---|---|---|---|");
  }
  md.push(`| ${r.label || "(icon)"} | ${r.tag}${r.role ? "/" + r.role : ""} | ${r.handlerKeys.join(", ") || "—"} | ${r.expected} | **${r.status}**${r.suspectedToast ? " (toast?)" : ""} |`);
}
md.push("", "## Route summary", "", "| Route | Final URL | Controls | Contract rows |", "|---|---|---:|---:|");
for (const r of routeSummary) md.push(`| ${r.route} | ${r.finalUrl} | ${r.controls} | ${r.contract} |`);
md.push("", "## Rows not wired to a real effect", "");
for (const r of all.filter((x) => /DEAD|NATIVE/.test(x.status))) {
  md.push(`- ${r.route || "shell"} — ${r.label || "(icon)"} — ${r.status} — expected: ${r.expected}`);
}
fs.writeFileSync(path.join(OUT, "map.json"), JSON.stringify({ counts, shell: [...shell.values()], pages: pageRows, summary: routeSummary }, null, 2) + "\n");
fs.writeFileSync(path.join(OUT, "map.md"), md.join("\n") + "\n");
console.log("\nCOUNTS", JSON.stringify(counts));
console.log("SHELL DEAD:", [...shell.values()].filter((r) => /DEAD/.test(r.status)).map((r) => r.label).join(" | "));
console.log("PAGE DEAD:");
for (const r of pageRows.filter((x) => /DEAD/.test(x.status))) console.log(`- ${r.route}: ${r.label || "(icon)"} [${r.tag}/${r.role}] ${r.status}`);
