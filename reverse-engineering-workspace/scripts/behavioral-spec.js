#!/usr/bin/env node
// behavioral-spec.js — behavioral spec card generator.
// Emits stack-agnostic spec cards reverse-engineered from reference repository runtime behavior.

const fs = require("fs");
const path = require("path");

const outDir = path.join(__dirname);
const cards = `# Behavioral Specification Cards

## Card 1 — SSLR (Sync, Scan, Load, Read)
Source PMS read-only sync. Throttled, batched, eventually consistent. Resync on schema change.

## Card 2 — Guest Profile API
Six endpoints: create, list, get, update, reservations, loyalty, search. Tenant-scoped. Audit logged.

## Card 3 — Guest Phases
12 phases: UNKNOWN_CONTACT, ACQUIRING, BOOKING_RECEIVED, WELCOME_SENT, INFO_SENT, IDLE, UPSELL, PRE_CHECKIN, CHECKIN_DAY, IN_HOUSE, POST_STAY, ESCALATED.

## Card 4 — Search Ranking
pg_trgm on name/email/phone. p95 < 300ms. Phone number is the primary lookup key.

## Card 5 — FormFilla
Chrome MV3 extension. Scanner + scorer + Kuhn-Munkres solver. Native setter bypass for form fill.
`;

fs.writeFileSync(path.join(outDir, "BEHAVIORAL-SPEC.md"), cards.trim() + "\n");
console.log("Behavioral spec generated.");
