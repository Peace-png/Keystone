/**
 * SCAR Watch Hook
 *
 * Watches messages and surfaces relevant scars BEFORE action
 * This is a UserPromptSubmit hook - runs when user sends a message
 */

import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';

const hookDir = dirname(new URL(import.meta.url).pathname);
const SOUL_FILE = join(hookDir, '../../constitution/SOUL.md');

interface Scar {
  id: string;
  rule: string;
  triggers: string[];
}

let scars: Scar[] = [];
let loaded = false;

// Load scars once
function loadScars(): void {
  if (loaded) return;

  try {
    if (!existsSync(SOUL_FILE)) {
      console.error('[SCAR] SOUL.md not found');
      return;
    }

    const content = readFileSync(SOUL_FILE, 'utf-8');
    const principles = content.split(/(?=### P\d+)/);

    for (const block of principles) {
      if (!block.trim()) continue;

      const headerMatch = block.match(/### (P\d+): (.+)/);
      if (!headerMatch) continue;

      const id = headerMatch[1];
      const title = headerMatch[2];

      const ruleMatch = block.match(/\*\*RULE:\*\* (.+?)(?:\n\n|\n\*\*|$)/s);
      if (!ruleMatch) continue;

      const rule = ruleMatch[1].trim();

      // Extract trigger keywords
      const triggers = extractTriggers(rule + ' ' + title + ' ' + block);

      scars.push({ id, rule, triggers });
    }

    loaded = true;
    console.error(`[SCAR] Loaded ${scars.length} scars`);
  } catch (e) {
    console.error('[SCAR] Failed to load scars:', e);
  }
}

function extractTriggers(text: string, block: string): string[] {
  const triggers: Set<string> = new Set();

  const actionWords = [
    'move', 'rename', 'delete', 'remove', 'edit', 'modify', 'change',
    'read', 'check', 'verify', 'test', 'describe', 'claim', 'say',
    'search', 'find', 'assume', 'guess', 'fix', 'commit', 'push', 'pull',
    'folder', 'file', 'directory', 'path'
  ];

  const words = text.toLowerCase().split(/\s+/);
  for (const word of words) {
    if (word.length > 3 && actionWords.includes(word)) {
      triggers.add(word);
    }
  }

  // Special patterns
  if (block.includes('hardcoded path')) triggers.add('path');
  if (block.includes('folder name')) triggers.add('folder');
  if (block.includes('timestamp')) triggers.add('timestamp');
  if (block.includes('verify') || block.includes('check')) triggers.add('verify');
  if (block.includes('substrate') || block.includes('hallucination')) triggers.add('substrate');
  if (block.includes('retrieval') || block.includes('search')) triggers.add('retrieval');
  if (block.includes('error') || block.includes('mistake')) triggers.add('error');
  if (block.includes('identity') || block.includes('github')) triggers.add('identity');

  return Array.from(triggers);
}

// Match message against scars
function matchScars(message: string): Scar[] {
  const matches: Scar[] = [];
  const messageLower = message.toLowerCase();

  for (const scar of scars) {
    let matchCount = 0;

    for (const trigger of scar.triggers) {
      if (messageLower.includes(trigger.toLowerCase())) {
        matchCount++;
      }
    }

    // Need at least 2 trigger matches
    if (matchCount >= 2) {
      matches.push(scar);
    }
  }

  return matches;
}

// Hook function - this gets called by Claude Code
export default async function hook(input: { prompt: string }): Promise<{ prompt?: string; context?: string }> {
  loadScars();

  const message = input.prompt;
  const matches = matchScars(message);

  if (matches.length > 0) {
    // Build context with relevant scar reminders
    const scarReminders = matches.map(s => {
      return `⚠️ ${s.id}: ${s.rule.slice(0, 100)}...`;
    }).join('\n');

    // Inject into context
    return {
      context: `\n\n[SCAR CHECK - Relevant scars for this request]\n${scarReminders}\n`
    };
  }

  // No matches - return empty
  return {};
}
