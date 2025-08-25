import { execSync } from 'child_process';

const packages = ['types', 'auth', 'ui', 'hooks', 'api-client', 'telemedicine-core'];
const apps = ['api-server', 'doctors', 'patients', 'companies', 'admin', 'web-app', 'signaling-server'];

console.log('🔍 E2E Validation Starting...\n');

// Validate packages
packages.forEach(pkg => {
  try {
    execSync(`pnpm --filter "@altamedica/${pkg}" build`, {stdio: 'pipe'});
    console.log(`✅ Package ${pkg}: BUILD SUCCESS`);
  } catch {
    console.log(`❌ Package ${pkg}: BUILD FAILED`);
  }
});

// Validate apps
apps.forEach(app => {
  try {
    execSync(`pnpm --filter "${app}" type-check`, {stdio: 'pipe'});
    console.log(`✅ App ${app}: TYPE-CHECK SUCCESS`);
  } catch {
    console.log(`❌ App ${app}: TYPE-CHECK FAILED`);
  }
});
