#!/usr/bin/env bun
/**
 * MONKEY BRIDGE - Shadow ↔ Infection Monkey Integration
 *
 * Connects Shadow to the Infection Monkey battle simulator.
 * Shadow runs real attacks and earns XP from actual results.
 * Every battle is saved to soul memory for learning.
 *
 * Run: bun run monkey-bridge.ts
 */

import { scarLog } from './scar';
import { Shadow } from './shadow';
import { SoulManager, BattleResult } from './soul';
import { SpikeLogger } from './spike-logger';
import { MapManager } from './map';

// Accept self-signed certificates (Monkey uses self-signed)
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// === CONFIG ========================================================

const MONKEY_URL = process.env.MONKEY_URL || 'https://localhost:5000';
const MONKEY_USER = process.env.MONKEY_USER || 'shadow';
const MONKEY_PASS = process.env.MONKEY_PASS || (() => {
  throw new Error('MONKEY_PASS environment variable required. Set it before running.');
})();

// === TYPES =========================================================

interface MonkeyConfig {
  token: string;
  tokenExpiry: number;
}

interface AgentInfo {
  id: string;
  machine_id: number;
  registration_time: string;
  start_time: string;
  stop_time: string | null;
}

interface NodeInfo {
  machine_id: number;
  connections: Record<string, string[]>;
  tcp_connections: Record<string, unknown>;
}

interface MachineInfo {
  id: number;
  hostname: string;
  operating_system: string;
  network_interfaces: string[];
  island: boolean;
}

interface SimResults {
  agents: AgentInfo[];
  nodes: NodeInfo[];
  machines: MachineInfo[];
  durationMs: number;
  threats: number;
  propagations: number;
}

// === MONKEY CLIENT =================================================

class MonkeyClient {
  private config: MonkeyConfig | null = null;

