// TASK-009 — clickability / behaviour audit.
// Attaches to the visible Chrome (browser-attach), logs in, walks every workspace
// route on the PRODUCTION build, assigns audit ids, and clicks every control that
// looks interactive. Records whether the click did anything.
import fs from "node:fs";
import path from "node:path";
import { attach, detach, takeTabs } from "/home/lordwhitefire/.agents/skills/browser-attach/scripts/attach.mjs";

const BASE = process.env.AUDIT_BASE || "http://localhost:3100";
const OUT = "/home/lordwhitefire/current-project/guest-profiling-system-builder-bundle/developer-workspace/parity/clickability";
fs.mkdirSync(OUT, { recursive: true });

const ROUTES = [
  "dashboard", "guest-search", "directory", "guest-profile", "visit-history",
  "registration", "pms-sync", "data-requests", "audit-logs", "users",
  "tenants", "settings", "hotel-settings", "analytics",
];

const COLLECT = () => {
  const seen = new Set();
  const out = [];
  const sel = [
    "button", "a[href]", "select", "input", "textarea",
    "[role=button]", "[role=menuitem]", "[role=switch]", "[role=tab]",
    ".gps-hotel-badge", ".gps-sidebar-user", ".gps-profile-button",
    ".gps-icon-button", ".gps-top-button", ".gps-switch", ".gps-match-row",
    ".gps-nav-item", ".gps-guest-row", ".gps-row-action",
  ].join(",");
  const looks = Array.from(document.querySelectorAll(sel));
  for (const raw of looks) {
    let el = raw;
    if (el.tagName.toLowerCase() === "svg") {
      el = el.closest("button,a,[role=button],.gps-hotel-badge,.gps-sidebar-user") || el.parentElement;
    }
    if (!el || seen.has(el)) continue;
    seen.add(el);
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === "hidden" || cs.display === "none" || cs.pointerEvents === "none") continue;
    const tag = el.tagName.toLowerCase();
    const text = (el.innerText || el.textContent || "").trim().replace(/\s+/g, " ").slice(0, 90);
    const aria = el.getAttribute("aria-label") || "";
    const title = el.getAttribute("title") || "";
    const cls = typeof el.className === "string" ? el.className : "";
    const id = "a" + out.length;
    el.setAttribute("data-audit-id", id);
    out.push({
      id, tag,
      type: el.getAttribute("type") || "",
      role: el.getAttribute("role") || "",
      text, aria, title, cls,
      href: tag === "a" ? el.getAttribute("href") : "",
      disabled: Boolean(el.disabled) || el.getAttribute("aria-disabled") === "true",
      iconOnly: !text && !aria && !title,
      hasChevron: /chevron/i.test(el.innerHTML),
      expanded: el.getAttribute("aria-expanded"),
      inSidebar: Boolean(el.closest(".gps-sidebar")),
      inTopbar: Boolean(el.closest(".gps-topbar")),
    });
  }
  return out;
};

function expectedOf(c) {
  const t = (c.text || c.aria || c.title || "").toLowerCase();
  if (c.tag === "a") return "navigate to " + c.href;
  if (c.tag === "select") return "change the selected option";
  if (c.type === "checkbox" || c.role === "switch" || /gps-switch/.test(c.cls)) return "toggle on/off";
  if (/search|find a returning/.test(c.cls) || /enter guest name/.test(t)) return "search as you type";
  if (/sign out|log out/.test(t)) return "end the session";
  if (/save/.test(t)) return "persist the change";
  if (/export|download|report/.test(t)) return "produce a file";
  if (/sync now|test connection|retry|refresh/.test(t)) return "run the operation";
  if (/cancel|close/.test(t)) return "close or reset";
  if (/add |invite|new |create/.test(t)) return "open a form";
  if (/edit|pencil/.test(t)) return "open an editor";
  if (/notification|bell/.test(t)) return "open notifications";
  if (c.hasChevron || /hotel-badge|sidebar-user|profile-button/.test(c.cls)) return "open a menu";
  if (c.iconOnly) return "open a menu or run an icon action";
  if (c.role === "tab") return "switch tab";
  return "perform the labelled action";
}

