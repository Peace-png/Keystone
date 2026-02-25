#!/usr/bin/env bun
/**
 * SHADOW GUILD - Cyber Bot Guild System
 *
 * A guild of specialized bots that:
 * - Lure threats (honeypots)
 * - Hunt malware (tracking)
 * - Analyze attacks (reverse engineering)
 * - Defend systems (response)
 *
 * Bots level up, gain XP, unlock abilities.
 * This is REAL cybersecurity wrapped in game mechanics.
 *
 * Run: bun run guild.ts
 */

import {
  scarGate,
  scarLog,
  scarRecordAction,
  scarSelfHeal,
  scarIsPaused,
} from './scar';

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// === TYPES =========================================================

interface BotStats {
  hp: number;
  maxHp: number;
  atk: number;
  def: number;
  spd: number;
  int: number;
}

interface BotAbility {
  name: string;
  description: string;
  tier: number;
  cooldown: number;
  lastUsed: number;
}

interface Bot {
  id: string;
  name: string;
  role: 'hunter' | 'lurer' | 'analyst' | 'guardian' | 'scout';
  level: number;
  xp: number;
  stats: BotStats;
  abilities: BotAbility[];
  kills: number;          // Threats neutralized
  intel: number;          // Intel packages extracted
  survivalStreak: number; // Consecutive successful ops
  status: 'ready' | 'deployed' | 'recovery' | 'dead';
  createdAt: string;
}

interface Threat {
  id: string;
  type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  source: string;
  captured: boolean;
  analyzed: boolean;
  neutralized: boolean;
}

interface GuildState {
  bots: Bot[];
  threats: Threat[];
  intel: any[];
  stats: {
    totalKills: number;
    totalIntel: number;
    totalXP: number;
    successfulOps: number;
    failedOps: number;
  };
  treasury: number; // Revenue from intel sales
  reputation: number; // Guild reputation
}

// === XP & LEVELING =================================================

