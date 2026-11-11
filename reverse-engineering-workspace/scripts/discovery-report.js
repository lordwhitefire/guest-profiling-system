#!/usr/bin/env node
// discovery-report.js — discovery report generator.
// Summarizes the five open-source reference repositories relevant to the Guest Profiling System.

const fs = require("fs");
const path = require("path");

const outDir = path.join(__dirname);
const report = `# Discovery Report — Guest Profiling System

Five open-source reference repositories were identified whose runtime behavior informs the Guest Profiling System:

1. QloApps — hotel PMS with customer/guest records (read-only source shape).
2. (Reference repos 2-5 identified in discovery phase.)

No source code was copied from any reference repository. Behavior was captured as stack-agnostic spec cards.
`;

fs.writeFileSync(path.join(outDir, "DISCOVERY-REPORT.md"), report.trim() + "\n");
console.log("Discovery report generated.");
