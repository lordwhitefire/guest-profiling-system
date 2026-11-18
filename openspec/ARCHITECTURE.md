# Architecture — Guest Profiling System

This document is a high-level overview. The authoritative specification is the three upstream deliverables (kept outside this repo as Word documents in `download/`):

1. **Discovery Report** (`Guest-Profiling-System_Discovery-Report.docx`) — five open-source reference repositories
2. **Behavioral Specification** (`Guest-Profiling-System_Behavioral-Specification.docx`) — reverse-engineered runtime behavior of those five repositories, captured as stack-agnostic spec cards
3. **PM Plan** (`Guest-Profiling-System_PM-Plan.docx`) — CIRCLES recommendation + Blueprint 80-area checklist + phased build plan

If this document conflicts with any of the three upstream deliverables, the upstream deliverable wins.

## What we are building

A hotel add-on that:

1. Reads existing guest records (read-only) from a hotel's Property Management System (PMS)
2. Presents live-filtered matching profiles as a receptionist types (target: p95 search response < 300ms)
3. Auto-fills the hotel's existing registration form on click (target: p95 form-fill < 100ms)

The system never writes back to any hotel's database. It is custom-built per hotel, maintained by a single developer, with a shared core across hotels and a per-hotel adapter.

> **A note on the demo's "Register" button.** In the local demo, pressing Register
> writes one raw row into the "messy" source database. That messy database is a
> **stand-in for the hotel's own PMS** — the row represents the hotel's own system
> recording its own guest, not our software writing into a third party's database.
> In production this step is the hotel's own PMS persisting the form that the
> receptionist submits (the form our Adapter-Fill extension fills). Our software
> itself never writes to any external database; the sync/adapter path is strictly
> read-only.

## Architecture overview

```
┌────────────────────────────────────────────────────────────────────────────┐
│                       Guest Profiling System (one hotel install)          │
│                                                                            │
│  ┌──────────────────────┐    ┌──────────────────────────────────────┐    │
│  │  Adapter-Read        │    │  Core (Next.js 16 + API)              │    │
│  │  (separate process)  │───►│  - Guest profile API (6 endpoints)   │    │
│  │  - SSLR-pattern sync │    │  - Tenant scope resolver              │    │
│  │  - Card 1 contract   │    │  - Auth (JWT + Argon2id)             │    │
│  │  - Reads from PMS    │    │  - Admin UI                           │    │
│  │  - Writes to our DB  │    │  - Receptionist web UI                │    │
│  └──────────┬───────────┘    └──────────────────┬───────────────────┘    │
│             │                                   │                        │
│             │                                   │ HTTPS + Bearer JWT      │
│             │                                   ▼                        │
│             │                       ┌──────────────────────────┐         │
│             │                       │  Adapter-Fill Extension  │         │
│             │                       │  (Chrome MV3)            │         │
│             │                       │  - Card 5 algorithm      │         │
│             │                       │  - Scanner + scorer +   │         │
│             │                       │    Kuhn-Munkres solver  │         │
│             │                       │  - Native setter bypass │         │
│             │                       └──────────────────────────┘         │
│             │                                                            │
│             ▼                                                            │
│  ┌──────────────────────┐    ┌──────────────────────────────────────┐    │
│  │  Source PMS DB        │    │  Our DB (PostgreSQL 15+)              │    │
│  │  (read-only access)   │    │  - 9 tables per PM Plan §14.3        │    │
│  │  - e.g. QloApps       │    │  - tenant_id on every domain table   │    │
│  │    PREFIX_customer    │    │  - Soft delete throughout            │    │
│  │  - Read-only conn     │    │  - pg_trgm indexes for search        │    │
│  └──────────────────────┘    └──────────────────────────────────────┘    │
└────────────────────────────────────────────────────────────────────────────┘
```

## Two adapters, one core

The "PMS Adapter" is actually two distinct components with nothing in common except the name:

- **Adapter-Read** — backend sync primitive. Stateful, throttled, background, eventually-consistent, batched. Behavioral spec: Card 1 (SSLR).
- **Adapter-Fill** — frontend DOM-write primitive. Stateless per fill, instant, interactive, transactional. Behavioral spec: Card 5 (FormFilla).

