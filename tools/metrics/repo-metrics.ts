#!/usr/bin/env ts-node
/**
 * Repo Metrics Script
 * Recorre el monorepo y genera métricas básicas:
 *  - Líneas por tipo: source (.ts/.tsx/.js), test (.*test.*|.*spec.*), docs (.md)
 *  - Distribución apps vs packages vs otros
 *  - Detección aproximada de duplicación (hash de líneas significativas repetidas)
 *  - Conteo de ficheros
 * Salida: JSON en stdout
 */
import crypto from 'crypto';
import { promises as fs } from 'fs';
import path from 'path';

interface FileStat {
  path: string;
  lines: number;
  kind: 'source' | 'test' | 'doc' | 'other';
  area: 'app' | 'package' | 'root' | 'other';
}

const repoRoot = process.cwd();
const INCLUDED_EXT = ['.ts', '.tsx', '.js', '.md'];
const IGNORE_DIR_PARTS = ['node_modules', 'dist', 'build', '.turbo', '.next', 'coverage', '.git'];

function classifyKind(file: string, ext: string): FileStat['kind'] {
  if (ext === '.md') return 'doc';
  if (/test|spec|\.stories\./i.test(file)) return 'test';
  if (['.ts', '.tsx', '.js'].includes(ext)) return 'source';
  return 'other';
}

function classifyArea(abs: string): FileStat['area'] {
  const rel = path.relative(repoRoot, abs).replace(/\\/g, '/');
  if (rel.startsWith('apps/')) return 'app';
  if (rel.startsWith('packages/')) return 'package';
  if (rel.indexOf('/') === -1) return 'root';
  return 'other';
}

async function walk(dir: string, acc: string[] = []): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const full = path.join(dir, e.name);
    const rel = path.relative(repoRoot, full).replace(/\\/g, '/');
    if (IGNORE_DIR_PARTS.some(p => rel.split('/').includes(p))) continue;
    if (e.isDirectory()) {
      acc = await walk(full, acc);
    } else {
      const ext = path.extname(e.name);
      if (INCLUDED_EXT.includes(ext)) acc.push(full);
    }
  }
  return acc;
}

function hashLine(line: string) {
  return crypto.createHash('sha1').update(line.trim()).digest('base64');
}

async function collect(): Promise<{ files: FileStat[]; duplication: { repeatedLineHashes: number; totalLines: number; duplicationRatio: number } }> {
  const files: FileStat[] = [];
  const filePaths = await walk(repoRoot);
  const lineHashFrequency: Record<string, number> = {};
  let totalLinesGlobal = 0;

  for (const fp of filePaths) {
    const content = await fs.readFile(fp, 'utf8');
    const lines = content.split(/\r?\n/);
    const ext = path.extname(fp);
    const kind = classifyKind(fp, ext);
    const area = classifyArea(fp);
    files.push({ path: path.relative(repoRoot, fp), lines: lines.length, kind, area });
    totalLinesGlobal += lines.length;

    if (kind === 'source') {
      for (const l of lines) {
        if (!l.trim()) continue;
        if (l.trim().startsWith('//')) continue; // skip comments
        if (l.trim().length < 8) continue; // skip very short
        const h = hashLine(l);
        lineHashFrequency[h] = (lineHashFrequency[h] || 0) + 1;
      }
    }
  }

  const repeated = Object.values(lineHashFrequency).filter(c => c > 1).reduce((a, b) => a + b, 0);
  const duplicationRatio = totalLinesGlobal ? repeated / totalLinesGlobal : 0;

  return { files, duplication: { repeatedLineHashes: repeated, totalLines: totalLinesGlobal, duplicationRatio } };
}

function aggregate(files: FileStat[]) {
  const summary = {
    totalFiles: files.length,
    totals: {
      lines: files.reduce((a, f) => a + f.lines, 0),
      source: files.filter(f => f.kind === 'source').reduce((a, f) => a + f.lines, 0),
      test: files.filter(f => f.kind === 'test').reduce((a, f) => a + f.lines, 0),
      doc: files.filter(f => f.kind === 'doc').reduce((a, f) => a + f.lines, 0),
    },
    byArea: {} as Record<string, { lines: number; files: number; source: number; test: number; doc: number }>,
  };

  for (const f of files) {
    if (!summary.byArea[f.area]) summary.byArea[f.area] = { lines: 0, files: 0, source: 0, test: 0, doc: 0 };
    const bucket = summary.byArea[f.area];
    bucket.lines += f.lines;
    bucket.files += 1;
    if (f.kind === 'source') bucket.source += f.lines; else if (f.kind === 'test') bucket.test += f.lines; else if (f.kind === 'doc') bucket.doc += f.lines;
  }
  return summary;
}

(async () => {
  try {
    const { files, duplication } = await collect();
    const summary = aggregate(files);
    const report = { generatedAt: new Date().toISOString(), summary, duplication };
    console.log(JSON.stringify(report, null, 2));
  } catch (e:any) {
    console.error('ERROR_METRICS', e.message);
    process.exit(1);
  }
})();