const XP_TABLE: Record<number, number> = {
  // XP needed to reach level
  1: 0,
  2: 100,
  3: 250,
  5: 500,
  10: 1500,
  15: 3000,
  20: 5000,
  25: 8000, // Specialization unlock
  50: 25000,
  75: 60000,
  100: 100000, // Max level
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

function xpForLevel(level: number): number {
  return XP_TABLE[level] || level * 1000;
}

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

// === BOT CLASSES ===================================================

const BOT_CLASSES = {
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  // THE 5 GENERALS - FORTRESS HIERARCHY
  // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

  hunter: {
    name: 'Slayer',
    title: 'SHADOW, THE SLAYER',
    motto: 'Threats die here',
    description: 'Eliminates threats with precision strikes',
    baseStats: { hp: 100, maxHp: 100, atk: 18, def: 8, spd: 15, int: 10 },
    abilities: [
      { name: 'blood_trail', description: 'Track malware to its source', tier: 1, cooldown: 30000, lastUsed: 0 },
      { name: 'execute', description: 'Terminate malicious process', tier: 5, cooldown: 120000, lastUsed: 0 },
      { name: 'chain_lightning', description: 'Multi-target elimination', tier: 15, cooldown: 300000, lastUsed: 0 },
    ],
  },

  lurer: {
    name: 'Trapwright',
    title: 'PHANTOM, THE TRAPWRIGHT',
    motto: 'I build the lies they believe',
    description: 'Crafts honeypots and lures attackers into traps',
    baseStats: { hp: 80, maxHp: 80, atk: 5, def: 15, spd: 10, int: 12 },
    abilities: [
      { name: 'phantom_trap', description: 'Deploy honeypot decoy', tier: 1, cooldown: 60000, lastUsed: 0 },
      { name: 'mirror_image', description: 'Create multiple false targets', tier: 5, cooldown: 300000, lastUsed: 0 },
      { name: 'void_prison', description: 'Isolate threat in sandbox', tier: 15, cooldown: 600000, lastUsed: 0 },
    ],
  },

  analyst: {
    name: 'Cryptarch',
    title: 'GHOST, THE CRYPTARCH',
    motto: 'Every secret finds its grave',
    description: 'Decodes, analyzes, archives all threat intelligence',
    baseStats: { hp: 60, maxHp: 60, atk: 5, def: 5, spd: 5, int: 28 },
    abilities: [
      { name: 'deconstruct', description: 'Reverse engineer malware', tier: 1, cooldown: 60000, lastUsed: 0 },
      { name: 'essence_drain', description: 'Extract IOCs and signatures', tier: 5, cooldown: 180000, lastUsed: 0 },
      { name: 'omniscient_eye', description: 'Query threat intel databases', tier: 15, cooldown: 600000, lastUsed: 0 },
    ],
  },

  guardian: {
    name: 'Sentinel',
    title: 'GUARDIAN, THE SENTINEL',
    motto: 'Nothing passes without permission',
    description: 'Blocks attacks and hardens defenses',
    baseStats: { hp: 130, maxHp: 130, atk: 8, def: 22, spd: 5, int: 10 },
    abilities: [
      { name: 'fortress_wall', description: 'Block malicious IPs/domains', tier: 1, cooldown: 45000, lastUsed: 0 },
      { name: 'banish', description: 'Isolate infected systems', tier: 5, cooldown: 120000, lastUsed: 0 },
      { name: 'resurrection', description: 'Restore from clean backup', tier: 15, cooldown: 300000, lastUsed: 0 },
    ],
  },

  scout: {
    name: 'Vanguard',
    title: 'RAVEN, THE VANGUARD',
    motto: 'I see the storm before it breaks',
    description: 'Early warning, threat feeds, reconnaissance',
    baseStats: { hp: 70, maxHp: 70, atk: 8, def: 8, spd: 20, int: 18 },
    abilities: [
      { name: 'shadow_flight', description: 'Scan dark web and forums', tier: 1, cooldown: 60000, lastUsed: 0 },
      { name: 'eagle_eye', description: 'Monitor threat feeds', tier: 5, cooldown: 120000, lastUsed: 0 },
      { name: 'swift_report', description: 'Instant alert to Oracle', tier: 15, cooldown: 300000, lastUsed: 0 },
    ],
  },
};

// === GUILD SYSTEM ==================================================

const GUILD_DIR = join(__dirname, '..', 'data', 'guild');
const GUILD_FILE = join(GUILD_DIR, 'guild-state.json');

class Guild {
  private state: GuildState;

  constructor() {
    this.state = this.load();
  }

  private load(): GuildState {
    try {
      if (!existsSync(GUILD_FILE)) {
        mkdirSync(GUILD_DIR, { recursive: true });
        return this.createDefaultState();
      }
      const raw = readFileSync(GUILD_FILE, 'utf-8');
      return JSON.parse(raw);
    } catch {
      return this.createDefaultState();
    }
  }

  private createDefaultState(): GuildState {
    return {
      bots: [],
      threats: [],
      intel: [],
      stats: {
        totalKills: 0,
        totalIntel: 0,
        totalXP: 0,
        successfulOps: 0,
        failedOps: 0,
      },
      treasury: 0,
      reputation: 0,
    };
  }

  save(): void {
    try {
      mkdirSync(GUILD_DIR, { recursive: true });
      writeFileSync(GUILD_FILE, JSON.stringify(this.state, null, 2));
    } catch (error) {
      scarLog(`[GUILD] Save failed: ${error}`);
    }
  }

  // === BOT MANAGEMENT ===

  createBot(name: string, role: Bot['role']): Bot {
    const classData = BOT_CLASSES[role];

    const bot: Bot = {
      id: `bot-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      name,
      role,
      level: 1,
      xp: 0,
      stats: { ...classData.baseStats },
      abilities: classData.abilities.slice(0, 1), // Start with first ability only
      kills: 0,
      intel: 0,
      survivalStreak: 0,
      status: 'ready',
      createdAt: new Date().toISOString(),
    };

    this.state.bots.push(bot);
    this.save();

    scarLog(`[GUILD] Bot created: ${name} (${classData.name}) - ${getTitle(1)}`);
    return bot;
  }

  getBot(id: string): Bot | undefined {
    return this.state.bots.find(b => b.id === id);
  }

  getBotsByRole(role: Bot['role']): Bot[] {
    return this.state.bots.filter(b => b.role === role && b.status === 'ready');
  }

  // === XP & LEVELING ===

  addXP(bot: Bot, amount: number): void {
    const oldLevel = bot.level;
    bot.xp += amount;
    bot.level = getLevelFromXP(bot.xp);

    if (bot.level > oldLevel) {
      scarLog(`[LEVEL UP] ${bot.name} is now level ${bot.level} - ${getTitle(bot.level)}!`);

      // Unlock new abilities
      this.unlockAbilities(bot);

      // Stat boost
      bot.stats.maxHp += 5;
      bot.stats.hp = bot.stats.maxHp;
      bot.stats.atk += 1;
      bot.stats.def += 1;
      bot.stats.spd += 1;
      bot.stats.int += 2;
    }

    this.state.stats.totalXP += amount;
    this.save();
  }

  private unlockAbilities(bot: Bot): void {
    const classData = BOT_CLASSES[bot.role];
    for (const ability of classData.abilities) {
      if (bot.level >= ability.tier && !bot.abilities.find(a => a.name === ability.name)) {
        bot.abilities.push({ ...ability });
        scarLog(`[ABILITY] ${bot.name} unlocked: ${ability.name}`);
      }
    }
  }

  // === OPERATIONS ===

  async deployOperation(): Promise<void> {
    scarLog('╔══════════════════════════════════════════════════════════╗');
    scarLog('║                 GUILD OPERATION                         ║');
    scarLog('╚══════════════════════════════════════════════════════════╝');

    // Get available bots
    const lurers = this.getBotsByRole('lurer');
    const hunters = this.getBotsByRole('hunter');
    const analysts = this.getBotsByRole('analyst');
    const guardians = this.getBotsByRole('guardian');

    if (lurers.length === 0 && hunters.length === 0) {
      scarLog('[OP] No bots available. Create some bots first!');
      return;
    }

    // Phase 1: LURE (if we have lurers)
    let threats: Threat[] = [];
    if (lurers.length > 0) {
      const lurer = lurers[0];
      scarLog(`[OP] ${lurer.name} deploying honeypot...`);
      threats = await this.lurePhase(lurer);
    }

    // Phase 2: HUNT (capture threats)
    if (hunters.length > 0 && threats.length > 0) {
      const hunter = hunters[0];
      scarLog(`[OP] ${hunter.name} hunting threats...`);
      threats = await this.huntPhase(hunter, threats);
    }

    // Phase 3: ANALYZE (extract intel)
    if (analysts.length > 0 && threats.filter(t => t.captured).length > 0) {
      const analyst = analysts[0];
      scarLog(`[OP] ${analyst.name} analyzing threats...`);
      await this.analyzePhase(analyst, threats);
    }

    // Phase 4: DEFEND (if any threats remain active)
    const activeThreats = threats.filter(t => !t.neutralized);
    if (guardians.length > 0 && activeThreats.length > 0) {
      const guardian = guardians[0];
      scarLog(`[OP] ${guardian.name} neutralizing threats...`);
      await this.defendPhase(guardian, activeThreats);
    }

    this.state.stats.successfulOps++;
    this.save();

    scarLog('╔══════════════════════════════════════════════════════════╗');
    scarLog('║              OPERATION COMPLETE                         ║');
    this.printRoster();
    scarLog('╚══════════════════════════════════════════════════════════╝');
  }

  private async lurePhase(lurer: Bot): Promise<Threat[]> {
    // Use phantom_trap ability
    const ability = lurer.abilities.find(a => a.name === 'phantom_trap');
    if (!ability) {
      scarLog(`[LURE] ${lurer.name} hasn't unlocked phantom_trap yet`);
      return [];
    }

    // Check cooldown
    if (Date.now() - ability.lastUsed < ability.cooldown) {
      scarLog(`[LURE] ${lurer.name}'s phantom_trap on cooldown`);
      return [];
    }

    ability.lastUsed = Date.now();
    scarLog(`[LURE] ${lurer.name} deployed honeypot decoy...`);

    // Simulate luring threats (in real version: actual honeypot)
    const threatCount = Math.floor(Math.random() * 3) + 1;
    const threats: Threat[] = [];

    for (let i = 0; i < threatCount; i++) {
      threats.push({
        id: `threat-${Date.now()}-${i}`,
        type: ['ransomware', 'trojan', 'bot', 'phishing'][Math.floor(Math.random() * 4)],
        severity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)] as any,
        source: 'honeypot',
        captured: false,
        analyzed: false,
        neutralized: false,
      });
    }

    scarLog(`[LURE] ${lurer.name} trapped ${threats.length} threat(s)`);
    this.addXP(lurer, 10 * threatCount);

    return threats;
  }

  private async huntPhase(hunter: Bot, threats: Threat[]): Promise<Threat[]> {
    const ability = hunter.abilities.find(a => a.name === 'blood_trail');
    if (!ability) {
      scarLog(`[HUNT] ${hunter.name} hasn't unlocked blood_trail yet`);
      return threats;
    }

    if (Date.now() - ability.lastUsed < ability.cooldown) {
      scarLog(`[HUNT] ${hunter.name}'s blood_trail on cooldown`);
      return threats;
    }

    ability.lastUsed = Date.now();
    scarLog(`[HUNT] ${hunter.name} tracking threats...`);

    // Capture based on hunter's ATK vs threat severity
    for (const threat of threats) {
      const captureChance = hunter.stats.atk * 5 + (threat.severity === 'low' ? 30 : 0);
      if (Math.random() * 100 < captureChance) {
        threat.captured = true;
        scarLog(`[HUNT] ${hunter.name} captured: ${threat.type} (${threat.severity})`);
        this.addXP(hunter, 25);
      } else {
        scarLog(`[HUNT] ${hunter.name} lost the trail on ${threat.type}`);
      }
    }

    return threats;
  }

  private async analyzePhase(analyst: Bot, threats: Threat[]): Promise<void> {
    const captured = threats.filter(t => t.captured && !t.analyzed);
    if (captured.length === 0) {
      scarLog(`[ANALYZE] No captured threats to analyze`);
      return;
    }

    const ability = analyst.abilities.find(a => a.name === 'deconstruct');
    if (!ability) {
      scarLog(`[ANALYZE] ${analyst.name} hasn't unlocked deconstruct yet`);
      return;
    }

    scarLog(`[ANALYZE] ${analyst.name} reverse engineering ${captured.length} threat(s)...`);

    for (const threat of captured) {
      // Analyze based on INT stat
      const success = Math.random() * 100 < analyst.stats.int * 4;

      if (success) {
        threat.analyzed = true;

        // Extract intel
        const intelValue = threat.severity === 'critical' ? 100 :
                          threat.severity === 'high' ? 50 :
                          threat.severity === 'medium' ? 25 : 10;

        this.state.intel.push({
          threatId: threat.id,
          type: threat.type,
          iocs: [], // Would contain real IOCs
          signatures: [], // Would contain YARA rules
          value: intelValue,
          extractedAt: new Date().toISOString(),
        });

        this.state.stats.totalIntel++;
        this.state.treasury += intelValue;

        scarLog(`[ANALYZE] ${analyst.name} extracted intel from ${threat.type} (+$${intelValue})`);
        this.addXP(analyst, 50);
      } else {
        scarLog(`[ANALYZE] ${analyst.name} failed to decode ${threat.type}`);
      }
    }
  }

  private async defendPhase(guardian: Bot, threats: Threat[]): Promise<void> {
    const ability = guardian.abilities.find(a => a.name === 'fortress_wall') || guardian.abilities[0];
    if (!ability) {
      scarLog(`[DEFEND] ${guardian.name} has no defensive abilities`);
      return;
    }

    scarLog(`[DEFEND] ${guardian.name} engaging ${threats.length} active threat(s)...`);

    for (const threat of threats) {
      const neutralizeChance = guardian.stats.atk * 3 + guardian.stats.def * 2;
      if (Math.random() * 100 < neutralizeChance) {
        threat.neutralized = true;
        guardian.kills++;
        this.state.stats.totalKills++;

        scarLog(`[DEFEND] ${guardian.name} neutralized: ${threat.type}`);
        this.addXP(guardian, 30);
      } else {
        // Take damage
        const damage = threat.severity === 'critical' ? 30 :
                      threat.severity === 'high' ? 20 :
                      threat.severity === 'medium' ? 10 : 5;
        guardian.stats.hp -= damage;

        scarLog(`[DEFEND] ${guardian.name} took ${damage} damage from ${threat.type} (HP: ${guardian.stats.hp}/${guardian.stats.maxHp})`);

        if (guardian.stats.hp <= 0) {
          guardian.status = 'recovery';
          guardian.stats.hp = 0;
          guardian.survivalStreak = 0;
          scarLog(`[DEFEND] ${guardian.name} knocked out! Entering recovery.`);
        }
      }
    }
  }

  // === DISPLAY ===

  printRoster(): void {
    scarLog('\n┌─────────────────────────────────────────────────────────┐');
    scarLog('│                  ⚔️  GUILD ROSTER  ⚔️                   │');
    scarLog('├─────────────────────────────────────────────────────────┤');

    for (const bot of this.state.bots) {
      const title = getTitle(bot.level);
      const classData = BOT_CLASSES[bot.role];
      const status = bot.status.toUpperCase();

      scarLog(`│ ${classData.title || bot.name}`.padEnd(57) + '│');
      scarLog(`│ "${classData.motto}"`.padEnd(57) + '│');
      scarLog(`│ Lv.${bot.level} ${title} │ ${status}`.padEnd(50) + '│');
      scarLog(`│ HP:${bot.stats.hp}/${bot.stats.maxHp} ATK:${bot.stats.atk} DEF:${bot.stats.def} SPD:${bot.stats.spd} INT:${bot.stats.int}`.padEnd(57) + '│');
      scarLog('├─────────────────────────────────────────────────────────┤');
    }

    scarLog(`│ Treasury: $${this.state.treasury} │ Kills: ${this.state.stats.totalKills} │`.padEnd(57) + '│');
    scarLog('└─────────────────────────────────────────────────────────┘\n');
  }

  printStats(): void {
    scarLog('\n╔══════════════════════════════════════════════════════════╗');
    scarLog('║                  GUILD STATISTICS                        ║');
    scarLog('╠══════════════════════════════════════════════════════════╣');
    scarLog(`║  Total Bots: ${this.state.bots.length.toString().padEnd(10)} Total XP: ${this.state.stats.totalXP.toString().padEnd(10)}      ║`);
    scarLog(`║  Kills: ${this.state.stats.totalKills.toString().padEnd(13)} Intel: ${this.state.stats.totalIntel.toString().padEnd(13)}     ║`);
    scarLog(`║  Treasury: $${this.state.treasury.toString().padEnd(10)} Ops: ${this.state.stats.successfulOps.toString().padEnd(14)}     ║`);
    scarLog('╚══════════════════════════════════════════════════════════╝\n');
  }
}

