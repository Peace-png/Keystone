#!/usr/bin/env bun
import { SCAR_NETWORK } from './scar.ts';

console.log('=== SCAR NETWORK ALLOWLIST TEST ===\n');

// Test allowed URLs
const allowed = [
  'https://www.moltbook.com/api/v1/feed',
  'https://api.github.com/repos/test/repo',
  'https://discord.com/api/webhooks/123/abc',
  'http://localhost:5000/api/login',
  'https://cdn.discordapp.com/attachments/123/456',
];

console.log('ALLOWED URLs:');
let passed = 0;
let failed = 0;

for (const url of allowed) {
  const result = SCAR_NETWORK.isUrlAllowed(url);
  if (result.allowed) {
    console.log(`  ✓ PASS: ${url}`);
    passed++;
  } else {
    console.log(`  ✗ FAIL: ${url}`);
    console.log(`    Reason: ${result.reason}`);
    failed++;
  }
}

console.log('\nBLOCKED URLs:');
const blocked = [
  'https://evil.com/api',
  'https://moltbook.com/admin',
  'http://169.254.169.254/metadata',
  'https://randomsite.onion/test',
  'https://api.openai.com/v1/chat',
  'https://moltbook.com/internal/secret',
];

for (const url of blocked) {
  const result = SCAR_NETWORK.isUrlAllowed(url);
  if (!result.allowed) {
    console.log(`  ✓ BLOCKED: ${url}`);
    console.log(`    Reason: ${result.reason}`);
    passed++;
  } else {
    console.log(`  ✗ FAIL (should block): ${url}`);
    failed++;
  }
}

console.log('\n=== RESULTS ===');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(failed === 0 ? '\n✓ ALL TESTS PASSED' : '\n✗ SOME TESTS FAILED');

// Test safeFetch throws on blocked URL
console.log('\n=== SAFE FETCH TEST ===');
try {
  SCAR_NETWORK.validateUrl('https://evil.com/api');
  console.log('✗ FAIL: Should have thrown');
} catch (e) {
  console.log('✓ PASS: validateUrl threw error for blocked URL');
  console.log(`  Error: ${(e as Error).message.substring(0, 80)}...`);
}
