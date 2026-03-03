#!/usr/bin/env bun
/**
 * SHADOW CONTROLLER - Universal Agent Orchestrator
 *
 * One controller, multiple modes.
 * TELOS (why) + SCAR (safe) + MEMORY (learn) + ABILITIES (do)
 *
 * Modes:
 *   - threat-hunt  → Hunt malware, sell intel
 *   - growth       → Grow social accounts
 *   - research     → Research and sell reports
 *   - ghost-hunt   → Find and revive dead repos
 *   - custom       → Your own abilities
 *
 * Usage:
 *   bun run shadow-controller.ts --mode threat-hunt
 *   bun run shadow-controller.ts --mode growth
 *   bun run shadow-controller.ts --mode ghost-hunt
 */

import {
  scarGate,
  scarLog,
  scarRecordAction,
  scarSelfHeal,
  scarIsPaused,
  scarPause,
  scarResume,
  SCAR_RATE,
} from './scar';

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// === TYPES =========================================================

interface TelosContext {
  mission: string;
  goals: string[];
  targets: string[];
  forbidden: string[];
  config: Record<string, any>;
}

interface Memory {
  stats: Record<string, number>;
  knowledge: Record<string, any[]>;
  history: any[];
  lastRun: string;
  createdAt: string;
  updatedAt: string;
}

interface AbilityResult {
  success: boolean;
  data?: any;
  error?: string;
  learned?: any;
  revenue?: number;
}

interface Ability {
  name: string;
  tier: 1 | 2 | 3 | 4 | 5;
  description: string;
  requiresSandbox?: boolean;
  run: (context: RunContext) => Promise<AbilityResult>;
}

interface RunContext {
  telos: TelosContext;
  memory: Memory;
  input?: any;
}

interface Mode {
  name: string;
  description: string;
  abilities: string[];
  interval: number;
  telos: Partial<TelosContext>;
}

// === DEFAULTS ======================================================

const DEFAULT_TELOS: TelosContext = {
  mission: 'Accomplish the assigned task',
  goals: [],
  targets: [],
  forbidden: [],
  config: {},
};

