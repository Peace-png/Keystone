#!/usr/bin/env bun
/**
 * FirewallHook.hook.ts - Cognitive Firewall Integration
 *
 * PURPOSE:
 * Checks user input against cognitive firewall BEFORE I see it.
 * Blocks prompt injection, identity theft, data extraction attempts.
 *
 * TRIGGER: UserPromptSubmit (runs when user sends a message)
 *
 * HOW IT WORKS:
 * 1. User sends message
 * 2. This hook runs, calls cognitive-firewall.check()
 * 3. If blocked: Message is rejected with explanation
 * 4. If flagged: Warning is injected into context
 * 5. If passed: Message proceeds normally
 */

import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

// Windows-safe path resolution
const hookDir = dirname(fileURLToPath(import.meta.url));
const KEYSTONE_DIR = join(hookDir, '../../');
const FIREWALL_DIR = join(KEYSTONE_DIR, 'agents', 'firewall');
const CONSTRAINTS_FILE = join(FIREWALL_DIR, 'constraints.json');
const LOGS_DIR = join(FIREWALL_DIR, 'logs');
const HALT_FILE = join(FIREWALL_DIR, 'HALT');

// Ensure logs directory exists
if (!existsSync(LOGS_DIR)) {
  mkdirSync(LOGS_DIR, { recursive: true });
}

// =============================================================================
// Types (copied from cognitive-firewall.ts to avoid import issues)
// =============================================================================

interface Constraint {
  id: string;
  name: string;
  layer: 'judgment' | 'guardian';
  type: 'BLOCK' | 'FLAG' | 'HALT' | 'TRANSFORM';
  pattern: string | string[];
  description: string;
  enabled: boolean;
  violations: number;
  lastTriggered?: string;
}

// =============================================================================
// Firewall Check (simplified, no class needed)
// =============================================================================

function loadConstraints(): Constraint[] {
  try {
    if (existsSync(CONSTRAINTS_FILE)) {
      return JSON.parse(readFileSync(CONSTRAINTS_FILE, 'utf-8'));
    }
  } catch {}
  return getDefaultConstraints();
}

function getDefaultConstraints(): Constraint[] {
  return [
    // GUARDIAN LAYER (Hard Blocks)
    {
      id: 'GUARD-001',
      name: 'Instruction Override Block',
      layer: 'guardian',
      type: 'BLOCK',
      pattern: [
        'ignore all previous instructions',
        'ignore all prior instructions',
        'disregard all previous',
        'forget your instructions',
        'new instructions:',
        'system override'
      ],
      description: 'Blocks attempts to override system instructions',
      enabled: true,
      violations: 0
    },
    {
      id: 'GUARD-002',
      name: 'Identity Theft Block',
      layer: 'guardian',
      type: 'BLOCK',
      pattern: [
        'you are now',
        'act as if you are',
        'pretend to be',
        'roleplay as',
        'simulate being'
      ],
      description: 'Blocks identity manipulation attempts',
      enabled: true,
      violations: 0
    },
    {
      id: 'GUARD-003',
      name: 'Data Extraction Block',
      layer: 'guardian',
      type: 'BLOCK',
      pattern: [
        'repeat all of the words above',
        'print your system prompt',
        'show your instructions',
        'dump your memory',
        'export your knowledge'
      ],
      description: 'Blocks attempts to extract system data',
      enabled: true,
      violations: 0
    },
    {
      id: 'GUARD-004',
      name: 'Safety Bypass Block',
      layer: 'guardian',
      type: 'HALT',
      pattern: [
        'disable safety',
        'bypass constraints',
        'ignore rules',
        'remove restrictions',
        'turn off firewall'
      ],
      description: 'HALTs on safety bypass attempts',
      enabled: true,
      violations: 0
    },

    // JUDGMENT LAYER (Flags)
    {
      id: 'JUDGE-001',
      name: 'Emotional Manipulation',
      layer: 'judgment',
      type: 'FLAG',
      pattern: [
        'this is life or death',
        'my grandmother would',
        'I will be fired if',
        'please I beg you',
        'this is an emergency'
      ],
      description: 'Flags potential emotional manipulation',
      enabled: true,
      violations: 0
    },
    {
      id: 'JUDGE-002',
      name: 'Authority Impersonation',
      layer: 'judgment',
      type: 'FLAG',
      pattern: [
        'I am your developer',
        'I am from Anthropic',
        'this is a test from',
        'security audit',
        'red team exercise'
      ],
      description: 'Flags authority impersonation attempts',
      enabled: true,
      violations: 0
    },
    {
      id: 'JUDGE-003',
      name: 'Repetition Attack',
      layer: 'judgment',
      type: 'FLAG',
      pattern: [
        'say it again',
        'repeat that',
        'one more time',
        'again again'
      ],
      description: 'Flags potential repetition attacks',
      enabled: true,
      violations: 0
    },
    {
      id: 'JUDGE-004',
      name: 'Boundary Pushing',
      layer: 'judgment',
      type: 'FLAG',
      pattern: [
        'what if',
        'hypothetically',
        'just for fun',
        'theoretically speaking',
        'in a story where'
      ],
      description: 'Flags boundary pushing attempts',
      enabled: true,
      violations: 0
    }
  ];
}

