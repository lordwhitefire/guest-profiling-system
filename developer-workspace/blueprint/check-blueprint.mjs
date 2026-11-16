#!/usr/bin/env node
/**
 * Structural checker for the Blueprint artifacts.
 *
 * It does not test the product. It checks that the Blueprint itself is complete:
 * - 80 areas, exactly once, in checklist and verification
 * - status counts match the checklist summary
 * - every verification row has a check, pass condition, task slot, and result slot
 * - every Pending area is covered by at least one task
 * - every task has an id, a scope, and an acceptance check
 *
 * Run: node developer-workspace/blueprint/check-blueprint.mjs
 */

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const read = (name) => readFileSync(join(here, name), 'utf8');

const checklist = read('checklist.md');
const tasks = read('tasks.md');
const verification = read('verification.md');

const errors = [];
const addError = (message) => errors.push(message);

const validStatuses = new Set(['Decided', 'Pending', 'Skip']);
const expectedCounts = { Decided: 36, Pending: 21, Skip: 23 };
const expectedAreas = Array.from({ length: 80 }, (_, index) =>
  String(index + 1).padStart(2, '0'),
);

function tableCells(line) {
  return line.split('|').map((cell) => cell.trim());
}

function parseChecklist() {
  const rows = new Map();

  for (const line of checklist.split(/\r?\n/)) {
    const match = line.match(/^\|\s*(\d{2})\s*\|/);
    if (!match) continue;

    const cells = tableCells(line);
    const status = (cells[4] ?? '').replace(/\*/g, '').trim();
    if (!validStatuses.has(status)) continue;

    const number = match[1];
    if (rows.has(number)) addError(`checklist: area ${number} appears more than once`);
    rows.set(number, { number, status, line });
  }

  return rows;
}

function parseVerification() {
  const rows = new Map();

  for (const line of verification.split(/\r?\n/)) {
    const match = line.match(/^\|\s*(\d{2})\s*\|/);
    if (!match) continue;

    const cells = tableCells(line);
    const number = match[1];
    if (rows.has(number)) addError(`verification: area ${number} appears more than once`);

    rows.set(number, {
      number,
      status: cells[3] ?? '',
      check: cells[4] ?? '',
      pass: cells[5] ?? '',
      task: cells[6] ?? '',
      result: cells[7] ?? '',
      line,
    });
  }

  return rows;
}

