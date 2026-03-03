#!/usr/bin/env bun
/**
 * SHADOW - Cyber Combat Agent
 *
 * Single AI agent that:
 * - Lures threats (honeypots)
 * - Hunts malware (tracking)
 * - Analyzes attacks (reverse engineering)
 * - Defends systems (response)
 * - Scouts for intel (reconnaissance)
 *
 * Levels up, gains XP, unlocks abilities.
 * This is REAL cybersecurity wrapped in game mechanics.
 *
 * Run: bun run shadow.ts
 */

import {
  scarLog,
  scarRecordAction,
} from './scar';

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// === TYPES =========================================================

interface ShadowStats {
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  spd: number;
  int: number;
}

interface Ability {
  name: string;
  description: string;
  tier: number;
  cooldown: number;
  lastUsed: number;
  unlocked: boolean;
}

interface ShadowState {
  name: string;
  title: string;
  motto: string;
  level: number;
  xp: number;
  stats: ShadowStats;
  abilities: Ability[];
  kills: number;
  intelExtracted: number;
  threatsTrapped: number;
  survivalStreak: number;
  status: 'ready' | 'deployed' | 'recovery' | 'dead';
  createdAt: string;
  totalBattles: number;
  treasury: number;
}

// === XP & LEVELING =================================================

const XP_TABLE: Record<number, number> = {
  1: 0,
  2: 100,
  3: 250,
  5: 500,
  10: 1500,
  15: 3000,
  20: 5000,
  25: 8000,
  50: 25000,
  75: 60000,
  100: 100000,
};

const LEVEL_TITLES: Record<number, string> = {
  1: 'Script Kiddie',
  5: 'Novice',
  10: 'Apprentice',
  15: 'Operator',
  20: 'Veteran',
  25: 'Elite',
  50: 'Master',
  75: 'Legend',
  100: 'Apex',
};

function getLevelFromXP(xp: number): number {
  let level = 1;
  for (const [lvl, needed] of Object.entries(XP_TABLE)) {
    if (xp >= needed) level = parseInt(lvl);
  }
  return level;
}

function getTitle(level: number): string {
  let title = 'Script Kiddie';
  for (const [lvl, t] of Object.entries(LEVEL_TITLES)) {
    if (level >= parseInt(lvl)) title = t;
  }
  return title;
}

// === ABILITIES =====================================================

const ALL_ABILITIES: Ability[] = [
  // Tier 1 - Scout
  { name: 'shadow_flight', description: 'Scan dark web and forums for threats', tier: 1, cooldown: 60000, lastUsed: 0, unlocked: true },

  // Tier 3 - Lure
  { name: 'phantom_trap', description: 'Deploy honeypot decoy', tier: 3, cooldown: 60000, lastUsed: 0, unlocked: false },

  // Tier 5 - Hunt
  { name: 'blood_trail', description: 'Track malware to its source', tier: 5, cooldown: 30000, lastUsed: 0, unlocked: false },

  // Tier 10 - Analyze
  { name: 'deconstruct', description: 'Reverse engineer captured malware', tier: 10, cooldown: 60000, lastUsed: 0, unlocked: false },

  // Tier 15 - Defend
  { name: 'fortress_wall', description: 'Block malicious IPs/domains', tier: 15, cooldown: 45000, lastUsed: 0, unlocked: false },

  // Tier 20 - Advanced
  { name: 'execute', description: 'Terminate malicious process', tier: 20, cooldown: 120000, lastUsed: 0, unlocked: false },
  { name: 'essence_drain', description: 'Extract IOCs and signatures', tier: 20, cooldown: 180000, lastUsed: 0, unlocked: false },

  // Tier 30 - Expert
  { name: 'chain_lightning', description: 'Multi-target elimination', tier: 30, cooldown: 300000, lastUsed: 0, unlocked: false },
  { name: 'void_prison', description: 'Isolate threat in sandbox', tier: 30, cooldown: 600000, lastUsed: 0, unlocked: false },

  // Tier 50 - Master
  { name: 'omniscient_eye', description: 'Query threat intel databases', tier: 50, cooldown: 600000, lastUsed: 0, unlocked: false },
  { name: 'resurrection', description: 'Restore from clean backup', tier: 50, cooldown: 300000, lastUsed: 0, unlocked: false },

  // Tier 75 - Legendary
  { name: 'zero_day', description: 'Discover unknown vulnerability', tier: 75, cooldown: 120000, lastUsed: 0, unlocked: false },

  // Tier 100 - Apex
  { name: 'system_takeover', description: 'Assume control of enemy agent', tier: 100, cooldown: 180000, lastUsed: 0, unlocked: false },
];

// === SHADOW CLASS ==================================================

