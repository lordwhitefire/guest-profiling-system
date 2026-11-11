# Guest Profiling System

A hotel add-on that reads existing guest records (read-only) from a hotel's Property Management System (PMS), presents live-filtered matching profiles as a receptionist types, and auto-fills the hotel's existing registration form on click.

**Custom-built per hotel. Maintained by a single developer. Shared core; per-hotel adapter.**

This repository contains the agent definitions, skills, plain-English plan, and (in `packages/`) the actual implementation.

## Quick start

### Prerequisites

- Node.js 20 LTS (see `.nvmrc`)
- pnpm 9+ (`npm install -g pnpm@9`)
- PostgreSQL 15+ (local dev: `docker run -d --name gps-pg -e POSTGRES_PASSWORD=dev -e POSTGRES_DB=gps -p 5432:5432 postgres:15`)

### Install

```bash
pnpm install
cp .env.example .env
# edit .env: set DATABASE_URL, JWT_SECRET, ARGON2_SECRET, SOURCE_PMS_URL
```

### Run migrations

```bash
pnpm db:migrate
```

### Start dev server

```bash
pnpm dev
# → http://localhost:3000
```

### Run tests

```bash
pnpm typecheck    # tsc --noEmit across all packages
pnpm lint         # ESLint across all packages
pnpm test:unit    # Vitest + pg-mem
pnpm test:e2e     # Playwright smoke test
```

## Repository layout

```
.
├── packages/
│   ├── core/                       Next.js 16 app + API
│   ├── adapter-read/               SSLR-pattern sync worker (separate process)
│   ├── adapter-fill-extension/     Chrome MV3 form-fill extension
│   └── shared/                     Types + Zod schemas + DB migrations + auth utils
├── openspec/                       OpenSpec task registry + per-task briefs
│   ├── tasks-registry.md
│   └── tasks/TASK-001/{task.md, testing.md}
├── docs/                           Runbook + OpenAPI spec
├── ARCHITECTURE.md                 High-level architecture overview
├── PROGRESS.md                      Blueprint area 73 (session recovery)
└── .github/workflows/ci.yml
```

## Architecture

See [ARCHITECTURE.md](./ARCHITECTURE.md) for the high-level architecture. The authoritative specification is the three upstream deliverables (kept outside this repo as Word documents):

1. **Discovery Report** — five open-source reference repositories whose runtime behavior is relevant
2. **Behavioral Specification** — reverse-engineered runtime behavior of those five repositories (no source code copied)
3. **PM Plan** — CIRCLES recommendation + Blueprint 80-area checklist + phased build plan

## OpenSpec workflow

This repo uses OpenSpec for spec-driven development. See `openspec/tasks-registry.md` for the current task list. Each task has a `task.md` (implementation brief) and `testing.md` (acceptance criteria) under `openspec/tasks/TASK-XXX/`.

## License

MIT. See [LICENSE](./LICENSE).