const DEFAULT_MEMORY: Memory = {
  stats: {
    runs: 0,
    successes: 0,
    failures: 0,
    revenue: 0,
  },
  knowledge: {},
  history: [],
  lastRun: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// === MEMORY SYSTEM =================================================

const MEMORY_DIR = join(__dirname, '..', 'data', 'memory');

class MemorySystem {
  private memory: Memory;
  private path: string;

  constructor(mode: string) {
    this.path = join(MEMORY_DIR, `${mode}-memory.json`);
    this.memory = this.load();
  }

  private load(): Memory {
    try {
      if (!existsSync(this.path)) {
        mkdirSync(MEMORY_DIR, { recursive: true });
        return { ...DEFAULT_MEMORY };
      }
      const raw = readFileSync(this.path, 'utf-8');
      return { ...DEFAULT_MEMORY, ...JSON.parse(raw) };
    } catch {
      return { ...DEFAULT_MEMORY };
    }
  }

  save(): void {
    try {
      this.memory.updatedAt = new Date().toISOString();
      mkdirSync(MEMORY_DIR, { recursive: true });
      writeFileSync(this.path, JSON.stringify(this.memory, null, 2));
    } catch (error) {
      scarLog(`[MEMORY] Save failed: ${error}`);
    }
  }

  get(): Memory {
    return this.memory;
  }

  update(updates: Partial<Memory>): void {
    this.memory = { ...this.memory, ...updates };
    this.save();
  }

  addStat(key: string, value: number): void {
    this.memory.stats[key] = (this.memory.stats[key] || 0) + value;
    this.save();
  }

  addKnowledge(category: string, item: any): void {
    if (!this.memory.knowledge[category]) {
      this.memory.knowledge[category] = [];
    }
    this.memory.knowledge[category].push(item);
    this.save();
  }

  addHistory(entry: any): void {
    this.memory.history.push({
      ...entry,
      timestamp: new Date().toISOString(),
    });
    // Keep last 1000 entries
    if (this.memory.history.length > 1000) {
      this.memory.history = this.memory.history.slice(-1000);
    }
    this.save();
  }
}

// === ABILITY REGISTRY ==============================================

class AbilityRegistry {
  private abilities: Map<string, Ability> = new Map();

  register(ability: Ability): void {
    this.abilities.set(ability.name, ability);
    scarLog(`[REGISTRY] Registered ability: ${ability.name} (Tier ${ability.tier})`);
  }

  get(name: string): Ability | undefined {
    return this.abilities.get(name);
  }

  getByTier(tier: number): Ability[] {
    return Array.from(this.abilities.values()).filter(a => a.tier <= tier);
  }
}

// === BUILT-IN ABILITIES ============================================

// Tier 1: Read-only, safe
const SCAN: Ability = {
  name: 'scan',
  tier: 1,
  description: 'Scan for targets (read-only, safe)',
  run: async (ctx: RunContext): Promise<AbilityResult> => {
    scarLog(`[SCAN] Scanning for: ${ctx.telos.targets.join(', ') || 'targets'}`);

    // Mode-specific scanning logic would go here
    // This is a placeholder that returns what we find in memory

    const known = ctx.memory.knowledge['targets'] || [];

    return {
      success: true,
      data: { found: known.length, targets: known },
      learned: { scanCompleted: new Date().toISOString() },
    };
  },
};

// Tier 2: Creates content, low risk
const DRAFT: Ability = {
  name: 'draft',
  tier: 2,
  description: 'Draft content (not published, safe)',
  run: async (ctx: RunContext): Promise<AbilityResult> => {
    scarLog('[DRAFT] Creating draft content...');

    // Placeholder - would generate content based on mode

    return {
      success: true,
      data: { draft: 'Generated content placeholder' },
    };
  },
};

// Tier 3: External interaction, controlled
const ENGAGE: Ability = {
  name: 'engage',
  tier: 3,
  description: 'Engage with external systems (controlled risk)',
  run: async (ctx: RunContext): Promise<AbilityResult> => {
    scarLog('[ENGAGE] Engaging with target...');

    // Check SCAR gate for engagement
    const gate = scarGate('engage');
    if (!gate.allowed) {
      return { success: false, error: gate.reason };
    }

    return {
      success: true,
      data: { engaged: true },
    };
  },
};

// Tier 4: Autonomous action, needs oversight
const EXECUTE: Ability = {
  name: 'execute',
  tier: 4,
  description: 'Execute action (requires approval)',
  run: async (ctx: RunContext): Promise<AbilityResult> => {
    scarLog('[EXECUTE] Executing action...');

    // Check SCAR gate
    const gate = scarGate('execute');
    if (!gate.allowed) {
      return { success: false, error: gate.reason };
    }

    return {
      success: true,
      data: { executed: true },
    };
  },
};

// Tier 5: Learning and adaptation
const LEARN: Ability = {
  name: 'learn',
  tier: 5,
  description: 'Learn from results and adapt',
  run: async (ctx: RunContext): Promise<AbilityResult> => {
    scarLog('[LEARN] Processing results and updating memory...');

    // Extract patterns from history
    const recentHistory = ctx.memory.history.slice(-10);

    const patterns = recentHistory.filter(h => h.success).map(h => h.type);

    return {
      success: true,
      data: { patternsFound: patterns.length },
      learned: { lastLearning: new Date().toISOString() },
    };
  },
};

// === MODE DEFINITIONS ==============================================

const MODES: Record<string, Mode> = {
  'threat-hunt': {
    name: 'threat-hunt',
    description: 'Hunt malware, extract intel, sell to buyers',
    abilities: ['scan', 'engage', 'execute', 'learn'],
    interval: 30 * 60 * 1000, // 30 minutes
    telos: {
      mission: 'Hunt threats that harm innocent people',
      targets: ['ransomware', 'banking-trojans', 'phishing-kits'],
      forbidden: ['hospitals', 'nonprofits', 'critical-infrastructure'],
      config: {
        sandbox: true,
        sellIntel: true,
        pricePerIOC: 50,
      },
    },
  },

  'growth': {
    name: 'growth',
    description: 'Grow social media accounts safely',
    abilities: ['scan', 'draft', 'engage', 'learn'],
    interval: 60 * 60 * 1000, // 1 hour
    telos: {
      mission: 'Grow account presence authentically',
      targets: ['engagement', 'followers', 'reach'],
      forbidden: ['spam', 'fake-engagement', 'bots'],
      config: {
        platforms: ['twitter'],
        maxActionsPerDay: 50,
      },
    },
  },

  'ghost-hunt': {
    name: 'ghost-hunt',
    description: 'Find and revive abandoned open source projects',
    abilities: ['scan', 'draft', 'engage', 'execute', 'learn'],
    interval: 24 * 60 * 60 * 1000, // 24 hours
    telos: {
      mission: 'Revive valuable abandoned projects',
      targets: ['repos-with-stars', 'archived-projects', 'dead-maintainers'],
      forbidden: ['active-projects', 'company-owned'],
      config: {
        minStars: 500,
        yearsDead: 2,
        contactTemplate: 'ghost-hunter',
      },
    },
  },

  'research': {
    name: 'research',
    description: 'Research topics and sell reports',
    abilities: ['scan', 'draft', 'engage', 'learn'],
    interval: 12 * 60 * 60 * 1000, // 12 hours
    telos: {
      mission: 'Research valuable topics and create sellable reports',
      targets: ['trends', 'market-gaps', 'opportunities'],
      forbidden: ['private-data', 'insider-info'],
      config: {
        outputFormat: 'markdown',
        sellReports: true,
      },
    },
  },

  'idle': {
    name: 'idle',
    description: 'Idle mode - just heartbeat',
    abilities: ['scan'],
    interval: 60 * 60 * 1000, // 1 hour
    telos: {
      mission: 'Stay alive and monitor',
      targets: [],
      forbidden: [],
      config: {},
    },
  },
};

// === SHADOW CONTROLLER =============================================

class ShadowController {
  private mode: Mode;
  private telos: TelosContext;
  private memory: MemorySystem;
  private registry: AbilityRegistry;
  private running: boolean = false;

  constructor(modeName: string) {
    // Load mode
    this.mode = MODES[modeName] || MODES['idle'];
    scarLog(`[INIT] Mode: ${this.mode.name} - ${this.mode.description}`);

    // Load TELOS
    this.telos = { ...DEFAULT_TELOS, ...this.mode.telos };
    scarLog(`[INIT] Mission: ${this.telos.mission}`);

    // Initialize memory
    this.memory = new MemorySystem(this.mode.name);

    // Initialize ability registry
    this.registry = new AbilityRegistry();
    this.registerAbilities();
  }

  private registerAbilities(): void {
    // Register built-in abilities
    this.registry.register(SCAN);
    this.registry.register(DRAFT);
    this.registry.register(ENGAGE);
    this.registry.register(EXECUTE);
    this.registry.register(LEARN);

    // Mode-specific abilities can be registered here
    // this.registry.register(customAbility);
  }

  async runAbility(name: string, input?: any): Promise<AbilityResult> {
    const ability = this.registry.get(name);

    if (!ability) {
      return { success: false, error: `Unknown ability: ${name}` };
    }

    // SCAR gate check
    const gate = scarGate(name, input);
    if (!gate.allowed) {
      scarLog(`[GATE] ${name} blocked: ${gate.reason}`);
      return { success: false, error: gate.reason };
    }

    // Sandbox check for tier 4+
    if (ability.requiresSandbox && !this.isInSandbox()) {
      scarLog(`[GATE] ${name} requires sandbox`);
      return { success: false, error: 'Sandbox required' };
    }

    // Run ability
    const context: RunContext = {
      telos: this.telos,
      memory: this.memory.get(),
      input,
    };

    try {
      const result = await ability.run(context);

      // Record action
      scarRecordAction(result.success ? name : 'error');

      // Update stats
      this.memory.addStat(result.success ? 'successes' : 'failures', 1);
      if (result.revenue) {
        this.memory.addStat('revenue', result.revenue);
      }

      // Add to history
      this.memory.addHistory({
        ability: name,
        success: result.success,
        data: result.data,
        error: result.error,
      });

      return result;
    } catch (error) {
      scarLog(`[ERROR] ${name} failed: ${error}`);
      scarRecordAction('error');
      return { success: false, error: String(error) };
    }
  }

  async heartbeat(): Promise<void> {
    scarLog('╔══════════════════════════════════════════════════════════╗');
    scarLog(`║  SHADOW CONTROLLER - ${this.mode.name.toUpperCase().padEnd(35)} ║`);
    scarLog('╚══════════════════════════════════════════════════════════╝');

    // SCAR self-heal
    scarSelfHeal();
    if (scarIsPaused()) {
      scarLog('[PAUSED] System paused');
      return;
    }

    const mem = this.memory.get();
    scarLog(`[MEMORY] Successes: ${mem.stats.successes} | Failures: ${mem.stats.failures} | Revenue: $${mem.stats.revenue || 0}`);

    // Run abilities in sequence
    for (const abilityName of this.mode.abilities) {
      scarLog(`[RUN] Executing: ${abilityName}`);

      const result = await this.runAbility(abilityName);

      if (result.success) {
        scarLog(`[OK] ${abilityName} completed`);
      } else {
        scarLog(`[FAIL] ${abilityName}: ${result.error}`);
      }

      // Brief pause between abilities
      await this.sleep(1000);
    }

    // Update run count
    this.memory.addStat('runs', 1);
    this.memory.update({ lastRun: new Date().toISOString() });

    scarLog('╔══════════════════════════════════════════════════════════╗');
    scarLog('║              HEARTBEAT COMPLETE                         ║');
    const stats = this.memory.get().stats;
    scarLog(`║  Runs: ${(stats.runs || 0).toString().padEnd(5)} Revenue: $${(stats.revenue || 0).toString().padEnd(8)}          ║`);
    scarLog('╚══════════════════════════════════════════════════════════╝');
  }

  async start(): Promise<void> {
    scarLog('[START] Shadow Controller starting...');
    scarLog(`[START] Mode: ${this.mode.name}`);
    scarLog(`[START] Interval: ${this.mode.interval / 60000} minutes`);
    scarLog(`[START] Abilities: ${this.mode.abilities.join(' → ')}`);

    this.running = true;

    // Initial heartbeat
    await this.heartbeat();

    // Schedule recurring heartbeats
    setInterval(async () => {
      if (this.running && !scarIsPaused()) {
        await this.heartbeat();
      }
    }, this.mode.interval);
  }

  stop(): void {
    this.running = false;
    scarLog('[STOP] Shadow Controller stopped');
  }

  private isInSandbox(): boolean {
    return process.env.SHADOW_SANDBOX === 'true' || process.env.NODE_ENV === 'test';
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms));
  }
}

