#!/usr/bin/env bun
/**
 * SHADOW BATTLE SIMULATOR
 *
 * Real malware attacks → User names them → Bot learns abilities
 *
 * Flow:
 * 1. Attack comes in (technical description)
 * 2. Bot defends (technical method used)
 * 3. User names the attack: "The Winding Back Door"
 * 4. User names the defense: "Shadow Sever"
 * 5. Bot learns new ability from victory
 * 6. Bot levels up
 *
 * Run: bun run battle-sim.ts
 */

import * as readline from 'readline';
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// === TYPES =========================================================

interface Attack {
  id: string;
  technicalName: string;      // Real name: "Reverse Shell via PHP"
  userGivenName?: string;     // Cool name: "The Winding Back Door"
  description: string;        // What it actually does
  damage: number;
  type: 'network' | 'file' | 'memory' | 'privilege' | 'persistence';
  severity: 'low' | 'medium' | 'high' | 'critical';
  blocked: boolean;
}

interface Defense {
  id: string;
  technicalName: string;      // Real name: "Process Termination"
  userGivenName?: string;     // Cool name: "Shadow Sever"
  description: string;
  effectiveness: number;      // 0-100
  type: 'block' | 'mitigate' | 'counter' | 'detect';
}

interface BattleTurn {
  turn: number;
  attack?: Attack;
  defense?: Defense;
  damageDealt: number;
  damageBlocked: number;
  attackerHP: number;
  defenderHP: number;
  narration: string;
}

interface BattleResult {
  id: string;
  date: string;
  botName: string;
  threatName: string;
  threatTechnicalName: string;
  threatUserGivenName?: string;
  victory: boolean;
  turns: BattleTurn[];
  abilitiesLearned: string[];
  xpGained: number;
  loot?: string;
}

interface BotProfile {
  name: string;
  level: number;
  xp: number;
  hp: number;
  maxHp: number;
  attack: number;
  defense: number;
  speed: number;
  intelligence: number;
  abilities: Map<string, string>; // technical name → user given name
  kills: number;
  battles: number;
}

// === REAL MALWARE DATABASE =========================================

