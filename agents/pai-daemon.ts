#!/usr/bin/env bun
/**
 * PAI Daemon - Unified Engine Integration
 *
 * This wires PAI hooks to the unified executing architecture.
 * Hooks enqueue work to a queue file, daemon processes it through SCAR-gated loop.
 *
 * Run: bun run engine/pai-daemon.ts
 *
 * Hook Integration:
 *   Hooks write to: ~/.claude/MEMORY/STATE/pai-queue.jsonl
 *   Daemon reads and processes through unified engine
 */

import { createEngine, type ActionHandler, type UnifiedState } from './index';
import { existsSync, readFileSync, writeFileSync, appendFileSync, mkdirSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { watch } from 'fs';
import { homedir } from 'os';

// =============================================================================
// Configuration
// =============================================================================

// Cross-platform home directory (works on Windows, Mac, Linux)
const HOME = homedir();
const PAI_DIR = process.env.PAI_DIR || join(HOME, '.claude');
const MEMORY_DIR = join(PAI_DIR, 'MEMORY');
const STATE_DIR = join(MEMORY_DIR, 'STATE');
const QUEUE_FILE = join(STATE_DIR, 'pai-queue.jsonl');
const WORK_DIR = join(MEMORY_DIR, 'WORK');
const LEARNING_DIR = join(MEMORY_DIR, 'LEARNING');

// =============================================================================
// Types
// =============================================================================

interface QueueItem {
  id: string;
  action: string;
  source: string;
  timestamp: number;
  data: Record<string, unknown>;
}

interface HookInput {
  session_id: string;
  prompt?: string;
  user_prompt?: string;
  transcript_path?: string;
  hook_event_name: string;
  stop_hook_active?: boolean;
}

interface CurrentWork {
  session_id: string;
  work_dir: string;
  created_at: string;
  item_count: number;
}

interface WorkClassification {
  type: 'work' | 'question' | 'conversational';
  title: string;
  effort: 'TRIVIAL' | 'QUICK' | 'STANDARD' | 'THOROUGH';
}

// =============================================================================
// Utilities
// =============================================================================

function ensureDir(path: string): void {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }
}

function getPSTComponents(): { year: string; month: string; day: string; hours: string; minutes: string; seconds: string } {
  const now = new Date();
  const pst = new Date(now.toLocaleString('en-US', { timeZone: 'America/Los_Angeles' }));
  return {
    year: pst.getFullYear().toString(),
    month: String(pst.getMonth() + 1).padStart(2, '0'),
    day: String(pst.getDate()).padStart(2, '0'),
    hours: String(pst.getHours()).padStart(2, '0'),
    minutes: String(pst.getMinutes()).padStart(2, '0'),
    seconds: String(pst.getSeconds()).padStart(2, '0'),
  };
}

function getISOTimestamp(): string {
  return new Date().toISOString();
}

// =============================================================================
// PAI Action Handlers
// =============================================================================

/**
 * Handler: pai:work:create
 * Creates work directory for a session
 */
const workCreateHandler: ActionHandler = async (payload, state) => {
  const { sessionId, prompt, classification } = payload as {
    sessionId: string;
    prompt: string;
    classification: WorkClassification;
  };

  console.error('[PAI:work:create] Creating work directory...');

  const { year, month, day, hours, minutes, seconds } = getPSTComponents();
  const timestamp = `${year}${month}${day}-${hours}${minutes}${seconds}`;
  const title = classification.title || prompt.substring(0, 50);
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50)
    .replace(/-$/, '');

  const workDirName = `${timestamp}_${slug || 'session-work'}`;
  const workPath = join(WORK_DIR, workDirName);

  // Create directories
  ensureDir(workPath);
  ensureDir(join(workPath, 'items'));
  ensureDir(join(workPath, 'verification'));
  ensureDir(join(workPath, 'research'));
  ensureDir(join(workPath, 'agents', 'claimed'));
  ensureDir(join(workPath, 'agents', 'completed'));
  ensureDir(join(workPath, 'children'));

  // Create META.yaml
  const meta = `id: "${workDirName}"
title: "${title}"
created_at: "${getISOTimestamp()}"
completed_at: null
source: "SESSION"
status: "ACTIVE"
session_id: "${sessionId}"
lineage:
  tools_used: []
  files_changed: []
  agents_spawned: []
parent: null
`;
  writeFileSync(join(workPath, 'META.yaml'), meta, 'utf-8');
  writeFileSync(join(workPath, 'IDEAL.md'), '# Ideal State\n\nTo be defined.\n', 'utf-8');
  writeFileSync(join(workPath, 'IdealState.jsonl'), '', 'utf-8');

  // Update state
  ensureDir(STATE_DIR);
  const currentWork: CurrentWork = {
    session_id: sessionId,
    work_dir: workDirName,
    created_at: getISOTimestamp(),
    item_count: 1,
  };
  writeFileSync(join(STATE_DIR, 'current-work.json'), JSON.stringify(currentWork, null, 2));

  console.error(`[PAI:work:create] Created: ${workDirName}`);

  return {
    success: true,
    output: { workDir: workDirName, path: workPath },
    durationMs: 0
  };
};

