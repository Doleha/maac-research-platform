#!/usr/bin/env tsx

/**
 * Validation script to ensure project setup is correct
 * Run with: pnpm tsx scripts/validate-setup.ts
 */

import { existsSync } from 'fs';
import { join } from 'path';

const checks = [
  {
    name: 'Package directories exist',
    test: () => {
      const dirs = [
        'packages/shared-types',
        'packages/maac-framework',
        'packages/experiment-orchestrator',
        'packages/statistical-analysis',
        'apps/api',
        'apps/dashboard',
      ];
      return dirs.every((dir) => existsSync(join(process.cwd(), dir)));
    },
  },
  {
    name: 'Root configuration files exist',
    test: () => {
      const files = [
        'package.json',
        'turbo.json',
        'pnpm-workspace.yaml',
        'tsconfig.base.json',
        'docker-compose.yml',
      ];
      return files.every((file) => existsSync(join(process.cwd(), file)));
    },
  },
  {
    name: 'Node modules installed',
    test: () => existsSync(join(process.cwd(), 'node_modules')),
  },
];

console.log('🔍 Validating project setup...\n');

let passed = 0;
let failed = 0;

for (const check of checks) {
  try {
    if (check.test()) {
      console.log(`✅ ${check.name}`);
      passed++;
    } else {
      console.log(`❌ ${check.name}`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ ${check.name} - ${error.message}`);
    failed++;
  }
}

console.log(`\n📊 Results: ${passed} passed, ${failed} failed`);

if (failed > 0) {
  console.log('\n⚠️  Some checks failed. Please review the setup.');
  process.exit(1);
} else {
  console.log('\n✨ Project setup validated successfully!');
}