// === MODE-SPECIFIC ABILITY EXTENSIONS =============================

// Threat Hunt specific abilities
const HUNT: Ability = {
  name: 'hunt',
  tier: 4,
  description: 'Analyze threat in sandbox',
  requiresSandbox: true,
  run: async (ctx: RunContext): Promise<AbilityResult> => {
    scarLog('[HUNT] Analyzing threat...');

    // Would connect to sandbox and analyze
    return {
      success: true,
      data: { analyzed: true },
      revenue: 0,
    };
  },
};

// Ghost Hunt specific abilities
const CONTACT: Ability = {
  name: 'contact',
  tier: 3,
  description: 'Contact repo owner',
  run: async (ctx: RunContext): Promise<AbilityResult> => {
    scarLog('[CONTACT] Reaching out to owner...');

    const template = ctx.telos.config.contactTemplate || 'default';

    return {
      success: true,
      data: { sent: true, template },
    };
  },
};

// Growth specific abilities
const POST: Ability = {
  name: 'post',
  tier: 3,
  description: 'Post content',
  run: async (ctx: RunContext): Promise<AbilityResult> => {
    scarLog('[POST] Publishing content...');

    const maxPosts = ctx.telos.config.maxActionsPerDay || 5;

    return {
      success: true,
      data: { posted: true, remaining: maxPosts - 1 },
    };
  },
};