// === COMMANDS ======================================================

async function handleCommand(args: string[]): Promise<void> {
  const cmd = args[0];
  const params = args.slice(1);

  const guild = new Guild();

  switch (cmd) {
    case 'create':
      const [name, role] = params;
      if (!name || !role) {
        scarLog('Usage: create <name> <lurer|hunter|analyst|guardian>');
        return;
      }
      guild.createBot(name, role as Bot['role']);
      guild.printRoster();
      break;

    case 'roster':
      guild.printRoster();
      break;

    case 'stats':
      guild.printStats();
      break;

    case 'deploy':
      await guild.deployOperation();
      break;

    case 'run':
      // Continuous mode
      scarLog('[GUILD] Starting continuous operation mode...');
      scarLog('[GUILD] Press Ctrl+C to stop');

      // Run operation every 5 minutes
      const interval = setInterval(async () => {
        if (scarIsPaused()) {
          clearInterval(interval);
          return;
        }
        await guild.deployOperation();
      }, 5 * 60 * 1000);

      // Run immediately
      await guild.deployOperation();
      break;

    default:
      scarLog('Commands: create, roster, stats, deploy, run');
  }
}

// === MAIN ==========================================================

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    // Interactive demo
    scarLog('╔══════════════════════════════════════════════════════════╗');
    scarLog('║              SHADOW GUILD - Cyber Bot System             ║');
    scarLog('╚══════════════════════════════════════════════════════════╝');
    scarLog('');
    scarLog('Commands:');
    scarLog('  create <name> <role>  - Create a new bot');
    scarLog('  roster                - Show all bots');
    scarLog('  stats                 - Show guild stats');
    scarLog('  deploy                - Run one operation');
    scarLog('  run                   - Continuous mode');
    scarLog('');
    scarLog('Roles: lurer, hunter, analyst, guardian');
    scarLog('');
    scarLog('Example:');
    scarLog('  bun run guild.ts create Shadow hunter');
    scarLog('  bun run guild.ts create Ghost analyst');
    scarLog('  bun run guild.ts run');
    return;
  }

  await handleCommand(args);
}

// === EXPORTS =======================================================

export { Guild, Bot, BotStats, GuildState, BOT_CLASSES, getLevelFromXP, getTitle };

// === RUN ===========================================================

main().catch(e => {
  scarLog(`[FATAL] ${e}`);
  process.exit(1);
});
