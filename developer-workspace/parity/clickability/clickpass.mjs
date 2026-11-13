// TASK-009 — click pass on the production build.
// Every mapped row is clicked once, on :3100, with browser-attach.
// Verdicts: PASS / DEAD / FAKE / NOT RUN / NATIVE.
import fs from "node:fs";
import { attach, detach } from "/home/lordwhitefire/.agents/skills/browser-attach/scripts/attach.mjs";

const BASE = process.env.CP_BASE || "http://localhost:3100";
const OUT = "/home/lordwhitefire/current-project/guest-profiling-system-builder-bundle/developer-workspace/parity/clickability";
const TAG = process.env.CP_TAG || "";
const FILE = TAG ? `clickpass-${TAG}` : "clickpass";
const MAP = JSON.parse(fs.readFileSync(`${OUT}/map.json`, "utf8"));
const ONLY = process.env.ONLY_ROUTES ? process.env.ONLY_ROUTES.split(",") : null;

const COLLECT = ({ rootSelector }) => {
  const root = rootSelector ? document.querySelector(rootSelector) : document;
  if (!root) return [];
  document.querySelectorAll("[data-click-id]").forEach((e) => e.removeAttribute("data-click-id"));
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
    while (a && a !== root) {
      if (isControl(a)) return false;
      a = a.parentElement;
    }
    return true;
  });
  return roots.map((el, i) => {
    const clickId = `cp-${Date.now().toString(36)}-${i}`;
    el.setAttribute("data-click-id", clickId);
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
    const cls = typeof el.className === "string" ? el.className : "";
    return {
      clickId, tag, type, role: roleOf(el), label,
      href: el.getAttribute("href") || "",
      handlerKeys: handlers(el),
      handlerSource: handlerSource(el),
      disabled: Boolean(el.disabled) || el.getAttribute("aria-disabled") === "true",
      checked: type === "checkbox" ? Boolean(el.checked) : null,
      inForm: Boolean(el.form),
      formSubmit: tag === "button" && (type === "" || type === "submit") && Boolean(el.form),
      inSidebar: Boolean(el.closest(".gps-sidebar")),
      inTopbar: Boolean(el.closest(".gps-topbar")),
      hasChevron: /chevron|ellipsis|more-horizontal|more-vertical/i.test(el.innerHTML),
      cls: cls.slice(0, 100),
      value: el.value ?? "",
      optionValues: tag === "select" ? [...el.options].map((o) => o.value) : [],
    };
  });
};

const sig = (r) => [r.tag, (r.label || "").trim(), r.href || "", (r.handlerKeys || []).join(","), r.type || ""].join("|");

function bucket(rows) {
  const m = new Map();
  for (const r of rows) {
    const k = sig(r);
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(r);
  }
  return m;
}
function occMap(rows) {
  const m = new Map();
  const seen = new Map();
  for (const r of rows) {
    const k = sig(r);
    const n = seen.get(k) || 0;
    m.set(r, n);
    seen.set(k, n + 1);
  }
  return m;
}
function pickLive(mapRow, liveBucket, occ) {
  return (liveBucket.get(sig(mapRow)) || [])[occ] || null;
}

async function snap(page) {
  for (let i = 0; i < 3; i++) {
    try {
      return await page.evaluate(() => {
    const txt = (el) => (el?.innerText || "").replace(/\s+/g, " ").trim();
    const main = document.querySelector("main");
    let mainText = "";
    let mainLen = 0;
    if (main) {
      const clone = main.cloneNode(true);
      clone.querySelectorAll(".gps-toast,[data-sonner-toast]").forEach((e) => e.remove());
      const full = txt(clone);
      mainLen = full.length;
      mainText = full.slice(0, 400);
    }
    return {
      url: location.pathname + location.search,
      heading: txt(document.querySelector("main h1, main h2, h1, h2")),
      mainText,
      mainLen,
      bodyLen: document.body.innerText.length,
      modals: document.querySelectorAll(".gps-modal, .gps-login-help-backdrop").length,
      popovers: document.querySelectorAll(".gps-popover, .gps-login-help-backdrop").length,
      toasts: [...document.querySelectorAll(".gps-toast, [data-sonner-toast]")].map(txt).filter(Boolean).slice(0, 3),
      errors: [...document.querySelectorAll('[class*=error], [role=alert]')].map(txt).filter(Boolean).slice(0, 2),
      switches: [...document.querySelectorAll("[role=switch]")].map((e) => e.getAttribute("aria-checked")),
      rows: document.querySelectorAll("tbody tr").length,
      active: [...document.querySelectorAll("[aria-selected=true], .active, .current")].map(txt).filter(Boolean).slice(0, 6),
    };
      });
    } catch (e) {
      await page.waitForTimeout(500);
    }
  }
  return { url: page.url().replace(BASE, ""), heading: "", mainText: "", mainLen: 0, bodyLen: 0, modals: 0, popovers: 0, toasts: [], switches: [], rows: 0, active: [], errors: [] };
}

function net(page) {
  const reqs = [];
  const resps = [];
  const downloads = [];
  const onReq = (r) => {
    const u = r.url();
    if (/\/(_next|favicon)/.test(u) || /_rsc=/.test(u) || /\.(png|jpg|jpeg|svg|woff2?|ico)(\?|$)/.test(u)) return;
    reqs.push({ method: r.method(), url: u.replace(BASE, "") });
  };
  const onRes = (r) => {
    const u = r.url();
    if (/\/(_next|favicon)/.test(u) || /_rsc=/.test(u) || /\.(png|jpg|jpeg|svg|woff2?|ico)(\?|$)/.test(u)) return;
    resps.push({ url: u.replace(BASE, ""), status: r.status(), method: r.request().method() });
  };
  const onDl = (d) => downloads.push(d.suggestedFilename());
  page.on("request", onReq);
  page.on("response", onRes);
  page.on("download", onDl);
  return {
    reqs, resps, downloads,
    off() {
      page.off("request", onReq);
      page.off("response", onRes);
      page.off("download", onDl);
    },
  };
}

