// Neon Function — automatic sync for the Guest Profiling System.
//
// A Neon schedule trigger POSTs here every 5 minutes. This function is a thin
// caller: all sync logic stays in the Render app (/api/sync-status/now).
//
// Env: RENDER_URL, ADMIN_EMAIL, ADMIN_PASSWORD, TRIGGER_KEY

const RENDER_URL = (process.env.RENDER_URL ?? "").replace(/\/+$/, "");
const ADMIN_EMAIL = process.env.ADMIN_EMAIL ?? "";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD ?? "";
const TRIGGER_KEY = process.env.TRIGGER_KEY ?? "";

const TENANTS = [
  "11111111-1111-1111-1111-111111111111", // Grand Vista
  "22222222-2222-2222-2222-222222222222", // Lakeside
];

function cookieFrom(res: Response): string {
  const anyRes = res as unknown as { headers: { getSetCookie?: () => string[] } };
  const raw = anyRes.headers.getSetCookie?.() ?? [];
  return raw.map((c) => c.split(";")[0]).join("; ");
}

async function main(request: Request): Promise<Response> {
  const url = new URL(request.url);
  // The key travels as a path segment: Neon trigger paths cannot carry a query string.
  const pathKey = url.pathname.startsWith("/sync/")
    ? url.pathname.slice("/sync/".length)
    : url.searchParams.get("key");
  if (!TRIGGER_KEY || pathKey !== TRIGGER_KEY) {
    return Response.json({ ok: false, error: "forbidden" }, { status: 403 });
  }
  if (!RENDER_URL || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
    return Response.json(
      { ok: false, error: "missing RENDER_URL / ADMIN_EMAIL / ADMIN_PASSWORD" },
      { status: 500 },
    );
  }

  const results: Array<{ tenantId: string; status: number; body: string }> = [];

  const loginRes = await fetch(`${RENDER_URL}/api/auth/login`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
  });
  if (!loginRes.ok) {
    return Response.json(
      { ok: false, error: `login failed: ${loginRes.status}` },
      { status: 502 },
    );
  }
  let cookie = cookieFrom(loginRes);

  for (let i = 0; i < TENANTS.length; i += 1) {
    const tenantId = TENANTS[i]!;
    if (i > 0) {
      const switchRes = await fetch(`${RENDER_URL}/api/auth/switch-tenant`, {
        method: "POST",
        headers: { "content-type": "application/json", cookie },
        body: JSON.stringify({ tenantId }),
      });
      const nextCookie = cookieFrom(switchRes);
      if (nextCookie) cookie = nextCookie;
      if (!switchRes.ok) {
        results.push({ tenantId, status: switchRes.status, body: "switch-tenant failed" });
        continue;
      }
    }

    const syncRes = await fetch(`${RENDER_URL}/api/sync-status/now`, {
      method: "POST",
      headers: { cookie },
      body: "{}",
    });
    const body = await syncRes.text();
    results.push({ tenantId, status: syncRes.status, body: body.slice(0, 400) });
  }

  const ok = results.every((r) => r.status === 200);
  return Response.json({ ok, results }, { status: ok ? 200 : 502 });
}

export default { fetch: main };