#!/usr/bin/env node
// pm-plan.js — PM plan generator (CIRCLES method output).
// Produces the comprehension, identification, reporting, cutting, listing, evaluation, and summary for the Guest Profiling System.

const fs = require("fs");
const path = require("path");

const outDir = path.join(__dirname);
const plan = `# PM Plan — Guest Profiling System

## CIRCLES Method Output

### Comprehend
Hotel receptionists re-enter guest details on every return visit. The goal is to reduce repeated data entry by reading existing guest records from the hotel's PMS and presenting matching profiles as staff type.

### Identify
Customer: hotel reception staff. Stakeholder: hotel owner/manager.

### Report
Underlying job: "Check in a returning guest without re-typing their details."

### Cut
Scope cut to read-only guest profile lookup + form fill. No AI, no auto-dedup, no write-back to PMS.

### List
Options: (1) full CRM replacement, (2) read-only profile lookup with form fill (chosen), (3) standalone check-in system.

### Evaluate
Option 2 has the lowest risk and highest value. It does not disrupt existing hotel operations.

### Summarize
Build one reusable guest-profiling system with per-hotel PMS adapters. Phase 0: foundation. Phase 1: adapter-read + profile API + receptionist UI. Phase 2: browser extension form-fill.
`;

fs.writeFileSync(path.join(outDir, "PM-PLAN.md"), plan.trim() + "\n");
console.log("PM plan generated.");