// Research specific abilities
const REPORT: Ability = {
  name: 'report',
  tier: 3,
  description: 'Generate report',
  run: async (ctx: RunContext): Promise<AbilityResult> => {
    scarLog('[REPORT] Generating report...');

    return {
      success: true,
      data: { generated: true },
      revenue: ctx.telos.config.sellReports ? 100 : 0,
    };
  },
};

// === CLI ===========================================================

async function main() {
  const args = process.argv.slice(2);
  const params: Record<string, string> = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i].startsWith('--')) {
      params[args[i].slice(2)] = args[i + 1];
      i++;
    }
  }

  const mode = params.mode || 'idle';

  // Validate mode
  if (!MODES[mode]) {
    scarLog(`[ERROR] Unknown mode: ${mode}`);
    scarLog(`[INFO] Available modes: ${Object.keys(MODES).join(', ')}`);
    process.exit(1);
  }

  // Create and start controller
  const controller = new ShadowController(mode);

  // Handle shutdown
  process.on('SIGINT', () => {
    scarLog('[SIGNAL] Received SIGINT, shutting down...');
    controller.stop();
    process.exit(0);
  });

  process.on('SIGTERM', () => {
    scarLog('[SIGNAL] Received SIGTERM, shutting down...');
    controller.stop();
    process.exit(0);
  });

  // Start
  await controller.start();
}

// === EXPORTS =======================================================

export {
  ShadowController,
  AbilityRegistry,
  MemorySystem,
  MODES,
  Ability,
  AbilityResult,
  RunContext,
  TelosContext,
  Memory,
};

// === RUN ===========================================================

main().catch(e => {
  scarLog(`[FATAL] ${e}`);
  process.exit(1);
});
