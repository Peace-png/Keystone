#!/usr/bin/env bun
/**
 * Test script for Unified Engine
 */

import { createEngine } from './index';

console.log('=== UNIFIED ENGINE TEST ===\n');

// Create engine
const engine = createEngine({
  name: 'test-engine',
  systems: ['pai', 'clawmem', 'shadow'],
  rateLimits: {
    'test:action': { max: 5, windowMs: 60000 }  // 5 per minute
  }
  // No pauseFile - testing without it first
});

console.log('✓ Engine created');

// Register a simple handler
engine.registerHandler('test:action', async (payload, state) => {
  console.log(`  → Handler executing with payload:`, payload);
  return { success: true, output: `Processed: ${payload}`, durationMs: 10 };
});

console.log('✓ Handler registered');

// Test 1: Check SCAR gate (should pass)
const check1 = engine.checkGate({ type: 'test:action', source: 'manual' }, { test: 1, content: 'gate check test' });
console.log(`✓ Gate check 1: ${check1.allowed ? 'ALLOWED' : 'BLOCKED'}`);

// Start engine
console.log('\nStarting engine...');
engine.start();
console.log('✓ Engine started');

// Enqueue some work
async function runTests() {
  console.log('\nEnqueueing work...\n');

  for (let i = 1; i <= 3; i++) {
    const workId = await engine.enqueue(
      { type: 'test:action', source: 'manual' },
      { iteration: i, content: `Test payload ${i}` },  // Added content field
      { priority: 'normal' }
    );
    console.log(`✓ Work ${i} enqueued: ${workId.slice(0, 8)}...`);
  }

  // Wait for processing
  await new Promise(r => setTimeout(r, 500));

  // Check metrics
  const metrics = engine.getMetrics();
  console.log('\n=== METRICS ===');
  console.log(`  Enqueued: ${metrics.totalEnqueued}`);
  console.log(`  Completed: ${metrics.totalCompleted}`);
  console.log(`  Blocked: ${metrics.totalBlocked}`);
  console.log(`  Failed: ${metrics.totalFailed}`);

  // Get observations
  const observations = engine.getObservations(10);
  console.log('\n=== RECENT OBSERVATIONS ===');
  for (const obs of observations.slice(-5)) {
    console.log(`  [${obs.type}] ${obs.action.type}`);
  }

  // Test rate limiting - enqueue 10 more (should hit limit)
  console.log('\n=== RATE LIMIT TEST ===');
  for (let i = 1; i <= 10; i++) {
    await engine.enqueue(
      { type: 'test:action', source: 'manual' },
      { rateTest: i, content: `Rate test ${i}` },  // Added content field
      { priority: 'low' }
    );
  }

  await new Promise(r => setTimeout(r, 500));

  const metrics2 = engine.getMetrics();
  console.log(`  Enqueued: ${metrics2.totalEnqueued}`);
  console.log(`  Completed: ${metrics2.totalCompleted}`);
  console.log(`  Blocked: ${metrics2.totalBlocked} (rate limited)`);

  // Stop engine
  console.log('\nStopping engine...');
  await engine.stop();
  console.log('✓ Engine stopped');

  console.log('\n=== TEST COMPLETE ===');
}

runTests().catch(console.error);
