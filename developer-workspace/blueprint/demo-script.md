# Demo Script — Local Guest Profiling System

**Decision:** the demo uses **manual Sync Now**. Registration writes one raw hotel row immediately; the clean profile's derived visit count changes only after the operator clicks **Sync Now** on **PMS Integration**. This is deliberate: it makes the boundary between the hotel source database and our clean database visible.

**Hosting (2026-11-18):** free tier. Render free web service + three Neon databases (Frankfurt). The Render service **sleeps after 15 minutes idle**, so the first visit can take ~50 seconds. Open the site first, wait for it to wake, then start the demo.

## 0. Start

```bash
# from the repo root
set -a && . ./.env && set +a
pnpm db:migrate
pnpm seed:source
pnpm build
PORT=3100 NEXT_PUBLIC_APP_URL=http://127.0.0.1:3100 pnpm --filter @gps/core exec next start -p 3100
```

Open `http://127.0.0.1:3100/login`.

**Admin:** `admin@grandvista.test` / `Admin123!`
**Receptionist:** `receptionist@grandvista.test` / `Reception123!`

## 1. Same guest, same count (BP-01)

1. Sign in as admin. The active hotel is **Grand Vista Hotel**.
2. Go to **Guest Directory**.
3. Find **Zainab Wang**. Expected: **3** total visits.
4. Open her profile. Expected: **3** in the header and **3** rows under **Visit history**.
5. Open **Guest History** from the profile link. Expected: **3** total visits, **3** source rows.
6. Use the hotel badge (bottom left) to switch to **Lakeside Suites**.
7. Find **Zainab Wang** again. Expected: **2** visits. She is a different profile in a different hotel, not the Grand Vista record.
8. Optional direct-link check: copy the `guestId` from the directory row and open `/profile/<guestId>`; the URL id and the API id must match.

**Pass:** GV Zainab = 3 on directory, profile, and visit history. LS Zainab = 2 (the Lakeside source DB has two Zainab Wang rows). No screen shows the other hotel's count.

## 2. Registration → manual sync → one new visit (BP-02)

1. Stay in **Grand Vista Hotel**. Go to **Registration**.
2. Enter a new guest, for example `Demo Guest <demo+timestamp@grandvista.test>`.
3. Click **Complete Registration**. Expected toast: `Registered. ps_customer row #... written ... Click Sync Now ...`.
4. Open **Guest Search** and find the new guest. Expected: **0** or **1** visit depending on whether this exact email was registered before; the raw row is in the hotel DB, but the clean profile has not been synced yet.
5. Go to **PMS Integration** and click **Sync Now**.
6. Return to the guest. Expected: visit count increased by exactly **1**.
7. Click **Sync Now** again. Expected: count stays the same. No duplicate visit.

**Pass:** registration writes one raw row; one sync adds one visit; a second sync adds none.

## 3. Tenant isolation

1. As admin, open a Grand Vista guest profile.
2. Switch to Lakeside Suites.
3. Re-open the same Grand Vista `guestId` URL. Expected: **404 / not found**, not the Lakeside namesake.

**Pass:** the same guest id cannot be read from the wrong tenant.

## 4. Extension fill (laptop)

1. Open a guest profile in the workspace.
2. Click **Prepare Registration**. Expected: success toast only when the extension acknowledges.
3. Open the hotel registration form in the same Chrome profile.
4. Click the extension icon. Expected: Full Name, email, and phone fill correctly.
5. If the extension is missing, expected: `Extension not detected...`, never a false success.

## 5. Empty and failure states (BP-06)

- Search for a name with no match → plain “No matching guests found” + Clear search.
- Open a guest with no links → “No visits recorded.”
- Open PMS Integration before seeding → “No sync state recorded yet.”
- Stop the DB → API/health shows an error state, not a blank page.

## 6. What is intentionally not in this demo

- Render/public URL — deferred. The demo URL is local only: `http://127.0.0.1:3100`.
- Phone limitation: phones cannot run Chrome extensions. The manager views profiles on a phone; the form-fill demo runs on a laptop.
- Automatic sync after registration — not enforced; the demo is manual.
- Email delivery, MFA enforcement, login alerts — labelled as not enforced.
- Real room/check-in/check-out columns — the hotel source table has none.