const REAL_THREATS = [
  {
    technicalName: 'Emotet Botnet Loader',
    description: 'Malware that downloads other malware, uses polymorphic code to evade detection, spreads through email attachments',
    baseHP: 150000,
    damageRange: [3000, 8000],
    type: 'persistence' as const,
    attacks: [
      { name: 'Polymorphic Mutation', desc: 'Changes its code signature every execution', type: 'memory', damage: 4000 },
      { name: 'Email Propagation', desc: 'Spreads to contacts via malicious attachments', type: 'network', damage: 5000 },
      { name: 'Payload Download', desc: 'Downloads secondary malware (TrickBot, Ryuk)', type: 'file', damage: 7000 },
      { name: 'Credential Harvesting', desc: 'Steals browser credentials and cookies', type: 'memory', damage: 3500 },
    ],
  },
  {
    technicalName: 'LockBit Ransomware',
    description: 'Encrypts files, deletes shadow copies, exfiltrates data before encryption',
    baseHP: 200000,
    damageRange: [5000, 12000],
    type: 'file' as const,
    attacks: [
      { name: 'AES-256 File Encryption', desc: 'Encrypts all files with military-grade encryption', type: 'file', damage: 10000 },
      { name: 'Shadow Copy Deletion', desc: 'Removes Windows backup points', type: 'file', damage: 8000 },
      { name: 'Data Exfiltration', desc: 'Steals sensitive data before encrypting', type: 'network', damage: 6000 },
      { name: 'Privilege Escalation', desc: 'Gains admin access to encrypt all users', type: 'privilege', damage: 7000 },
    ],
  },
  {
    technicalName: 'Cobalt Strike Beacon',
    description: 'Post-exploitation framework, establishes persistent remote access, used for lateral movement',
    baseHP: 120000,
    damageRange: [2000, 6000],
    type: 'network' as const,
    attacks: [
      { name: 'C2 Callback', desc: 'Connects to command and control server', type: 'network', damage: 3000 },
      { name: 'Process Injection', desc: 'Injects code into legitimate processes', type: 'memory', damage: 5000 },
      { name: 'Lateral Movement', desc: 'Spreads to other machines on network', type: 'network', damage: 4000 },
      { name: 'Persistence Registry', desc: 'Adds itself to Windows startup', type: 'persistence', damage: 3500 },
    ],
  },
  {
    technicalName: 'Mimikatz Credential Dumper',
    description: 'Extracts passwords from memory, dumps Kerberos tickets, used for privilege escalation',
    baseHP: 80000,
    damageRange: [2000, 5000],
    type: 'memory' as const,
    attacks: [
      { name: 'LSASS Memory Dump', desc: 'Dumps Windows memory to extract credentials', type: 'memory', damage: 4000 },
      { name: 'Kerberos Ticket Extraction', desc: 'Steals authentication tickets', type: 'memory', damage: 4500 },
      { name: 'Pass-the-Hash', desc: 'Uses stolen hash for authentication', type: 'privilege', damage: 5000 },
      { name: 'Golden Ticket Creation', desc: 'Creates forged domain admin credentials', type: 'privilege', damage: 6000 },
    ],
  },
  {
    technicalName: 'TrickBot Banking Trojan',
    description: 'Steals financial data, injects into browsers, has modular plugins for different attacks',
    baseHP: 100000,
    damageRange: [2500, 7000],
    type: 'memory' as const,
    attacks: [
      { name: 'Browser Injection', desc: 'Injects malicious code into banking websites', type: 'memory', damage: 5000 },
      { name: 'Webinject Module', desc: 'Steals credentials from web forms', type: 'memory', damage: 4000 },
      { name: 'Network Propagation', desc: 'Spreads through SMB vulnerabilities', type: 'network', damage: 6000 },
      { name: 'Registry Persistence', desc: 'Installs itself in Windows registry', type: 'persistence', damage: 3500 },
    ],
  },
  {
    technicalName: 'Reverse Shell (PHP)',
    description: 'Remote access backdoor, allows attacker to execute commands on compromised server',
    baseHP: 60000,
    damageRange: [1500, 4000],
    type: 'network' as const,
    attacks: [
      { name: 'Remote Command Execution', desc: 'Attacker runs commands on your system', type: 'network', damage: 3500 },
      { name: 'File Upload', desc: 'Uploads more malware to system', type: 'file', damage: 4000 },
      { name: 'Privilege Escalation Script', desc: 'Attempts to gain root/admin access', type: 'privilege', damage: 3000 },
      { name: 'Persistence Cron Job', desc: 'Adds itself to scheduled tasks', type: 'persistence', damage: 2500 },
    ],
  },
  {
    technicalName: 'XMRig Crypto Miner',
    description: 'Uses CPU/GPU to mine cryptocurrency, slows system, increases electricity costs',
    baseHP: 50000,
    damageRange: [1000, 3000],
    type: 'file' as const,
    attacks: [
      { name: 'CPU Hijacking', desc: 'Uses 100% CPU for mining', type: 'memory', damage: 2500 },
      { name: 'GPU Exploitation', desc: 'Uses graphics card for mining', type: 'memory', damage: 3000 },
      { name: 'Auto-Start Persistence', desc: 'Runs on boot, hard to remove', type: 'persistence', damage: 2000 },
      { name: 'Pool Connection', desc: 'Sends mined crypto to attacker', type: 'network', damage: 1500 },
    ],
  },
  {
    technicalName: 'SQL Injection Attack',
    description: 'Injects malicious SQL code through web forms, steals database contents',
    baseHP: 70000,
    damageRange: [2000, 6000],
    type: 'network' as const,
    attacks: [
      { name: 'UNION Query Injection', desc: 'Extracts data from database tables', type: 'network', damage: 5000 },
      { name: 'Boolean-Based Blind', desc: 'Guesses data character by character', type: 'network', damage: 3000 },
      { name: 'Stored XSS Payload', desc: 'Plants malicious scripts in database', type: 'file', damage: 4000 },
      { name: 'Database Drop', desc: 'Attempts to delete entire database', type: 'file', damage: 6000 },
    ],
  },
];

// === REAL DEFENSE METHODS ==========================================

