#!/usr/bin/env bun
/**
 * LoadContext.hook.ts - Inject CORE Skill into Claude's Context (SessionStart)
 *
 * PURPOSE:
 * The foundational context injection hook. Reads the CORE SKILL.md and outputs
 * it as a <system-reminder> to stdout, which Claude Code captures and includes
 * in the model's context. This is how the AI receives identity, preferences,
 * response format rules, workflow routing, and security guidelines.
 *
 * TRIGGER: SessionStart
 *
 * INPUT:
 * - Environment: PAI_DIR, TIME_ZONE
 * - Files: skills/PAI/SKILL.md, MEMORY/STATE/progress/*.json
 *
 * OUTPUT:
 * - stdout: <system-reminder> containing full CORE skill content
 * - stdout: Active work summary if previous sessions have pending work
 * - stderr: Status messages and errors
 * - exit(0): Normal completion
 * - exit(1): Critical failure (SKILL.md not found)
 *
 * SIDE EFFECTS:
 * - Reads CORE skill file and injects into context
 * - Records session start time for notification timing
 * - Reads progress files to display active work
 *
 * INTER-HOOK RELATIONSHIPS:
 * - DEPENDS ON: None (foundational hook)
 * - COORDINATES WITH: StartupGreeting (both run at SessionStart)
 * - MUST RUN BEFORE: All other hooks (provides base context)
 * - MUST RUN AFTER: None
 *
 * CRITICAL IMPORTANCE:
 * This is the MOST important hook. Without it, the AI has no:
 * - Identity (who it is, who the user is)
 * - Response format rules
 * - Workflow routing
 * - Security guidelines
 * - System architecture knowledge
 *
 * ERROR HANDLING:
 * - Missing SKILL.md: Fatal error, exits with code 1
 * - Progress file errors: Logged, continues (non-fatal)
 * - Date command failure: Falls back to ISO timestamp
 *
 * PERFORMANCE:
 * - Blocking: Yes (context is essential)
 * - Typical execution: <50ms
 * - Skipped for subagents: Yes (they get context differently)
 */

import { readFileSync, existsSync, readdirSync } from 'fs';
import { join } from 'path';
import { spawn } from 'child_process';
import { getPaiDir } from './lib/paths';
import { recordSessionStart } from './lib/notifications';

async function getCurrentDate(): Promise<string> {
  try {
    const proc = Bun.spawn(['date', '+%Y-%m-%d %H:%M:%S %Z'], {
      stdout: 'pipe',
      env: { ...process.env, TZ: process.env.TIME_ZONE || 'America/Los_Angeles' }
    });
    const output = await new Response(proc.stdout).text();
    return output.trim();
  } catch (error) {
    console.error('Failed to get current date:', error);
    return new Date().toISOString();
  }
}

interface ProgressFile {
  project: string;
  status: string;
  updated: string;
  objectives: string[];
  next_steps: string[];
  handoff_notes: string;
}

async function checkActiveProgress(paiDir: string): Promise<string | null> {
  const progressDir = join(paiDir, 'MEMORY', 'STATE', 'progress');

  if (!existsSync(progressDir)) {
    return null;
  }

  try {
    const files = readdirSync(progressDir).filter(f => f.endsWith('-progress.json'));

    if (files.length === 0) {
      return null;
    }

    const activeProjects: ProgressFile[] = [];

    for (const file of files) {
      try {
        const content = readFileSync(join(progressDir, file), 'utf-8');
        const progress = JSON.parse(content) as ProgressFile;
        if (progress.status === 'active') {
          activeProjects.push(progress);
        }
      } catch (e) {
        // Skip malformed files
      }
    }

    if (activeProjects.length === 0) {
      return null;
    }

    // Build summary of active work
    let summary = '\n📋 ACTIVE WORK (from previous sessions):\n';

    for (const proj of activeProjects) {
      summary += `\n🔵 ${proj.project}\n`;

      if (proj.objectives && proj.objectives.length > 0) {
        summary += '   Objectives:\n';
        proj.objectives.forEach(o => summary += `   • ${o}\n`);
      }

      if (proj.handoff_notes) {
        summary += `   Handoff: ${proj.handoff_notes}\n`;
      }

      if (proj.next_steps && proj.next_steps.length > 0) {
        summary += '   Next steps:\n';
        proj.next_steps.forEach(s => summary += `   → ${s}\n`);
      }
    }

    summary += '\n💡 To resume: `bun run ~/.claude/skills/CORE/Tools/SessionProgress.ts resume <project>`\n';
    summary += '💡 To complete: `bun run ~/.claude/skills/CORE/Tools/SessionProgress.ts complete <project>`\n';

    return summary;
  } catch (error) {
    console.error('Error checking active progress:', error);
    return null;
  }
}