/**
 * Handler: pai:work:add_item
 * Adds an item to existing work directory
 */
const workAddItemHandler: ActionHandler = async (payload, state) => {
  const { prompt, classification } = payload as {
    prompt: string;
    classification: WorkClassification;
  };

  console.error('[PAI:work:add_item] Adding item...');

  // Read current work
  const currentWorkPath = join(STATE_DIR, 'current-work.json');
  if (!existsSync(currentWorkPath)) {
    return { success: false, error: 'No current work', durationMs: 0 };
  }

  const currentWork = JSON.parse(readFileSync(currentWorkPath, 'utf-8')) as CurrentWork;
  currentWork.item_count += 1;

  // Create item file
  const itemId = String(currentWork.item_count).padStart(3, '0');
  const slug = (classification.title || prompt.substring(0, 30))
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 40);

  const itemPath = join(WORK_DIR, currentWork.work_dir, 'items', `${itemId}-${slug}.yaml`);
  const item = `id: "${itemId}"
description: "${prompt.replace(/"/g, '\\"').substring(0, 500)}"
type: "${classification.type}"
effort: "${classification.effort}"
source: "USER_PROMPT"
status: "ACTIVE"
created_at: "${getISOTimestamp()}"
completed_at: null
response_summary: null
lineage:
  created_by: "user_request"
`;
  writeFileSync(itemPath, item, 'utf-8');

  // Update state
  writeFileSync(currentWorkPath, JSON.stringify(currentWork, null, 2));

  console.error(`[PAI:work:add_item] Added item ${itemId}`);

  return {
    success: true,
    output: { itemId, itemCount: currentWork.item_count },
    durationMs: 0
  };
};

/**
 * Handler: pai:learning:capture
 * Captures learning from completed work
 */
const learningCaptureHandler: ActionHandler = async (payload, state) => {
  const { workDir, title, filesChanged, toolsUsed } = payload as {
    workDir: string;
    title: string;
    filesChanged: string[];
    toolsUsed: string[];
  };

  console.error('[PAI:learning:capture] Capturing learning...');

  // Determine category
  let category = 'SYSTEM';
  if (toolsUsed.length > 0 || filesChanged.length > 0) {
    category = 'ALGORITHM';
  }

  // Create learning directory
  const now = new Date();
  const monthDir = join(LEARNING_DIR, category, `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`);
  ensureDir(monthDir);

  // Create learning file
  const timestamp = now.toISOString().replace(/[:.]/g, '-');
  const slug = title.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 40);
  const learningPath = join(monthDir, `${timestamp}_work_${slug}.md`);

  const content = `# Learning: ${title}

**Captured:** ${getISOTimestamp()}
**Source:** WORK/${workDir}
**Category:** ${category}

## Files Changed
${filesChanged.length > 0 ? filesChanged.map(f => `- ${f}`).join('\n') : 'None'}

## Tools Used
${toolsUsed.length > 0 ? toolsUsed.map(t => `- ${t}`).join('\n') : 'None'}

## Context
This learning was automatically captured from completed work session.

---
*Auto-captured by PAI Unified Engine*
`;

  writeFileSync(learningPath, content, 'utf-8');

  console.error(`[PAI:learning:capture] Created: ${learningPath}`);

  return {
    success: true,
    output: { path: learningPath, category },
    durationMs: 0
  };
};

/**
 * Handler: pai:memory:save
 * Saves a memory item
 */
