#!/usr/bin/env bun
/**
 * SCAR Session Checkpoint - Phase 3: Safe First Wire-up
 *
 * PURPOSE:
 * At session end, analyze session activity and surface relevant SCAR advisories.
 * This is a NON-BLOCKING checkpoint - it only appends to SESSION.md.
 *
 * TRIGGER: Manual call at session end, or hooked into shutdown sequence
 *
 * INPUT:
 * - Reads SESSION.md for session activity (EVENTS section only)
 * - Reads SOUL.md via SCAR daemon
 *
 * OUTPUT:
 * - Appends "## SCAR Advisories" section to SESSION.md if matches found
 *
 * SAFETY:
 * - Non-blocking: Only logs/appends, never blocks
 * - Single checkpoint: Only runs at session end
 * - No runtime hooks: Doesn't intercept during session
 */

import { readFileSync, existsSync, appendFileSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';

const KEYSTONE_DIR = join(__dirname, '..');
const SESSION_FILE = join(KEYSTONE_DIR, 'constitution/SESSION.md');
const SCAR_LOG_DIR = join(__dirname, 'scar-daemon');

// Import SCAR daemon
import { daemon } from './scar-daemon.ts';

// Tag vocabulary for machine-readable filtering (future use)
const ALLOWED_DOMAINS = ['scar', 'witness', 'memory', 'core', 'search', 'shadow', 'firewall', 'git', 'boot'] as const;
const ALLOWED_RISKS = ['low', 'medium', 'high'] as const;
const ALLOWED_SIGNAL = ['verification', 'failure', 'mismatch', 'config', 'deletion', 'security', 'performance'] as const;

/**
 * Extract ONLY the EVENTS section from SESSION.md
 * This is the operational feed - actions, errors, outcomes
 * NOT the narrative/philosophy sections
 *
 * Expected format (lightweight, optional):
 *   **Event Title**
 *   - Intent: [what was attempted]
 *   - Action: [what operation occurred]
 *   - Outcome: [result/error/success]
 *   - Tags: domain=X risk=Y artifact=Z signal=W (optional, machine-readable)
 *
 * This mirrors SCAR's internal structure:
 *   Intent → Action → Outcome ≈ Wound → Consequence → Checks
 */
function extractEventsSection(sessionContent: string): string {
  const lines = sessionContent.split('\n');
  const events: string[] = [];
  let inEventsSection = false;

  for (const line of lines) {
    // Check if we're entering the EVENTS section
    if (line.startsWith('## EVENTS')) {
      inEventsSection = true;
      continue;
    }

    // Check if we've hit another ## section (exit)
    if (inEventsSection && line.startsWith('## ') && !line.startsWith('## EVENTS')) {
      break;
    }

    // Collect bullet points in the EVENTS section
    if (inEventsSection) {
      const trimmed = line.trim();
      if (trimmed.startsWith('- ')) {
        events.push(trimmed.slice(2)); // Remove "- " prefix
      }
    }
  }

    return events.join(' | ');
}

/**
 * Compute a short hash of the events section for de-dupe
 */
function hashEvents(eventsText: string): string {
  return createHash('sha256').update(eventsText).digest('hex').slice(0, 8);
}

/**
 * Check if an advisory for this scar+events_hash already exists in SESSION.md
 * Looks for marker: <!-- SCAR_ADVISORY: P5 a1b2c3d4 -->
 */
function advisoryExists(sessionContent: string, scarId: string, eventsHash: string): boolean {
  const marker = `<!-- SCAR_ADVISORY: ${scarId} ${eventsHash} -->`;
  return sessionContent.includes(marker);
}

/**
 * Get current SESSION.md content for de-dupe check
 */
function getSessionContent(): string {
  try {
    if (existsSync(SESSION_FILE)) {
      return readFileSync(SESSION_FILE, 'utf-8');
    }
  } catch {
    // Ignore errors, fail open
  }
  return '';
}

/**
 * Check if advisory marker already exists in session content
 */
function advisoryExists(sessionContent: string, scarId: string, eventsHash: string): boolean {
  const marker = `<!-- SCAR_ADVISORY: ${scarId} ${eventsHash} -->`;
  return sessionContent.includes(marker);
}

/**
 * Parse optional Tags from an event string
 * Returns normalized tags object (future use: filtering, routing)
 */
function parseTags(eventText: string): Record<string, string> {
  const tags: Record<string, string> = {};

  // Match key=value patterns
  const tagMatches = eventText.match(/(\w+)=([^\s]+)/g);
  if (tagMatches) {
    for (const match of tagMatches) {
      const parts = match.split('=');
      const key = parts[0].toLowerCase();
      const value = parts[1]?.toLowerCase() || '';
      tags[key] = value;
    }
  }

  return tags;
}

/**
 * Run SCAR checkpoint and return advisories
 */
function runCheckpoint(sessionSummary: string): {
  matched: boolean;
  advisories: Array<{
    id: string;
    rule: string;
    advisory: {
    wound?: string;
    consequence?: string;
    checks?: string[];
    remember?: string;
  };
  relevance: number;
  }>;
} {
  const result = daemon.match(sessionSummary);

  if (!result.matched || !result.advisory) {
    return { matched: false, advisories: [] };
  }

  return {
    matched: true,
    advisories: [{
      id: result.scar!.id,
      rule: result.scar!.rule,
      advisory: result.advisory,
      relevance: result.relevance
    }]
  };
}

/**
 * Append SCAR advisories to SESSION.md
 * Includes de-dupe marker for each advisory
 */
function appendAdvisories(
  advisories: typeof runCheckpoint extends (s: string) => infer R ? R['advisories'] : never,
  eventsHash: string,
  sessionContent: string
): { appended: boolean; skipped: string[] } {
  if (advisories.length === 0) return { appended: false, skipped: [] };

  const timestamp = new Date().toISOString().split('T')[0];
  const skipped: string[] = [];
  let hasNewAdvisories = false;

  let section = '\n---\n\n## SCAR Advisories (Session End Checkpoint)\n\n';
  section += `**Generated:** ${timestamp}\n`;
  section += `**Events Hash:** ${eventsHash}\n\n`;

  for (const adv of advisories) {
    // De-dupe check: skip if advisory already exists for this scar+hash
    if (advisoryExists(sessionContent, adv.id, eventsHash)) {
      skipped.push(adv.id);
      console.log(`[SCAR-CHECKPOINT] Skipping duplicate advisory for ${adv.id}`);
      continue;
    }

    hasNewAdvisories = true;

    // Add de-dupe marker
    section += `<!-- SCAR_ADVISORY: ${adv.id} ${eventsHash} -->\n\n`;
    section += `### ${adv.id} (${(adv.relevance * 100).toFixed(0)}% relevance)\n\n`;
    section += `**Rule:** ${adv.rule.slice(0, 100)}...\n\n`;

    if (adv.advisory.wound) {
      section += `**Wound:** ${adv.advisory.wound.slice(0, 200)}...\n\n`;
    }
    if (adv.advisory.consequence) {
      section += `**Consequence:** ${adv.advisory.consequence.slice(0, 200)}...\n\n`;
    }
    if (adv.advisory.checks && adv.advisory.checks.length > 0) {
      section += `**Checks:**\n`;
      for (const check of adv.advisory.checks.slice(0, 3)) {
        section += `- ${check.slice(0, 100)}...\n`;
      }
      section += '\n';
    }
    if (adv.advisory.remember) {
      section += `> ${adv.advisory.remember}\n\n`;
    }
  }

  if (!hasNewAdvisories) {
    return { appended: false, skipped };
  }

  try {
    appendFileSync(SESSION_FILE, section, 'utf-8');
    console.log('[SCAR-CHECKPOINT] Appended advisories to SESSION.md');
    return { appended: true, skipped };
  } catch (e) {
    console.error('[SCAR-CHECKPOINT] Failed to append:', e);
    return { appended: false, skipped };
  }
}

/**
 * Log checkpoint to SCAR log directory
 */
function logCheckpoint(summary: string, result: ReturnType<typeof runCheckpoint>): void {
  const logFile = join(SCAR_LOG_DIR, 'session-checkpoints.log');
  const timestamp = new Date().toISOString();
  const entry = `[${timestamp}] Checkpoint run. Matched: ${result.matched}. Advisory count: ${result.advisories.length}\n`;

  try {
    appendFileSync(logFile, entry, 'utf-8');
  } catch {
    // Ignore log failures
  }
}

/**
 * Main entry point
 */
async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];

  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║        SCAR SESSION CHECKPOINT (Phase 3)                  ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');

  switch (cmd) {
    case 'run':
    case 'check':
      // Read SESSION.md
      if (!existsSync(SESSION_FILE)) {
        console.log('[SCAR-CHECKPOINT] No SESSION.md found');
        process.exit(0);
      }

      const sessionContent = readFileSync(SESSION_FILE, 'utf-8');
      const events = extractEventsSection(sessionContent);

      if (!events) {
        console.log('[SCAR-CHECKPOINT] No EVENTS section found in SESSION.md');
        console.log('[SCAR-CHECKPOINT] Add "## EVENTS (for SCAR)" section with bullet points');
        process.exit(0);
      }

      console.log(`[SCAR-CHECKPOINT] Extracted events (${events.length} chars)`);
      console.log('[SCAR-CHECKPOINT] Running SCAR match...');

      const eventsHash = hashEvents(events);
      const result = runCheckpoint(events);

      if (result.matched) {
        console.log('');
        console.log('⚠️  SCAR MATCHED:');
        for (const adv of result.advisories) {
          console.log(`   ${adv.id}: ${(adv.relevance * 100).toFixed(0)}% relevance`);
        }
        console.log('');

        // Append to SESSION.md (with de-dupe check)
        const appendResult = appendAdvisories(result.advisories, eventsHash, sessionContent);
        if (appendResult.appended) {
          console.log('[SCAR-CHECKPOINT] Advisory appended to SESSION.md');
        } else if (appendResult.skipped.length > 0) {
          console.log(`[SCAR-CHECKPOINT] Skipped duplicates: ${appendResult.skipped.join(', ')}`);
        }
      } else {
        console.log('[SCAR-CHECKPOINT] No SCAR matches for this session');
      }

      // Log the checkpoint
      logCheckpoint(events, result);
      break;

    case 'test':
      // Test with a specific context
      const testContext = args.slice(1).join(' ') || 'verify the substrate and check retrieval';
      console.log(`[SCAR-CHECKPOINT] Testing with: "${testContext}"`);
      console.log('');

      const testResult = daemon.match(testContext);

      if (testResult.matched) {
        console.log('⚠️  MATCHED:', testResult.scar?.id);
        console.log('   Rule:', testResult.scar?.rule.slice(0, 80));
        console.log('');
        console.log('   Advisory:');
        console.log('     Wound:', testResult.advisory?.wound?.slice(0, 80));
        console.log('     Consequence:', testResult.advisory?.consequence?.slice(0, 80));
        console.log('     Checks:', testResult.advisory?.checks?.length || 0);
        console.log('     Remember:', testResult.advisory?.remember?.slice(0, 60));
      } else {
        console.log('✅ No match');
      }
      break;

    case 'summary':
    case 'events':
      // Just show the extracted events
      if (!existsSync(SESSION_FILE)) {
        console.log('[SCAR-CHECKPOINT] No SESSION.md found');
        process.exit(0);
      }

      const content = readFileSync(SESSION_FILE, 'utf-8');
      const extracted = extractEventsSection(content);

      if (!extracted) {
        console.log('[SCAR-CHECKPOINT] No EVENTS section found');
        console.log('');
        console.log('Add this to SESSION.md:');
        console.log('');
        console.log('## EVENTS (for SCAR)');
        console.log('- Intent: [what user wanted]');
        console.log('- Action: [what AI did]');
        console.log('- Outcome: [result/error]');
        console.log('');
      } else {
        console.log('Extracted events for SCAR:');
        console.log('');
        console.log(extracted);
      }
      break;

    default:
      console.log('Commands:');
      console.log('  run       - Run checkpoint on SESSION.md, append advisories');
      console.log('  test "X"  - Test SCAR match with custom context');
      console.log('  events    - Show extracted events');
      console.log('');
      console.log('Examples:');
      console.log('  bun run scar-session-checkpoint.ts run');
      console.log('  bun run scar-session-checkpoint.ts test "delete this folder"');
  }
}

main();
