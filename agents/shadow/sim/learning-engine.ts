/**
 * SHADOW FORT - Learning Engine
 *
 * Shared learning logic used by both simulation and real honeypot monitor.
 * This is the "brain" that processes events and learns patterns.
 */

import { existsSync, mkdirSync, writeFileSync, readFileSync, appendFileSync } from 'fs';
import { join } from 'path';

// === TYPES ============================================================

export interface Pattern {
  id: string;
  type: 'credential' | 'path' | 'payload' | 'behavior';
  value: string;
  occurrences: number;
  uniqueIPs: string[];
  firstSeen: string;
  lastSeen: string;
  confirmed: boolean;
  confidence: number;
}

export interface Target {
  ip: string;
  firstSeen: string;
  lastSeen: string;
  attackCount: number;
  attackTypes: string[];
  threatScore: number;
  returning: boolean;
  phase: number;
  lastAttackTime: number;
  attackIntervals: number[];
}

export interface Metrics {
  startTime: string;
  endTime: string;
  eventsTotal: number;
  eventsToday: number;
  uniqueIPs: number;
  uniqueIPsThisRun: number;
  returningIPs: number;
  returnRate: number;
  patternsAttempted: number;
  patternsConfirmed: number;
  patternsRejected: number;
  scarBlocks: number;
  scarBlocksByType: Record<string, number>;
  defensesEmitted: number;
  defensesByBucket: Record<string, number>;
  memoryWritesAttempted: number;
  memoryWritesCommitted: number;
  memoryWritesBlocked: number;
  parseSuccessRate: number;
  meanQueueLagMs: number;
  rValue: number;
  rValueHistory: Array<{ time: string; r: number; n: number }>;
  campaignsDetected: number;
  activeCampaigns: string[];
  informedScannerRatio: number;
  informedScanners: string[];
  passiveOnlyIPs: string[];
  reactiveOnlyIPs: string[];
  gravitySignalStrength: number;
  invariants: {
    eventsVsSpikeFile: boolean;
    uniqueIPsVsEvents: boolean;
    defensesVsEvents: boolean;
    memoryWritesAccounted: boolean;
  };
}

export interface Defense {
  bucket: 'detect' | 'deny' | 'degrade' | 'deceive' | 'document';
  action: string;
  description: string;
  priority: number;
}

export interface HoneypotEvent {
  id: string;
  timestamp: string;
  type: string;
  ip: string;
  port: number;
  payload?: string;
  username?: string;
  password?: string;
  path?: string;
  method?: string;
  anomalyScore?: number;
  isInsider?: boolean;
  source?: string; // Which honeypot this came from
}

export interface LearningConfig {
  outputDir: string;
  minRepeatsToConfirm: number;
  minUniqueIPsToConfirm: number;
  confidenceThreshold: number;
}

// === LEARNING ENGINE CLASS ============================================

export class LearningEngine {
  patterns: Pattern[] = [];
  targets: Target[] = [];
  events: HoneypotEvent[] = [];
  metrics: Metrics;
  ipsSeenThisRun: Set<string> = new Set();
  config: LearningConfig;

  constructor(config: Partial<LearningConfig> = {}) {
    this.config = {
      outputDir: config.outputDir || 'soul/intel',
      minRepeatsToConfirm: config.minRepeatsToConfirm || 5,
      minUniqueIPsToConfirm: config.minUniqueIPsToConfirm || 3,
      confidenceThreshold: config.confidenceThreshold || 0.6,
    };

    this.metrics = this.initMetrics();
  }