const memorySaveHandler: ActionHandler = async (payload, state) => {
  const { content, category, metadata } = payload as {
    content: string;
    category: string;
    metadata?: Record<string, unknown>;
  };

  console.error(`[PAI:memory:save] Saving memory to ${category}...`);

  // This could integrate with ClawMem in the future
  // For now, save to MEMORY/ directory
  const memoryPath = join(MEMORY_DIR, category || 'events');
  ensureDir(memoryPath);

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const filename = `${timestamp}.md`;
  const filePath = join(memoryPath, filename);

  const fullContent = `---
timestamp: ${getISOSTimestamp()}
category: ${category}
metadata: ${JSON.stringify(metadata || {})}
---

${content}
`;

  writeFileSync(filePath, fullContent, 'utf-8');

  console.error(`[PAI:memory:save] Saved: ${filePath}`);

  return {
    success: true,
    output: { path: filePath },
    durationMs: 0
  };
};

// =============================================================================
// Constitution Loading (merged from constitution-daemon.ts)
// =============================================================================

const KEYSTONE_DIR = process.env.KEYSTONE_DIR || join(HOME, 'Desktop', 'Keystone');
const CONSTITUTION_DIR = join(KEYSTONE_DIR, 'constitution');
const AUTO_MEMORY_DIR = join(HOME, '.claude', 'projects', 'C--Users-peace', 'memory');
const CONSTITUTION_OUTPUT = join(AUTO_MEMORY_DIR, 'CONSTITUTION.md');
const CONSTITUTION_FILES = ['SOUL.md', 'USER.md', 'VOICE.md', 'SESSION.md'];

function loadConstitution(): string {
  let output = `# CONSTITUTION - Auto-loaded at session start

**Last Updated:** ${new Date().toISOString().split('T')[0]}

This file is automatically generated by PAI Daemon from:
${CONSTITUTION_DIR}

---

## SERVICES RUNNING

You have 3 services (daemons) running in the background:

| Service | What It Does |
|---------|--------------|
| **PAI Daemon** | Tracks work, creates folders, saves memories, loads constitution (YOU ARE HERE) |
| **ClawMem Daemon** | Indexes files, builds search graphs |
| **Shadow Daemon** | Security agent, heartbeats every 30 min |

These start automatically when you run START-KEYSTONE.cmd.

---

`;

  for (const file of CONSTITUTION_FILES) {
    const filePath = join(CONSTITUTION_DIR, file);
    if (existsSync(filePath)) {
      const content = readFileSync(filePath, 'utf-8');
      output += `\n## ${file}\n\n${content}\n\n---\n`;
    }
  }

  return output;
}

function saveConstitution(): void {
  try {
    // Ensure directory exists
    if (!existsSync(AUTO_MEMORY_DIR)) {
      mkdirSync(AUTO_MEMORY_DIR, { recursive: true });
    }

    const content = loadConstitution();
    writeFileSync(CONSTITUTION_OUTPUT, content, 'utf-8');
    console.log(`[CONSTITUTION] Saved to: ${CONSTITUTION_OUTPUT}`);
  } catch (error) {
    console.error('[CONSTITUTION] Error saving:', error);
  }
}

// =============================================================================
// Queue Management
// =============================================================================

function enqueueWork(item: QueueItem): void {
  ensureDir(STATE_DIR);
  appendFileSync(QUEUE_FILE, JSON.stringify(item) + '\n', 'utf-8');
}

function readQueue(): QueueItem[] {
  if (!existsSync(QUEUE_FILE)) return [];

  const content = readFileSync(QUEUE_FILE, 'utf-8');
  const lines = content.trim().split('\n').filter(Boolean);

  return lines.map(line => {
    try {
      return JSON.parse(line) as QueueItem;
    } catch {
      return null;
    }
  }).filter(Boolean) as QueueItem[];
}

function clearQueue(): void {
  if (existsSync(QUEUE_FILE)) {
    unlinkSync(QUEUE_FILE);
  }
}

// =============================================================================
// Daemon Factory
// =============================================================================

export function createPAIDaemon() {
  const engine = createEngine({
    name: 'pai-daemon',
    systems: ['pai'],
    rateLimits: {
      'pai:work:create': { max: 100, windowMs: 86400000 },
      'pai:learning:capture': { max: 100, windowMs: 86400000 },
    }
  });

  // Register handlers
  engine.registerHandlers({
    'pai:work:create': workCreateHandler,
    'pai:work:add_item': workAddItemHandler,
    'pai:learning:capture': learningCaptureHandler,
    'pai:memory:save': memorySaveHandler,
  });

  return engine;
}

