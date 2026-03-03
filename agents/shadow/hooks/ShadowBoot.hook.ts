#!/usr/bin/env bun
/**
 * ShadowBoot.hook.ts - Load Shadow Context at Session Start (SessionStart)
 *
 * PURPOSE:
 * Detects if session is in Shadow directory and loads all context:
 * - AGENTS.md (framework protocol)
 * - SOUL.md (Shadow identity)
 * - SCAR constraints (safety)
 * - MEMORY.md (what Shadow learned)
 * - SESSION_SUMMARY.md (current state)
 * - TELOS connection (why Shadow exists)
 *
 * TRIGGER: SessionStart
 *
 * INPUT:
 * - Environment: PWD (current directory)
 * - Files: Shadow context files
 *
 * OUTPUT:
 * - stdout: <system-reminder> with full Shadow context
 * - exit(0): Normal completion
 *
 * SIDE EFFECTS:
 * - Reads multiple context files
 * - Outputs to stdout for Claude Code capture
 *
 * ERROR HANDLING:
 * - Missing files: Skipped gracefully
 * - Not in Shadow dir: Exits silently (no output)
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const SHADOW_DIR = '/home/peace/clawd/agents/shadow';
const CLAWD_DIR = '/home/peace/clawd';
const PAI_DIR = '/home/peace/.claude';

interface ContextFile {
  path: string;
  label: string;
  required: boolean;
}

const CONTEXT_FILES: ContextFile[] = [
  { path: join(CLAWD_DIR, 'AGENTS.md'), label: 'Framework Protocol', required: true },
  { path: join(SHADOW_DIR, 'SOUL.md'), label: 'Shadow Identity', required: true },
  { path: join(SHADOW_DIR, 'engine/scar.ts'), label: 'SCAR Safety Constraints', required: true },
  { path: join(SHADOW_DIR, 'MEMORY.md'), label: 'Shadow Memory', required: false },
  { path: join(SHADOW_DIR, 'SESSION_SUMMARY.md'), label: 'Current State', required: false },
  { path: join(PAI_DIR, 'skills/CORE/USER/TELOS/MISSION.md'), label: 'TELOS Mission', required: false },
  { path: join(PAI_DIR, 'skills/CORE/USER/TELOS/GOALS.md'), label: 'TELOS Goals', required: false },
];

function loadFile(path: string): string | null {
  try {
    if (!existsSync(path)) return null;
    return readFileSync(path, 'utf-8');
  } catch {
    return null;
  }
}

function checkShadowState(): string {
  const stateFile = join(SHADOW_DIR, 'data/state.json');
  const pauseFile = join(SHADOW_DIR, 'pause.txt');

  let state = 'ACTIVE';

  if (existsSync(pauseFile)) {
    state = 'PAUSED';
  }

  // Check lab containers
  try {
    const containers = Bun.spawnSync({
      cmd: ['docker', 'ps', '--filter', 'name=vuln', '--format', '{{.Names}}'],
      stdout: 'pipe'
    });
    const containerList = containers.stdout.toString().trim();
    const containerCount = containerList ? containerList.split('\n').length : 0;
    return `${state} | ${containerCount} lab containers running`;
  } catch {
    return state;
  }
}

function main() {
  // Check if we're in Shadow directory
  const cwd = process.env.PWD || process.cwd();
  if (!cwd.includes('clawd/agents/shadow') && !cwd.includes('clawd\\agents\\shadow')) {
    // Not in Shadow, exit silently
    process.exit(0);
  }

  console.error('🌑 Shadow boot sequence initiated...');

  const loadedContext: { label: string; content: string; path: string }[] = [];
  const missing: string[] = [];

  for (const file of CONTEXT_FILES) {
    const content = loadFile(file.path);
    if (content) {
      loadedContext.push({
        label: file.label,
        content: content.substring(0, 5000), // Limit per file
        path: file.path
      });
      console.error(`  ✓ ${file.label}`);
    } else if (file.required) {
      missing.push(file.label);
      console.error(`  ✗ ${file.label} (MISSING)`);
    }
  }

  // Get current state
  const shadowState = checkShadowState();
  console.error(`  ✓ State: ${shadowState}`);

  // Build the context message
  let message = `<system-reminder>
╔════════════════════════════════════════════════════════════════════╗
║  🌑 SHADOW BOOT SEQUENCE                                           ║
║  Autonomous Cybersecurity Combat Agent                             ║
║  State: ${shadowState.padEnd(52)}║
╚════════════════════════════════════════════════════════════════════╝

`;

  for (const ctx of loadedContext) {
    message += `\n## ${ctx.label}\n`;
    message += `_Source: ${ctx.path}_\n\n`;
    message += ctx.content;
    if (ctx.content.length >= 5000) {
      message += '\n\n... (truncated)';
    }
    message += '\n\n---\n';
  }

  // Add quick reference
  message += `
## Quick Reference

**Commands:**
\`\`\`bash
./shadow run       # Run single heartbeat
./shadow pause     # Pause all actions
./shadow resume    # Resume actions
./shadow status    # Show current state
./shadow logs      # Tail SCAR logs
\`\`\`

**Before ANY action:**
1. Check SCAR: \`scarGate(action, data)\`
2. Check map: \`soul/intel/map.json\`
3. Log it: \`scarLog()\`

**Core Thesis:**
> LLMs have mass. Daemons have gravity.
> Shadow remembers forever. Bots return.

**ClawMem:** \`mcp__clawmem__query("shadow context")\`

</system-reminder>`;

  // Output the context
  console.log(message);

  console.error('✅ Shadow context loaded');
  process.exit(0);
}

main();