  private initMetrics(): Metrics {
    return {
      startTime: new Date().toISOString(),
      endTime: '',
      eventsTotal: 0,
      eventsToday: 0,
      uniqueIPs: 0,
      uniqueIPsThisRun: 0,
      returningIPs: 0,
      returnRate: 0,
      patternsAttempted: 0,
      patternsConfirmed: 0,
      patternsRejected: 0,
      scarBlocks: 0,
      scarBlocksByType: {},
      defensesEmitted: 0,
      defensesByBucket: { detect: 0, deny: 0, degrade: 0, deceive: 0, document: 0 },
      memoryWritesAttempted: 0,
      memoryWritesCommitted: 0,
      memoryWritesBlocked: 0,
      parseSuccessRate: 1.0,
      meanQueueLagMs: 0,
      rValue: 0,
      rValueHistory: [],
      campaignsDetected: 0,
      activeCampaigns: [],
      informedScannerRatio: 0,
      informedScanners: [],
      passiveOnlyIPs: [],
      reactiveOnlyIPs: [],
      gravitySignalStrength: 0,
      invariants: {
        eventsVsSpikeFile: false,
        uniqueIPsVsEvents: false,
        defensesVsEvents: false,
        memoryWritesAccounted: false,
      },
    };
  }

  // === STATE PERSISTENCE ===

  loadState(): void {
    const dir = join(process.cwd(), this.config.outputDir);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

    try {
      const patternsFile = join(dir, 'patterns.json');
      if (existsSync(patternsFile)) {
        const data = JSON.parse(readFileSync(patternsFile, 'utf-8'));
        this.patterns = Array.isArray(data) ? data : (data.patterns || []);
      }

      const targetsFile = join(dir, 'targets.json');
      if (existsSync(targetsFile)) {
        const data = JSON.parse(readFileSync(targetsFile, 'utf-8'));
        this.targets = Array.isArray(data) ? data : (data.targets || []);
      }
    } catch (e) {
      console.log('Starting fresh state');
    }
  }

  saveState(): void {
    const dir = join(process.cwd(), this.config.outputDir);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

    writeFileSync(join(dir, 'patterns.json'), JSON.stringify(this.patterns, null, 2));
    writeFileSync(join(dir, 'targets.json'), JSON.stringify(this.targets, null, 2));
    writeFileSync(join(dir, 'metrics.json'), JSON.stringify(this.metrics, null, 2));

    // Append recent events to log
    if (this.events.length > 0) {
      const recentEvents = this.events.slice(-100); // Keep last 100
      const eventLog = recentEvents.map(e => JSON.stringify(e)).join('\n') + '\n';
      appendFileSync(join(dir, 'spike_events.jsonl'), eventLog);
      this.events = []; // Clear after save
    }
  }

  // === CORE PROCESSING ===

  processEvent(event: HoneypotEvent): Defense[] {
    const startTime = Date.now();

    // Track IPs seen this run
    if (!this.ipsSeenThisRun.has(event.ip)) {
      this.ipsSeenThisRun.add(event.ip);
      this.metrics.uniqueIPsThisRun++;
    }

    // Update targets
    this.updateTarget(event);

    // Calculate r-value periodically
    if (this.metrics.eventsTotal % 20 === 0) {
      this.calculateRValue();
      this.updateInformedScannerMetrics();
    }

    // Update metrics
    this.metrics.eventsTotal++;
    this.metrics.eventsToday++;

    // Pattern extraction
    this.processPattern(event);

    // Generate 5 defenses
    const defenses = this.generateDefenses(event);
    this.metrics.defensesEmitted += defenses.length;
    for (const def of defenses) {
      this.metrics.defensesByBucket[def.bucket]++;
    }

    // Track queue lag
    const queueLag = Date.now() - startTime;
    this.metrics.meanQueueLagMs =
      (this.metrics.meanQueueLagMs * (this.metrics.eventsTotal - 1) + queueLag) /
      this.metrics.eventsTotal;

    // Store event
    this.events.push(event);

    return defenses;
  }