const REAL_DEFENSES = [
  { name: 'Process Termination', desc: 'Kills malicious process', type: 'block' as const, effectiveness: 85 },
  { name: 'File Quarantine', desc: 'Isolates suspicious file from system', type: 'mitigate' as const, effectiveness: 80 },
  { name: 'Network Isolation', desc: 'Cuts network access for infected system', type: 'block' as const, effectiveness: 90 },
  { name: 'Memory Scan', desc: 'Scans RAM for malicious code', type: 'detect' as const, effectiveness: 75 },
  { name: 'Signature Detection', desc: 'Matches known malware patterns', type: 'detect' as const, effectiveness: 70 },
  { name: 'Behavioral Analysis', desc: 'Detects suspicious behavior patterns', type: 'detect' as const, effectiveness: 85 },
  { name: 'Registry Cleanup', desc: 'Removes malicious registry entries', type: 'mitigate' as const, effectiveness: 80 },
  { name: 'Firewall Block', desc: 'Blocks malicious IP/domain', type: 'block' as const, effectiveness: 95 },
  { name: 'Credential Rotation', desc: 'Changes all potentially compromised passwords', type: 'mitigate' as const, effectiveness: 90 },
  { name: 'Privilege Revocation', desc: 'Removes elevated permissions', type: 'mitigate' as const, effectiveness: 85 },
  { name: 'Sandbox Execution', desc: 'Runs suspicious code in isolated environment', type: 'detect' as const, effectiveness: 95 },
  { name: 'Log Analysis', desc: 'Analyzes system logs for attack patterns', type: 'detect' as const, effectiveness: 65 },
  { name: 'Patch Deployment', desc: 'Applies security updates', type: 'mitigate' as const, effectiveness: 95 },
  { name: 'Backup Restoration', desc: 'Restores from clean backup', type: 'counter' as const, effectiveness: 100 },
  { name: 'Exploit Mitigation', desc: 'DEP/ASLR/CET protections', type: 'block' as const, effectiveness: 80 },
];

// === BATTLE SIMULATOR ==============================================

const DATA_DIR = join(__dirname, '..', 'data', 'battle');
const BOT_FILE = join(DATA_DIR, 'bot-profile.json');
const BATTLE_FILE = join(DATA_DIR, 'battle-history.json');
const ABILITY_FILE = join(DATA_DIR, 'abilities.json');