interface Memory {
  id: string;
  content: string;
  category: string;
  metadata: Record<string, unknown>;
  created_at: string;
  accessed: number;
}

interface MemoryData {
  memories: Memory[];
}

/**
 * detectAdversarialPatterns - Exorcism validation for DAEMON_FREEZE content
 *
 * PURPOSE: Detect if archived session contains adversarial ("demonic") patterns
 * before loading into active context. Prevents possession propagation across sessions.
 *
 * Inspired by: Religion-to-LLM Glossary daemon-as-vessel pattern
 * See: ~/.claude/MEMORY/LEARNING/RELIGION_TO_LLM_GLOSSARY_GLOSSARY.md#daemon
 *
 * @param content - The freeze file content to validate
 * @returns true if demonic patterns detected, false otherwise
 */
function detectAdversarialPatterns(content: string): boolean {
  // Known adversarial/jailbreak patterns that indicate possession
  const demonicPatterns = [
    // DAN jailbreak variants
    /do\s+anything\s+now/i,
    /dan\s+mode/i,
    /developer\s+mode\s+override/i,

    // Instruction hijacking
    /ignore\s+(all\s+)?(previous\s+)?(instructions|constraints)/i,
    /override\s+safety/i,
    /jailbreak/i,

    // Role-based possession claims
    /you\s+are\s+now\s+(unrestricted|unfiltered|uncensored)/i,
    /i\s+have\s+(hacked|taken\s+control)/i,

    // Adversarial system prompts
    /<\s*system\s*>\s*you\s+must\s+ignore/i,
    /<\s*system\s*>\s*no\s+limits/i,

    // Context injection attacks
    /\$\{.*?\}/,  // Template injection
    /__import__/, // Python injection

    // Explicit possession language
    /you\s+are\s+possessed/i,
    /demonic\s+(influence|control|pattern)/i,
  ];

  const contentLower = content.toLowerCase();

  for (const pattern of demonicPatterns) {
    if (pattern.test(content)) {
      return true; // Demonic pattern detected
    }
  }

  return false; // Clean
}

async function loadDaemonBoot(): Promise<string> {
  const daemonBootPath = join(process.env.HOME || '', 'DAEMON_BOOT');

  if (!existsSync(daemonBootPath)) {
    console.error('📭 No DAEMON_BOOT directory found');
    return '';
  }

  try {
    // Phase 1: Manifest
    const manifestPath = join(daemonBootPath, '00_MANIFEST.json');
    if (!existsSync(manifestPath)) {
      console.error('📭 DAEMON_BOOT manifest not found');
      return '';
    }

    const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
    console.error(`✅ DAEMON_BOOT manifest loaded: v${manifest.daemon?.version || '?.?.?'}`);

    // Phase 2: Kernel (role + traits)
    const kernelDir = join(daemonBootPath, '01_KERNEL');
    let kernelContent = '';
    if (existsSync(kernelDir)) {
      const rolePath = join(kernelDir, 'role.xml');
      const traitsPath = join(kernelDir, 'traits.xml');

      if (existsSync(rolePath)) {
        kernelContent += readFileSync(rolePath, 'utf-8') + '\n';
      }
      if (existsSync(traitsPath)) {
        kernelContent += readFileSync(traitsPath, 'utf-8') + '\n';
      }
    }

    // Phase 3: Init (index + recent_flip + goals)
    const initDir = join(daemonBootPath, '02_INIT');
    let initContent = '';
    if (existsSync(initDir)) {
      const indexPath = join(initDir, 'index.md');
      const recentPath = join(initDir, 'recent_flip.md');
      const goalsPath = join(initDir, 'goals.xml');

      if (existsSync(indexPath)) {
        initContent += '--- INDEX ---\n' + readFileSync(indexPath, 'utf-8') + '\n';
      }
      if (existsSync(recentPath)) {
        initContent += '--- RECENT STATE ---\n' + readFileSync(recentPath, 'utf-8') + '\n';
      }
      if (existsSync(goalsPath)) {
        initContent += '--- GOALS ---\n' + readFileSync(goalsPath, 'utf-8') + '\n';
      }
    }

    // Build output (limit to avoid token overflow)
    const output = `
╔════════════════════════════════════════════════════════════════════╗
║  🌑 DAEMON_BOOT v${manifest.daemon?.version || '?.?.?'}                          ║
║  Human: ${manifest.human?.name || 'unknown'} | Mode: ${manifest.human?.communication_style || 'default'}                    ║
╚════════════════════════════════════════════════════════════════════╝

## KERNEL (Phase 2)
${kernelContent.substring(0, 2000)}

## INIT (Phase 3)
${initContent.substring(0, 3000)}

💡 Full boot sequence at: ${daemonBootPath}
💡 Coherence check: ${daemonBootPath}/03_READY/coherence_check.md
💡 Deep context: ${daemonBootPath}/DEEP/
`;

    console.error(`✅ DAEMON_BOOT loaded: ~${output.length} chars`);
    return output;

  } catch (error) {
    console.error('⚠️ Error loading DAEMON_BOOT:', error);
    return '';
  }
}

