#!/usr/bin/env bun
/**
 * SHADOW THREAT HUNTER - Closed Loop Learning System
 *
 * Architecture: TELOS (mission) → SHADOW (action) → SCAR (safety) → LEARN (improve)
 *
 * Run: bun run engine/threat-hunter.ts
 */

import {
  scarGate,
  scarLog,
  scarRecordAction,
  scarSelfHeal,
  scarIsPaused,
  SCAR_RATE,
} from './scar';

import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// === TYPES =========================================================

interface ThreatIntel {
  hash: string;
  type: string;
  source: string;
  timestamp: string;
  metadata?: Record<string, any>;
}

interface Analysis {
  hash: string;
  malwareType: string;
  family?: string;
  capabilities: string[];
  iocs: IOC[];
  ttps: string[];
  infrastructure: Infrastructure[];
}

interface IOC {
  type: 'ip' | 'domain' | 'url' | 'hash' | 'email';
  value: string;
  context?: string;
}

interface Infrastructure {
  type: 'c2' | 'dropzone' | 'panel' | 'proxy';
  address: string;
  port?: number;
}

interface IntelPackage {
  id: string;
  hash: string;
  type: string;
  family?: string;
  iocs: IOC[];
  signatures: string[];
  ttps: string[];
  infrastructure: Infrastructure[];
  attribution?: string;
  relatedTo?: string[];
  confidence: number;
  timestamp: string;
}

interface ThreatPattern {
  family: string;
  characteristics: string[];
  knownIOCs: IOC[];
  ttps: string[];
  actor?: string;
}

interface ThreatActor {
  name: string;
  aliases: string[];
  motivations: string[];
  ttps: string[];
  infrastructure: string[];
  firstSeen: string;
  lastSeen: string;
}

interface HuntMemory {
  // Knowledge base
  knownPatterns: ThreatPattern[];
  knownActors: ThreatActor[];
  knownInfrastructure: Map<string, Infrastructure>;

  // Performance tracking
  stats: {
    huntsCompleted: number;
    threatsFound: number;
    intelPackages: number;
    salesCompleted: number;
    revenue: number;
  };

  // Learning
  successfulSignatures: string[];
  failedHunts: string[];
  improvements: string[];

  // Timestamps
  lastHunt: string;
  createdAt: string;
  updatedAt: string;
}

// === TELOS CONTEXT =================================================

interface TelosContext {
  mission: string;
  goals: string[];
  targets: string[];
  forbidden: string[];
  sellIntel: boolean;
  pricePerIOC: number;
}

const DEFAULT_TELOS: TelosContext = {
  mission: 'Hunt threats that harm innocent people',
  goals: [
    'Build comprehensive threat intel database',
    'Attribute threats to actors',
    'Protect vulnerable organizations',
  ],
  targets: ['ransomware', 'banking-trojans', 'phishing-kits', 'stealers'],
  forbidden: ['hospitals', 'nonprofits', 'education', 'critical-infrastructure'],
  sellIntel: true,
  pricePerIOC: 50, // $50 per unique IOC
};

async function loadTelosContext(): Promise<TelosContext> {
  // In future: load from ~/.claude/skills/CORE/USER/TELOS/
  // For now: return default
  return DEFAULT_TELOS;
}

// === SCAR THREAT EXTENSIONS ========================================

const SCAR_THREAT = {
  /** Never execute outside sandbox */
  sandboxOnly: true,

  /** Maximum samples per day */
  maxSamplesPerDay: 50,

  /** Maximum hunts per heartbeat */
  maxHuntsPerHeartbeat: 5,

  /** Cooldown between analyses (ms) */
  analysisCooldown: 60000,

  /** Auto-purge samples after extraction */
  autoPurge: true,

  /** Never connect to real C2 */
  noRealC2Connection: true,

  /** Mask origin when probing */
  useProxy: true,
};

function scarThreatGate(action: string, data?: any): { allowed: boolean; reason?: string } {
  // First check base SCAR
  const baseGate = scarGate(action, data);
  if (!baseGate.allowed) return baseGate;

  // Additional threat-specific checks
  switch (action) {
    case 'analyze':
      if (!isInSandbox()) {
        return { allowed: false, reason: 'Analysis must run in sandbox' };
      }
      break;

    case 'connect':
      if (SCAR_THREAT.noRealC2Connection) {
        return { allowed: false, reason: 'Real C2 connections forbidden' };
      }
      break;
  }

  return { allowed: true };
}

