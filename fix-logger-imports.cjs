const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Find all files with incorrect import
const files = glob.sync('apps/patients/**/*.{ts,tsx,js,jsx}', { 
  ignore: ['**/node_modules/**', '**/dist/**', '**/.next/**'] 
});

let fixedCount = 0;

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  const originalContent = content;
  
  // Replace incorrect imports
  content = content.replace(
    /@altamedica\/shared\/services\/logger\.service/g,
    '@altamedica/shared'
  );
  
  // Also fix any direct logger.service imports
  content = content.replace(
    /from ['"]\.\.\/.*?\/services\/logger\.service['"]/g,
    "from '@altamedica/shared'"
  );
  
  if (content !== originalContent) {
    fs.writeFileSync(file, content);
    console.log(`Fixed: ${file}`);
    fixedCount++;
  }
});

console.log(`\nFixed ${fixedCount} files with incorrect logger imports`);