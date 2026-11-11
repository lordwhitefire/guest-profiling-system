# TASK-001 Plan

1. Scaffold pnpm workspaces (packages/core, adapter-read, adapter-fill-extension, shared)
2. Write 001_initial_schema.sql migration (9 tables + indexes + triggers)
3. Implement shared auth (jwt.ts, password.ts, tenant-scope.ts)
4. Implement core auth routes (login, logout, register) + middleware
5. Add design system components (Button, Input, Card, Badge, Toast)
6. Add CI pipeline (lint, typecheck, unit tests, e2e smoke)
7. Add documentation skeleton (.env.example, README.md, ARCHITECTURE.md, PROGRESS.md, docs/openapi.yaml)
8. Verify: typecheck, lint, test:unit, build