  async ensureAuth(): Promise<void> {
    // Token lasts 15 minutes, refresh if needed
    if (this.config && Date.now() < this.config.tokenExpiry) {
      return;
    }

    scarLog('[MONKEY] Authenticating...');
    const response = await fetch(`${MONKEY_URL}/api/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: MONKEY_USER, password: MONKEY_PASS }),
    });

    if (!response.ok) {
      // Try to register first
      await this.register();
      return this.ensureAuth();
    }

    const data = await response.json();
    this.config = {
      token: data.response.user.authentication_token,
      tokenExpiry: Date.now() + (data.response.user.token_ttl_sec * 1000) - 60000, // 1 min buffer
    };
    scarLog('[MONKEY] Authenticated successfully');
  }

  private async register(): Promise<void> {
    const response = await fetch(`${MONKEY_URL}/api/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: MONKEY_USER, password: MONKEY_PASS }),
    });

    if (!response.ok) {
      throw new Error(`Registration failed: ${response.status}`);
    }

    scarLog('[MONKEY] Registered new user');
  }

  private async request(path: string, options: RequestInit = {}): Promise<Response> {
    await this.ensureAuth();

    const response = await fetch(`${MONKEY_URL}${path}`, {
      ...options,
      headers: {
        'Authentication-Token': this.config!.token,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    return response;
  }

  async runSimulation(): Promise<boolean> {
    scarLog('[MONKEY] Starting simulation...');

    const response = await this.request('/api/local-monkey', {
      method: 'POST',
      body: JSON.stringify({ action: 'run' }),
    });

    if (!response.ok) {
      scarLog(`[MONKEY] Failed to start: ${response.status}`);
      return false;
    }

    const data = await response.json();
    if (data.is_running) {
      scarLog('[MONKEY] Simulation started');
      return true;
    }

    scarLog(`[MONKEY] Failed to start: ${data.error_text}`);
    return false;
  }

  async getAgents(): Promise<AgentInfo[]> {
    const response = await this.request('/api/agents');
    return response.json();
  }

  async getNodes(): Promise<NodeInfo[]> {
    const response = await this.request('/api/nodes');
    return response.json();
  }

  async getMachines(): Promise<MachineInfo[]> {
    const response = await this.request('/api/machines');
    return response.json();
  }

  async clearSimulation(): Promise<void> {
    await this.request('/api/clear-simulation-data', { method: 'POST' });
    scarLog('[MONKEY] Cleared simulation data');
  }

  async getSecurityReport(): Promise<any> {
    const response = await this.request('/api/report/security');
    return response.json();
  }

  async getExploitations(): Promise<any> {
    const response = await this.request('/api/exploitations/monkey');
    return response.json();
  }

  async getMachines(): Promise<MachineInfo[]> {
    const response = await this.request('/api/machines');
    return response.json();
  }

  async waitForCompletion(timeoutMs: number = 30000): Promise<SimResults> {
    const startTime = Date.now();
    let agents: AgentInfo[] = [];

    scarLog('[MONKEY] Waiting for simulation to complete...');

    while (Date.now() - startTime < timeoutMs) {
      await sleep(2000);
      agents = await this.getAgents();

      // Check if all agents have stopped
      if (agents.length > 0 && agents.every(a => a.stop_time)) {
        scarLog('[MONKEY] Simulation complete');
        break;
      }
    }

    const nodes = await this.getNodes();
    const machines = await this.getMachines();

    // Calculate metrics
    const propagations = nodes.reduce((sum, n) =>
      sum + Object.keys(n.connections).length, 0);
    const threats = agents.length;

    return {
      agents,
      nodes,
      machines,
      durationMs: Date.now() - startTime,
      threats,
      propagations,
    };
  }
}

// === SHADOW MONKEY BATTLE ==========================================

async function shadowMonkeyBattle(shadow: Shadow, plainMode: boolean = false): Promise<void> {
  const monkey = new MonkeyClient();
  const soul = new SoulManager();
  const spikeLogger = new SpikeLogger();
  const map = new MapManager();
  const battleStartTime = new Date();
  const battleId = `battle_${battleStartTime.toISOString().replace(/[:.]/g, '-')}`;
  const abilitiesUsed: string[] = [];

  // === PLAIN MODE OUTPUT ===
  if (plainMode) {
    scarLog('═════════════════════════════════════════════════════════════');
    scarLog('                    SCAN REPORT');
    scarLog('═════════════════════════════════════════════════════════════');
    scarLog('');
  } else {
    scarLog('╔══════════════════════════════════════════════════════════╗');
    scarLog('║           SHADOW x INFECTION MONKEY BATTLE               ║');
    scarLog('╚══════════════════════════════════════════════════════════╝');
    scarLog('');

    // MAP CHECK: Where can Shadow go?
    scarLog('[MAP] Checking allowed territory...');
    const allowedRanges = map.getAllowedRanges();
    for (const r of allowedRanges) {
      scarLog(`[MAP] ✅ ${r.cidr} - ${r.name}`);
    }
    scarLog('');

    // MEMORY CHECK: Has Shadow seen these targets before?
    const knownTargets = soul.getKnownTargets();
    if (knownTargets.length > 0) {
      scarLog(`[SOUL] Remembering ${knownTargets.length} known target(s)...`);
    }
  }

  // === PHASE 1: SCAN ===
  if (!plainMode) {
    scarLog('');
    scarLog('┌─────────────────────────────────────────────────────────┐');
    scarLog('│  PHASE 1: SCOUT                                         │');
    scarLog('└─────────────────────────────────────────────────────────┘');
  }

  if (shadow.canUseAbility('shadow_flight')) {
    shadow.useAbility('shadow_flight');
    abilitiesUsed.push('shadow_flight');
    if (!plainMode) scarLog('[SHADOW] Using SHADOW_FLIGHT to scan environment...');
    await sleep(500);

    const machines = await monkey.getMachines();
    const targets = machines.filter(m => !m.island);

    if (plainMode) {
      scarLog('MACHINES DETECTED:');
      scarLog(`  Total: ${machines.length}`);
      scarLog(`  Targets (non-island): ${targets.length}`);
    } else {
      scarLog(`[SHADOW] Detected ${machines.length} machine(s), ${targets.length} potential target(s)`);
    }

    // Check if we've seen these before
    for (const t of targets) {
      const ip = t.network_interfaces[0]?.split('/')[0];
      if (ip && soul.hasSeenTarget(ip)) {
        const known = soul.getTargetByIP(ip);
        if (plainMode) {
          scarLog(`  ${ip} - SEEN BEFORE (${known?.timesScanned} times)`);
        } else {
          scarLog(`[SOUL] I remember ${ip} - seen ${known?.timesScanned}x before`);
        }
      }
    }

    shadow.addXP(10 * machines.length, 'reconnaissance');
  } else {
    if (!plainMode) scarLog('[SHADOW] shadow_flight not ready, proceeding...');
  }

  // === PHASE 2: DEPLOY ===
  if (!plainMode) {
    scarLog('');
    scarLog('┌─────────────────────────────────────────────────────────┐');
    scarLog('│  PHASE 2: DEPLOY                                        │');
    scarLog('└─────────────────────────────────────────────────────────┘');
  }

  if (shadow.canUseAbility('phantom_trap')) {
    shadow.useAbility('phantom_trap');
    abilitiesUsed.push('phantom_trap');
    if (!plainMode) scarLog('[SHADOW] Using PHANTOM_TRAP - deploying simulation...');
  } else {
    if (!plainMode) scarLog('[SHADOW] Deploying simulation (basic mode)...');
  }

  if (plainMode) scarLog('Running simulation...');
  const started = await monkey.runSimulation();
  if (!started) {
    scarLog('Failed to start simulation');
    return;
  }

  // === PHASE 3: WAIT FOR RESULTS ===
  if (!plainMode) {
    scarLog('');
    scarLog('┌─────────────────────────────────────────────────────────┐');
    scarLog('│  PHASE 3: HUNT                                          │');
    scarLog('└─────────────────────────────────────────────────────────┘');
  }

  if (shadow.canUseAbility('blood_trail')) {
    shadow.useAbility('blood_trail');
    abilitiesUsed.push('blood_trail');
    if (!plainMode) scarLog('[SHADOW] Using BLOOD_TRAIL to track malware spread...');
  }

  const results = await monkey.waitForCompletion(30000);

  if (plainMode) {
    scarLog(`Duration: ${(results.durationMs / 1000).toFixed(1)}s`);
  } else {
    scarLog(`[MONKEY] Results:`);
    scarLog(`  - Agents deployed: ${results.threats}`);
    scarLog(`  - Nodes discovered: ${results.nodes.length}`);
    scarLog(`  - Propagations: ${results.propagations}`);
    scarLog(`  - Duration: ${(results.durationMs / 1000).toFixed(1)}s`);
  }

  // === PHASE 4: ANALYZE ===
  if (!plainMode) {
    scarLog('');
    scarLog('┌─────────────────────────────────────────────────────────┐');
    scarLog('│  PHASE 4: ANALYZE                                       │');
    scarLog('└─────────────────────────────────────────────────────────┘');
  }

  // Fetch reports
  const report = await monkey.getSecurityReport();
  const exploitations = await monkey.getExploitations();

  if (plainMode) {
    scarLog('');
    scarLog('ANALYSIS:');
    scarLog(`  Exploits attempted: ${report.overview?.config_exploits?.length || 0}`);
    scarLog(`  Systems exploited: ${report.glance?.exploited_cnt || 0}`);
  } else {
    scarLog('[REPORT] Security Overview:');
    scarLog(`  Duration: ${report.overview?.monkey_duration || 'unknown'}`);
    scarLog(`  Exploits attempted: ${report.overview?.config_exploits?.length || 0}`);
    scarLog(`  Systems exploited: ${report.glance?.exploited_cnt || 0}`);
  }

  // Show discovered machines
  const allMachines = await monkey.getMachines();
  const targets = allMachines.filter((m: MachineInfo) => !m.island);

  // Format targets for soul
  const discoveredTargets = targets.map((m: MachineInfo) => ({
    ip: m.network_interfaces[0]?.split('/')[0] || m.network_interfaces[0],
    services: m.network_services || {},
  }));

  if (targets.length > 0) {
    if (plainMode) {
      scarLog('');
      scarLog('TARGETS FOUND:');
    } else {
      scarLog(`\n[TARGETS DISCOVERED: ${targets.length}]`);
    }

    targets.forEach((m: MachineInfo) => {
      const ip = m.network_interfaces[0]?.split('/')[0] || m.network_interfaces[0];
      const services = Object.keys(m.network_services || {}).join(', ') || 'none detected';
      const isNew = !soul.hasSeenTarget(ip);

      if (plainMode) {
        scarLog(`  ${ip}`);
        if (Object.keys(m.network_services || {}).length > 0) {
          for (const [port, svc] of Object.entries(m.network_services || {})) {
            scarLog(`    - ${port}: ${svc}`);
          }
        } else {
          scarLog(`    (no services detected)`);
        }
      } else {
        scarLog(`  ${isNew ? '🆕' : '📌'} ${ip} - ${services || 'scanned'}`);
      }
    });
  }

  if (exploitations.monkey_exploitations?.length > 0) {
    if (plainMode) {
      scarLog('');
      scarLog('EXPLOITS USED:');
    } else {
      scarLog(`  Exploitation details:`);
    }
    exploitations.monkey_exploitations.forEach((e: any) => {
      scarLog(`    - ${e.label}: ${e.count} time(s)`);
    });
  }

  // === SPIKE LOGGING ===
  // Log attack events for SNN training
  const spikeEvents: Array<{
    source_ip: string;
    source_port: number;
    dest_port: number;
    protocol: string;
    attack_type: 'scan' | 'exploit' | 'brute_force' | 'unknown';
    payload_size_bytes: number;
    session_duration_ms: number;
    raw?: any;
  }> = [];

  // Log each discovered target as a scan event
  for (const target of targets) {
    const ip = (target as any).network_interfaces?.[0]?.split('/')[0] || 'unknown';
    const services = (target as any).network_services || {};

    for (const [portService, serviceName] of Object.entries(services)) {
      const [portStr] = portService.split(':');
      const port = parseInt(portStr) || 0;

      spikeEvents.push({
        source_ip: ip,
        source_port: 0,  // We don't know the source port from Monkey
        dest_port: port,
        protocol: serviceName as string || 'unknown',
        attack_type: 'scan',
        payload_size_bytes: 0,
        session_duration_ms: results.durationMs,
        raw: { service: serviceName },
      });
    }
  }

  // Log exploitations as exploit events
  if (exploitations.monkey_exploitations) {
    for (const exp of exploitations.monkey_exploitations) {
      spikeEvents.push({
        source_ip: 'monkey-island',  // From our simulation
        source_port: 0,
        dest_port: 0,
        protocol: exp.label || 'unknown',
        attack_type: 'exploit',
        payload_size_bytes: 0,
        session_duration_ms: results.durationMs,
        raw: { count: exp.count },
      });
    }
  }

  // Log all spikes
  if (spikeEvents.length > 0) {
    const spikes = spikeLogger.logBattle(battleId, spikeEvents);
    scarLog(`[SPIKE] Logged ${spikes.length} events for SNN training`);
  }

  let xpEarned = 0;

  if (shadow.canUseAbility('deconstruct') && results.threats > 0) {
    shadow.useAbility('deconstruct');
    abilitiesUsed.push('deconstruct');
    scarLog('[SHADOW] Using DECONSTRUCT to analyze captured data...');

    const intelValue = results.propagations * 25 + results.threats * 50;
    shadow.recordIntel(intelValue);
    xpEarned += 50 * results.threats;
    shadow.addXP(50 * results.threats, 'analysis');
    scarLog(`[SHADOW] Extracted intel worth $${intelValue}`);
  } else if (results.threats > 0) {
    scarLog('[SHADOW] Basic analysis - deconstruct not unlocked');
    xpEarned += 20 * results.threats;
    shadow.addXP(20 * results.threats, 'basic analysis');
  }

  // PHASE 5: DEFEND (calculate damage taken)
  scarLog('');
  scarLog('┌─────────────────────────────────────────────────────────┐');
  scarLog('│  PHASE 5: ASSESS DAMAGE                                 │');
  scarLog('└─────────────────────────────────────────────────────────┘');

  // Simulate taking damage based on exposure
  const exposureDamage = Math.floor(Math.random() * 15) + 5;
  let damageTaken = 0;

  if (shadow.canUseAbility('fortress_wall')) {
    shadow.useAbility('fortress_wall');
    abilitiesUsed.push('fortress_wall');
    const blocked = Math.random() > 0.4;
    if (blocked) {
      scarLog('[SHADOW] FORTRESS_WALL blocked counter-attack!');
      shadow.addXP(20, 'defense');
    } else {
      damageTaken = Math.floor(exposureDamage / 2);
      shadow.takeDamage(damageTaken);
    }
  } else {
    damageTaken = exposureDamage;
    shadow.takeDamage(exposureDamage);
  }

  // Award XP for successful operation
  const totalXP = results.threats * 25 + results.propagations * 15;
  xpEarned += totalXP;
  shadow.addXP(totalXP, 'battle completion');

  // === SOUL PROCESSING ===
  // Save battle to memory
  const battleResult: BattleResult = {
    timestamp: battleStartTime.toISOString(),
    duration: results.durationMs,
    agentsDeployed: results.threats,
    nodesDiscovered: results.nodes.length,
    propagations: results.propagations,
    targets: discoveredTargets,
    xpEarned,
    damageTaken,
    abilitiesUsed,
  };

  soul.processBattle(battleResult);

  // Clean up
  await monkey.clearSimulation();

  // Final status
  if (plainMode) {
    scarLog('');
    scarLog('═════════════════════════════════════════════════════════════');
    scarLog('                    SCAN COMPLETE');
    scarLog('═════════════════════════════════════════════════════════════');
    const memoryStats = soul.getMemoryStats();
    scarLog(`Total battles: ${memoryStats.battlesFought}`);
    scarLog(`Total targets known: ${memoryStats.targetsDiscovered}`);
    scarLog('');
    scarLog('Data saved to: soul/intel/');
  } else {
    scarLog('');
    scarLog('╔══════════════════════════════════════════════════════════╗');
    scarLog('║              BATTLE COMPLETE                            ║');
    scarLog('╚══════════════════════════════════════════════════════════╝');

    // Show memory stats
    const memoryStats = soul.getMemoryStats();
    scarLog(`[SOUL] Battles: ${memoryStats.battlesFought} | Targets known: ${memoryStats.targetsDiscovered}`);

    shadow.printStatus();
  }
}

// === HELPERS =======================================================

function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// === MAIN ==========================================================

async function main() {
  const args = process.argv.slice(2);
  const shadow = new Shadow();
  const soul = new SoulManager();

  if (args[0] === 'status') {
    shadow.printStatus();
    return;
  }

  if (args[0] === 'abilities') {
    shadow.printAbilities();
    return;
  }

  if (args[0] === 'fight' || args[0] === 'battle' || args[0] === 'sim' || !args[0]) {
    const plainMode = args.includes('--plain') || args.includes('-p');
    await shadowMonkeyBattle(shadow, plainMode);
    return;
  }

  if (args[0] === 'heal') {
    shadow.heal(shadow.stats.maxHp);
    scarLog('[SHADOW] Fully healed');
    shadow.printStatus();
    return;
  }

  if (args[0] === 'xp') {
    const amount = parseInt(args[1]) || 100;
    shadow.addXP(amount, 'manual grant');
    shadow.printStatus();
    return;
  }

  // === SOUL COMMANDS ===

  if (args[0] === 'reflect') {
    scarLog(soul.reflect());
    return;
  }

  if (args[0] === 'memory') {
    scarLog('\n┌─────────────────────────────────────────────────────────┐');
    scarLog('│  SHADOW MEMORY                                          │');
    scarLog('└─────────────────────────────────────────────────────────┘');
    const stats = soul.getMemoryStats();
    scarLog(`  Battles fought: ${stats.battlesFought}`);
    scarLog(`  Targets discovered: ${stats.targetsDiscovered}`);
    scarLog(`  Patterns learned: ${stats.patternsLearned}`);
    scarLog(`  Total XP earned: ${stats.totalXpEarned}`);
    scarLog(`  Total damage taken: ${stats.totalDamageTaken}`);
    scarLog(`  Last battle: ${stats.lastBattle || 'Never'}`);
    scarLog('');
    return;
  }

  if (args[0] === 'targets') {
    const targets = soul.getKnownTargets();
    scarLog('\n┌─────────────────────────────────────────────────────────┐');
    scarLog('│  KNOWN TARGETS                                          │');
    scarLog('└─────────────────────────────────────────────────────────┘');

    if (targets.length === 0) {
      scarLog('  No targets discovered yet. Run a battle first.');
    } else {
      for (const t of targets) {
        const services = Object.entries(t.services)
          .map(([p, s]) => `${p}:${s}`)
          .join(', ') || 'none';
        scarLog(`  🎯 ${t.ip}`);
        scarLog(`     Services: ${services}`);
        scarLog(`     Scanned: ${t.timesScanned}x | First: ${t.firstSeen.split('T')[0]}`);
        scarLog('');
      }
    }
    return;
  }

  if (args[0] === 'spikes' || args[0] === 'telemetry') {
    const spikeLogger = new SpikeLogger();
    const telemetry = spikeLogger.getTelemetry();

    scarLog('\n┌─────────────────────────────────────────────────────────┐');
    scarLog('│  SPIKE TELEMETRY (SNN Data)                             │');
    scarLog('└─────────────────────────────────────────────────────────┘');

    if (!telemetry) {
      scarLog('  No spike data yet. Run battles to collect events.');
      return;
    }

    scarLog(`  Total events: ${telemetry.total_events}`);
    scarLog(`  Unique IPs: ${telemetry.unique_source_ips}`);
    scarLog(`  Avg inter-arrival time: ${telemetry.avg_inter_arrival_time_ms.toFixed(0)}ms`);
    scarLog(`  Timing pattern: ${telemetry.timing_pattern}`);
    scarLog(`  Spike rate: ${telemetry.spike_rate_per_minute.toFixed(2)}/min`);
    scarLog('');
    scarLog('  Attack types:');
    for (const [type, count] of Object.entries(telemetry.attack_type_distribution)) {
      scarLog(`    - ${type}: ${count}`);
    }
    scarLog('');
    scarLog('  Suspected families:');
    const families = Object.entries(telemetry.family_distribution);
    if (families.length === 0) {
      scarLog('    (none detected yet)');
    } else {
      for (const [family, count] of families) {
        scarLog(`    - ${family}: ${count}`);
      }
    }
    scarLog('');
    scarLog('  Top ports:');
    for (const { port, count } of telemetry.top_ports.slice(0, 5)) {
      scarLog(`    - Port ${port}: ${count} hits`);
    }
    scarLog('');
    scarLog(`  Data stored in: soul/intel/spike_events.jsonl`);
    return;
  }

  if (args[0] === 'export') {
    const spikeLogger = new SpikeLogger();
    const brian2Data = spikeLogger.exportForBrian2();

    scarLog('\n┌─────────────────────────────────────────────────────────┐');
    scarLog('│  BRIAN2 EXPORT                                          │');
    scarLog('└─────────────────────────────────────────────────────────┘');
    scarLog(`  Spike times: ${brian2Data.spike_times.length}`);
    scarLog(`  Unique neurons: ${new Set(brian2Data.neuron_ids).size}`);
    scarLog(`  Labels: ${[...new Set(brian2Data.labels)].join(', ')}`);
    scarLog('');
    scarLog('  Use this data in Brian2:');
    scarLog('  ┌─────────────────────────────────────────────────────┐');
    scarLog('  │ spike_times = [...]  # timestamps in ms            │');
    scarLog('  │ neuron_ids = [...]   # which neuron fired          │');
    scarLog('  │ # Create spike generator from this data            │');
    scarLog('  └─────────────────────────────────────────────────────┘');
    return;
  }

  // === MAP COMMANDS ===

  if (args[0] === 'map') {
    const mapMgr = new MapManager();

    // map show
    if (!args[1] || args[1] === 'show') {
      mapMgr.showMap();
      return;
    }

    // map check <ip>
    if (args[1] === 'check' && args[2]) {
      const result = mapMgr.canVisit(args[2]);
      scarLog(`\n[MAP] Can visit ${args[2]}?`);
      scarLog(`  ${result.allowed ? '✅ YES' : '❌ NO'} - ${result.reason}`);
      return;
    }

    // map add range <cidr> <name> <type>
    if (args[1] === 'add' && args[2] === 'range') {
      const cidr = args[3];
      const name = args[4] || 'Unnamed';
      const type = (args[5] || 'lab') as 'lab' | 'honeypot' | 'public' | 'research';
      if (cidr) {
        mapMgr.addRange(cidr, name, type);
      } else {
        scarLog('[MAP] Usage: map add range <cidr> <name> <type>');
      }
      return;
    }

    // map add host <ip> <name> <type>
    if (args[1] === 'add' && args[2] === 'host') {
      const ip = args[3];
      const name = args[4] || 'Unnamed';
      const type = (args[5] || 'cloud') as 'local' | 'cloud' | 'honeypot';
      if (ip) {
        mapMgr.addHost(ip, name, type);
      } else {
        scarLog('[MAP] Usage: map add host <ip> <name> <type>');
      }
      return;
    }

    // map forbid <keyword>
    if (args[1] === 'forbid' && args[2]) {
      mapMgr.addForbiddenKeyword(args[2]);
      return;
    }

    scarLog('[MAP] Commands:');
    scarLog('  map show              - Show the current map');
    scarLog('  map check <ip>        - Check if IP is allowed');
    scarLog('  map add range <cidr> <name> <type> - Add allowed range');
    scarLog('  map add host <ip> <name> <type>   - Add allowed host');
    scarLog('  map forbid <keyword>  - Add forbidden keyword');
    return;
  }

  scarLog('');
  scarLog('╔══════════════════════════════════════════════════════════╗');
  scarLog('║              SHADOW - Cyber Combat Agent                 ║');
  scarLog('╚══════════════════════════════════════════════════════════╝');
  scarLog('');
  scarLog('Commands:');
  scarLog('  fight [--plain]  - Run battle (add --plain for simple output)');
  scarLog('  status           - Show Shadow status');
  scarLog('  abilities        - Show abilities (locked/unlocked)');
  scarLog('  heal             - Restore HP');
  scarLog('  xp <n>           - Grant XP (testing)');
  scarLog('');
  scarLog('Soul Commands:');
  scarLog('  reflect   - Shadow reflects on what it learned');
  scarLog('  memory    - Show memory statistics');
  scarLog('  targets   - List all known targets');
  scarLog('  spikes    - Show SNN telemetry data');
  scarLog('  export    - Export data for Brian2');
  scarLog('');
  scarLog('Map Commands:');
  scarLog('  map show              - Show where Shadow can go');
  scarLog('  map check <ip>        - Check if IP is allowed');
  scarLog('  map add range/host    - Add to the map');
  scarLog('');
  scarLog('Example:');
  scarLog('  bun run monkey-bridge.ts fight');
  scarLog('  bun run monkey-bridge.ts reflect');
}

main().catch(e => {
  scarLog(`[FATAL] ${e}`);
  process.exit(1);
});

export { MonkeyClient, shadowMonkeyBattle };