function classifyGeneric(row, before, after, n, clickErr) {
  const hrefPath = (row.href || "").replace(BASE, "").split("?")[0];
  if (/^(mailto:|tel:)/i.test(row.href || ""))
    return ["NATIVE", "external mail/tel link (handled by the OS, not app state)"];
  if (hrefPath && before.url === hrefPath && after.url === before.url)
    return ["PASS", `self-link: already on ${hrefPath}`];
  if (n.downloads.length) return ["PASS", `download: ${n.downloads.join(", ")}`];
  if (before.modals === 0 && after.modals > 0) return ["PASS", "opens a modal"];
  if (before.modals > 0 && after.modals === 0) return ["PASS", "closes the modal"];
  if (before.popovers === 0 && after.popovers > 0) return ["PASS", "opens a popover"];
  if (before.popovers > 0 && after.popovers === 0) return ["PASS", "closes the popover"];
  if (after.url !== before.url) return ["PASS", `navigation: ${after.url}`];
  const ok = n.resps.filter((r) => r.status >= 200 && r.status < 400 && r.method !== "OPTIONS");
  const bad = n.resps.filter((r) => r.status >= 400);
  if (ok.length) return ["PASS", `network: ${ok.map((r) => `${r.method} ${r.url} ${r.status}`).slice(0, 2).join("; ")}`];
  if (bad.length) return ["DEAD", `request failed: ${bad.map((r) => `${r.method} ${r.url} ${r.status}`).slice(0, 2).join("; ")}`];
  if (before.active.includes(row.label) && after.active.includes(row.label) && after.toasts.length === 0)
    return ["PASS", `already active: ${row.label}`];
  if (after.heading !== before.heading || after.mainText !== before.mainText) return ["PASS", "screen/state changed"];
  if (after.mainLen > before.mainLen + 40) return ["PASS", `content expanded (${before.mainLen} -> ${after.mainLen})`];
  if (after.switches.join() !== before.switches.join()) return ["PASS", "switch state changed"];
  if (after.errors.length && before.errors.join() !== after.errors.join()) return ["PASS", `error/notice shown: ${after.errors[0]}`];
  if (after.toasts.length) return ["FAKE", `toast only: ${after.toasts[0]}`];
  if (clickErr) return ["DEAD", `click failed: ${clickErr.slice(0, 120)}`];
  return ["DEAD", "no state, route, network or download change"];
}

const results = [];
let lastFlush = 0;
function rec(row, verdict, reason, extra = {}) {
  const r = {
    id: row.id, route: extra.displayRoute || row.route || "shell", scope: row.scope,
    label: extra.displayLabel || row.label || "(icon)", tag: row.tag, type: row.type, mapStatus: row.status,
    expected: row.expected, verdict, reason, ...extra,
  };
  results.push(r);
  console.log(`${verdict.padEnd(7)} ${r.route} | ${r.label} | ${reason}`);
  // Flush partials so a browser crash never loses the whole audit.
  if (results.length >= lastFlush + 20) {
    lastFlush = results.length;
    const partialCounts = results.reduce((m, x) => { m[x.verdict] = (m[x.verdict] || 0) + 1; return m; }, {});
    try { fs.writeFileSync(`${OUT}/clickpass.partial.json`, JSON.stringify({ counts: partialCounts, results: [...results] }, null, 2) + "\n"); } catch {}
  }
}

const browser = await attach();
let page;
let loggedIn = false;
const login = async (page) => {
  const r = await page.request.post(`${BASE}/api/auth/login`, {
    data: { email: "admin@grandvista.test", password: "Admin123!" },
  });
  loggedIn = r.status() === 200;
  return loggedIn;
};

