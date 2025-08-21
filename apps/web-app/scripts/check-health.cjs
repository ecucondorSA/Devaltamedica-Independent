#!/usr/bin/env node

/**
 * Simple Health Check for AltaMedica Web App
 */

const http = require('http');

function checkHealth(url = 'http://localhost:3000') {
  console.log('\n🏥 AltaMedica Health Check\n');
  console.log(`Checking: ${url}\n`);

  const makeRequest = (path, label) => {
    return new Promise((resolve) => {
      const fullUrl = `${url}${path}`;
      
      http.get(fullUrl, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const status = res.statusCode;
          const emoji = status >= 200 && status < 400 ? '✅' : '❌';
          const color = status >= 200 && status < 400 ? '\x1b[32m' : '\x1b[31m';
          const reset = '\x1b[0m';
          
          console.log(`${emoji} ${label}: ${color}${status}${reset} - ${fullUrl}`);
          
          if (status === 500 && data.includes('Error')) {
            // Try to extract error message
            const errorMatch = data.match(/<pre[^>]*>([^<]+)<\/pre>/);
            if (errorMatch) {
              console.log(`   Error: ${errorMatch[1].substring(0, 100)}...`);
            }
          }
          
          resolve({ path, status, success: status >= 200 && status < 400 });
        });
      }).on('error', (err) => {
        console.log(`❌ ${label}: Failed - ${err.message}`);
        resolve({ path, status: 0, success: false });
      }).setTimeout(5000);
    });
  };

  // Check various endpoints
  Promise.all([
    makeRequest('/', 'Homepage'),
    makeRequest('/api/health', 'Health API'),
    makeRequest('/api/font-css', 'Font CSS'),
    makeRequest('/manifest.json', 'PWA Manifest'),
    makeRequest('/auth/login', 'Login Page'),
  ]).then(results => {
    console.log('\n📊 Summary:');
    const successful = results.filter(r => r.success).length;
    const total = results.length;
    const percentage = (successful / total * 100).toFixed(0);
    
    const color = percentage >= 80 ? '\x1b[32m' : percentage >= 50 ? '\x1b[33m' : '\x1b[31m';
    console.log(`${color}${successful}/${total} endpoints working (${percentage}%)\x1b[0m\n`);
    
    if (percentage < 100) {
      console.log('💡 Tips:');
      if (!results[0].success) {
        console.log('  - Homepage error: Check if all dependencies are installed (pnpm install)');
        console.log('  - Verify Firebase configuration in .env.local');
        console.log('  - Check if @altamedica/auth package is built');
      }
      if (!results[2].success) {
        console.log('  - Font CSS endpoint missing: Check api routes in app/api/font-css/route.ts');
      }
    }
  });
}

// Run
checkHealth();