const SNAPSHOT = () => ({
  url: location.pathname + location.search,
  modals: document.querySelectorAll(".gps-modal").length,
  modalText: (document.querySelector(".gps-modal")?.innerText || "").slice(0, 160),
  popovers: document.querySelectorAll(".gps-popover,[role=menu]").length,
  toast: (document.querySelector(".gps-toast")?.innerText || "").slice(0, 160),
  bodyLen: document.body.innerText.length,
  bodyText: document.body.innerText.slice(0, 4000),
  dialogs: document.querySelectorAll("[role=dialog]").length,
});

const browser = await attach();
const results = [];
const inventory = [];
try {
  const { ref: page } = await takeTabs(browser, ["ref"]);
  const login = await page.request.post(`${BASE}/api/auth/login`, {
    data: { email: "admin@grandvista.test", password: "Admin123!" },
  });
  if (login.status() !== 200) throw new Error("login failed: " + login.status());

  const seenKeys = new Set();
  for (const route of ROUTES) {
    const url = `${BASE}/workspace/${route}`;
    await page.goto(url, { waitUntil: "domcontentloaded" });
    await page.waitForTimeout(1400);
    const controls = await page.evaluate(COLLECT);
    for (const c of controls) inventory.push({ route, ...c, expected: expectedOf(c) });

    for (const c of controls) {
      const key = [c.tag, c.text || c.aria || c.title, c.cls].join("|");
      const shared = c.inSidebar || c.inTopbar;
      if (shared && seenKeys.has(key)) continue;
      if (shared) seenKeys.add(key);

      const base = { route, id: c.id, tag: c.tag, text: c.text || c.aria || c.title || "(icon)", cls: c.cls, expected: expectedOf(c) };
      if (c.disabled) { results.push({ ...base, verdict: "NOT RUN", evidence: "disabled" }); continue; }
      if (c.tag === "input" || c.tag === "textarea") {
        if (/name|phone|email|search|guest/i.test(c.text + c.cls + c.aria) && c.tag === "input") {
          const before = await page.evaluate(SNAPSHOT);
          const focused = await page.locator(`[data-audit-id="${c.id}"]`).first().fill("zainba").then(() => true).catch(() => false);
          await page.waitForTimeout(1000);
          const after = await page.evaluate(SNAPSHOT);
          results.push({
            ...base, verdict: focused && (after.bodyLen !== before.bodyLen || after.url !== before.url) ? "PASS" : "DEAD",
            evidence: focused ? `fill "zainba": body ${before.bodyLen}->${after.bodyLen}, url ${before.url}->${after.url}` : "control not fillable",
          });
        } else {
          results.push({ ...base, verdict: "NOT RUN", evidence: "free-text input — covered by its form's action" });
        }
        continue;
      }
      if (c.tag === "a") {
        const target = c.href || "";
        const okTarget = target.startsWith("/") || target.startsWith("http");
        results.push({ ...base, verdict: okTarget ? "PASS (link)" : "DEAD", evidence: `href="${target}"` });
        continue;
      }
      if (c.tag === "select") {
        const before = await page.evaluate(SNAPSHOT);
        const changed = await page.locator(`[data-audit-id="${c.id}"]`).first().selectOption({ index: 1 }).then(() => true).catch(() => false);
        await page.waitForTimeout(400);
        const after = await page.evaluate(SNAPSHOT);
        results.push({ ...base, verdict: changed ? "PASS" : "NOT RUN", evidence: changed ? `selected option 2; body ${before.bodyLen}->${after.bodyLen}` : "no second option" });
        continue;
      }
      if (c.type === "checkbox") {
        const before = await page.evaluate(SNAPSHOT);
        const clicked = await page.locator(`[data-audit-id="${c.id}"]`).first().click().then(() => true).catch(() => false);
        await page.waitForTimeout(250);
        const after = await page.evaluate(SNAPSHOT);
        results.push({ ...base, verdict: clicked ? "PASS" : "DEAD", evidence: `checkbox toggled; body ${before.bodyLen}->${after.bodyLen}` });
        continue;
      }

      // Button-like control.
      const before = await page.evaluate(SNAPSHOT);
      const reqs = [];
      const onReq = (r) => { const u = new URL(r.url()); if (u.pathname.startsWith("/api/")) reqs.push(`${r.method()} ${u.pathname}`); };
      page.on("request", onReq);
      const downloadPromise = page.waitForEvent("download", { timeout: 900 }).catch(() => null);
      const clicked = await page.locator(`[data-audit-id="${c.id}"]`).first().click({ timeout: 4000 }).then(() => true).catch(() => false);
      await page.waitForTimeout(750);
      const download = await downloadPromise;
      page.off("request", onReq);
      const after = await page.evaluate(SNAPSHOT);

      const changed =
        after.url !== before.url ||
        after.modals > before.modals || after.popovers > before.popovers || after.dialogs > before.dialogs ||
        after.toast !== before.toast ||
        Math.abs(after.bodyLen - before.bodyLen) > 20 ||
        reqs.length > 0 || Boolean(download);

      let evidence = [];
      if (!clicked) evidence.push("click failed");
      if (after.url !== before.url) evidence.push(`route ${before.url} -> ${after.url}`);
      if (after.modals > before.modals) evidence.push(`modal opened: ${after.modalText.replace(/\n/g, " | ").slice(0, 100)}`);
      if (after.popovers > before.popovers) evidence.push("menu/popover opened");
      if (after.toast !== before.toast) evidence.push(`toast: ${after.toast.replace(/\n/g, " | ").slice(0, 90)}`);
      if (reqs.length) evidence.push(`API: ${reqs.join(", ")}`);
      if (download) evidence.push(`download: ${download.suggestedFilename()}`);
      if (!evidence.length) evidence.push(`no change (body ${before.bodyLen}->${after.bodyLen})`);

      results.push({ ...base, verdict: clicked && changed ? "PASS" : "DEAD", evidence: evidence.join("; ") });

      // Restore: close modal/popover, dismiss toast, return to the route if we navigated.
      if (after.url !== before.url) {
        await page.goto(url, { waitUntil: "domcontentloaded" });
        await page.waitForTimeout(600);
      } else {
        await page.keyboard.press("Escape").catch(() => {});
        await page.locator(".gps-modal button[aria-label], .gps-popover button").first().click({ timeout: 500 }).catch(() => {});
        await page.waitForTimeout(200);
      }
    }
    console.log(`${route}: ${controls.length} controls mapped`);
  }
} finally {
  await detach(browser);
}