const DATA_DIR = join(__dirname, '..', 'data');
const STATE_FILE = join(DATA_DIR, 'shadow-state.json');

class Shadow {
  private state: ShadowState;

  constructor() {
    this.state = this.load();
  }

  private load(): ShadowState {
    try {
      if (!existsSync(STATE_FILE)) {
        mkdirSync(DATA_DIR, { recursive: true });
        return this.createDefaultState();
      }
      const raw = readFileSync(STATE_FILE, 'utf-8');
      return JSON.parse(raw);
    } catch {
      return this.createDefaultState();
    }
  }

  private createDefaultState(): ShadowState {
    return {
      name: 'Shadow',
      title: 'SHADOW, THE SLAYER',
      motto: 'Threats die here',
      level: 1,
      xp: 0,
      stats: {
        hp: 100,
        maxHp: 100,
        atk: 15,
        def: 10,
        spd: 12,
        int: 15,
      },
      abilities: ALL_ABILITIES.map(a => ({ ...a })),
      kills: 0,
      intelExtracted: 0,
      threatsTrapped: 0,
      survivalStreak: 0,
      status: 'ready',
      createdAt: new Date().toISOString(),
      totalBattles: 0,
      treasury: 0,
    };
  }

  save(): void {
    try {
      mkdirSync(DATA_DIR, { recursive: true });
      writeFileSync(STATE_FILE, JSON.stringify(this.state, null, 2));
    } catch (error) {
      scarLog(`[SHADOW] Save failed: ${error}`);
    }
  }

  // === GETTERS ===

  get name(): string { return this.state.name; }
  get level(): number { return this.state.level; }
  get xp(): number { return this.state.xp; }
  get stats(): ShadowStats { return this.state.stats; }
  get abilities(): Ability[] { return this.state.abilities; }
  get status(): string { return this.state.status; }
  get kills(): number { return this.state.kills; }
  get treasury(): number { return this.state.treasury; }

  // === ABILITY MANAGEMENT ===

  getUnlockedAbilities(): Ability[] {
    return this.state.abilities.filter(a => a.unlocked);
  }

  canUseAbility(name: string): boolean {
    const ability = this.state.abilities.find(a => a.name === name);
    if (!ability || !ability.unlocked) return false;
    return Date.now() - ability.lastUsed >= ability.cooldown;
  }

  useAbility(name: string): boolean {
    const ability = this.state.abilities.find(a => a.name === name);
    if (!ability || !ability.unlocked) return false;
    if (Date.now() - ability.lastUsed < ability.cooldown) return false;

    ability.lastUsed = Date.now();
    this.save();
    return true;
  }

  // === XP & LEVELING ===

  addXP(amount: number, reason: string): void {
    const oldLevel = this.state.level;
    this.state.xp += amount;
    this.state.level = getLevelFromXP(this.state.xp);

    if (this.state.level > oldLevel) {
      scarLog(`[LEVEL UP] Shadow is now level ${this.state.level} - ${getTitle(this.state.level)}!`);
      this.unlockAbilities();
      this.boostStats();
    }

    scarLog(`[XP] +${amount} (${reason}) - Total: ${this.state.xp}`);
    this.save();
  }

  private unlockAbilities(): void {
    for (const ability of this.state.abilities) {
      if (this.state.level >= ability.tier && !ability.unlocked) {
        ability.unlocked = true;
        scarLog(`[ABILITY] Unlocked: ${ability.name} - ${ability.description}`);
      }
    }
  }

  private boostStats(): void {
    this.state.stats.maxHp += 5;
    this.state.stats.hp = this.state.stats.maxHp;
    this.state.stats.atk += 1;
    this.state.stats.def += 1;
    this.state.stats.spd += 1;
    this.state.stats.int += 2;
  }

  // === COMBAT ===

  takeDamage(amount: number): void {
    this.state.stats.hp -= amount;
    if (this.state.stats.hp <= 0) {
      this.state.stats.hp = 0;
      this.state.status = 'recovery';
      this.state.survivalStreak = 0;
      scarLog(`[DAMAGE] Shadow knocked out! Entering recovery.`);
    } else {
      scarLog(`[DAMAGE] Shadow took ${amount} damage (HP: ${this.state.stats.hp}/${this.state.stats.maxHp})`);
    }
    this.save();
  }

  heal(amount: number): void {
    this.state.stats.hp = Math.min(this.state.stats.hp + amount, this.state.stats.maxHp);
    if (this.state.status === 'recovery' && this.state.stats.hp > 0) {
      this.state.status = 'ready';
    }
    this.save();
  }

  recordKill(): void {
    this.state.kills++;
    this.state.survivalStreak++;
    this.save();
  }

  recordIntel(value: number): void {
    this.state.intelExtracted++;
    this.state.treasury += value;
    this.save();
  }