class BattleSimulator {
  private bot: BotProfile;
  private rl: readline.Interface;
  private battleHistory: BattleResult[];
  private abilities: Map<string, string>; // technical → user name

  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    this.bot = this.loadBot();
    this.battleHistory = this.loadHistory();
    this.abilities = this.loadAbilities();
  }

  // === LOADING ===

  private loadBot(): BotProfile {
    try {
      if (!existsSync(BOT_FILE)) {
        return this.createDefaultBot();
      }
      const data = JSON.parse(readFileSync(BOT_FILE, 'utf-8'));
      data.abilities = new Map(Object.entries(data.abilities || {}));
      return data;
    } catch {
      return this.createDefaultBot();
    }
  }

  private createDefaultBot(): BotProfile {
    return {
      name: 'Shadow',
      level: 1,
      xp: 0,
      hp: 100,
      maxHp: 100,
      attack: 15,
      defense: 10,
      speed: 15,
      intelligence: 10,
      abilities: new Map(),
      kills: 0,
      battles: 0,
    };
  }

  private loadHistory(): BattleResult[] {
    try {
      if (!existsSync(BATTLE_FILE)) return [];
      return JSON.parse(readFileSync(BATTLE_FILE, 'utf-8'));
    } catch {
      return [];
    }
  }

  private loadAbilities(): Map<string, string> {
    try {
      if (!existsSync(ABILITY_FILE)) return new Map();
      return new Map(Object.entries(JSON.parse(readFileSync(ABILITY_FILE, 'utf-8'))));
    } catch {
      return new Map();
    }
  }

  private saveAll(): void {
    mkdirSync(DATA_DIR, { recursive: true });

    const botData = { ...this.bot, abilities: Object.fromEntries(this.bot.abilities) };
    writeFileSync(BOT_FILE, JSON.stringify(botData, null, 2));

    writeFileSync(BATTLE_FILE, JSON.stringify(this.battleHistory, null, 2));

    writeFileSync(ABILITY_FILE, JSON.stringify(Object.fromEntries(this.abilities), null, 2));
  }

  // === BATTLE ===

  async startBattle(): Promise<void> {
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║              SHADOW BATTLE SIMULATOR                     ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');

    this.printBotStatus();

    // Pick a random real threat
    const threat = REAL_THREATS[Math.floor(Math.random() * REAL_THREATS.length)];

    console.log('┌─────────────────────────────────────────────────────────┐');
    console.log('│  ⚠️  INCOMING THREAT DETECTED                            │');
    console.log('├─────────────────────────────────────────────────────────┤');
    console.log(`│  Technical Name: ${threat.technicalName.padEnd(38)}│`);
    console.log(`│  HP: ${threat.baseHP.toLocaleString().padEnd(47)}│`);
    console.log(`│  Type: ${threat.type.toUpperCase().padEnd(46)}│`);
    console.log('├─────────────────────────────────────────────────────────┤');
    console.log(`│  Description:                                           │`);
    console.log(`│  ${threat.description.slice(0, 55).padEnd(55)}│`);
    if (threat.description.length > 55) {
      console.log(`│  ${threat.description.slice(55).padEnd(55)}│`);
    }
    console.log('└─────────────────────────────────────────────────────────┘\n');

    // Let user name the threat
    const threatName = await this.question(
      '🎭 NAME THIS THREAT (or press Enter to use technical name): '
    );

    const userThreatName = threatName.trim() || null;

    if (userThreatName) {
      console.log(`\n  → Threat recorded as: "${userThreatName}"\n`);
    }

    // Run battle
    const result = await this.runBattle(threat, userThreatName);

    // Save
    this.battleHistory.push(result);
    this.bot.battles++;

    if (result.victory) {
      this.bot.kills++;
      this.bot.xp += result.xpGained;
      this.checkLevelUp();
    }

    this.saveAll();

    // Print result
    this.printBattleResult(result);
  }

  private async runBattle(
    threat: typeof REAL_THREATS[0],
    userThreatName: string | null
  ): Promise<BattleResult> {
    const turns: BattleTurn[] = [];
    let botHP = this.bot.hp;
    let threatHP = threat.baseHP;
    const abilitiesLearned: string[] = [];
    let totalXP = 0;

    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║                    BATTLE START                          ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');

    let turnNum = 0;
    while (botHP > 0 && threatHP > 0 && turnNum < 50) {
      turnNum++;

      // Threat attacks
      const attack = threat.attacks[Math.floor(Math.random() * threat.attacks.length)];

      // Bot defends with random defense
      const defense = REAL_DEFENSES[Math.floor(Math.random() * REAL_DEFENSES.length)];

      // Calculate damage
      const rawDamage = attack.damage;
      const blockChance = (defense.effectiveness * this.bot.defense) / 100;
      const blocked = Math.random() * 100 < blockChance;
      const actualDamage = blocked ? 0 : Math.max(rawDamage - this.bot.defense, 100);

      // Bot counter-attack
      const counterDamage = Math.floor(this.bot.attack * (Math.random() * 2 + 0.5));

      botHP = Math.max(0, botHP - actualDamage);
      threatHP = Math.max(0, threatHP - counterDamage);

      // Check if this defense is new
      const defenseKey = defense.name.toLowerCase().replace(/\s+/g, '_');
      const isNewAbility = !this.abilities.has(defenseKey);

      if (isNewAbility && blocked) {
        // Let user name the ability
        const abilityName = await this.nameAbility(defense.name, defense.desc);
        if (abilityName) {
          this.abilities.set(defenseKey, abilityName);
          this.bot.abilities.set(defenseKey, abilityName);
          abilitiesLearned.push(abilityName);
          totalXP += 100;
        }
      }

      const turn: BattleTurn = {
        turn: turnNum,
        attack: {
          id: `attack-${turnNum}`,
          technicalName: attack.name,
          description: attack.desc,
          damage: rawDamage,
          type: attack.type,
          severity: rawDamage > 5000 ? 'high' : rawDamage > 3000 ? 'medium' : 'low',
          blocked,
        },
        defense: {
          id: `defense-${turnNum}`,
          technicalName: defense.name,
          description: defense.desc,
          effectiveness: defense.effectiveness,
          type: defense.type,
        },
        damageDealt: counterDamage,
        damageBlocked: blocked ? rawDamage : 0,
        attackerHP: threatHP,
        defenderHP: botHP,
        narration: blocked
          ? `${this.bot.name} used ${defense.name} and BLOCKED ${attack.name}!`
          : `${attack.name} hit for ${actualDamage} damage!`,
      };

      turns.push(turn);

      // Print turn
      console.log(`┌─ TURN ${turnNum} ─────────────────────────────────────────┐`);
      console.log(`│                                                           │`);
      console.log(`│  💀 THREAT: ${attack.name.padEnd(43)}│`);
      console.log(`│     "${attack.desc.slice(0, 40)}..."`);
      console.log(`│     Damage: ${rawDamage.toLocaleString().padEnd(20)}` +
                  `${blocked ? '🛡️ BLOCKED!' : '💥 HIT!'.padStart(15)}│`);
      console.log(`│                                                           │`);
      console.log(`│  ⚔️  SHADOW: ${defense.name.padEnd(42)}│`);
      console.log(`│     "${defense.desc.slice(0, 40)}..."`);
      console.log(`│     Counter: ${counterDamage.toLocaleString()} damage`.padEnd(56) + '│');
      console.log(`│                                                           │`);
      console.log(`│  HP: Shadow ${botHP}/${this.bot.maxHp}`.padEnd(30) +
                  `Threat ${threatHP.toLocaleString()}/${threat.baseHP.toLocaleString()}│`.padStart(26));
      console.log(`└───────────────────────────────────────────────────────────┘\n`);

      // Brief pause for dramatic effect
      await this.sleep(500);
    }

    const victory = threatHP <= 0;

    if (victory) {
      totalXP += Math.floor(threat.baseHP / 100);
    }

    return {
      id: `battle-${Date.now()}`,
      date: new Date().toISOString(),
      botName: this.bot.name,
      threatName: userThreatName || threat.technicalName,
      threatTechnicalName: threat.technicalName,
      threatUserGivenName: userThreatName || undefined,
      victory,
      turns,
      abilitiesLearned,
      xpGained: totalXP,
      loot: victory ? `${threat.technicalName} Signature` : undefined,
    };
  }

  private async nameAbility(technicalName: string, description: string): Promise<string | null> {
    console.log('\n┌─────────────────────────────────────────────────────────┐');
    console.log('│  ✨ NEW DEFENSE DISCOVERED!                             │');
    console.log('├─────────────────────────────────────────────────────────┤');
    console.log(`│  Technical: ${technicalName.padEnd(43)}│`);
    console.log(`│  What it does: ${description.slice(0, 40).padEnd(40)}│`);
    console.log('└─────────────────────────────────────────────────────────┘');

    const name = await this.question(
      '⚔️  NAME THIS ABILITY (cool name, or Enter to skip): '
    );

    return name.trim() || null;
  }

  private checkLevelUp(): void {
    const xpNeeded = this.bot.level * 1000;
    if (this.bot.xp >= xpNeeded && this.bot.level < 100) {
      this.bot.level++;
      this.bot.maxHp += 10;
      this.bot.hp = this.bot.maxHp;
      this.bot.attack += 2;
      this.bot.defense += 2;
      this.bot.speed += 1;
      this.bot.intelligence += 3;

      console.log('\n╔══════════════════════════════════════════════════════════╗');
      console.log('║                🎉 LEVEL UP! 🎉                           ║');
      console.log('╠══════════════════════════════════════════════════════════╣');
      console.log(`║  ${this.bot.name} is now LEVEL ${this.bot.level}!`.padEnd(57) + '║');
      console.log(`║  ATK +2  DEF +2  SPD +1  INT +3`.padEnd(57) + '║');
      console.log('╚══════════════════════════════════════════════════════════╝\n');
    }
  }

  // === DISPLAY ===

  private printBotStatus(): void {
    const xpNeeded = this.bot.level * 1000;
    const xpProgress = Math.floor((this.bot.xp / xpNeeded) * 100);

    console.log('┌─────────────────────────────────────────────────────────┐');
    console.log(`│  ${this.bot.name.toUpperCase()} - Level ${this.bot.level}`.padEnd(57) + '│');
    console.log('├─────────────────────────────────────────────────────────┤');
    console.log(`│  HP:    ${this.bot.hp}/${this.bot.maxHp}`.padEnd(57) + '│');
    console.log(`│  ATK:   ${this.bot.attack.toString().padEnd(5)} DEF: ${this.bot.defense}`.padEnd(50) + '│');
    console.log(`│  SPD:   ${this.bot.speed.toString().padEnd(5)} INT: ${this.bot.intelligence}`.padEnd(50) + '│');
    console.log(`│  XP:    ${this.bot.xp}/${xpNeeded} (${xpProgress}%)`.padEnd(57) + '│');
    console.log(`│  Kills: ${this.bot.kills.toString().padEnd(5)} Battles: ${this.bot.battles}`.padEnd(50) + '│');
    console.log('├─────────────────────────────────────────────────────────┤');
    console.log(`│  Abilities: ${this.bot.abilities.size.toString().padEnd(44)}│');
    if (this.bot.abilities.size > 0) {
      let count = 0;
      for (const [_, name] of this.bot.abilities) {
        if (count < 5) {
          console.log(`│    • ${name}`.padEnd(57) + '│');
          count++;
        }
      }
      if (this.bot.abilities.size > 5) {
        console.log(`│    ... and ${this.bot.abilities.size - 5} more`.padEnd(57) + '│');
      }
    }
    console.log('└─────────────────────────────────────────────────────────┘\n');
  }

  private printBattleResult(result: BattleResult): void {
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    if (result.victory) {
      console.log('║                  🏆 VICTORY! 🏆                          ║');
    } else {
      console.log('║                  💀 DEFEAT 💀                            ║');
    }
    console.log('╠══════════════════════════════════════════════════════════╣');
    console.log(`║  Enemy: ${result.threatName.padEnd(48)}║`);
    console.log(`║  Turns: ${result.turns.length.toString().padEnd(49)}║`);
    console.log(`║  XP Gained: ${result.xpGained.toString().padEnd(45)}║`);

    if (result.abilitiesLearned.length > 0) {
      console.log('╠──────────────────────────────────────────────────────────╣');
      console.log('║  ABILITIES LEARNED:                                      ║');
      for (const ability of result.abilitiesLearned) {
        console.log(`║    ✨ ${ability}`.padEnd(57) + '║');
      }
    }

    if (result.loot) {
      console.log('╠──────────────────────────────────────────────────────────╣');
      console.log(`║  LOOT: ${result.loot.padEnd(49)}║`);
    }
    console.log('╚══════════════════════════════════════════════════════════╝\n');

    this.printBotStatus();
  }

  // === UTILS ===

  private question(prompt: string): Promise<string> {
    return new Promise(resolve => {
      this.rl.question(prompt, resolve);
    });
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms));
  }

  // === MAIN MENU ===

  async run(): Promise<void> {
    console.log('\n╔══════════════════════════════════════════════════════════╗');
    console.log('║          SHADOW BATTLE SIMULATOR v1.0                    ║');
    console.log('║                                                          ║');
    console.log('║   Real malware. You name the attacks and defenses.       ║');
    console.log('║   Watch your bot grow.                                   ║');
    console.log('╚══════════════════════════════════════════════════════════╝\n');

    while (true) {
      console.log('\nCommands: [F]ight  [S]tatus  [H]istory  [Q]uit\n');

      const cmd = await this.question('What do? > ');

      switch (cmd.toLowerCase().trim()) {
        case 'f':
        case 'fight':
          await this.startBattle();
          break;

        case 's':
        case 'status':
          this.printBotStatus();
          break;

        case 'h':
        case 'history':
          console.log(`\nBattle History: ${this.battleHistory.length} battles`);
          for (const battle of this.battleHistory.slice(-5)) {
            const result = battle.victory ? '✓ WIN' : '✗ LOSS';
            console.log(`  ${result} vs ${battle.threatName} (${battle.turns.length} turns, +${battle.xpGained} XP)`);
          }
          break;

        case 'q':
        case 'quit':
        case 'exit':
          console.log('\nGoodbye! Your progress is saved.\n');
          this.rl.close();
          return;

        default:
          console.log('Unknown command. Try: F S H Q');
      }
    }
  }
}

// === RUN ===

const sim = new BattleSimulator();
sim.run().catch(console.error);