They share only the guest-data contract (the `guests` table schema). Combining them into one component would couple two unrelated concerns.

## Stack

- **Language**: TypeScript 5 throughout
- **Runtime**: Node.js 20 LTS
- **Web framework**: Next.js 16 (App Router) with API routes — single deploy unit for core + API
- **Database**: PostgreSQL 15+
- **DB driver**: postgres.js
- **Query builder**: Kysely (type-safe, no ORM lock-in)
- **Migrations**: plain SQL files applied by a small custom runner (`packages/shared/scripts/migrate.mjs`). node-pg-migrate was originally planned but never adopted.
- **Auth**: JWT (jose) with group claims; Argon2id password hashing
- **Frontend styling**: Tailwind CSS 4 + shadcn/ui (Radix primitives)
- **Browser extension**: Chrome Manifest V3, TypeScript, esbuild bundler
- **Tests**: Vitest (unit) + Playwright (e2e) + pg-mem (DB unit)
- **CI**: GitHub Actions

## Build order

Confirmed by Victor on 2026-11-08 per the Blueprint skill:

**Functionality → Business logic → Data → UI**

(Reverse of the study order, which is UI → Data → Business logic → Functionality.)

## Constraints (Blueprint area 75)

See PM Plan Section 10. Summary:

- Read-only access to source PMS data (hard)
- One-way data flow: source DB → our DB (hard)
- Single-developer maintainable (hard)
- NDPR (Nigeria), GDPR (EU), CCPA (US) compliance (hard)
- No AI features, no auto-dedup, no spell correction (hard, per project plan)
- Frontend art-directed, polished, modern (per user design brief)
- Backend re-implemented from scratch (no code reuse from any of the 5 reference repos)

### How registration fits the read-only rule (clarification, not an exception)

Our software never writes to any external database. The sync/adapter path is strictly
read-only, and the one-way flow (source PMS → our DB) holds without exception.

The local demo's **Register** button writes one raw row into the "messy" source
database — but that database is a **stand-in for the hotel's own PMS**, and the row
represents the hotel's own system recording its own guest. It is not our software
writing into a third party's database. The demo's separate write connection
(`adapter_connections.is_read_only = FALSE`) exists only to simulate the hotel's own
PMS write; it is test scaffolding, not a product data path.

In production, registration is the receptionist submitting the hotel's existing form.
The hotel's own PMS persists that submission. Our only involvement is the Adapter-Fill
extension filling that form in the browser. **We never write to any hotel database.**

## Phased build plan

See `openspec/tasks-registry.md` for the current task list. Summary:

- **Phase 0** (TASK-001) — Foundation: monorepo, schema, design system, auth scaffold, CI. Status: done (verified).
- **Phase 1** (TASK-002 through TASK-005c, TASK-008, TASK-009) — Adapter-read + guest profile API + receptionist web UI + admin UI, plus real-DB and live-verification hardening. Status: done (verified, software scope).
- **Phase 2** (TASK-006) — Browser extension form-fill. Status: done (verified).
- **Phase 3** (future tasks) — Additional PMS adapters (Mews, Cloudbeds, Apaleo; Windows desktop). Status: deferred to v2.

## Decisions (resolved)

Per owner directive (2026-11-12), captured in `openspec/tasks-registry.md`:

- **First hotel customer** — Not needed for production-grade software. The software reads any PMS matching the QloApps schema, or a new mapping can be added per the `mappings/types.ts` interface. The integration layer (connecting a specific hotel's PMS) is a separate concern handled when a customer is identified.
- **Hosting provider** — **Render**. Declared in `render.yaml` (one web service + one managed Postgres + one cron worker). Declared, not yet deployed.
- **Brand identity** — **Decided**. The workspace UI ships its own visual identity: gps-brand-mark in the sidebar, "Guest Profiling System" wordmark, hotel-name placeholders throughout. No further brand work needed for v1.
- **Open-source license** — **MIT** (per the discovery report recommendation and the existing `LICENSE` file).