  recordTrap(): void {
    this.state.threatsTrapped++;
    this.save();
  }

  // === DISPLAY ===

  printStatus(): void {
    const title = getTitle(this.state.level);
    const xpToNext = this.findNextXPLevel();
    const xpProgress = this.state.xp - (XP_TABLE[this.state.level] || 0);
    const xpNeeded = xpToNext - (XP_TABLE[this.state.level] || 0);

    scarLog('\n┌─────────────────────────────────────────────────────────┐');
    scarLog('│  SHADOW, THE SLAYER                                     │');
    scarLog('│  "Threats die here"                                     │');
    scarLog('├─────────────────────────────────────────────────────────┤');
    scarLog(`│  Level ${this.state.level} ${title.padEnd(20)}`);

    // XP bar
    const xpBar = this.makeBar(xpProgress, xpNeeded, 20);
    scarLog(`│  XP: ${xpBar} ${this.state.xp}/${xpToNext}`);

    // HP bar
    const hpBar = this.makeBar(this.state.stats.hp, this.state.stats.maxHp, 20);
    scarLog(`│  HP: ${hpBar} ${this.state.stats.hp}/${this.state.stats.maxHp}`);

    scarLog('├─────────────────────────────────────────────────────────┤');
    scarLog(`│  ATK:${this.state.stats.atk.toString().padStart(3)}  DEF:${this.state.stats.def.toString().padStart(3)}  SPD:${this.state.stats.spd.toString().padStart(3)}  INT:${this.state.stats.int.toString().padStart(3)}`);
    scarLog('├─────────────────────────────────────────────────────────┤');
    scarLog(`│  Kills: ${this.state.kills}  │  Intel: ${this.state.intelExtracted}  │  Trapped: ${this.state.threatsTrapped}`);
    scarLog(`│  Treasury: $${this.state.treasury}  │  Streak: ${this.state.survivalStreak}`);
    scarLog('└─────────────────────────────────────────────────────────┘\n');
  }

  printAbilities(): void {
    scarLog('\n┌─────────────────────────────────────────────────────────┐');
    scarLog('│  ABILITIES                                              │');
    scarLog('├─────────────────────────────────────────────────────────┤');

    for (const ability of this.state.abilities) {
      const status = ability.unlocked ?
        (this.canUseAbility(ability.name) ? '✓' : '⏳') :
        `🔒 Lv${ability.tier}`;
      const name = ability.name.padEnd(18);
      scarLog(`│  ${status} ${name} - ${ability.description.substring(0, 25)}`);
    }

    scarLog('└─────────────────────────────────────────────────────────┘\n');
  }

  private makeBar(current: number, max: number, length: number): string {
    const filled = Math.floor((current / max) * length);
    const empty = length - filled;
    return '█'.repeat(filled) + '░'.repeat(empty);
  }

  private findNextXPLevel(): number {
    for (const [lvl, xp] of Object.entries(XP_TABLE)) {
      if (xp > this.state.xp) return xp;
    }
    return this.state.xp + 1000;
  }
}

// === COMBAT SIMULATION =============================================