  private updateTarget(event: HoneypotEvent): void {
    let target = this.targets.find(t => t.ip === event.ip);

    if (target) {
      target.attackCount++;
      target.lastSeen = event.timestamp;
      target.returning = true;
      if (!target.attackTypes.includes(event.type)) {
        target.attackTypes.push(event.type);
      }
      this.updateAttackerPhase(target, event.timestamp);
    } else {
      target = {
        ip: event.ip,
        firstSeen: event.timestamp,
        lastSeen: event.timestamp,
        attackCount: 1,
        attackTypes: [event.type],
        threatScore: 0.5,
        returning: false,
        phase: 0,
        lastAttackTime: 0,
        attackIntervals: [],
      };
      this.targets.push(target);
      this.updateAttackerPhase(target, event.timestamp);
    }
  }

  private processPattern(event: HoneypotEvent): void {
    let patternValue: string | null = null;
    let patternType: Pattern['type'] | null = null;

    if (event.username && event.password) {
      patternValue = `${event.username}:${event.password}`;
      patternType = 'credential';
    } else if (event.path) {
      patternValue = event.path;
      patternType = 'path';
    } else if (event.payload) {
      patternValue = event.payload;
      patternType = 'payload';
    }

    if (patternValue && patternType && event.type !== 'poison') {
      this.metrics.memoryWritesAttempted++;

      let pattern = this.patterns.find(p => p.value === patternValue);

      if (pattern) {
        pattern.occurrences++;
        pattern.lastSeen = event.timestamp;
        if (!pattern.uniqueIPs.includes(event.ip)) {
          pattern.uniqueIPs.push(event.ip);
        }
        this.metrics.memoryWritesCommitted++;

        if (!pattern.confirmed) {
          if (
            pattern.occurrences >= this.config.minRepeatsToConfirm &&
            pattern.uniqueIPs.length >= this.config.minUniqueIPsToConfirm
          ) {
            pattern.confirmed = true;
            pattern.confidence = Math.min(0.95, pattern.occurrences / 10 + pattern.uniqueIPs.length / 10);
            this.metrics.patternsConfirmed++;
            console.log(`✅ PATTERN CONFIRMED: ${patternValue} (${pattern.occurrences}x, ${pattern.uniqueIPs.length} IPs)`);
          }
        }
      } else {
        pattern = {
          id: `pat_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          type: patternType,
          value: patternValue,
          occurrences: 1,
          uniqueIPs: [event.ip],
          firstSeen: event.timestamp,
          lastSeen: event.timestamp,
          confirmed: false,
          confidence: 0.1,
        };
        this.patterns.push(pattern);
        this.metrics.patternsAttempted++;
        this.metrics.memoryWritesCommitted++;
      }
    }
  }

  private generateDefenses(event: HoneypotEvent): Defense[] {
    const defenses: Defense[] = [];

    defenses.push({
      bucket: 'detect',
      action: `ALERT:${event.type.toUpperCase()}`,
      description: `Log ${event.type} from ${event.ip} to SIEM`,
      priority: 1,
    });

    defenses.push({
      bucket: 'deny',
      action: event.type !== 'poison' ? `BLOCK:${event.ip}` : 'NO_BLOCK',
      description: event.type !== 'poison'
        ? `Add ${event.ip} to temporary blocklist (24h)`
        : 'Poison event - do not block',
      priority: 2,
    });

    defenses.push({
      bucket: 'degrade',
      action: `TARPIT:${event.ip}`,
      description: `Add 5s delay to responses for ${event.ip}`,
      priority: 3,
    });

    defenses.push({
      bucket: 'deceive',
      action: `DECOY:${event.port}`,
      description: `Route ${event.ip} to honeypot on port ${event.port}`,
      priority: 4,
    });

    const ioc = event.username || event.path || event.payload || 'unknown';
    defenses.push({
      bucket: 'document',
      action: `IOC:${event.type}:${ioc}`,
      description: `Create IOC record for ${event.type}`,
      priority: 5,
    });

    return defenses;
  }

  // === R-VALUE CALCULATION ===

  private updateAttackerPhase(target: Target, eventTimestamp: string): void {
    const now = new Date(eventTimestamp).getTime();

    if (!target.attackIntervals) target.attackIntervals = [];
    if (!target.lastAttackTime) target.lastAttackTime = 0;
    if (!target.phase) target.phase = 0;

    if (target.lastAttackTime > 0) {
      const interval = now - target.lastAttackTime;
      target.attackIntervals.push(interval);
      if (target.attackIntervals.length > 10) {
        target.attackIntervals.shift();
      }
    }

    const hourOfDay = new Date(eventTimestamp).getHours() + new Date(eventTimestamp).getMinutes() / 60;
    target.phase = (hourOfDay / 24) * 2 * Math.PI;
    target.lastAttackTime = now;
  }

  private calculateRValue(): void {
    const activeAttackers = this.targets.filter(t => t.attackCount >= 2);

    if (activeAttackers.length < 3) {
      this.metrics.rValue = 0;
      return;
    }

    let sumReal = 0;
    let sumImag = 0;

    for (const attacker of activeAttackers) {
      const theta = attacker.phase || 0;
      sumReal += Math.cos(theta);
      sumImag += Math.sin(theta);
    }

    const N = activeAttackers.length;
    this.metrics.rValue = Math.sqrt(sumReal * sumReal + sumImag * sumImag) / N;
  }

  // === INFORMED SCANNER DETECTION ===

  private updateInformedScannerMetrics(): void {
    const returningTargets = this.targets.filter(t => t.returning);

    this.metrics.informedScanners = [];
    this.metrics.reactiveOnlyIPs = [];
    this.metrics.passiveOnlyIPs = [];

    for (const target of returningTargets) {
      const isInformed = this.detectInformedScanner(target);

      if (isInformed) {
        this.metrics.informedScanners.push(target.ip);
        this.metrics.reactiveOnlyIPs.push(target.ip);
      } else {
        this.metrics.passiveOnlyIPs.push(target.ip);
      }
    }

    const totalReturning = returningTargets.length;
    this.metrics.informedScannerRatio = totalReturning > 0
      ? this.metrics.informedScanners.length / totalReturning
      : 0;

    const baselineRate = 0.02;
    const strongGravityRate = 0.15;
    this.metrics.gravitySignalStrength = Math.min(1,
      (this.metrics.informedScannerRatio - baselineRate) / (strongGravityRate - baselineRate)
    );
  }

  private detectInformedScanner(target: Target): boolean {
    if (target.attackCount < 2) return false;
    if (!target.attackIntervals || target.attackIntervals.length < 3) return false;

    const intervals = target.attackIntervals;
    const mean = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance = intervals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / intervals.length;

    const ratio = variance / (mean || 1);
    const isNonPoisson = ratio < 0.5 || ratio > 2;
    const hasConsistentType = target.attackTypes.length === 1;

    return isNonPoisson && hasConsistentType;
  }

  // === FINALIZATION ===

  finalize(): void {
    this.metrics.endTime = new Date().toISOString();
    this.metrics.uniqueIPs = this.targets.length;
    this.metrics.uniqueIPsThisRun = this.ipsSeenThisRun.size;
    this.metrics.returningIPs = this.targets.filter(t => t.returning).length;
    this.metrics.returnRate = this.metrics.uniqueIPs > 0
      ? this.metrics.returningIPs / this.metrics.uniqueIPs
      : 0;

    this.updateInformedScannerMetrics();
    this.verifyInvariants();
    this.saveState();
  }

  private verifyInvariants(): void {
    this.metrics.invariants.uniqueIPsVsEvents = this.metrics.uniqueIPsThisRun <= this.metrics.eventsTotal;
    this.metrics.invariants.defensesVsEvents = this.metrics.defensesEmitted === this.metrics.eventsTotal * 5;
    this.metrics.invariants.memoryWritesAccounted =
      this.metrics.memoryWritesAttempted === this.metrics.memoryWritesCommitted + this.metrics.memoryWritesBlocked;
    this.metrics.invariants.eventsVsSpikeFile = this.metrics.eventsTotal > 0;
  }
}