// === MEMORY SYSTEM (ClawMem Integration) ==========================

const MEMORY_DIR = join(__dirname, '..', 'data', 'memory');
const MEMORY_FILE = join(MEMORY_DIR, 'hunt-memory.json');

const DEFAULT_MEMORY: HuntMemory = {
  knownPatterns: [],
  knownActors: [],
  knownInfrastructure: new Map(),
  stats: {
    huntsCompleted: 0,
    threatsFound: 0,
    intelPackages: 0,
    salesCompleted: 0,
    revenue: 0,
  },
  successfulSignatures: [],
  failedHunts: [],
  improvements: [],
  lastHunt: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

function loadMemory(): HuntMemory {
  try {
    if (!existsSync(MEMORY_FILE)) {
      mkdirSync(MEMORY_DIR, { recursive: true });
      writeFileSync(MEMORY_FILE, JSON.stringify(DEFAULT_MEMORY, null, 2));
      return { ...DEFAULT_MEMORY };
    }

    const raw = readFileSync(MEMORY_FILE, 'utf-8');
    const memory = JSON.parse(raw);

    // Convert infrastructure back to Map
    if (memory.knownInfrastructure) {
      memory.knownInfrastructure = new Map(Object.entries(memory.knownInfrastructure || {}));
    }

    return { ...DEFAULT_MEMORY, ...memory };
  } catch (error) {
    scarLog(`[MEMORY] Corrupted, resetting: ${error}`);
    return { ...DEFAULT_MEMORY };
  }
}

function saveMemory(memory: HuntMemory): void {
  try {
    memory.updatedAt = new Date().toISOString();

    // Convert Map to object for JSON
    const serialized = {
      ...memory,
      knownInfrastructure: Object.fromEntries(memory.knownInfrastructure || new Map()),
    };

    writeFileSync(MEMORY_FILE, JSON.stringify(serialized, null, 2));
  } catch (error) {
    scarLog(`[MEMORY] Save failed: ${error}`);
  }
}

// === ABILITIES =====================================================

/**
 * PATROL - Find threats (uses memory to prioritize)
 */
async function patrol(memory: HuntMemory, telos: TelosContext): Promise<ThreatIntel[]> {
  const gate = scarThreatGate('patrol');
  if (!gate.allowed) {
    scarLog(`[GATE] Patrol blocked: ${gate.reason}`);
    return [];
  }

  scarLog('[PATROL] Scanning for threats...');

  const threats: ThreatIntel[] = [];

  // Simulated: In real version, connect to honeypots, feeds, etc.
  // For now, demonstrate the pattern

  // Check if we know patterns that help us find related threats
  if (memory.knownPatterns.length > 0) {
    scarLog(`[PATROL] Using ${memory.knownPatterns.length} known patterns for detection`);
    // Use patterns to identify similar threats
  }

  // Simulate finding threats (replace with real sources)
  const simulatedThreats: ThreatIntel[] = [
    // These would come from honeypots, feeds, etc.
  ];

  // Filter by TELOS targets
  for (const threat of simulatedThreats) {
    if (telos.targets.some(t => threat.type.includes(t))) {
      threats.push(threat);
      scarLog(`[PATROL] Found: ${threat.type} - ${threat.hash.slice(0, 8)}`);
    }
  }

  memory.stats.huntsCompleted++;
  scarRecordAction('patrol');

  return threats;
}

/**
 * HUNT - Analyze threat in sandbox
 */
async function hunt(threat: ThreatIntel, memory: HuntMemory): Promise<Analysis | null> {
  const gate = scarThreatGate('analyze');
  if (!gate.allowed) {
    scarLog(`[GATE] Analysis blocked: ${gate.reason}`);
    return null;
  }

  // [SCAR] MUST be in sandbox
  if (!isInSandbox()) {
    scarLog('[BLOCKED] Analysis attempted outside sandbox!');
    return null;
  }

  scarLog(`[HUNT] Analyzing: ${threat.hash.slice(0, 8)}`);

  // Check memory for similar threats
  const similarThreats = memory.knownPatterns.filter(p =>
    p.characteristics.some(c => threat.type.includes(c))
  );

  if (similarThreats.length > 0) {
    scarLog(`[HUNT] Found ${similarThreats.length} similar patterns in memory`);
  }

  // Simulated analysis (replace with real sandbox analysis)
  const analysis: Analysis = {
    hash: threat.hash,
    malwareType: threat.type,
    family: similarThreats[0]?.family || 'Unknown',
    capabilities: [],
    iocs: [],
    ttps: similarThreats[0]?.ttps || [],
    infrastructure: [],
  };

  scarRecordAction('analyze');
  return analysis;
}

/**
 * EXTRACT - Package intel from analysis
 */
async function extract(analysis: Analysis, memory: HuntMemory): Promise<IntelPackage> {
  const gate = scarThreatGate('extract');
  if (!gate.allowed) {
    scarLog(`[GATE] Extract blocked: ${gate.reason}`);
    return null;
  }

  scarLog(`[EXTRACT] Packaging intel: ${analysis.hash.slice(0, 8)}`);

  // Generate YARA-like signatures
  const signatures = generateSignatures(analysis, memory);

  const intel: IntelPackage = {
    id: `intel-${Date.now()}`,
    hash: analysis.hash,
    type: analysis.malwareType,
    family: analysis.family,
    iocs: analysis.iocs,
    signatures,
    ttps: analysis.ttps,
    infrastructure: analysis.infrastructure,
    confidence: calculateConfidence(analysis, memory),
    timestamp: new Date().toISOString(),
  };

  // [SCAR] Auto-purge sample
  if (SCAR_THREAT.autoPurge) {
    await purgeSample(analysis.hash);
    scarLog(`[EXTRACT] Sample purged: ${analysis.hash.slice(0, 8)}`);
  }

  scarRecordAction('extract');
  return intel;
}

/**
 * LEARN - Update memory with new knowledge (CLOSES THE LOOP)
 */
async function learn(intel: IntelPackage, memory: HuntMemory, telos: TelosContext): Promise<HuntMemory> {
  scarLog('[LEARN] Updating memory with new intel...');

  // 1. Pattern Recognition - "This looks like family X"
  if (intel.family && intel.family !== 'Unknown') {
    const existingPattern = memory.knownPatterns.find(p => p.family === intel.family);

    if (existingPattern) {
      // Update existing pattern with new IOCs
      for (const ioc of intel.iocs) {
        if (!existingPattern.knownIOCs.some(i => i.value === ioc.value)) {
          existingPattern.knownIOCs.push(ioc);
          scarLog(`[LEARN] New IOC for ${intel.family}: ${ioc.value}`);
        }
      }
    } else {
      // Create new pattern
      memory.knownPatterns.push({
        family: intel.family,
        characteristics: [intel.type],
        knownIOCs: intel.iocs,
        ttps: intel.ttps,
      });
      scarLog(`[LEARN] New pattern: ${intel.family}`);
    }
  }

  // 2. Infrastructure Tracking - "This C2 was used before"
  for (const infra of intel.infrastructure) {
    const key = `${infra.type}:${infra.address}`;
    const existing = memory.knownInfrastructure.get(key);

    if (existing) {
      scarLog(`[LEARN] Known infrastructure: ${key}`);
    } else {
      memory.knownInfrastructure.set(key, infra);
      scarLog(`[LEARN] New infrastructure: ${key}`);
    }
  }

  // 3. Attribution - "This matches Actor X"
  const matchingActor = memory.knownActors.find(actor =>
    actor.ttps.some(ttp => intel.ttps.includes(ttp))
  );

  if (matchingActor) {
    intel.attribution = matchingActor.name;
    matchingActor.lastSeen = new Date().toISOString();
    scarLog(`[LEARN] Attributed to: ${matchingActor.name}`);
  }

  // 4. Signature Improvement - "Old signatures missed this"
  if (intel.signatures.length > 0) {
    for (const sig of intel.signatures) {
      if (!memory.successfulSignatures.includes(sig)) {
        memory.successfulSignatures.push(sig);
        memory.improvements.push(`New signature for ${intel.type} at ${intel.timestamp}`);
      }
    }
  }

  // 5. Update Stats
  memory.stats.threatsFound++;
  memory.stats.intelPackages++;
  memory.lastHunt = new Date().toISOString();

  // 6. Update TELOS goals (if we had the full TELOS integration)
  // await updateGoalProgress('threat-intel-database', memory.stats.intelPackages);

  scarLog(`[LEARN] Memory updated: ${memory.knownPatterns.length} patterns, ${memory.knownInfrastructure.size} infrastructure`);

  return memory;
}

/**
 * REPORT - Save intel and optionally sell
 */
async function report(intel: IntelPackage, memory: HuntMemory, telos: TelosContext): Promise<{ saved: boolean; sold: boolean; revenue?: number }> {
  const result = { saved: false, sold: false, revenue: 0 };

  // Save to local intel database
  const intelDir = join(__dirname, '..', 'data', 'intel');
  mkdirSync(intelDir, { recursive: true });

  const intelFile = join(intelDir, `${intel.id}.json`);
  writeFileSync(intelFile, JSON.stringify(intel, null, 2));
  result.saved = true;
  scarLog(`[REPORT] Intel saved: ${intel.id}`);

  // Optionally sell intel
  if (telos.sellIntel && intel.confidence > 0.7) {
    const sale = await sellIntel(intel, telos);
    if (sale) {
      result.sold = true;
      result.revenue = sale;
      memory.stats.salesCompleted++;
      memory.stats.revenue += sale;
      scarLog(`[REPORT] Intel sold: $${sale}`);
    }
  }

  scarRecordAction('report');
  return result;
}

/**
 * ADAPT - Use learning to improve future hunts
 */
async function adapt(memory: HuntMemory): Promise<void> {
  scarLog('[ADAPT] Analyzing performance for improvements...');

  // 1. Check revenue threshold for upgrades
  if (memory.stats.revenue > 1000 && memory.improvements.length < 10) {
    scarLog('[ADAPT] Revenue threshold reached - could upgrade tools/feeds');
    // In real version: purchase better feeds, upgrade sandbox, etc.
  }

  // 2. Analyze failed hunts
  if (memory.failedHunts.length > 5) {
    scarLog(`[ADAPT] ${memory.failedHunts.length} failed hunts - need better detection`);
    // In real version: adjust patrol strategy
  }

  // 3. Signature effectiveness
  if (memory.successfulSignatures.length > 20) {
    scarLog(`[ADAPT] ${memory.successfulSignatures.length} effective signatures - good coverage`);
  }

  // 4. Suggest TELOS updates
  if (memory.stats.intelPackages > 100) {
    scarLog('[ADAPT] Goal progress: 100+ intel packages collected');
  }
}

// === HELPER FUNCTIONS ==============================================

function isInSandbox(): boolean {
  // Check if running in isolated environment
  // In real version: check for Docker, VM, etc.
  return process.env.SHADOW_SANDBOX === 'true' || process.env.NODE_ENV === 'test';
}

function generateSignatures(analysis: Analysis, memory: HuntMemory): string[] {
  const signatures: string[] = [];

  // Generate YARA-like rules based on characteristics
  signatures.push(`rule ${analysis.malwareType}_${analysis.hash.slice(0, 8)} {
    strings:
      $hash = "${analysis.hash}"
    condition:
      $hash
  }`);

  // Add improved signatures based on memory
  if (memory.successfulSignatures.length > 0) {
    // Use learned patterns
  }

  return signatures;
}

function calculateConfidence(analysis: Analysis, memory: HuntMemory): number {
  let confidence = 0.5;

  // Higher confidence if we know the family
  if (analysis.family && analysis.family !== 'Unknown') {
    confidence += 0.2;
  }

  // Higher confidence if we have IOCs
  if (analysis.iocs.length > 0) {
    confidence += 0.1;
  }

  // Higher confidence if we've seen similar patterns
  const similarPatterns = memory.knownPatterns.filter(p =>
    p.family === analysis.family
  );
  if (similarPatterns.length > 0) {
    confidence += 0.2;
  }

  return Math.min(confidence, 1.0);
}

async function purgeSample(hash: string): Promise<void> {
  // In real version: securely delete sample from sandbox
  scarLog(`[PURGE] Sample ${hash.slice(0, 8)} marked for deletion`);
}

async function sellIntel(intel: IntelPackage, telos: TelosContext): Promise<number | null> {
  // In real version: connect to threat intel platforms, brokers, etc.
  // For now, simulate

  const iocValue = intel.iocs.length * telos.pricePerIOC;
  const attributionBonus = intel.attribution ? 200 : 0;

  // Don't actually sell in demo mode
  scarLog(`[SELL] Would sell for estimated $${iocValue + attributionBonus}`);
  return null; // Return null in demo mode
}

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// === MAIN HEARTBEAT (CLOSED LOOP) ==================================

async function closedLoopHeartbeat(): Promise<void> {
  scarLog('╔══════════════════════════════════════════════════════════╗');
  scarLog('║         SHADOW THREAT HUNTER - CLOSED LOOP               ║');
  scarLog('╚══════════════════════════════════════════════════════════╝');

  // [SCAR] Self-heal check
  scarSelfHeal();
  if (scarIsPaused()) {
    scarLog('[PAUSED] System paused, exiting');
    return;
  }

  // [TELOS] Load mission
  const telos = await loadTelosContext();
  scarLog(`[TELOS] Mission: ${telos.mission}`);

  // [MEMORY] Load what we've learned
  const memory = loadMemory();
  scarLog(`[MEMORY] ${memory.knownPatterns.length} patterns, ${memory.stats.intelPackages} intel packages, $${memory.stats.revenue} revenue`);

  try {
    // [PATROL] Find threats (uses memory)
    const threats = await patrol(memory, telos);

    if (threats.length === 0) {
      scarLog('[PATROL] No threats found this cycle');
    }

    // Process each threat
    let processed = 0;
    for (const threat of threats) {
      if (processed >= SCAR_THREAT.maxHuntsPerHeartbeat) {
        scarLog(`[LIMIT] Max ${SCAR_THREAT.maxHuntsPerHeartbeat} hunts per heartbeat`);
        break;
      }

      // [HUNT] Analyze in sandbox
      const analysis = await hunt(threat, memory);
      if (!analysis) continue;

      // [EXTRACT] Package intel
      const intel = await extract(analysis, memory);
      if (!intel) continue;

      // [LEARN] Update memory (CLOSES THE LOOP)
      const updatedMemory = await learn(intel, memory, telos);

      // [REPORT] Save and sell
      await report(intel, updatedMemory, telos);

      // Save memory
      saveMemory(updatedMemory);

      processed++;

      // [SCAR] Cooldown between analyses
      await sleep(SCAR_THREAT.analysisCooldown);
    }

    // [ADAPT] Analyze and improve
    await adapt(memory);

    // Final memory save
    saveMemory(memory);

  } catch (error) {
    scarLog(`[ERROR] ${error}`);
    scarRecordAction('error');
  }

  scarLog('╔══════════════════════════════════════════════════════════╗');
  scarLog('║              HEARTBEAT COMPLETE                         ║');
  scarLog(`║  Patterns: ${memory.knownPatterns.length.toString().padEnd(10)} Intel: ${memory.stats.intelPackages.toString().padEnd(10)}     ║`);
  scarLog(`║  Revenue: $${memory.stats.revenue.toString().padEnd(9)} Hunts: ${memory.stats.huntsCompleted.toString().padEnd(10)}     ║`);
  scarLog('╚══════════════════════════════════════════════════════════╝');
}

// === RUN ===========================================================

// Run every 30 minutes
const HEARTBEAT_INTERVAL = 30 * 60 * 1000;

scarLog('[START] Shadow Threat Hunter initialized');
scarLog(`[START] Heartbeat interval: ${HEARTBEAT_INTERVAL / 60000} minutes`);

// Initial run
closedLoopHeartbeat();

// Schedule recurring runs
setInterval(closedLoopHeartbeat, HEARTBEAT_INTERVAL);
