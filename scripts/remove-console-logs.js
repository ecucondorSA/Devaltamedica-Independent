const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const sensitivePatterns = [
  'patient', 'doctor', 'medical', 'health', 'diagnosis',
  'prescription', 'historial', 'token', 'password', 'email',
  'phone', 'address', 'dni', 'ssn', 'PHI', 'credential'
];

const targetDirs = [
  path.join(process.cwd(), 'apps'),
  path.join(process.cwd(), 'packages')
];

function findSensitiveLogs() {
  const results = [];
  
  targetDirs.forEach(dir => {
    if (!fs.existsSync(dir)) return;
    
    try {
      const grepPattern = sensitivePatterns.map(p => `-e "console.*${p}"`).join(' ');
      const command = `grep -r -n ${grepPattern} --include="*.ts" --include="*.tsx" --include="*.js" --include="*.jsx" "${dir}" 2>/dev/null || true`;
      
      const output = execSync(command, { encoding: 'utf8', shell: true });
      if (output) {
        output.split('\n').filter(Boolean).forEach(line => {
          const match = line.match(/^(.+):(\d+):(.+)$/);
          if (match) {
            results.push({
              file: match[1],
              line: parseInt(match[2]),
              content: match[3].trim()
            });
          }
        });
      }
    } catch (error) {}
  });
  
  return results;
}

function removeSensitiveLogs(logs) {
  const fileGroups = {};
  
  logs.forEach(log => {
    if (!fileGroups[log.file]) {
      fileGroups[log.file] = [];
    }
    fileGroups[log.file].push(log);
  });
  
  Object.keys(fileGroups).forEach(filePath => {
    if (!fs.existsSync(filePath)) return;
    
    let content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const logsToRemove = fileGroups[filePath].sort((a, b) => b.line - a.line);
    
    logsToRemove.forEach(log => {
      const lineIndex = log.line - 1;
      if (lines[lineIndex] && lines[lineIndex].includes('console.')) {
        if (process.env.NODE_ENV === 'production') {
          lines[lineIndex] = '';
        } else {
          lines[lineIndex] = lines[lineIndex].replace(
            /console\.(log|error|warn|info)/,
            '// [SECURITY] Removed sensitive console.$1'
          );
        }
      }
    });
    
    content = lines.filter(line => line !== '').join('\n');
    fs.writeFileSync(filePath, content);
  });
  
  return Object.keys(fileGroups).length;
}

function main() {
  console.log('🔍 Scanning for sensitive console.log statements...\n');
  
  const sensitiveLogs = findSensitiveLogs();
  
  if (sensitiveLogs.length === 0) {
    console.log('✅ No sensitive console.log statements found!');
    return;
  }
  
  console.log(`⚠️  Found ${sensitiveLogs.length} sensitive console.log statements:\n`);
  
  sensitiveLogs.slice(0, 10).forEach(log => {
    console.log(`  ${log.file}:${log.line}`);
    console.log(`    ${log.content.substring(0, 80)}...`);
  });
  
  if (sensitiveLogs.length > 10) {
    console.log(`  ... and ${sensitiveLogs.length - 10} more\n`);
  }
  
  console.log('\n🔧 Removing sensitive logs...');
  const filesModified = removeSensitiveLogs(sensitiveLogs);
  
  console.log(`\n✅ Complete! Modified ${filesModified} files, removed ${sensitiveLogs.length} sensitive logs.`);
}

main();