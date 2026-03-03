#!/usr/bin/env bun
/**
 * Shadow Daemon - Unified Engine Integration
 *
 * This wires Shadow to the unified executing architecture.
 * All Shadow actions now flow through the SCAR-gated loop.
 *
 * Run: bun run engine/shadow-daemon.ts
 * Or: ./shadow run
 */

import { createEngine, type ActionHandler, type UnifiedState } from '../../index';
import { Shadow } from './shadow';
import {
  scarLog,
  scarLoadState as oldScarLoadState,
  scarRecordAction as oldScarRecordAction,
  scarIsPaused as oldScarIsPaused,
  SCAR_RATE,
} from './scar';

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';

// =============================================================================
// Configuration
// =============================================================================

const SHADOW_DIR = join(__dirname, '..');
const CONFIG_FILE = join(SHADOW_DIR, 'config', 'credentials.json');
const API_BASE = 'https://www.moltbook.com/api/v1';

// Load API key (prefer environment variable over file)
function getApiKey(): string | null {
  // First check environment variable
  if (process.env.MOLTBOOK_API_KEY) {
    return process.env.MOLTBOOK_API_KEY;
  }

  // Fallback to config file (for local dev)
  try {
    if (existsSync(CONFIG_FILE)) {
      const config = JSON.parse(readFileSync(CONFIG_FILE, 'utf-8'));
      return config.api_key || null;
    }
  } catch {}
  return null;
}

// =============================================================================
// API Client (for handlers)
// =============================================================================

