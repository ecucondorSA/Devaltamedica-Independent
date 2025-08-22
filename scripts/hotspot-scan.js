import fs from 'fs';
import path from 'path';

const args = process.argv.slice(2);
const paths = args.find(arg => arg.startsWith('--paths'))?.split('=')[1]?.split(' ') || [];
const failOnCritical = args.includes('--fail-on-critical');

const HOTSPOT_PATTERNS = {
  critical: [
    /console\.log\(/g,
    /debugger;/g,
    /TODO:/g,
    /FIXME:/g,
    /\.only\(/g,
    /\.skip\(/g
  ],
  warning: [
    /any/g,
    /@ts-ignore/g,
    /@ts-expect-error/g,
    /eslint-disable/g
  ]
};

function scanHotspots(filePaths) {
  const results = {
    timestamp: new Date().toISOString(),
    files: [],
    summary: { critical: 0, warning: 0, total: 0 }
  };

  filePaths.forEach(filePath => {
    if (!filePath || !fs.existsSync(filePath)) return;
    
    const stat = fs.statSync(filePath);
    if (!stat.isFile() || !filePath.match(/\.(ts|tsx|js|jsx)$/)) return;
    
    const content = fs.readFileSync(filePath, 'utf8');
    const fileResult = { path: filePath, issues: [] };
    
    // Check critical patterns
    HOTSPOT_PATTERNS.critical.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        fileResult.issues.push({ 
          type: 'critical', 
          pattern: pattern.source, 
          count: matches.length 
        });
        results.summary.critical += matches.length;
      }
    });
    
    // Check warning patterns
    HOTSPOT_PATTERNS.warning.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        fileResult.issues.push({ 
          type: 'warning', 
          pattern: pattern.source, 
          count: matches.length 
        });
        results.summary.warning += matches.length;
      }
    });
    
    if (fileResult.issues.length > 0) {
      results.files.push(fileResult);
    }
  });
  
  results.summary.total = results.summary.critical + results.summary.warning;
  return results;
}

function generateReport(results) {
  let report = `# 🔎 Hotspot Scan Report\n\n`;
  report += `**Generated:** ${results.timestamp}\n\n`;
  report += `## 📊 Summary\n`;
  report += `- **Critical issues:** ${results.summary.critical}\n`;
  report += `- **Warning issues:** ${results.summary.warning}\n`;
  report += `- **Total issues:** ${results.summary.total}\n`;
  report += `- **Files scanned:** ${results.files.length}\n\n`;
  
  if (results.files.length === 0) {
    report += `✅ **No hotspots detected!**\n`;
    return report;
  }
  
  report += `## 🚨 Issues by File\n\n`;
  results.files.forEach(file => {
    report += `### \`${file.path}\`\n\n`;
    file.issues.forEach(issue => {
      const emoji = issue.type === 'critical' ? '🔴' : '⚠️';
      report += `- ${emoji} **${issue.type}**: ${issue.pattern} (${issue.count} matches)\n`;
    });
    report += '\n';
  });
  
  return report;
}

function main() {
  console.log('🔍 Starting hotspot scan...');
  
  if (paths.length === 0) {
    console.log('⚠️ No paths provided for scanning');
    return;
  }
  
  const results = scanHotspots(paths);
  const report = generateReport(results);
  
  // Write report to file
  fs.writeFileSync('scripts/HOTSPOT-REPORT.md', report);
  
  console.log(`📋 Hotspot scan completed:`);
  console.log(`  Critical: ${results.summary.critical}`);
  console.log(`  Warnings: ${results.summary.warning}`);
  console.log(`  Total: ${results.summary.total}`);
  
  if (failOnCritical && results.summary.critical > 0) {
    console.error(`❌ Critical hotspots found: ${results.summary.critical}`);
    process.exit(1);
  }
  
  if (results.summary.total > 0) {
    console.log('📄 Report saved to scripts/HOTSPOT-REPORT.md');
  } else {
    console.log('✅ No hotspots detected!');
  }
}

main();