#!/usr/bin/env ts-node
/**
 * Recalculate valuation documents:
 *  - Reads metrics-report.json (regenerates if missing via repo-metrics.ts)
 *  - Computes replacement cost, discounts, premiums, floor range
 *  - Rewrites VALUATION_MODEL.md and VALUATION_REPORT.md replacing {{GENERATED_AT}} and numeric placeholders
 */
import { execSync } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';

interface MetricsReport {
  summary: { totals: { lines: number; source: number; test: number; doc: number } };
  duplication: { duplicationRatio: number };
}

const ROOT = process.cwd();
const metricsPath = path.join(ROOT, 'metrics-report.json');
const modelPath = path.join(ROOT, 'docs', 'VALUATION_MODEL.md');
const reportPath = path.join(ROOT, 'docs', 'VALUATION_REPORT.md');

async function ensureMetrics(): Promise<MetricsReport> {
  if (!(await exists(metricsPath))) {
    console.log('[valuation] metrics-report.json missing → generating');
    execSync('npx ts-node tools/metrics/repo-metrics.ts > metrics-report.json', { stdio: 'inherit' });
  }
  const raw = await fs.readFile(metricsPath, 'utf8');
  return JSON.parse(raw) as MetricsReport;
}

async function exists(p: string) {
  try { await fs.access(p); return true; } catch { return false; }
}

function formatUSD(n: number): string { return n.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }); }

async function recalc() {
  const metrics = await ensureMetrics();
  const source = metrics.summary.totals.source; // 331,923
  const tests = metrics.summary.totals.test;    // 54,873
  const docs = metrics.summary.totals.doc;      // 43,864 (informativo)

  // Assumptions (keep in sync with model doc)
  const testWeight = 0.6;
  const locPerDay = 60; // net effective
  const dailyCost = 450;
  const factorIntegration = 1.25;
  const factorDomain = 1.15;
  const consolidationFactor = 0.82; // (1 - 0.18)
  const efficiencyPremiumPct = 0.10;
  const strategicPremiumPct = 0.08;
  // Risk components (sum 27%)
  const riskPct = 0.27;

  const weightedLOC = source + tests * testWeight;
  const baseDays = weightedLOC / locPerDay;
  const factoredDays = baseDays * factorIntegration * factorDomain;
  const finalDays = factoredDays * consolidationFactor;
  const replacementCost = finalDays * dailyCost;
  const riskDiscount = replacementCost * riskPct;
  const efficiencyPremium = replacementCost * efficiencyPremiumPct;
  const strategicPremium = replacementCost * strategicPremiumPct;
  const floor = replacementCost - riskDiscount + efficiencyPremium + strategicPremium;
  const sensitivity = 0.12;
  const lower = floor * (1 - sensitivity);
  const upper = floor * (1 + sensitivity);

  const calcBlock = {
    weightedLOC, baseDays, factoredDays, finalDays, replacementCost, riskDiscount, efficiencyPremium, strategicPremium, floor, lower, upper
  };

  console.log('[valuation] Calculation summary:', calcBlock);

  const generatedAt = new Date().toISOString();
  await rewrite(modelPath, generatedAt, calcBlock, metrics);
  await rewrite(reportPath, generatedAt, calcBlock, metrics);
}

async function rewrite(filePath: string, generatedAt: string, calc: any, metrics: MetricsReport) {
  if (!(await exists(filePath))) return;
  let content = await fs.readFile(filePath, 'utf8');
  content = content
    .replace(/Generado: .*?(\r?\n)/, `Generado: ${generatedAt}$1`)
    .replace(/331,923/g, formatUSD(metrics.summary.totals.source))
    .replace(/54,873/g, formatUSD(metrics.summary.totals.test))
    .replace(/43,864/g, formatUSD(metrics.summary.totals.doc))
    .replace(/430,660/g, formatUSD(metrics.summary.totals.lines || (metrics.summary.totals.source + metrics.summary.totals.test + metrics.summary.totals.doc)))
    .replace(/364,847/g, formatUSD(Math.round(calc.weightedLOC)))
    .replace(/6,081/g, formatUSD(Math.round(calc.baseDays)))
    .replace(/8,744/g, formatUSD(Math.round(calc.factoredDays)))
    .replace(/7,169/g, formatUSD(Math.round(calc.finalDays)))
    .replace(/3,226,050/g, formatUSD(Math.round(calc.replacementCost)))
    .replace(/870,000/g, formatUSD(Math.round(calc.riskDiscount)))
    .replace(/322,605/g, formatUSD(Math.round(calc.efficiencyPremium)))
    .replace(/258,084/g, formatUSD(Math.round(calc.strategicPremium)))
    .replace(/2,936,739/g, formatUSD(Math.round(calc.floor)))
    .replace(/2.58 M USD/g, `${(calc.lower/1_000_000).toFixed(2)} M USD`)
    .replace(/2.94 M USD/g, `${(calc.floor/1_000_000).toFixed(2)} M USD`)
    .replace(/3.29 M USD/g, `${(calc.upper/1_000_000).toFixed(2)} M USD`)
    .replace(/{{GENERATED_AT}}/g, generatedAt);

  await fs.writeFile(filePath, content, 'utf8');
  console.log('[valuation] Updated', path.basename(filePath));
}

recalc().catch(e => { console.error('[valuation] ERROR', e); process.exit(1); });
