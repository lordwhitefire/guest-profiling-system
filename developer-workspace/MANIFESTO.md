# MANIFESTO — what this system is

This is the one-page description of the product and the demo. If a decision does not serve this, it is the wrong decision.

## The product

A **guest profiling system** for a hotel. It recognises returning guests and helps the receptionist register them without retyping everything.

## The two databases

1. **The messy PMS database** — the hotel's own registration database. It has raw rows, duplicates, missing emails, and no visit table. In the demo this is a stand-in database with the same shape as the hotel PMS; we do **not** need access to the real hotel database.
2. **The clean profile database** — our arranged database. One profile per guest, with visits derived by grouping repeated raw rows. This is what the receptionist searches and clicks.

## The two adapters

- **Read adapter** — server-side. Reads the messy PMS database and updates the clean profile database. It is the background sync.
- **Fill adapter** — the Chrome extension. It is the bridge between our web app and the hotel's existing registration form. It watches the form, matches the typed details to a clean profile, prefills the form when the receptionist clicks a profile, and writes the submitted registration back to the messy PMS database.

The adapter is not one thing. It is the connector to the PMS, in two parts: one reads, one fills.

## The demo flow

1. The hotel receptionist opens the hotel's registration form.
2. Our profiling system watches the details being typed.
3. It matches those details against the clean profiles built from the messy PMS database.
4. When a matching profile appears, the receptionist clicks it.
5. The extension prefills the hotel form from that profile.
6. The receptionist submits the registration.
7. The registration is stored as one raw row in the messy PMS database.
8. Our read adapter reads that raw row and updates the clean profile and visit history.

## What the client sees

- A returning guest is recognised while the receptionist types.
- One click fills the form.
- The registration is stored.
- The guest's visit history updates.

## What is real and what is a demo stand-in

- **Real:** the web app, the clean profile database, the matching, the extension prefill, the registration write, the sync, the visit history.
- **Demo stand-in:** the messy PMS database. It is shaped like the hotel PMS, but it is ours. The demo does not require the hotel's real database.

## Non-goals

- No real hotel database access is required for the presentation.
- No auto-merge, AI dedup, or spell correction in v1.
- No claim that the demo is connected to a live hotel PMS unless it actually is.

## The one-sentence version

We read the hotel's messy PMS database into our clean profile database; the receptionist types a guest into the hotel form, our extension recognises the returning guest, one click fills the form, the registration goes back into the messy database, and our sync updates the profile and visit history.