// Group + write.
const byVerdict = results.reduce((m, r) => (m[r.verdict] = (m[r.verdict] || []).concat(r), m), {});
const counts = Object.fromEntries(Object.entries(byVerdict).map(([k, v]) => [k, v.length]));
const md = [];
md.push("# Clickability audit — production build", "");
md.push(`Base: ${BASE}`);
md.push(`Captured: ${new Date().toISOString()}`);
md.push("", "## Counts", "", "```", JSON.stringify(counts, null, 2), "```", "");
md.push("## Controls", "", "| Route | Control | Expected | Verdict | Evidence |", "|---|---|---|---|---|");
for (const r of results) {
  const esc = (s) => String(s).replace(/\|/g, "\\|").replace(/\n/g, " ");
  md.push(`| ${r.route} | ${esc(r.text)} (${r.tag}) | ${esc(r.expected)} | **${r.verdict}** | ${esc(r.evidence)} |`);
}
md.push("", "## Dead controls", "");
for (const r of results.filter((x) => x.verdict === "DEAD")) md.push(`- ${r.route}: ${r.text} — ${r.expected}`);
fs.writeFileSync(path.join(OUT, "inventory.json"), JSON.stringify(inventory, null, 2) + "\n");
fs.writeFileSync(path.join(OUT, "results.json"), JSON.stringify(results, null, 2) + "\n");
fs.writeFileSync(path.join(OUT, "report.md"), md.join("\n") + "\n");
console.log("\nCOUNTS", JSON.stringify(counts));
console.log("DEAD:");
for (const r of results.filter((x) => x.verdict === "DEAD")) console.log(`- ${r.route}: ${r.text} | ${r.expected} | ${r.evidence}`);
