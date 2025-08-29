#!/usr/bin/env node
/**
 * Consolidate Patient Analytics Imports
 * Safely rewrites imports to use PatientAnalyticsService from @altamedica/services
 * - Replaces: import { PatientService } from '@altamedica/services'
 *   with:     import { PatientAnalyticsService as PatientService } from '@altamedica/services'
 */

import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    if (e.name === 'node_modules' || e.name.startsWith('.')) continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory()) files.push(...walk(full));
    else if (e.isFile() && /\.(ts|tsx|js|jsx)$/.test(e.name)) files.push(full);
  }
  return files;
}

function rewrite(file) {
  const src = fs.readFileSync(file, 'utf8');
  let out = src;
  // direct import form
  out = out.replace(
    /import\s*\{([^}]*?)PatientService([^}]*)\}\s*from\s*['"]@altamedica\/services['"];?/g,
    (m, pre, post) => `import { ${pre}PatientAnalyticsService as PatientService${post} } from '@altamedica/services';`
  );
  if (out !== src) {
    fs.writeFileSync(file, out);
    return true;
  }
  return false;
}

const candidates = walk(ROOT);
let changed = 0;
for (const f of candidates) {
  try {
    if (rewrite(f)) changed++;
  } catch {}
}

console.log(`Consolidation complete. Files changed: ${changed}`);

