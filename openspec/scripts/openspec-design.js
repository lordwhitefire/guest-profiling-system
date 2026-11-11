#!/usr/bin/env node
// openspec-design.js — OpenSpec design document generator.
// Produces the design artifact representing "what should exist" for the Guest Profiling System.

const fs = require("fs");
const path = require("path");

const outDir = path.join(__dirname);
const design = `# OpenSpec Design — Guest Profiling System

## What should exist

One reusable guest-profiling system per hotel install, with:

- Shared core: Next.js 16 app + API (guest profiles, live search, tenant-scoped auth)
- Adapter-Read: SSLR sync worker from the hotel's PMS (read-only)
- Adapter-Fill: Chrome MV3 form-fill extension
- Shared package: types, Zod schemas, DB migrations, auth utilities

## Constraints

- Read-only access to source PMS data (hard)
- One-way data flow: source DB → our DB (hard)
- No AI features, no auto-dedup, no spell correction (hard)
- Single-developer maintainable (hard)
- NDPR / GDPR / CCPA compliance (hard)

## Build order

Functionality → Business logic → Data → UI (confirmed 2026-11-08).
`;

fs.writeFileSync(path.join(outDir, "OPENSP-DESIGN.md"), design.trim() + "\n");
console.log("OpenSpec design generated.");
