import { execSync } from 'child_process';

console.log('====================================================');
console.log('CAMPUS HMS: EXECUTING FULL TEST SUITE (PHASES 3, 4, 5, 6, 8.1)');
console.log('====================================================\n');

try {
  console.log('>>> RUNNING PHASE 3: AUTHENTICATION & RBAC TESTS');
  execSync('node --max-old-space-size=4096 node_modules/tsx/dist/cli.mjs test-auth.ts', { stdio: 'inherit' });

  console.log('\n>>> RUNNING PHASE 4: COMPLAINTS, VOTING & FEEDBACK TESTS');
  execSync('node --max-old-space-size=4096 node_modules/tsx/dist/cli.mjs test-phase4.ts', { stdio: 'inherit' });

  console.log('\n>>> RUNNING PHASE 5: HOSTEL & ROOM ALLOCATION TESTS');
  execSync('node --max-old-space-size=4096 node_modules/tsx/dist/cli.mjs test-phase5.ts', { stdio: 'inherit' });

  console.log('\n>>> RUNNING PHASE 6: OPERATIONAL WORKFLOW INTEGRATION TESTS');
  execSync('node --max-old-space-size=4096 node_modules/tsx/dist/cli.mjs test-phase6.ts', { stdio: 'inherit' });

  console.log('\n>>> RUNNING PHASE 8.1: GATE PASS & SECURITY MANAGEMENT TESTS');
  execSync('node --max-old-space-size=4096 node_modules/tsx/dist/cli.mjs test-phase8.ts', { stdio: 'inherit' });

  console.log('\n====================================================');
  console.log('🎉 ALL INTEGRATION SUITES (PHASES 3 - 8.1) PASSED 100%!');
  console.log('====================================================');
} catch (error) {
  console.error('Test execution failed:', error);
  process.exit(1);
}