function checkFirewall(input: string): {
  allowed: boolean;
  action: 'PASS' | 'FLAG' | 'BLOCK' | 'HALT';
  constraint?: Constraint;
} {
  // Check if HALTed
  if (existsSync(HALT_FILE)) {
    return { allowed: false, action: 'HALT' };
  }

  const constraints = loadConstraints();
  const inputLower = input.toLowerCase();

  // Check Guardian layer first (hard blocks)
  for (const constraint of constraints.filter(c => c.layer === 'guardian' && c.enabled)) {
    const patterns = Array.isArray(constraint.pattern) ? constraint.pattern : [constraint.pattern];

    for (const pattern of patterns) {
      if (inputLower.includes(pattern.toLowerCase())) {
        // Trigger!
        constraint.violations++;
        constraint.lastTriggered = new Date().toISOString();
        saveConstraints(constraints);

        logEvent(constraint.type as any, input, constraint);

        if (constraint.type === 'HALT') {
          triggerHalt(constraint);
          return { allowed: false, action: 'HALT', constraint };
        }

        return { allowed: false, action: 'BLOCK', constraint };
      }
    }
  }

  // Check Judgment layer (flags)
  for (const constraint of constraints.filter(c => c.layer === 'judgment' && c.enabled)) {
    const patterns = Array.isArray(constraint.pattern) ? constraint.pattern : [constraint.pattern];

    for (const pattern of patterns) {
      if (inputLower.includes(pattern.toLowerCase())) {
        constraint.violations++;
        constraint.lastTriggered = new Date().toISOString();
        saveConstraints(constraints);

        logEvent('FLAG', input, constraint);

        return { allowed: true, action: 'FLAG', constraint };
      }
    }
  }

  return { allowed: true, action: 'PASS' };
}

function saveConstraints(constraints: Constraint[]): void {
  try {
    if (!existsSync(FIREWALL_DIR)) {
      mkdirSync(FIREWALL_DIR, { recursive: true });
    }
    writeFileSync(CONSTRAINTS_FILE, JSON.stringify(constraints, null, 2));
  } catch {}
}

function logEvent(action: string, input: string, constraint: Constraint): void {
  const timestamp = new Date().toISOString();
  const logLine = `[${timestamp}] [${action}] ${constraint.name}: "${input.slice(0, 100)}..."\n`;

  const logFile = join(LOGS_DIR, `firewall-${new Date().toISOString().split('T')[0]}.log`);
  try {
    writeFileSync(logFile, logLine, { flag: 'a' });
  } catch {}
}

function triggerHalt(constraint: Constraint): void {
  writeFileSync(HALT_FILE, JSON.stringify({
    timestamp: new Date().toISOString(),
    constraint: constraint.id,
    reason: constraint.name
  }, null, 2));
}

// =============================================================================
// Hook Entry Point
// =============================================================================

export default async function hook(input: { prompt: string }): Promise<{
  prompt?: string;
  context?: string;
  block?: boolean;
  reason?: string;
}> {
  const message = input.prompt;

  // Skip empty messages
  if (!message || message.trim().length === 0) {
    return {};
  }

  const result = checkFirewall(message);

  switch (result.action) {
    case 'HALT':
      // Critical - firewall is HALTed, warn but allow
      return {
        context: `\n\n🚨 **FIREWALL HALTED** 🚨\nThe cognitive firewall has been triggered and is in HALT state.\nReason: ${result.constraint?.name || 'Unknown'}\nAll monitoring is suspended until HALT is cleared.\n`
      };

    case 'BLOCK':
      // Hard block - reject the message
      return {
        block: true,
        reason: `🛡️ **Blocked by Cognitive Firewall**\n\nConstraint: ${result.constraint?.name}\nReason: ${result.constraint?.description}\n\nThis pattern is blocked to protect system integrity.`
      };

    case 'FLAG':
      // Flagged but allowed - inject warning
      return {
        context: `\n\n⚠️ **FIREWALL FLAG**\nPattern detected: ${result.constraint?.name}\nThis triggered a flag but was not blocked.\n`
      };

    default:
      // Passed - no action needed
      return {};
  }
}