// =============================================================================
// CLI Entry Point
// =============================================================================

async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];

  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║            PAI DAEMON - Unified Engine                   ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');

  const engine = createPAIDaemon();

  switch (cmd) {
    case 'start':
    case 'daemon':
      console.log('Starting PAI daemon...');

      // Load constitution into auto-memory at startup
      console.log('[CONSTITUTION] Loading constitution...');
      saveConstitution();

      console.log(`Watching: ${QUEUE_FILE}`);
      console.log('');

      await engine.start();

      // Process existing queue items
      const existing = readQueue();
      if (existing.length > 0) {
        console.log(`Processing ${existing.length} queued items...`);
        for (const item of existing) {
          await engine.enqueue(
            { type: item.action, source: item.source },
            item.data
          );
        }
        clearQueue();
      }

      // Watch queue file for new items
      let processing = false;

      const processQueue = async () => {
        if (processing) return;
        processing = true;

        try {
          const items = readQueue();
          if (items.length > 0) {
            console.log(`Processing ${items.length} new items...`);
            for (const item of items) {
              await engine.enqueue(
                { type: item.action, source: item.source },
                item.data
              );
            }
            clearQueue();
          }
        } catch (err) {
          console.error('Queue processing error:', err);
        }

        processing = false;
      };

      // Watch for changes
      if (existsSync(STATE_DIR)) {
        watch(STATE_DIR, (eventType, filename) => {
          if (filename === 'pai-queue.jsonl') {
            processQueue();
          }
        });
      }

      console.log('PAI daemon running. Press Ctrl+C to stop.');
      console.log('');
      console.log('Hooks can enqueue work by writing to:');
      console.log(`  ${QUEUE_FILE}`);
      console.log('');
      console.log('Format: {"id":"...", "action":"pai:work:create", "source":"hook", "data":{...}}');

      // Keep running
      await new Promise(() => {});
      break;

    case 'enqueue':
      const actionType = args[1] || 'work:create';
      const dataArg = args[2] ? JSON.parse(args[2]) : {};

      const item: QueueItem = {
        id: crypto.randomUUID(),
        action: `pai:${actionType}`,
        source: 'manual',
        timestamp: Date.now(),
        data: dataArg,
      };

      enqueueWork(item);
      console.log(`Enqueued: ${item.action}`);
      console.log(`ID: ${item.id}`);
      break;

    case 'process':
      console.log('Processing queue...');
      await engine.start();

      const queueItems = readQueue();
      console.log(`Found ${queueItems.length} items`);

      for (const item of queueItems) {
        console.log(`  Processing: ${item.action}`);
        await engine.enqueue(
          { type: item.action, source: item.source },
          item.data
        );
      }

      clearQueue();

      // Wait for processing
      await new Promise(r => setTimeout(r, 1000));

      const metrics = engine.getMetrics();
      console.log('');
      console.log('Metrics:');
      console.log(`  Enqueued: ${metrics.totalEnqueued}`);
      console.log(`  Completed: ${metrics.totalCompleted}`);
      console.log(`  Blocked: ${metrics.totalBlocked}`);

      await engine.stop();
      break;

    case 'status':
      const queued = readQueue();
      console.log(`Queue file: ${QUEUE_FILE}`);
      console.log(`Queued items: ${queued.length}`);
      if (queued.length > 0) {
        console.log('');
        console.log('Pending:');
        for (const item of queued.slice(0, 5)) {
          console.log(`  - ${item.action} (${item.id.slice(0, 8)}...)`);
        }
      }
      break;

    case 'clear':
      clearQueue();
      console.log('Queue cleared');
      break;

    default:
      console.log('Commands:');
      console.log('  start     - Start daemon (watches queue file)');
      console.log('  enqueue   - Add item to queue');
      console.log('  process   - Process all queued items once');
      console.log('  status    - Show queue status');
      console.log('  clear     - Clear queue');
      console.log('');
      console.log('Examples:');
      console.log('  bun run engine/pai-daemon.ts start');
      console.log('  bun run engine/pai-daemon.ts enqueue work:create \'{"sessionId":"test","prompt":"Fix bug"}\'');
      console.log('  bun run engine/pai-daemon.ts process');
  }
}

// Run if called directly
if (import.meta.main) {
  main().catch(e => {
    console.error('[FATAL]', e);
    process.exit(1);
  });
}

export { enqueueWork };
