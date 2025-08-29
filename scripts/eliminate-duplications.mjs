#!/usr/bin/env node
// Safe duplication scanner and optional fixer (dry-run by default)
// Focus: useAuth imports, patients-service relative imports, console.* in prod code

import fs from 'fs';
import path from 'path';
import glob from 'glob';

const args = process.argv.slice(2);
const WRITE = args.includes('--write');
const JSON_REPORT = args.includes('--json');

const repoRoot = process.cwd();

// Helpers
const read = (p) => fs.readFileSync(p, 'utf8');
const write = (p, s) => fs.writeFileSync(p, s, 'utf8');
const rel = (p) => path.relative(repoRoot, p);

const isTestFile = (f) => /(^|\/)__tests__\//.test(f) || /(\.|\/)test\.(ts|tsx|js|jsx)$/.test(f) || /(\.spec\.|\.stories\.)/.test(f);

// Targets
const FILE_GLOB = '**/*.{ts,tsx,js,jsx}';
const IGNORE = [
  '**/node_modules/**',
  '**/dist/**',
  '**/.next/**',
  '**/coverage/**',
  '**/.turbo/**',
];

const patterns = {
  useAuthWrongImport: /from\s+['"]@altamedica\/hooks\/auth['"]/g,
  patientServiceRelative: /from\s+['"](\.\.\/|\.\.\/\.\.\/)services\/patients-service['"]/g,
  consoleInProd: /\bconsole\.(log|error|warn|debug)\b/g,
};

const counters = {
  useAuthWrongImport: 0,
  patientServiceRelative: 0,
  consoleInProd: 0,
};

const touched = [];
const samples = {
  useAuthWrongImport: [],
  patientServiceRelative: [],
  consoleInProd: [],
};

function scanAndOptionallyFix(filePath) {
  const content = read(filePath);
  let updated = content;
  let changed = false;

  // useAuth import fix (safe)
  const beforeUseAuth = (updated.match(patterns.useAuthWrongImport) || []).length;
  if (beforeUseAuth) {
    counters.useAuthWrongImport += beforeUseAuth;
    samples.useAuthWrongImport.push(rel(filePath));
    if (WRITE) {
      updated = updated.replace(patterns.useAuthWrongImport, "from '@altamedica/auth'");
      changed = true;
    }
  }

  // patient-service relative imports (report only)
  const beforePatientSvc = (updated.match(patterns.patientServiceRelative) || []).length;
  if (beforePatientSvc) {
    counters.patientServiceRelative += beforePatientSvc;
    samples.patientServiceRelative.push(rel(filePath));
    // Intentionally do not rewrite by default (requires architectural choice)
  }

  // console.* in prod (report only; exclude test files)
  const beforeConsole = isTestFile(filePath) ? 0 : (updated.match(patterns.consoleInProd) || []).length;
  if (beforeConsole) {
    counters.consoleInProd += beforeConsole;
    samples.consoleInProd.push(rel(filePath));
  }

  if (WRITE && changed && updated !== content) {
    write(filePath, updated);
    touched.push(rel(filePath));
  }
}

function main() {
  const files = glob.sync(FILE_GLOB, { ignore: IGNORE, nodir: true });
  files.forEach(scanAndOptionallyFix);

  const report = {
    mode: WRITE ? 'write' : 'dry-run',
    totals: { ...counters },
    filesTouched: touched.length,
    samples: {
      useAuthWrongImport: samples.useAuthWrongImport.slice(0, 20),
      patientServiceRelative: samples.patientServiceRelative.slice(0, 20),
      consoleInProd: samples.consoleInProd.slice(0, 20),
    },
  };

  if (JSON_REPORT) {
    const outPath = path.join(repoRoot, 'DUPLICATIONS_SCAN_REPORT.json');
    write(outPath, JSON.stringify(report, null, 2));
    console.log(`[duplications] JSON report written to ${rel(outPath)}`);
  }

  // Human-readable summary
  console.log('\n=== Duplication Scan Summary ===');
  console.log(`Mode: ${report.mode}`);
  console.log(`- useAuth wrong imports: ${report.totals.useAuthWrongImport}`);
  console.log(`- patient-service relative: ${report.totals.patientServiceRelative}`);
  console.log(`- console.* in prod (excl. tests): ${report.totals.consoleInProd}`);
  console.log(`Files touched (when --write): ${report.filesTouched}`);
}

main();