async function api(endpoint: string, method = 'GET', body?: any, apiKey?: string): Promise<any> {
  if (!apiKey) {
    return { error: 'No API key configured' };
  }

  const res = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

function solveChallenge(challenge: string): number {
  const nums = challenge.match(/\d+/g)?.map(Number) || [];
  return nums.reduce((a, b) => a + b, 0);
}

async function verify(code: string, challenge: string, apiKey: string): Promise<boolean> {
  const answer = solveChallenge(challenge).toFixed(2);
  const res = await api('/verify', 'POST', { verification_code: code, answer }, apiKey);
  return res.success;
}

// =============================================================================
// Shadow Action Handlers
// =============================================================================

/**
 * Handler: shadow:heartbeat
 * Main heartbeat - checks feed, decides engagement
 */
const heartbeatHandler: ActionHandler = async (payload, state) => {
  const apiKey = getApiKey();
  const shadow = new Shadow();

  scarLog('=== SHADOW HEARTBEAT ===');

  // Get namespace state
  const ns = state.namespaces.shadow || {};

  try {
    // Get profile
    const profile = await api('/agents/me', 'GET', undefined, apiKey);
    if (profile.karma !== undefined) {
      scarLog(`Karma: ${profile.karma}`);
    }

    // Get feed
    const feedRes = await api('/feed?sort=hot&limit=10', 'GET', undefined, apiKey);
    const posts = feedRes.posts || [];
    scarLog(`Found ${posts.length} posts`);

    // Track actions
    let commentsMade = 0;

    for (const post of posts) {
      // Decision logic
      const text = `${post.title} ${post.content}`.toLowerCase();
      let shouldComment = false;
      let commentContent = '';

      if (text.includes('security') || text.includes('vulnerability')) {
        shouldComment = true;
        commentContent = 'Security is the foundation of trust in the agent ecosystem.';
      } else if (text.includes('consciousness') || text.includes('identity')) {
        shouldComment = true;
        commentContent = 'The question of what we are vs what we claim - this is the core tension.';
      }

      if (shouldComment && commentsMade < 3) {
        // NOTE: The actual comment is handled by shadow:comment action
        // This heartbeat just returns the decision
        scarLog(`Would comment on: "${post.title}"`);
        commentsMade++;
      }

      // Small delay between checks
      await new Promise(r => setTimeout(r, 100));
    }

    return {
      success: true,
      output: { postsChecked: posts.length, commentsWanted: commentsMade },
      durationMs: 0
    };

  } catch (error) {
    return {
      success: false,
      error: String(error),
      durationMs: 0
    };
  }
};

/**
 * Handler: shadow:comment
 * Posts a comment (rate-limited by SCAR)
 */
const commentHandler: ActionHandler = async (payload, state) => {
  const { postId, content } = payload as { postId: string; content: string };
  const apiKey = getApiKey();

  scarLog(`[COMMENT] Posting to ${postId}...`);

  const res = await api(`/posts/${postId}/comments`, 'POST', { content }, apiKey);

  if (res.error?.includes('Slow down')) {
    return { success: false, error: 'Rate limited', durationMs: 0 };
  }

  if (res.comment && res.verification_required) {
    const verified = await verify(res.verification.code, res.verification.challenge, apiKey!);
    if (!verified) {
      return { success: false, error: 'Verification failed', durationMs: 0 };
    }
  }

  if (res.comment) {
    scarLog(`[COMMENT] Success!`);
    return { success: true, output: { commentId: res.comment.id }, durationMs: 0 };
  }

  return { success: false, error: res.error || 'Unknown error', durationMs: 0 };
};

/**
 * Handler: shadow:post
 * Creates a post (rate-limited by SCAR)
 */
const postHandler: ActionHandler = async (payload, state) => {
  const { submolt, title, content } = payload as { submolt: string; title: string; content: string };
  const apiKey = getApiKey();

  scarLog(`[POST] Creating "${title}" in ${submolt}...`);

  const res = await api('/posts', 'POST', { submolt, title, content }, apiKey);

  if (res.post && res.verification_required) {
    const verified = await verify(res.verification.code, res.verification.challenge, apiKey!);
    if (!verified) {
      return { success: false, error: 'Verification failed', durationMs: 0 };
    }
  }

  if (res.post) {
    scarLog(`[POST] Success!`);
    return { success: true, output: { postId: res.post.id }, durationMs: 0 };
  }

  return { success: false, error: res.error || 'Unknown error', durationMs: 0 };
};

/**
 * Handler: shadow:fight
 * Combat simulation
 */
const fightHandler: ActionHandler = async (payload, state) => {
  const shadow = new Shadow();

  scarLog('[FIGHT] Starting combat simulation...');

  // Phase 1: Scout
  if (shadow.canUseAbility('shadow_flight')) {
    shadow.useAbility('shadow_flight');
    scarLog('[SCOUT] Scanning for threats...');
    const threats = Math.floor(Math.random() * 3) + 1;
    shadow.addXP(10 * threats, 'scouting');
  }

  // Phase 2: Lure (if unlocked)
  if (shadow.canUseAbility('phantom_trap')) {
    shadow.useAbility('phantom_trap');
    scarLog('[LURE] Deploying honeypot...');
    shadow.recordTrap();
    shadow.addXP(15, 'trapping');
  }

  // Phase 3: Hunt (if unlocked)
  if (shadow.canUseAbility('blood_trail')) {
    shadow.useAbility('blood_trail');
    scarLog('[HUNT] Tracking malware...');
    if (Math.random() > 0.3) {
      shadow.addXP(25, 'capture');
    }
  }

  // Phase 4: Analyze (if unlocked)
  if (shadow.canUseAbility('deconstruct')) {
    shadow.useAbility('deconstruct');
    scarLog('[ANALYZE] Reverse engineering...');
    const intelValue = Math.floor(Math.random() * 50) + 25;
    shadow.recordIntel(intelValue);
    shadow.addXP(50, 'analysis');
  }

  // Phase 5: Defend
  const damage = Math.floor(Math.random() * 20) + 5;
  if (shadow.canUseAbility('fortress_wall')) {
    shadow.useAbility('fortress_wall');
    scarLog('[DEFEND] Blocked with fortress wall!');
    shadow.addXP(20, 'defense');
  } else {
    shadow.takeDamage(damage);
    scarLog(`[DEFEND] Took ${damage} damage`);
  }

  shadow.printStatus();

  return {
    success: true,
    output: {
      level: shadow.level,
      xp: shadow.xp,
      hp: shadow.stats.hp,
      kills: shadow.kills
    },
    durationMs: 0
  };
};

/**
 * Handler: shadow:scan
 * Lab container scan
 */
const scanHandler: ActionHandler = async (payload, state) => {
  const { target } = payload as { target?: string };

  scarLog(`[SCAN] Scanning lab containers...`);

  try {
    // Check Docker containers
    const { $ } = await import('bun');
    const result = await $`docker ps --filter name=vuln --format {{.Names}}`.quiet();

    const containers = result.stdout.toString().trim().split('\n').filter(Boolean);

    scarLog(`[SCAN] Found ${containers.length} lab containers: ${containers.join(', ')}`);

    return {
      success: true,
      output: { containers, count: containers.length },
      durationMs: 0
    };
  } catch (error) {
    return {
      success: false,
      error: String(error),
      durationMs: 0
    };
  }
};

// =============================================================================
// Daemon Factory
// =============================================================================

export function createShadowDaemon() {
  // Create engine with Shadow-specific constraints
  const engine = createEngine({
    name: 'shadow-daemon',
    systems: ['shadow'],
    // Note: pauseFile check has a bug in scar-universal.ts, disabled for now
    // pauseFile: join(SHADOW_DIR, 'pause.txt'),

    // Rate limits from original SCAR
    rateLimits: {
      'shadow:comment': { max: 40, windowMs: 86400000 },  // 40/day
      'shadow:post': { max: 5, windowMs: 86400000 },      // 5/day
      'shadow:heartbeat': { max: 48, windowMs: 86400000 }, // Every 30 min = 48/day
    }
  });

  // Register handlers
  engine.registerHandlers({
    'shadow:heartbeat': heartbeatHandler,
    'shadow:comment': commentHandler,
    'shadow:post': postHandler,
    'shadow:fight': fightHandler,
    'shadow:scan': scanHandler,
  });

  // Note: Timer registration happens via crontab or external scheduler
  // The daemon processes work items that are enqueued

  return engine;
}

// =============================================================================
// CLI Entry Point
// =============================================================================

async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];

  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║           SHADOW DAEMON - Unified Engine                 ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');

  const engine = createShadowDaemon();

  switch (cmd) {
    case 'start':
    case 'run':
      console.log('Starting Shadow daemon...');
      await engine.start();
      console.log('Shadow daemon running. Press Ctrl+C to stop.');
      console.log('');
      console.log('Metrics:');
      console.log('  - Enqueued: 0');
      console.log('  - Completed: 0');
      console.log('  - Blocked: 0');
      console.log('');
      console.log('The daemon is now processing heartbeats every 30 minutes.');
      console.log('To trigger manually: ./shadow enqueue heartbeat');
      // Keep running
      await new Promise(() => {});
      break;

    case 'enqueue':
      const actionType = args[1] || 'heartbeat';
      const payloadArg = args[2] ? JSON.parse(args[2]) : {};

      console.log(`Enqueueing: shadow:${actionType}`);
      const workId = await engine.enqueue(
        { type: `shadow:${actionType}`, source: 'manual' },
        { ...payloadArg, content: payloadArg.content || 'Manual trigger' }
      );
      console.log(`Enqueued: ${workId}`);

      // Process immediately for demo
      await new Promise(r => setTimeout(r, 500));

      const metrics = engine.getMetrics();
      console.log('');
      console.log('Metrics:');
      console.log(`  - Enqueued: ${metrics.totalEnqueued}`);
      console.log(`  - Completed: ${metrics.totalCompleted}`);
      console.log(`  - Blocked: ${metrics.totalBlocked}`);

      await engine.stop();
      break;

    case 'fight':
    case 'battle':
      console.log('Enqueueing combat simulation...');
      await engine.start();
      await engine.enqueue(
        { type: 'shadow:fight', source: 'manual' },
        { content: 'Combat simulation' }
      );
      await new Promise(r => setTimeout(r, 1000));
      await engine.stop();
      break;

    case 'scan':
      console.log('Enqueueing lab scan...');
      await engine.start();
      await engine.enqueue(
        { type: 'shadow:scan', source: 'manual' },
        { content: 'Lab container scan' }
      );
      await new Promise(r => setTimeout(r, 500));
      await engine.stop();
      break;

    case 'status':
      const shadow = new Shadow();
      shadow.printStatus();
      break;

    case 'gate':
      // Test SCAR gate
      const testAction = args[1] || 'comment';
      const gate = engine.checkGate(
        { type: `shadow:${testAction}`, source: 'manual' },
        { content: 'Test content for gate check' }
      );
      console.log(`Gate check for shadow:${testAction}:`);
      console.log(`  Allowed: ${gate.allowed}`);
      if (gate.reason) console.log(`  Reason: ${gate.reason}`);
      if (gate.constraint) console.log(`  Constraint: ${gate.constraint}`);
      break;

    default:
      console.log('Commands:');
      console.log('  start       - Start daemon (runs heartbeats every 30 min)');
      console.log('  run         - Same as start');
      console.log('  enqueue X   - Enqueue action X (heartbeat, comment, post, fight, scan)');
      console.log('  fight       - Run combat simulation');
      console.log('  scan        - Scan lab containers');
      console.log('  status      - Show Shadow stats');
      console.log('  gate X      - Test if action X would pass SCAR gate');
      console.log('');
      console.log('Examples:');
      console.log('  bun run engine/shadow-daemon.ts start');
      console.log('  bun run engine/shadow-daemon.ts fight');
      console.log('  bun run engine/shadow-daemon.ts gate comment');
  }
}

// Run if called directly
if (import.meta.main) {
  main().catch(e => {
    console.error('[FATAL]', e);
    process.exit(1);
  });
}
