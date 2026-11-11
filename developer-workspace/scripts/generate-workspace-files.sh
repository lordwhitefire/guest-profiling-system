#!/usr/bin/env bash
# generate-workspace-files.sh — scaffolding for the developer workspace.
# Creates briefs/, notes/, plans/, reports/ for each known task.

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TASKS="${TASKS:-TASK-001 TASK-002 TASK-003 TASK-004}"

for task in $TASKS; do
  mkdir -p "$ROOT/briefs" "$ROOT/notes" "$ROOT/plans" "$ROOT/reports"
  : > "$ROOT/briefs/$task.md"
  : > "$ROOT/notes/$task.md"
  : > "$ROOT/plans/$task.md"
  : > "$ROOT/reports/$task.md"
done

echo "Workspace scaffolding ready for: $TASKS"
