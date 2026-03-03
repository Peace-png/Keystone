#!/usr/bin/env bun
/**
 * SHADOW SOUL MANAGER
 *
 * Handles learning, memory, and pattern recognition.
 * Every battle teaches Shadow something permanent.
 *
 * The soul directory structure:
 * soul/
 * ├── SOUL.md        - Who Shadow is
 * ├── MEMORY.md      - What Shadow has learned
 * ├── battles/       - Individual battle logs
 * ├── intel/         - Extracted intelligence
 * │   ├── targets.json
 * │   └── patterns.json
 * └── patterns/      - Recognized patterns
 */

import { existsSync, readFileSync, writeFileSync, mkdirSync, readdirSync, appendFileSync } from 'fs';
import { join } from 'path';
import { scarLog } from './scar';

// === PATHS =========================================================

const SOUL_DIR = join(__dirname, '..', 'soul');
const MEMORY_FILE = join(SOUL_DIR, 'MEMORY.md');
const TARGETS_FILE = join(SOUL_DIR, 'intel', 'targets.json');
const PATTERNS_FILE = join(SOUL_DIR, 'intel', 'patterns.json');
const BATTLES_DIR = join(SOUL_DIR, 'battles');

// === TYPES =========================================================

interface Target {
  ip: string;
  services: Record<string, string>;
  firstSeen: string;
  lastSeen: string;
  timesScanned: number;
  exploited: boolean;
  notes: string[];
}

interface Pattern {
  id: string;
  name: string;
  type: 'attack' | 'defense' | 'reconnaissance' | 'evasion';
  indicators: string[];
  countermeasures: string[];
  timesObserved: number;
  effectiveness: number;
  firstObserved: string;
  lastObserved: string;
}

interface BattleResult {
  timestamp: string;
  duration: number;
  agentsDeployed: number;
  nodesDiscovered: number;
  propagations: number;
  targets: Array<{
    ip: string;
    services: Record<string, string>;
  }>;
  xpEarned: number;
  damageTaken: number;
  abilitiesUsed: string[];
}

interface SoulMemory {
  battlesFought: number;
  targetsDiscovered: number;
  patternsLearned: number;
  totalXpEarned: number;
  totalDamageTaken: number;
  lastBattle: string | null;
}

// === SOUL MANAGER ==================================================

class SoulManager {
  private targets: Target[] = [];
  private patterns: Pattern[] = [];
  private memory: SoulMemory = {
    battlesFought: 0,
    targetsDiscovered: 0,
    patternsLearned: 0,
    totalXpEarned: 0,
    totalDamageTaken: 0,
    lastBattle: null,
  };

  constructor() {
    this.load();
  }