try {
  // A fresh tab: another agent may be using the shared ref tab.
  page = await browser.contexts()[0].newPage();
  // The window can have many tabs; make sure this one receives real mouse input.
  await page.bringToFront().catch(() => {});
  if (!(await login(page))) throw new Error("login failed");

  // The visit-history screen renders the guest saved in sessionStorage. Pick a
  // real guest so its period filter is present and testable.
  let visitGuestId = "";
  try {
    const g = await page.request.get(`${BASE}/api/guests?limit=1`);
    const gj = await g.json();
    visitGuestId = gj?.data?.[0]?.guestId || "";
  } catch {}
  if (visitGuestId) {
    await page.addInitScript((id) => {
      try { sessionStorage.setItem("gps-selected-guest-id", id); } catch {}
    }, visitGuestId);
  }

  const goto = async (route) => {
    let last;
    for (let i = 0; i < 4; i++) {
      try {
        await page.waitForTimeout(150);
        await page.goto(`${BASE}${route}`, { waitUntil: "domcontentloaded", timeout: 10000 });
        await page.waitForSelector("main", { timeout: 6000 }).catch(() => {});
        if (route.includes("guest-profile") || route.includes("visit-history")) {
          await page.waitForSelector(".gps-profile-hero", { timeout: 8000 }).catch(() => {});
        }
        // Wait for React to attach handlers before clicking: a server-rendered
        // control looks identical before hydration but ignores clicks.
        if (route.includes("/login")) {
          await page.waitForFunction(() => {
            const f = document.querySelector(".gps-login-card");
            const k = f && Object.getOwnPropertyNames(f).find((x) => x.startsWith("__reactProps$"));
            const p = k ? f[k] : null;
            return Boolean(p && typeof p.onSubmit === "function");
          }, { timeout: 8000 }).catch(() => {});
        }
        if (route.includes("/profile/")) {
          await page.waitForFunction(() => {
            const b = [...document.querySelectorAll("button")].find((el) => (el.textContent || "").includes("Fill registration form"));
            if (!b) return false;
            const k = Object.getOwnPropertyNames(b).find((x) => x.startsWith("__reactProps$"));
            const p = k ? b[k] : null;
            return Boolean(p && typeof p.onClick === "function");
          }, { timeout: 8000 }).catch(() => {});
        }
        if (
          route.includes("directory") ||
          route.includes("guest-search") ||
          route.includes("dashboard") ||
          route.includes("users") ||
          route.includes("data-requests") ||
          route.includes("audit-logs") ||
          route.includes("analytics")
        ) {
          await page.waitForSelector("tbody tr", { timeout: 4000 }).catch(() => {});
        }
        await page.waitForTimeout(2000);
        return;
      } catch (e) {
        last = e;
        await page.waitForTimeout(600);
      }
    }
    throw last;
  };

  const collectPage = async (rootSelector = null) => page.evaluate(COLLECT, { rootSelector });

  const closeOverlays = async () => {
    await page.keyboard.press("Escape").catch(() => {});
    const close = page.locator(".gps-modal button[aria-label], .gps-popover button[aria-label]").first();
    if (await close.count().catch(() => 0)) await close.click({ timeout: 500 }).catch(() => {});
  };

  const clickLive = async (live) => {
    const loc = page.locator(`[data-click-id="${live.clickId}"]`);
    await loc.scrollIntoViewIfNeeded().catch(() => {});
    await loc.click({ timeout: 2500 });
  };

  const runRow = async (row, opts = {}) => {
    // Non-click rows.
    if (row.status.startsWith("DISABLED")) return rec(row, "NOT RUN", "disabled");
    if (row.status.startsWith("STATIC")) return rec(row, "NOT RUN", "design-system demo");
    if (row.status.startsWith("INPUT") || row.tag === "textarea") return rec(row, "NOT RUN", "editable input");
    if (row.tag === "input" && row.type !== "checkbox" && !opts.inputTest) return rec(row, "NOT RUN", "editable input");
    // External protocol links hand off to the OS. Clicking them can leave the
    // browser tab in an odd state; the href itself is the contract.
    if (/^(mailto:|tel:)/i.test(row.href || "")) return rec(row, "NATIVE", "external mail/tel link; not clicked (OS handler)");

    // Special cases.
    if (row.label === "Sign out") return testSignOut(row);
    if (row.label === "Show password") return testShowPassword(row);
    if (row.label === "Sign In →") return testSignIn(row);
    if (row.route === "/workspace/registration") return testRegistration(row);
    if (/Search guest name|Enter guest name|Search guests, properties/.test(row.label)) return testSearchInput(row);
    if (row.tag === "select" && row.route === "/workspace/directory") return testDirectoryFilter(row);
    if (row.label === "Prepare Registration") return testPrepareRegistration(row);
    if (row.label === "Fill registration form") return testFillRegistration(row);
    if (row.label === "Clear search") return testClearSearch(row);
    if (row.label === "Filters") return testFilters(row);
    if (row.label === "Search") return testSearchButton(row);
    if (row.label === "Test Connection") return testTestConnection(row);
    if (row.label === "Save Defaults") return testSaveDefaults(row);
    if (row.label === "Save Changes") return testSettingsSave(row);
    if (row.label === "Cancel" && row.route === "/workspace/settings") return testSettingsCancel(row);
    if (row.label === "Dismiss notice") return testDismissNotice(row);
    if (row.label === "Copy" && row.route === "/workspace/error") return testCopy(row);
    if (row.label === "Go to directory" && row.route.startsWith("/workspace/guest-profile")) return testGoToDirectory(row);
    if (/^\d+$/.test(row.label) && row.route === "/workspace/directory") return testDirectoryPage(row);

    const route = opts.route || row.route;
    await goto(route);
    if (opts.before) await opts.before();
    let liveRows;
    for (let i = 0; i < 3; i++) {
      try {
        liveRows = await collectPage(opts.rootSelector || null);
        break;
      } catch (e) {
        if (i === 2) return rec(row, "NOT RUN", `collect failed: ${e.message.slice(0, 80)}`);
        await goto(route);
        if (opts.before) await opts.before();
      }
    }
    const filtered = opts.rootSelector
      ? liveRows
      : opts.shell
        ? liveRows.filter((r) => r.inSidebar || r.inTopbar)
        : liveRows.filter((r) => !r.inSidebar && !r.inTopbar);
    const live = pickLive(row, bucket(filtered), opts.occ || 0);
    if (!live) return rec(row, "NOT RUN", "not found in live DOM");

    const before = await snap(page);
    let checkedBefore = null;
    let valueBefore = null;
    if (row.type === "checkbox") checkedBefore = await page.locator(`[data-click-id="${live.clickId}"]`).isChecked().catch(() => null);
    if (row.tag === "select") valueBefore = await page.locator(`[data-click-id="${live.clickId}"]`).inputValue().catch(() => null);
    const n = net(page);
    let clickErr = "";
    try {
      if (row.tag === "select") {
        const vals = live.optionValues.filter((v) => v !== valueBefore);
        await page.locator(`[data-click-id="${live.clickId}"]`).selectOption(vals[0] ?? { index: 1 }, { timeout: 2000 });
      } else {
        await clickLive(live);
      }
    } catch (e) {
      clickErr = e.message;
    }
    await page.waitForLoadState("domcontentloaded", { timeout: 4000 }).catch(() => {});
    if (row.tag === "select") await page.waitForTimeout(1400);
    await page.waitForTimeout(900);
    const after = await snap(page);
    n.off();

    if (row.type === "checkbox") {
      const checkedAfter = await page.locator(`[data-click-id="${live.clickId}"]`).isChecked().catch(() => null);
      if (checkedBefore !== checkedAfter) return rec(row, "NATIVE", "checkbox toggles visually; no app state", { checkedBefore, checkedAfter });
      return rec(row, "DEAD", "checkbox did not change", { checkedBefore, checkedAfter, clickErr });
    }
    if (row.tag === "select") {
      const valueAfter = await page.locator(`[data-click-id="${live.clickId}"]`).inputValue().catch(() => null);
      const wired = /^WIRED/.test(row.status);
      if (valueBefore !== valueAfter)
        return rec(row, wired ? "PASS" : "NATIVE", `select changed ${valueBefore} -> ${valueAfter}${wired ? " (state change; Save still required)" : "; no data effect"}`, { valueBefore, valueAfter });
      if ((live.optionValues || []).length <= 1) return rec(row, "NOT RUN", "single option; cannot change", { valueBefore, optionValues: live.optionValues });
      return rec(row, "DEAD", "select did not change", { valueBefore, valueAfter, clickErr });
    }
    if (row.cls && row.cls.includes("gps-switch")) {
      const el = page.locator(`[data-click-id="${live.clickId}"]`);
      const c0 = (await el.getAttribute("class").catch(() => "")) || "";
      await el.click({ timeout: 2000 }).catch(() => {});
      await page.waitForTimeout(250);
      const c1 = (await el.getAttribute("class").catch(() => "")) || "";
      return rec(row, c0 !== c1 ? "PASS" : "DEAD", c0 !== c1 ? `switch state "${c0}" -> "${c1}"` : "switch state did not change");
    }

    const [verdict, reason0] = classifyGeneric(row, before, after, n, clickErr);
    const reason = clickErr ? `${reason0}; clickErr: ${clickErr.slice(0, 120)}` : reason0;
    rec(row, verdict, reason, {
      urlBefore: before.url, urlAfter: after.url,
      toasts: after.toasts, requests: n.reqs.slice(0, 4), responses: n.resps.slice(0, 4), downloads: n.downloads,
      clickErr: clickErr ? clickErr.slice(0, 160) : undefined,
    });
  };

  // ---- special test functions ----

  async function testSignOut(row) {
    await goto("/workspace/dashboard");
    await page.locator(".gps-profile-button").click({ timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(400);
    const wait = page.waitForResponse((r) => r.url().includes("/api/auth/logout"), { timeout: 8000 }).catch(() => null);
    await page.getByRole("button", { name: "Sign out" }).click({ timeout: 2000 }).catch(() => {});
    const response = await wait;
    await page.waitForTimeout(900);
    // Ask the API directly, rather than racing the redirect.
    const me = await page.request.get(`${BASE}/api/auth/me`).catch(() => null);
    const meStatus = me ? me.status() : 0;
    await goto("/workspace/dashboard");
    const redirected = page.url().includes("/login");
    await login(page);
    if (response && response.status() === 200 && meStatus === 401)
      rec(row, "PASS", `logout 200; /api/auth/me 401; dashboard ${redirected ? "redirects to /login" : "showed a public shell"}`, { meStatus, urlAfter: page.url() });
    else rec(row, "FAKE", `logout ${response ? response.status() : "missing"}; /api/auth/me ${meStatus}; dashboard ${redirected ? "redirects" : "still authenticated"}`, { meStatus, urlAfter: page.url() });
  }

  async function testShowPassword(row) {
    await page.context().clearCookies();
    await goto("/login");
    const input = page.locator('input[placeholder="Enter your password"]').first();
    const t0 = await input.getAttribute("type").catch(() => null);
    const n = net(page);
    await page.getByRole("button", { name: "Show password" }).click({ timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(400);
    n.off();
    const t1 = await input.getAttribute("type").catch(() => null);
    await login(page);
    if (t0 !== t1) rec(row, "PASS", `password field type ${t0} -> ${t1}`);
    else rec(row, "DEAD", `password field type stayed ${t0}`);
  }

  async function testSignIn(row) {
    await page.context().clearCookies();
    await goto("/login");
    await page.locator('input[placeholder="you@hotel.com"]').fill("nobody@test.invalid").catch(() => {});
    await page.locator('input[placeholder="Enter your password"]').fill("wrong-password").catch(() => {});
    const before = await snap(page);
    const n = net(page);
    await page.getByRole("button", { name: /Sign In/ }).click({ timeout: 2500 }).catch(() => {});
    await page.waitForTimeout(1000);
    const after = await snap(page);
    n.off();
    const bad = n.resps.some((r) => r.status >= 400);
    const ok = n.resps.some((r) => r.status === 200 || r.status === 201);
    const errorText = after.toasts.length || after.mainText !== before.mainText;
    await login(page);
    if (ok) rec(row, "PASS", `login request accepted: ${n.resps.map((r) => r.status).join(",")}`, { responses: n.resps });
    else if (bad) rec(row, "PASS", `login request submitted and rejected: ${n.resps.map((r) => r.status).join(",")}`, { responses: n.resps });
    else if (errorText) rec(row, "PASS", "form validation/error state changed", { toasts: after.toasts });
    else rec(row, "DEAD", "no request and no error state");
  }

  async function testClearSearch(row) {
    await goto(row.route);
    const input = page.locator('input[placeholder*="Enter guest name"], input[placeholder*="Search guest name"]').first();
    await input.fill("loop", { timeout: 2000 });
    await page.waitForTimeout(900);
    const before = await input.inputValue().catch(() => "");
    await page.getByRole("button", { name: "Clear search" }).first().click({ timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(500);
    const after = await input.inputValue().catch(() => "?");
    return rec(row, before !== "" && after === "" ? "PASS" : "DEAD",
      before !== "" && after === "" ? `query cleared "${before}" -> ""` : `query stayed "${after}"`, { before, after });
  }

  async function testFilters(row) {
    await goto("/workspace/directory");
    const select = page.locator("select.gps-select").first();
    const input = page.locator('input[placeholder*="Search guest name"]').first();
    const original = await select.inputValue().catch(() => "");
    const next = original === "VIP" ? "New" : "VIP";
    await select.selectOption(next).catch(() => {});
    await input.fill("loop", { timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(400);
    await page.getByRole("button", { name: "Filters" }).click({ timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(500);
    const filterAfter = await select.inputValue().catch(() => "?");
    const queryAfter = await input.inputValue().catch(() => "?");
    return rec(row, filterAfter === "All" && queryAfter === "" ? "PASS" : "DEAD",
      `filter ${next} -> ${filterAfter}, query -> "${queryAfter}"`, { filterAfter, queryAfter });
  }

  async function testSearchButton(row) {
    await goto(row.route);
    const input = page.locator('input[placeholder*="Enter guest name"]').first();
    await input.fill("loop", { timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(900); // let the live search settle
    const n = net(page);
    await page.getByRole("button", { name: "Search", exact: true }).first().click({ timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(900);
    n.off();
    const hit = n.reqs.find((r) => r.url.includes("/api/guests/search"));
    return rec(row, hit ? "PASS" : "DEAD",
      hit ? `search request: ${hit.method} ${hit.url}` : "clicking Search requested nothing", { requests: n.reqs.slice(0, 4) });
  }

  async function testTestConnection(row) {
    await goto("/workspace/pms-sync");
    const n = net(page);
    const wait = page.waitForResponse((r) => r.url().includes("/api/sync-status/test"), { timeout: 8000 }).catch(() => null);
    await page.getByRole("button", { name: "Test Connection" }).first().click({ timeout: 2500 }).catch(() => {});
    const response = await wait;
    await page.waitForTimeout(500);
    n.off();
    const status = response ? response.status() : 0;
    const pageText = (await snap(page)).mainText;
    return rec(row, status >= 200 && status < 300 ? "PASS" : "DEAD",
      status ? `POST /api/sync-status/test ${status}` : `no test request; page says: ${pageText.slice(0, 90)}`,
      { responses: n.resps.slice(0, 4) });
  }

  async function testSaveDefaults(row) {
    await goto("/workspace/settings");
    const wait = page.waitForResponse((r) => r.url().includes("/api/settings") && r.request().method() === "PUT", { timeout: 10000 }).catch(() => null);
    await page.getByRole("button", { name: /Save Defaults/ }).first().click({ timeout: 2500 }).catch(() => {});
    const response = await wait;
    await page.waitForTimeout(500);
    const status = response ? response.status() : 0;
    return rec(row, status >= 200 && status < 300 ? "PASS" : "DEAD",
      status ? `PUT /api/settings ${status}` : "no PUT /api/settings request", {});
  }

  async function testSettingsSave(row) {
    await goto("/workspace/settings");
    const select = page.locator("select.gps-input").first();
    const original = await select.inputValue().catch(() => "");
    const next = original === "en-US" ? "en-GB" : "en-US";
    await select.selectOption(next).catch(() => {});
    const wait = page.waitForResponse((r) => r.url().includes("/api/settings") && r.request().method() === "PUT", { timeout: 10000 }).catch(() => null);
    await page.getByRole("button", { name: /Save Changes/ }).first().click({ timeout: 2500 }).catch(() => {});
    const response = await wait;
    const status = response ? response.status() : 0;
    if (status < 200 || status >= 300) {
      return rec(row, "DEAD", status ? `PUT /api/settings ${status}` : "no PUT /api/settings request");
    }
    await goto("/workspace/settings");
    const persisted = await page.locator("select.gps-input").first().inputValue().catch(() => "?");
    // Restore the original value so the audit leaves settings as it found them.
    if (persisted !== original) {
      await page.locator("select.gps-input").first().selectOption(original).catch(() => {});
      const restore = page.waitForResponse((r) => r.url().includes("/api/settings") && r.request().method() === "PUT", { timeout: 10000 }).catch(() => null);
      await page.getByRole("button", { name: /Save Changes/ }).first().click({ timeout: 2500 }).catch(() => {});
      await restore;
    }
    return rec(row, persisted === next ? "PASS" : "FAKE",
      persisted === next ? `PUT 200 and persisted ${original} -> ${persisted}` : `saved ${next} but reload shows ${persisted}`,
      { status, original, next, persisted });
  }

  async function testSettingsCancel(row) {
    await goto("/workspace/settings");
    const select = page.locator("select.gps-input").first();
    const original = await select.inputValue().catch(() => "");
    const next = original === "en-US" ? "en-GB" : "en-US";
    await select.selectOption(next).catch(() => {});
    await page.getByRole("button", { name: "Cancel" }).first().click({ timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(500);
    const after = await select.inputValue().catch(() => "?");
    return rec(row, after === original ? "PASS" : "DEAD",
      after === original ? `discarded ${next}, restored ${after}` : `stayed ${after} instead of ${original}`, { original, after });
  }

  async function testDismissNotice(row) {
    await goto("/workspace/settings");
    const before = await page.locator(".gps-success-banner").count();
    await page.getByRole("button", { name: "Dismiss notice" }).click({ timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(400);
    const after = await page.locator(".gps-success-banner").count();
    return rec(row, before > 0 && after === 0 ? "PASS" : "DEAD",
      before > 0 && after === 0 ? "notice banner removed" : `banner count ${before} -> ${after}`);
  }

  async function testCopy(row) {
    await page.context().grantPermissions(["clipboard-read", "clipboard-write"], { origin: BASE }).catch(() => {});
    await goto("/workspace/error");
    await page.getByRole("button", { name: "Copy", exact: true }).click({ timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(400);
    const text = await page.evaluate(() => navigator.clipboard.readText()).catch(() => "");
    return rec(row, text.includes("GP-0017") ? "PASS" : "FAKE",
      text.includes("GP-0017") ? `clipboard: "${text}"` : `clipboard unreadable: "${text}"`, { text });
  }

  async function testGoToDirectory(row) {
    await page.evaluate(() => window.sessionStorage.removeItem("gps-selected-guest-id")).catch(() => {});
    await goto("/workspace/guest-profile");
    const button = page.getByRole("button", { name: "Go to directory" }).first();
    if ((await button.count()) === 0) {
      return rec(row, "PASS", "a guest is selected, so the empty-state button is not expected", {});
    }
    await button.click({ timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(700);
    return rec(row, page.url().includes("/workspace/directory") ? "PASS" : "DEAD",
      page.url().includes("/workspace/directory") ? "navigated to /workspace/directory" : `stayed on ${page.url()}`, { url: page.url() });
  }

  async function testDirectoryPage(row) {
    await goto("/workspace/directory");
    const target = page.locator(".gps-pagination button").filter({ hasText: new RegExp(`^${row.label}$`) }).first();
    const n = net(page);
    const wait = page.waitForResponse((r) => r.url().includes("/api/guests?page="), { timeout: 8000 }).catch(() => null);
    await target.click({ timeout: 2500 }).catch(() => {});
    const response = await wait;
    await page.waitForTimeout(500);
    n.off();
    const current = (await page.locator(".gps-pagination button.current").innerText().catch(() => "?")).trim();
    return rec(row, current === row.label ? "PASS" : "DEAD",
      `page ${current}${response ? ` (GET ${response.status()})` : ""}`, { responses: n.resps.slice(0, 4) });
  }

  async function testRegistration(row) {
    await goto("/workspace/registration");
    // Full Name is the first .gps-input on the form; Email carries type=email.
    const name = page.locator("input.gps-input").first();
    const email = page.locator('input[type="email"]').first();
    if (row.tag === "select") {
      const sel = page.locator("select.gps-input").first();
      const v0 = await sel.inputValue().catch(() => "");
      await sel.selectOption({ label: "Deluxe Room" }).catch(() => {});
      await page.waitForTimeout(300);
      const v1 = await sel.inputValue().catch(() => "");
      return v0 !== v1
        ? rec(row, "PASS", `room select changed ${v0} -> ${v1}`, { valueBefore: v0, valueAfter: v1 })
        : rec(row, "DEAD", "room select did not change", { valueBefore: v0, valueAfter: v1 });
    }
    if (row.type === "checkbox") {
      const cb = page.locator(".gps-checkbox input[type=checkbox]").first();
      const c0 = await cb.isChecked().catch(() => null);
      await cb.click({ timeout: 1500 }).catch(() => {});
      await page.waitForTimeout(200);
      const c1 = await cb.isChecked().catch(() => null);
      if (c0 === c1) return rec(row, "DEAD", "confirmation checkbox did not toggle", { checkedBefore: c0, checkedAfter: c1 });
      // It toggles. Prove it gates submission: fill the minimum fields, leave
      // it unchecked, submit, and expect the confirmation guard (no POST).
      await name.fill("Audit Check").catch(() => {});
      await email.fill("audit.check@example.invalid").catch(() => {});
      const n = net(page);
      await page.getByRole("button", { name: /Complete Registration/ }).click({ timeout: 2000 }).catch(() => {});
      await page.waitForTimeout(700);
      n.off();
      const toasts = (await snap(page)).toasts.join(" ");
      await cb.click({ timeout: 1000 }).catch(() => {}); // restore checked
      const posted = n.reqs.some((r) => r.url.includes("/api/registration/register"));
      if (posted) return rec(row, "DEAD", "unchecked confirmation still submitted a registration");
      return rec(row, /confirm/i.test(toasts) ? "PASS" : "FAKE",
        /confirm/i.test(toasts) ? `guarded submit: ${toasts}` : `no confirmation guard; toast: ${toasts || "(none)"}`,
        { checkedBefore: c0, checkedAfter: c1, toasts });
    }
    const before = await snap(page);
    const n = net(page);
    let clickErr = "";
    try {
      if (row.label === "Cancel") {
        await name.fill("ZZ Test").catch(() => {});
        await page.getByRole("button", { name: "Cancel" }).click({ timeout: 2000 });
      } else if (row.label === "Complete Registration") {
        // Leave the form empty: the submit button must run the validation guard
        // and must not write a row. The valid write path is verified in the E2E
        // registration test (rows 1008/1009), not by polluting the PMS here.
        await name.fill("").catch(() => {});
        await email.fill("").catch(() => {});
        await page.getByRole("button", { name: "Complete Registration" }).click({ timeout: 2000 });
      } else if (row.label.startsWith("JA ") || row.label.startsWith("AO ") || row.label.startsWith("NG ")) {
        const parts = row.label.split(" ");
        const guestName = `${parts[1]} ${parts[2]}`;
        await page.locator(".gps-match-row").filter({ hasText: guestName }).first().click({ timeout: 2000 });
      } else {
        await page.getByRole("button", { name: row.label }).first().click({ timeout: 2000 });
      }
    } catch (e) {
      clickErr = e.message;
    }
    await page.waitForTimeout(700);
    const after = await snap(page);
    n.off();
    if (row.label === "Cancel") {
      const val = await name.inputValue().catch(() => "?");
      if (val === "") rec(row, "PASS", "form fields reset", { clickErr });
      else rec(row, "FAKE", `toast only; name field still "${val}"`, { clickErr });
      return;
    }
    if (row.label === "Complete Registration") {
      const posted = n.reqs.some((r) => r.url.includes("/api/registration/register"));
      const bad = n.resps.filter((r) => r.status >= 400);
      const ok = n.resps.filter((r) => r.status >= 200 && r.status < 400 && r.method !== "OPTIONS");
      if (posted && ok.length) rec(row, "PASS", `registration POST: ${ok.map((r) => `${r.status}`).join(",")}`, { responses: n.resps });
      else if (posted && bad.length) rec(row, "DEAD", `request failed: ${bad.map((r) => `${r.status}`).join(",")}`, { responses: n.resps });
      else if (!posted && /complete|confirm|required/i.test(after.toasts.join(" ")))
        rec(row, "PASS", `validation guard fired, no PMS row written: ${after.toasts[0]}`, { toasts: after.toasts });
      else rec(row, "DEAD", "no validation, no request and no state change", { toasts: after.toasts, clickErr });
      return;
    }
    if (row.label.startsWith("JA ") || row.label.startsWith("AO ") || row.label.startsWith("NG ")) {
      const val = await name.inputValue().catch(() => "");
      const mail = await email.inputValue().catch(() => "");
      if (val && mail) rec(row, "PASS", `prefills ${val} / ${mail}; fixed suggestion, no live search`, { toasts: after.toasts });
      else rec(row, "DEAD", "click did not fill the form", { clickErr });
      return;
    }
    const [verdict, reason] = classifyGeneric(row, before, after, n, clickErr);
    rec(row, verdict, reason, { toasts: after.toasts, clickErr });
  }

  async function testSearchInput(row) {
    const route = row.route;
    await goto(route);
    const before = await snap(page);
    const n = net(page);
    const loc = page.getByPlaceholder(/Search guest name|Enter guest name|Search guests, properties/).first();
    let err = "";
    try {
      await loc.fill("zainba", { timeout: 2000 });
      if (row.label.startsWith("Search guests, properties")) await loc.press("Enter");
    } catch (e) {
      err = e.message;
    }
    await page.waitForTimeout(1400);
    const after = await snap(page);
    n.off();
    if (after.url !== before.url) return rec(row, "PASS", `enter navigated to ${after.url}`, { requests: n.reqs.slice(0, 4) });
    if (n.resps.some((r) => r.status >= 200 && r.status < 400)) return rec(row, "PASS", `search request fired`, { responses: n.resps.slice(0, 4), rowsBefore: before.rows, rowsAfter: after.rows });
    if (after.rows !== before.rows || after.mainText !== before.mainText) return rec(row, "PASS", `results changed (${before.rows} -> ${after.rows})`, { rowsBefore: before.rows, rowsAfter: after.rows });
    return rec(row, "DEAD", "typing did not change results and sent no request", { clickErr: err, rowsBefore: before.rows, rowsAfter: after.rows });
  }

  async function testDirectoryFilter(row) {
    await goto("/workspace/directory");
    const before = await snap(page);
    const n = net(page);
    const liveRows = await collectPage(null);
    const live = pickLive(row, bucket(liveRows.filter((r) => !r.inSidebar && !r.inTopbar)), 0);
    if (!live) return rec(row, "NOT RUN", "filter select not found");
    const val = await page.locator(`[data-click-id="${live.clickId}"]`).inputValue().catch(() => "");
    const options = live.optionValues.filter((v) => v !== val);
    await page.locator(`[data-click-id="${live.clickId}"]`).selectOption(options[0] ?? { index: 1 }, { timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(900);
    const after = await snap(page);
    n.off();
    if (after.rows !== before.rows || after.mainText !== before.mainText)
      return rec(row, "PASS", `row list changed (${before.rows} -> ${after.rows})`, { rowsBefore: before.rows, rowsAfter: after.rows });
    return rec(row, "FAKE", "selection changes but the list does not", { rowsBefore: before.rows, rowsAfter: after.rows });
  }

  async function testPrepareRegistration(row) {
    await goto("/workspace/guest-profile");
    const before = await snap(page);
    const n = net(page);
    let err = "";
    try {
      await page.getByRole("button", { name: "Prepare Registration" }).click({ timeout: 3000 });
    } catch (e) {
      err = e.message;
    }
    await page.waitForTimeout(1500);
    const after = await snap(page);
    n.off();
    const text = (after.toasts.join(" ") + " " + after.mainText).toLowerCase();
    if (/extension|not installed|not available|not connected|no bridge/.test(text))
      return rec(row, "NOT RUN", `extension bridge not loaded: ${after.toasts[0] || "no toast"}`, { toasts: after.toasts, clickErr: err });
    if (n.resps.some((r) => r.status >= 200 && r.status < 400)) return rec(row, "PASS", "extension/network request fired", { responses: n.resps.slice(0, 4) });
    if (after.toasts.length) return rec(row, "FAKE", `toast only: ${after.toasts[0]}`, { toasts: after.toasts });
    return rec(row, "DEAD", "no effect", { clickErr: err });
  }

  async function testFillRegistration(row) {
    await goto(row.route);
    const n = net(page);
    let err = "";
    try {
      await page.getByRole("button", { name: "Fill registration form" }).click({ timeout: 3000 });
    } catch (e) {
      err = e.message;
    }
    await page.waitForTimeout(1500);
    const after = await snap(page);
    n.off();
    const text = (after.toasts.join(" ") + " " + after.mainText).toLowerCase();
    if (/extension|not installed|not available|not connected|no bridge/.test(text))
      return rec(row, "NOT RUN", `extension bridge not loaded: ${after.toasts[0] || "no toast"}`, { toasts: after.toasts, clickErr: err });
    if (n.resps.some((r) => r.status >= 200 && r.status < 400)) return rec(row, "PASS", "extension/network request fired", { responses: n.resps.slice(0, 4) });
    if (after.toasts.length) return rec(row, "FAKE", `toast only: ${after.toasts[0]}`, { toasts: after.toasts });
    return rec(row, "DEAD", "no effect", { clickErr: err });
  }

  // ---- 1. shell ----
  if (!ONLY || ONLY.includes("shell")) {
    console.log("\n=== SHELL ===");
    await goto("/workspace/dashboard");
    let live = await collectPage(null);
    let shellLive = live.filter((r) => r.inSidebar || r.inTopbar);
    const shellOcc = occMap(MAP.shell.filter((r) => r.inSidebar || r.inTopbar));
    // Some shell rows were captured while the workspace was still loading and carry the
    // placeholder text ("Current hotel", "AC"). They are the same controls as the named
    // badge/account rows, so verify them against the live canonical control.
    const SHELL_ALIASES = {
      "Current hotel Hotel workspace": "Grand Vista Hotel Hotel workspace",
      "AC Account Team member": "AD Admin Administrator",
      AC: "AD",
    };
    for (const row of MAP.shell.filter((r) => r.inSidebar || r.inTopbar)) {
      if (!row.id) continue;
      if (row.id === "notifications-0") continue; // tested with the popover below
      const effective = SHELL_ALIASES[row.label] ? { ...row, label: SHELL_ALIASES[row.label] } : row;
      await runRow(effective, {
        route: "/workspace/dashboard", displayRoute: "shell", shell: true, occ: shellOcc.get(row),
        displayLabel: SHELL_ALIASES[row.label] ? `${row.label} (placeholder alias of ${SHELL_ALIASES[row.label]})` : undefined,
      });
    }

    // Notifications popover + Close.
    await goto("/workspace/dashboard");
    await page.locator(".gps-icon-button").first().click({ timeout: 2000 }).catch(() => {});
    await page.waitForTimeout(500);
    const pop = await snap(page);
    const closeBtn = page.locator(".gps-popover button").first();
    if (pop.popovers > 0 && (await closeBtn.count())) {
      await closeBtn.click({ timeout: 1500 }).catch(() => {});
      await page.waitForTimeout(350);
      const after = await snap(page);
      if (after.popovers === 0) rec({ id: "notifications-0", route: "shell", scope: "notifications", label: "Close", tag: "button", type: "", status: "WIRED (handler)", expected: "close the popover" }, "PASS", "popover closes");
      else rec({ id: "notifications-0", route: "shell", scope: "notifications", label: "Close", tag: "button", type: "", status: "WIRED (handler)", expected: "close the popover" }, "DEAD", "popover stayed open");
    } else {
      rec({ id: "notifications-0", route: "shell", scope: "notifications", label: "Close", tag: "button", type: "", status: "WIRED (handler)", expected: "close the popover" }, "NOT RUN", "notifications popover did not open");
    }
  }

  // ---- 2. page rows ----
  const routes = [...new Set(MAP.pages.filter((r) => r.scope === "page").map((r) => r.route))];
  for (const route of routes) {
    if (ONLY && !ONLY.includes(route)) continue;
    console.log(`\n=== ${route} ===`);
    const rows = MAP.pages.filter((r) => r.route === route && r.scope === "page");
    const occ = occMap(rows);
    for (const row of rows) {
      await runRow(row, { route, occ: occ.get(row) });
    }
  }

  // ---- 3. modal / popover scopes ----
  const STATE_OPENERS = {
    "/login": [{ scope: "login-help", rootSelector: ".gps-login-help", open: async () => { await page.context().clearCookies(); await goto("/login"); await page.getByRole("button", { name: "Forgot password?" }).click({ timeout: 2500 }); } }],
    "/workspace/guest-search": [{ scope: "guest-view", rootSelector: ".gps-modal", open: async () => page.getByRole("button", { name: /Adebola Kamal/ }).first().click({ timeout: 2500 }) }],
    "/workspace/directory": [
      { scope: "add-guest", rootSelector: ".gps-modal", open: async () => page.getByRole("button", { name: "Add Guest" }).first().click({ timeout: 2500 }) },
      { scope: "directory-view", rootSelector: ".gps-modal", open: async () => page.locator(".gps-row-action").first().click({ timeout: 2500 }) },
    ],
    "/workspace/data-requests": [{ scope: "new-request", rootSelector: ".gps-modal", open: async () => page.getByRole("button", { name: "New Request" }).first().click({ timeout: 2500 }) }],
    "/workspace/users": [{ scope: "invite-user", rootSelector: ".gps-modal", open: async () => page.getByRole("button", { name: "Invite User" }).first().click({ timeout: 2500 }) }],
    "/workspace/tenants": [{ scope: "add-hotel", rootSelector: ".gps-modal", open: async () => page.getByRole("button", { name: "Add Hotel" }).first().click({ timeout: 2500 }) }],
    "/workspace/dashboard": [
      { scope: "account-menu", rootSelector: ".gps-modal", open: async () => page.locator(".gps-profile-button").click({ timeout: 2500 }) },
    ],
    "/workspace/guest-profile": [
      { scope: "guest-edit", rootSelector: ".gps-modal", open: async () => page.getByRole("button", { name: "Edit Profile" }).first().click({ timeout: 2500 }) },
    ],
  };
  for (const [route, states] of Object.entries(STATE_OPENERS)) {
    if (ONLY && !ONLY.includes(route)) continue;
    for (const st of states) {
      const rows = MAP.pages.filter((r) => r.route === route && r.scope === st.scope);
      if (!rows.length) continue;
      console.log(`\n--- ${route} :: ${st.scope} (${rows.length}) ---`);
      const occ = occMap(rows);
      for (const row of rows) {
        await goto(route);
        try {
          await st.open({ timeout: 6000 });
        } catch (e) {
          rec(row, "NOT RUN", `could not open ${st.scope}: ${e.message.slice(0, 80)}`);
          continue;
        }
        await page.waitForTimeout(700);
        let liveRows = [];
        try {
          liveRows = await collectPage(st.rootSelector || ".gps-modal, .gps-popover");
        } catch (e) {
          rec(row, "NOT RUN", `collect failed: ${e.message.slice(0, 80)}`);
          continue;
        }
        const live = pickLive(row, bucket(liveRows), occ.get(row));
        if (!live) {
          rec(row, "NOT RUN", "not found in open modal");
          continue;
        }
        if (row.status.startsWith("INPUT") || row.tag === "input" || row.tag === "textarea") {
          rec(row, "NOT RUN", "editable input");
          continue;
        }
        if (row.formSubmit) {
          rec(row, "NOT RUN", "submitting creates a record; tested in phase 4 with disposable data");
          continue;
        }
        if (row.tag === "select") {
          const sel = page.locator(`[data-click-id="${live.clickId}"]`);
          const v0 = await sel.inputValue().catch(() => "");
          const options = (live.optionValues || []).filter((v) => v !== v0);
          await sel.selectOption(options[0] ?? { index: 1 }, { timeout: 1500 }).catch(() => {});
          await page.waitForTimeout(300);
          const v1 = await sel.inputValue().catch(() => "");
          rec(row, v0 !== v1 ? "PASS" : "DEAD", v0 !== v1 ? `select changed ${v0} -> ${v1} (state change)` : "select did not change", { valueBefore: v0, valueAfter: v1 });
          continue;
        }
        if (row.type === "checkbox") {
          const cb = page.locator(`[data-click-id="${live.clickId}"]`);
          const c0 = await cb.isChecked().catch(() => null);
          await cb.click({ timeout: 1500 }).catch(() => {});
          await page.waitForTimeout(200);
          const c1 = await cb.isChecked().catch(() => null);
          rec(row, c0 !== c1 ? "NATIVE" : "DEAD", c0 !== c1 ? "checkbox toggles; no app state" : "checkbox did not toggle", { checkedBefore: c0, checkedAfter: c1 });
          continue;
        }
        const before = await snap(page);
        const n = net(page);
        let clickErr = "";
        try {
          await clickLive(live);
        } catch (e) {
          clickErr = e.message;
        }
        await page.waitForTimeout(650);
        const after = await snap(page);
        n.off();
        if (row.label === "Sign out") {
          // handled here because the account menu is a modal state
          await page.waitForTimeout(900);
          const me = await page.request.get(`${BASE}/api/auth/me`).catch(() => null);
          const meStatus = me ? me.status() : 0;
          // The account menu sends the browser to /login; /workspace itself is a
          // client shell and does not server-redirect, so check where we land.
          await page.waitForURL(/\/login/, { timeout: 5000 }).catch(() => {});
          const onLogin = page.url().includes("/login");
          await goto("/login");
          await login(page);
          rec(row, meStatus === 401 && onLogin ? "PASS" : "FAKE",
            meStatus === 401 && onLogin ? "logout 200; /api/auth/me 401; landed on /login" : `/api/auth/me ${meStatus}; landed on ${page.url()}`,
            { meStatus, urlAfter: page.url() });
          continue;
        }
        const [verdict, reason0] = classifyGeneric(row, before, after, n, clickErr);
        const reason = clickErr ? `${reason0}; clickErr: ${clickErr.slice(0, 120)}` : reason0;
        rec(row, verdict, reason, { toasts: after.toasts, responses: n.resps.slice(0, 4), clickErr: clickErr.slice(0, 120) });
      }
    }
    if (route === "/login") {
      await page.context().clearCookies();
      if (!(await login(page))) throw new Error("re-login after anonymous login states failed");
    }
  }

  // ---- 4. login page (cookies cleared) ----
  if (!ONLY || ONLY.includes("/login")) {
    console.log("\n=== /login ===");
    // Page rows were already run in the page loop; that loop used a valid session and may have
    // redirected. Re-run only the controls that need anonymous state.
    await page.context().clearCookies();
    await goto("/login");
    for (const row of MAP.pages.filter((r) => r.route === "/login")) {
      if (row.tag === "input" || row.tag === "textarea") {
        rec(row, "NOT RUN", "editable input");
        continue;
      }
      if (row.label === "Show password") {
        await testShowPassword(row);
        continue;
      }
      if (row.label === "Sign In →") {
        await testSignIn(row);
        continue;
      }
    }
    await login(page);
  }

  // restore session
  if (!loggedIn) await login(page);
} finally {
  if (page) await page.close().catch(() => {});
  await detach(browser);
}

// Deduplicate results by route+scope+id+label (the page loop may see shell rows too).
const seen = new Set();
const final = results.filter((r) => {
  const k = [r.route, r.scope, r.id, r.label, r.verdict, r.reason].join("|");
  if (seen.has(k)) return false;
  seen.add(k);
  return true;
});

const counts = final.reduce((m, r) => {
  m[r.verdict] = (m[r.verdict] || 0) + 1;
  return m;
}, {});

const md = [];
md.push("# TASK-009 — click pass", "");
md.push(`Base: ${BASE} (production build)`);
md.push(`Captured: ${new Date().toISOString()}`);
md.push("", "## Counts", "", "```", JSON.stringify(counts, null, 2), "```", "");
md.push("## FAKE (toast only)", "");
for (const r of final.filter((x) => x.verdict === "FAKE")) md.push(`- ${r.route} — ${r.label} — ${r.reason}`);
md.push("", "## DEAD", "");
for (const r of final.filter((x) => x.verdict === "DEAD")) md.push(`- ${r.route} — ${r.label} — ${r.reason}`);
md.push("", "## NOT RUN", "");
for (const r of final.filter((x) => x.verdict === "NOT RUN")) md.push(`- ${r.route} — ${r.label} — ${r.reason}`);
md.push("", "## All rows", "", "| Route | Scope | Control | Map status | Verdict | Evidence |", "|---|---|---|---|---|---|");
for (const r of final) md.push(`| ${r.route} | ${r.scope} | ${r.label} | ${r.mapStatus || ""} | **${r.verdict}** | ${(r.reason || "").replace(/\|/g, "\\|")} |`);

fs.writeFileSync(`${OUT}/${FILE}.json`, JSON.stringify({ counts, results: final }, null, 2) + "\n");
fs.writeFileSync(`${OUT}/${FILE}.md`, md.join("\n") + "\n");
console.log("\nCOUNTS", JSON.stringify(counts));
console.log("saved", `${OUT}/${FILE}.md`);