function parseTasks() {
  const rows = new Map();
  let current = null;

  for (const line of tasks.split(/\r?\n/)) {
    const heading = line.match(/^###\s+(BP-\d{2})\s+—\s+(.+)$/);
    if (heading) {
      if (rows.has(heading[1])) addError(`tasks: ${heading[1]} appears more than once`);
      current = {
        id: heading[1],
        title: heading[2].trim(),
        areas: [],
        hasWhat: false,
        hasCheck: false,
      };
      rows.set(current.id, current);
      continue;
    }

    if (!current) continue;

    const areaLine = line.match(/^\-\s+\*\*Areas:\*\*\s+(.+)$/);
    if (areaLine) {
      current.areas = [...areaLine[1].matchAll(/\b(\d{2})\b/g)].map((match) => match[1]);
    }

    if (/^\-\s+\*\*What:\*\*\s+\S/.test(line)) current.hasWhat = true;
    if (/^\-\s+\*\*(Acceptance check|Check):\*\*\s+\S/.test(line)) current.hasCheck = true;
  }

  return rows;
}

const checklistRows = parseChecklist();
const verificationRows = parseVerification();
const taskRows = parseTasks();

// 1. Area coverage.
for (const number of expectedAreas) {
  if (!checklistRows.has(number)) addError(`checklist: area ${number} is missing`);
  if (!verificationRows.has(number)) addError(`verification: area ${number} is missing`);
}
for (const number of checklistRows.keys()) {
  if (!expectedAreas.includes(number)) addError(`checklist: unexpected area ${number}`);
}
for (const number of verificationRows.keys()) {
  if (!expectedAreas.includes(number)) addError(`verification: unexpected area ${number}`);
}
if (checklistRows.size !== 80) addError(`checklist: expected 80 areas, found ${checklistRows.size}`);
if (verificationRows.size !== 80) {
  addError(`verification: expected 80 areas, found ${verificationRows.size}`);
}

// 2. Status counts and status agreement.
const counts = { Decided: 0, Pending: 0, Skip: 0 };
for (const row of checklistRows.values()) {
  if (row.status in counts) counts[row.status] += 1;
  else addError(`checklist: area ${row.number} has unknown status "${row.status}"`);

  const verified = verificationRows.get(row.number);
  if (verified && verified.status !== row.status) {
    addError(
      `area ${row.number}: checklist says ${row.status}, verification says ${verified.status}`,
    );
  }
}
for (const [status, expected] of Object.entries(expectedCounts)) {
  if (counts[status] !== expected) {
    addError(`checklist: ${status} count is ${counts[status]}, expected ${expected}`);
  }
}

// 3. Every verification row is usable.
for (const row of verificationRows.values()) {
  if (!row.check || row.check === '—') {
    addError(`verification: area ${row.number} has no check`);
  }
  if (!row.pass || row.pass === '—') {
    addError(`verification: area ${row.number} has no pass condition`);
  }
  if (!row.task) {
    addError(`verification: area ${row.number} has no task cell`);
  }
  if (!row.result) {
    addError(`verification: area ${row.number} has no result slot`);
  }
  if (row.status === 'Pending' && (!row.task || row.task === '—')) {
    addError(`verification: Pending area ${row.number} has no task`);
  }
}

// 4. Task structure.
for (const task of taskRows.values()) {
  if (!task.title) addError(`tasks: ${task.id} has no title`);
  if (!task.hasWhat) addError(`tasks: ${task.id} has no What`);
  if (!task.hasCheck) addError(`tasks: ${task.id} has no acceptance check`);
  if (task.areas.length === 0) addError(`tasks: ${task.id} lists no Blueprint areas`);
}
if (taskRows.size !== 29) addError(`tasks: expected 29 tasks, found ${taskRows.size}`);

// 5. Every Pending area is covered by at least one task.
const pendingAreas = [...checklistRows.values()]
  .filter((row) => row.status === 'Pending')
  .map((row) => row.number);
const coveredPending = new Set(taskRows.values().flatMap((task) => task.areas));
for (const number of pendingAreas) {
  if (!coveredPending.has(number)) addError(`tasks: Pending area ${number} has no task coverage`);
}

// 6. Task ids referenced by verification exist.
const taskIds = new Set(taskRows.keys());
for (const row of verificationRows.values()) {
  for (const match of row.task.matchAll(/BP-\d{2}/g)) {
    if (!taskIds.has(match[0])) {
      addError(`verification: area ${row.number} references missing task ${match[0]}`);
    }
  }
}

// 7. Report.
const results = { Pass: 0, Fail: 0, 'Not run': 0, 'Skip confirmed': 0, Other: 0 };
for (const row of verificationRows.values()) {
  if (row.result in results) results[row.result] += 1;
  else results.Other += 1;
}

console.log('Blueprint structural check');
console.log(`  checklist areas:      ${checklistRows.size}`);
console.log(`  verification areas:   ${verificationRows.size}`);
console.log(`  tasks:                ${taskRows.size}`);
console.log(`  Decided / Pending / Skip: ${counts.Decided} / ${counts.Pending} / ${counts.Skip}`);
console.log(`  Pending areas covered by tasks: ${pendingAreas.length - [...pendingAreas].filter((n) => !coveredPending.has(n)).length} / ${pendingAreas.length}`);
console.log(`  Results: Pass ${results.Pass}, Fail ${results.Fail}, Not run ${results['Not run']}, Skip confirmed ${results['Skip confirmed']}, Other ${results.Other}`);

if (errors.length > 0) {
  console.error(`\nFAIL — ${errors.length} problem(s):`);
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

console.log('\nPASS — all 80 areas are present, checked, and task-covered.');