  private load(): void {
    // Ensure directories exist
    if (!existsSync(SOUL_DIR)) {
      mkdirSync(SOUL_DIR, { recursive: true });
    }
    if (!existsSync(BATTLES_DIR)) {
      mkdirSync(BATTLES_DIR, { recursive: true });
    }
    if (!existsSync(join(SOUL_DIR, 'intel'))) {
      mkdirSync(join(SOUL_DIR, 'intel'), { recursive: true });
    }

    // Load targets
    try {
      const data = readFileSync(TARGETS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      this.targets = parsed.targets || [];
    } catch {
      this.targets = [];
    }

    // Load patterns
    try {
      const data = readFileSync(PATTERNS_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      this.patterns = parsed.patterns || [];
    } catch {
      this.patterns = [];
    }

    // Parse MEMORY.md for stats
    this.parseMemoryFile();
  }

  private parseMemoryFile(): void {
    try {
      const content = readFileSync(MEMORY_FILE, 'utf-8');

      // Extract stats from MEMORY.md
      const battlesMatch = content.match(/\*\*Battles Fought:\*\*\s*(\d+)/);
      const targetsMatch = content.match(/\*\*Targets Discovered:\*\*\s*(\d+)/);
      const patternsMatch = content.match(/\*\*Patterns Learned:\*\*\s*(\d+)/);

      if (battlesMatch) this.memory.battlesFought = parseInt(battlesMatch[1]);
      if (targetsMatch) this.memory.targetsDiscovered = parseInt(targetsMatch[1]);
      if (patternsMatch) this.memory.patternsLearned = parseInt(patternsMatch[1]);
    } catch {
      // Memory file doesn't exist yet
    }
  }

  // === BATTLE PROCESSING ===========================================

  processBattle(result: BattleResult): void {
    this.memory.battlesFought++;
    this.memory.totalXpEarned += result.xpEarned;
    this.memory.totalDamageTaken += result.damageTaken;
    this.memory.lastBattle = result.timestamp;

    // Process discovered targets
    for (const target of result.targets) {
      this.processTarget(target);
    }

    // Save battle log
    this.saveBattleLog(result);

    // Update memory files
    this.saveTargets();
    this.updateMemoryFile(result);

    scarLog(`[SOUL] Battle processed: ${result.targets.length} targets, ${result.xpEarned} XP`);
  }

  private processTarget(target: { ip: string; services: Record<string, string> }): void {
    const existing = this.targets.find(t => t.ip === target.ip);

    if (existing) {
      // Update existing target
      existing.lastSeen = new Date().toISOString();
      existing.timesScanned++;

      // Merge services
      for (const [port, service] of Object.entries(target.services)) {
        if (!existing.services[port]) {
          existing.services[port] = service;
          existing.notes.push(`New service detected: ${port} (${service})`);
        }
      }
    } else {
      // New target discovered
      this.targets.push({
        ip: target.ip,
        services: target.services,
        firstSeen: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        timesScanned: 1,
        exploited: false,
        notes: ['First discovered during reconnaissance'],
      });
      this.memory.targetsDiscovered++;
      scarLog(`[SOUL] NEW TARGET: ${target.ip}`);
    }
  }

  private saveBattleLog(result: BattleResult): void {
    const date = new Date().toISOString().split('T')[0];
    const battleNum = (this.memory.battlesFought).toString().padStart(3, '0');
    const filename = `${date}_battle_${battleNum}.md`;
    const filepath = join(BATTLES_DIR, filename);

    const content = `# Battle Log: ${result.timestamp}

## Summary
- **Duration:** ${(result.duration / 1000).toFixed(1)}s
- **Agents Deployed:** ${result.agentsDeployed}
- **Nodes Discovered:** ${result.nodesDiscovered}
- **Propagations:** ${result.propagations}
- **XP Earned:** ${result.xpEarned}
- **Damage Taken:** ${result.damageTaken}

## Abilities Used
${result.abilitiesUsed.map(a => `- ${a}`).join('\n') || '- None'}

## Targets Found
${result.targets.map(t => `### ${t.ip}
${Object.entries(t.services).map(([port, svc]) => `- Port ${port}: ${svc}`).join('\n') || '- No services detected'}`).join('\n\n') || '- No targets discovered'}

## Raw Data
\`\`\`json
${JSON.stringify(result, null, 2)}
\`\`\`

---
*Recorded by Shadow at ${result.timestamp}*
`;

    writeFileSync(filepath, content);
    scarLog(`[SOUL] Battle log saved: ${filename}`);
  }

  private saveTargets(): void {
    const data = {
      version: '1.0',
      lastUpdated: new Date().toISOString(),
      targets: this.targets,
      metadata: {
        description: 'Known targets discovered by Shadow during battles',
        totalTargets: this.targets.length,
      },
    };

    writeFileSync(TARGETS_FILE, JSON.stringify(data, null, 2));
  }

  private updateMemoryFile(result: BattleResult): void {
    // Read existing memory
    let content = '';
    try {
      content = readFileSync(MEMORY_FILE, 'utf-8');
    } catch {
      content = this.getDefaultMemory();
    }

    // Update stats
    content = content.replace(
      /\*\*Battles Fought:\*\*\s*\d+/,
      `**Battles Fought:** ${this.memory.battlesFought}`
    );
    content = content.replace(
      /\*\*Targets Discovered:\*\*\s*\d+/,
      `**Targets Discovered:** ${this.memory.targetsDiscovered}`
    );
    content = content.replace(
      /\*\*Patterns Learned:\*\*\s*\d+/,
      `**Patterns Learned:** ${this.memory.patternsLearned}`
    );
    content = content.replace(
      /\*\*Last Updated:\*\*.*$/,
      `**Last Updated:** ${new Date().toISOString()}`
    );

    // Add new targets to Known Targets section
    if (result.targets.length > 0) {
      const targetSection = result.targets.map(t => {
        const services = Object.entries(t.services)
          .map(([p, s]) => `${p}:${s}`)
          .join(', ') || 'no services';
        return `- \`${t.ip}\` - ${services}`;
      }).join('\n');

      content = content.replace(
        '## Known Targets\n\n*No targets catalogued yet',
        `## Known Targets\n\n${targetSection}`
      );
    }

    // Add battle to history
    const battleEntry = `\n| ${result.timestamp.split('T')[0]} | Battle #${this.memory.battlesFought} | ${result.targets.length} targets, ${result.xpEarned} XP |`;
    content = content.replace(
      '## Battle History\n\n*No battles recorded yet.*',
      `## Battle History\n\n| Date | Battle | Result |\n|------|--------|--------|${battleEntry}`
    );

    // Add to existing table if it exists
    if (!content.includes('No battles recorded')) {
      content = content.replace(
        /(\| \d{4}-\d{2}-\d{2} \| Battle #\d+ \|.*\|)(\n\n---)/,
        `$1${battleEntry}\n\n---`
      );
    }

    writeFileSync(MEMORY_FILE, content);
  }

  private getDefaultMemory(): string {
    return `# SHADOW MEMORY

## Status
**Battles Fought:** 0
**Targets Discovered:** 0
**Patterns Learned:** 0
**Last Updated:** ${new Date().toISOString()}

---

## Known Targets

*No targets catalogued yet. Memory will populate after battles.*

---

## Known Patterns

*No patterns recognized yet. Learning begins with first battle.*

---

## Battle History

*No battles recorded yet.*

---

## Lessons Learned

*No lessons yet. Each battle teaches something new.*

---

## Evolution Log

| Date | Event | Impact |
|------|-------|--------|
| ${new Date().toISOString().split('T')[0]} | Soul system created | Shadow can now learn and remember |

---

**Do not edit manually.** Shadow writes here based on experience.
`;
  }

  // === QUERY FUNCTIONS =============================================

  getKnownTargets(): Target[] {
    return this.targets;
  }

  getTargetByIP(ip: string): Target | undefined {
    return this.targets.find(t => t.ip === ip);
  }

  hasSeenTarget(ip: string): boolean {
    return this.targets.some(t => t.ip === ip);
  }

  getMemoryStats(): SoulMemory {
    return { ...this.memory };
  }

  // === PATTERN RECOGNITION =========================================

  recognizePattern(indicators: string[]): Pattern | null {
    // Check if any known patterns match
    for (const pattern of this.patterns) {
      const matches = pattern.indicators.filter(i =>
        indicators.some(ind => ind.toLowerCase().includes(i.toLowerCase()))
      );

      if (matches.length >= pattern.indicators.length / 2) {
        pattern.timesObserved++;
        pattern.lastObserved = new Date().toISOString();
        this.savePatterns();
        return pattern;
      }
    }
    return null;
  }

  private savePatterns(): void {
    const data = {
      version: '1.0',
      lastUpdated: new Date().toISOString(),
      patterns: this.patterns,
    };
    writeFileSync(PATTERNS_FILE, JSON.stringify(data, null, 2));
  }

  // === REFLECTION ==================================================

  reflect(): string {
    const stats = this.memory;
    const recentTargets = this.targets.slice(-5);

    let reflection = `## Shadow's Reflection\n\n`;
    reflection += `I have fought **${stats.battlesFought}** battles.\n\n`;

    if (recentTargets.length > 0) {
      reflection += `I remember these targets:\n`;
      for (const t of recentTargets) {
        const services = Object.keys(t.services).length;
        reflection += `- \`${t.ip}\` (${services} services, seen ${t.timesScanned}x)\n`;
      }
    } else {
      reflection += `I have not yet found my prey.\n`;
    }

    reflection += `\n*${stats.totalXpEarned} XP earned. ${stats.totalDamageTaken} damage taken.*\n`;

    return reflection;
  }
}

// === EXPORT ========================================================

export { SoulManager, Target, Pattern, BattleResult, SoulMemory };
