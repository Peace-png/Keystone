#!/usr/bin/env bun
/**
 * ShadowReport.hook.ts - Session Report on Startup
 *
 * Runs when a session starts in the shadow directory.
 * Shows what Shadow has been doing.
 *
 * TRIGGER: SessionStart (when in shadow directory)
 */

import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { execSync } from 'child_process';

const SHADOW_DIR = '/home/peace/clawd/agents/shadow';
const REPORT_FILE = join(SHADOW_DIR, 'data', 'session-report.md');
const STATE_FILE = join(SHADOW_DIR, 'data', 'shadow-state.json');

interface HookInput {
  session_id: string;
  transcript_path?: string;
  hook_event_name: string;
}

async function readStdin(): Promise<string> {
  return new Promise((resolve, reject) => {
    let data = '';
    process.stdin.on('data', (chunk) => { data += chunk.toString(); });
    process.stdin.on('end', () => { resolve(data); });
    process.stdin.on('error', reject);
  });
}

async function main() {
  try {
    // Read hook input
    const input = await readStdin();
    const data: HookInput = JSON.parse(input || '{}');

    // Check if we're in shadow context (transcript path contains shadow)
    const transcriptPath = data.transcript_path || '';
    if (!transcriptPath.includes('shadow')) {
      process.exit(0);
    }

    // Generate fresh report
    console.error('[ShadowReport] Generating session report...');

    try {
      execSync('bun run engine/session-report.ts', {
        cwd: SHADOW_DIR,
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'pipe'] // Capture stdout
      });
    } catch (e: any) {
      // Non-fatal if report fails
    }

    // Read and output the report
    if (existsSync(REPORT_FILE)) {
      const report = readFileSync(REPORT_FILE, 'utf-8');
      // Output as system-reminder for context injection
      console.log(`<system-reminder>
${report}
</system-reminder>`);
    }

    process.exit(0);
  } catch (err) {
    console.error('[ShadowReport] Error:', err);
    process.exit(0); // Non-blocking
  }
}

main();