async function runCombatSimulation(shadow: Shadow): Promise<void> {
  scarLog('╔══════════════════════════════════════════════════════════╗');
  scarLog('║                 COMBAT SIMULATION                        ║');
  scarLog('╚══════════════════════════════════════════════════════════╝');

  // Phase 1: SCOUT
  scarLog('\n[PHASE 1: SCOUT]');
  if (shadow.canUseAbility('shadow_flight')) {
    shadow.useAbility('shadow_flight');
    scarLog('Shadow uses SHADOW_FLIGHT - scanning for threats...');
    await sleep(300);

    const threatsFound = Math.floor(Math.random() * 3) + 1;
    scarLog(`Detected ${threatsFound} potential threat(s)`);
    shadow.addXP(10 * threatsFound, 'scouting');
  } else {
    scarLog('Shadow_flight on cooldown, skipping scout phase');
  }

  // Phase 2: LURE
  scarLog('\n[PHASE 2: LURE]');
  if (shadow.canUseAbility('phantom_trap')) {
    shadow.useAbility('phantom_trap');
    scarLog('Shadow uses PHANTOM_TRAP - deploying honeypot...');
    await sleep(300);

    const trapped = Math.floor(Math.random() * 3) + 1;
    scarLog(`Trapped ${trapped} threat(s) in honeypot`);
    shadow.recordTrap();
    shadow.addXP(15 * trapped, 'trapping');
  } else if (!shadow.abilities.find(a => a.name === 'phantom_trap')?.unlocked) {
    scarLog('Phantom_trap not unlocked yet (requires level 3)');
  } else {
    scarLog('Phantom_trap on cooldown');
  }

  // Phase 3: HUNT
  scarLog('\n[PHASE 3: HUNT]');
  if (shadow.canUseAbility('blood_trail')) {
    shadow.useAbility('blood_trail');
    scarLog('Shadow uses BLOOD_TRAIL - tracking malware...');
    await sleep(300);

    const captured = Math.random() > 0.3;
    if (captured) {
      scarLog('Successfully captured malware sample');
      shadow.addXP(25, 'capture');
    } else {
      scarLog('Target escaped, continuing pursuit');
    }
  } else if (!shadow.abilities.find(a => a.name === 'blood_trail')?.unlocked) {
    scarLog('Blood_trail not unlocked yet (requires level 5)');
  } else {
    scarLog('Blood_trail on cooldown');
  }

  // Phase 4: ANALYZE
  scarLog('\n[PHASE 4: ANALYZE]');
  if (shadow.canUseAbility('deconstruct')) {
    shadow.useAbility('deconstruct');
    scarLog('Shadow uses DECONSTRUCT - reverse engineering...');
    await sleep(300);

    const intelValue = Math.floor(Math.random() * 50) + 25;
    scarLog(`Extracted intel worth $${intelValue}`);
    shadow.recordIntel(intelValue);
    shadow.addXP(50, 'analysis');
  } else if (!shadow.abilities.find(a => a.name === 'deconstruct')?.unlocked) {
    scarLog('Deconstruct not unlocked yet (requires level 10)');
  } else {
    scarLog('Deconstruct on cooldown');
  }

  // Phase 5: DEFEND
  scarLog('\n[PHASE 5: DEFEND]');
  const incomingDamage = Math.floor(Math.random() * 20) + 5;

  if (shadow.canUseAbility('fortress_wall')) {
    shadow.useAbility('fortress_wall');
    const blocked = Math.random() > 0.4;
    if (blocked) {
      scarLog('Shadow uses FORTRESS_WALL - blocked incoming attack!');
      shadow.addXP(20, 'defense');
    } else {
      scarLog('Attack partially penetrated defenses');
      shadow.takeDamage(Math.floor(incomingDamage / 2));
    }
  } else {
    scarLog(`Took ${incomingDamage} damage from counter-attack`);
    shadow.takeDamage(incomingDamage);
  }

  scarLog('\n╔══════════════════════════════════════════════════════════╗');
  scarLog('║              SIMULATION COMPLETE                         ║');
  scarLog('╚══════════════════════════════════════════════════════════╝');

  shadow.printStatus();
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// === COMMANDS ======================================================

async function handleCommand(args: string[]): Promise<void> {
  const cmd = args[0];
  const shadow = new Shadow();

  switch (cmd) {
    case 'status':
      shadow.printStatus();
      break;

    case 'abilities':
      shadow.printAbilities();
      break;

    case 'fight':
    case 'battle':
    case 'sim':
      await runCombatSimulation(shadow);
      break;

    case 'heal':
      shadow.heal(shadow.stats.maxHp);
      scarLog('[SHADOW] Fully healed');
      shadow.printStatus();
      break;

    case 'xp':
      const amount = parseInt(args[1]) || 100;
      shadow.addXP(amount, 'manual grant');
      shadow.printStatus();
      break;

    case 'reset':
      const confirm = args[1] === 'confirm';
      if (confirm) {
        if (existsSync(STATE_FILE)) {
          const { unlinkSync } = require('fs');
          unlinkSync(STATE_FILE);
        }
        scarLog('[SHADOW] Reset complete. Run again to start fresh.');
      } else {
        scarLog('Usage: reset confirm');
      }
      break;

    default:
      scarLog('╔══════════════════════════════════════════════════════════╗');
      scarLog('║              SHADOW - Cyber Combat Agent                 ║');
      scarLog('╚══════════════════════════════════════════════════════════╝');
      scarLog('');
      scarLog('Commands:');
      scarLog('  status     - Show Shadow status');
      scarLog('  abilities  - Show abilities (locked/unlocked)');
      scarLog('  fight      - Run combat simulation');
      scarLog('  heal       - Restore HP');
      scarLog('  xp <n>     - Grant XP (testing)');
      scarLog('  reset      - Reset to level 1');
      scarLog('');
      scarLog('Example:');
      scarLog('  bun run shadow.ts status');
      scarLog('  bun run shadow.ts fight');
  }
}

// === MAIN ==========================================================

async function main() {
  const args = process.argv.slice(2);
  await handleCommand(args);
}

// === EXPORTS =======================================================

export { Shadow, ShadowState, ShadowStats, Ability };

// === RUN ===========================================================

// Only run main if this is the entry point (not imported)
if (import.meta.main) {
  main().catch(e => {
    scarLog(`[FATAL] ${e}`);
    process.exit(1);
  });
}