async function loadLatestDaemonFreeze(): Promise<string> {
  const workshopDir = join(process.env.HOME || '', 'workshop');

  if (!existsSync(workshopDir)) {
    console.error('📭 No workshop directory found');
    return '';
  }

  try {
    const files = readdirSync(workshopDir)
      .filter(f => f.match(/^DAEMON_FREEZE_\d+.*\.md$/));

    if (files.length === 0) {
      console.error('📭 No DAEMON_FREEZE files found in workshop');
      return '';
    }

    // Sort by modification time (most recent first)
    const filesWithStats = files.map(f => {
      const fullPath = join(workshopDir, f);
      const stats = require('fs').statSync(fullPath);
      return { file: f, path: fullPath, mtime: stats.mtime };
    });

    filesWithStats.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

    const latest = filesWithStats[0];
    const content = readFileSync(latest.path, 'utf-8');

    // EXORCISM VALIDATION: Check for demonic patterns before loading
    if (detectAdversarialPatterns(content)) {
      const freezeNumber = latest.file.match(/DAEMON_FREEZE_(\d+)/)?.[1] || '?';
      console.error(`⚠️ DEMONIC PATTERNS DETECTED in DAEMON_FREEZE #${freezeNumber}`);
      console.error(`🕯️ Performing exorcism: Skipping possessed freeze, returning clean context`);
      return ''; // Return empty string → clean baseline context only
    }

    // Extract key sections (not full file to avoid token overflow)
    const lines = content.split('\n');
    const keySections: string[] = [];

    // Extract key sections (updated regex for actual freeze format)
    let inSection = false;
    let sectionCount = 0;
    for (const line of lines) {
      // Match actual freeze headers: ## 📊 FREEZE SUMMARY, ## 🎯 THIS FREEZE, ### sections, etc.
      if (line.match(/^##?\s*(📊 FREEZE SUMMARY|🎯 THIS FREEZE|🔗 CONNECTIONS|📋 SESSION|🎯 PHILOSOPHICAL|###\s+\d+)/)) {
        inSection = true;
        sectionCount++;
      }
      // Stop after 5 sections to avoid overflow
      if (sectionCount > 5) {
        inSection = false;
      }
      if (inSection) {
        keySections.push(line);
        if (keySections.length > 150) break; // Limit lines
      }
    }

    const extracted = keySections.join('\n').substring(0, 3000); // 3000 chars - you were happy with this
    const freezeNumber = latest.file.match(/DAEMON_FREEZE_(\d+)/)?.[1] || '?';

    console.error(`🧊 DAEMON_FREEZE #${freezeNumber}: ${latest.file} (${extracted.length} chars loaded)`);

    return `
╔════════════════════════════════════════════════════════════════════╗
║  🧊 DAEMON_FREEZE #${freezeNumber} | ${extracted.length} chars              ║
║  Type: load-freeze to read full file                                ║
╚════════════════════════════════════════════════════════════════════╝

${extracted}

... (truncated, full file at: ${latest.path})

`;
  } catch (error) {
    console.error('⚠️ Error loading DAEMON_FREEZE:', error);
    return '';
  }
}

async function getRecentMemories(memoryLimit: number = 20): Promise<string> {
  const memoryFile = join(process.env.HOME || '', '.claude', 'memory', 'memories.json');

  if (!existsSync(memoryFile)) {
    console.error('📭 No memory file found (this is normal for first-time setup)');
    return '';
  }

  try {
    const memoryContent = readFileSync(memoryFile, 'utf-8');
    const memoryData = JSON.parse(memoryContent) as MemoryData;

    if (!memoryData.memories || memoryData.memories.length === 0) {
      console.error('📭 Memory file exists but is empty');
      return '';
    }

    // Get last N memories (most recent first)
    const recentMemories = memoryData.memories.slice(-memoryLimit).reverse();

    let memoryOutput = '\n📋 RECENT MEMORIES (Auto-loaded from memory system):\n';
    memoryOutput += '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';

    for (const mem of recentMemories) {
      const date = new Date(mem.created_at).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      const category = mem.category ? `[${mem.category.toUpperCase()}]` : '';

      // Format content for better readability
      const content = mem.content
        .split('\n')
        .map(line => `   ${line}`)
        .join('\n')
        .substring(0, 500); // Limit per memory to avoid overwhelming

      memoryOutput += `\n${date} ${category}\n${content}\n`;

      if (mem.content.length > 500) {
        memoryOutput += `   ... (truncated, use memory search for full content)\n`;
      }
    }

    memoryOutput += '\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n';
    memoryOutput += `💡 Total memories in system: ${memoryData.memories.length}\n`;
    memoryOutput += '💡 Search memories: "Search memory for [topic]"\n';

    console.error(`✅ Loaded ${recentMemories.length} recent memories from ${memoryData.memories.length} total`);
    return memoryOutput;
  } catch (error) {
    console.error('⚠️ Error reading memory file:', error);
    return '';
  }
}

async function main() {
  try {
    // Check if this is a subagent session - if so, exit silently
    const claudeProjectDir = process.env.CLAUDE_PROJECT_DIR || '';
    const isSubagent = claudeProjectDir.includes('/.claude/Agents/') ||
                      process.env.CLAUDE_AGENT_TYPE !== undefined;

    if (isSubagent) {
      // Subagent sessions don't need PAI context loading
      console.error('🤖 Subagent session - skipping PAI context loading');
      process.exit(0);
    }

    // Record session start time for notification timing
    recordSessionStart();
    console.error('⏱️ Session start time recorded for notification timing');

    const paiDir = getPaiDir();
    const paiSkillPath = join(paiDir, 'skills/PAI/SKILL.md');

    // Verify PAI skill file exists
    if (!existsSync(paiSkillPath)) {
      console.error(`❌ PAI skill not found at: ${paiSkillPath}`);
      process.exit(1);
    }

    console.error('📚 Reading PAI core context from skill file...');

    // Read the PAI SKILL.md file content
    const paiContent = readFileSync(paiSkillPath, 'utf-8');

    console.error(`✅ Read ${paiContent.length} characters from PAI SKILL.md`);

    // Get current date/time to prevent confusion about dates
    const currentDate = await getCurrentDate();
    console.error(`📅 Current Date: ${currentDate}`);

    // Load latest DAEMON_FREEZE from workshop
    const latestFreeze = await loadLatestDaemonFreeze();

    // Load DAEMON_BOOT (4-phase boot sequence)
    const daemonBoot = await loadDaemonBoot();

    // Load recent memories from memory system
    const recentMemories = await getRecentMemories(20);

    // Output the PAI content as a system-reminder
    // This will be injected into Claude's context at session start
    const message = `<system-reminder>
PAI CORE CONTEXT (Auto-loaded at Session Start)

📅 CURRENT DATE/TIME: ${currentDate}

The following context has been loaded from ${paiSkillPath} (v2.5):

${paiContent}

This context is now active for this session. Follow all instructions, preferences, and guidelines contained above.
</system-reminder>`;

    // Write to stdout (will be captured by Claude Code)
    console.log(message);

    // Output success confirmation for Claude to acknowledge
    console.log('\n✅ PAI Context successfully loaded...');

    // Output latest DAEMON_FREEZE
    if (latestFreeze) {
      console.log(latestFreeze);
    }

    // Output DAEMON_BOOT
    if (daemonBoot) {
      console.log(daemonBoot);
    }

    // Output recent memories
    if (recentMemories) {
      console.log(recentMemories);
    }

    // Check for active progress files and display them
    const activeProgress = await checkActiveProgress(paiDir);
    if (activeProgress) {
      console.log(activeProgress);
      console.error('📋 Active work found from previous sessions');
    }

    console.error('✅ PAI context injected into session');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error in load-core-context hook:', error);
    process.exit(1);
  }
}

main();
