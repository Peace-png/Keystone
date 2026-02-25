#!/usr/bin/env bun
/**
 * SPIKE LOGGER - Event-Driven Encoding for SNN
 *
 * Converts attack telemetry into spike trains for Brian2.
 * Captures everything Shadow needs to learn temporal patterns.
 *
 * Output: soul/intel/spike_events.jsonl (one event per line)
 */

import { appendFileSync, existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

// === PATHS =========================================================

const SOUL_DIR = join(__dirname, '..', 'soul');
const INTEL_DIR = join(SOUL_DIR, 'intel');
const SPIKE_FILE = join(INTEL_DIR, 'spike_events.jsonl');
const TELEMETRY_FILE = join(INTEL_DIR, 'telemetry.json');

// === TYPES =========================================================

/**
 * A spike event - one attack observation
 * This is what gets fed to the SNN
 */
interface SpikeEvent {
  // Core identification
  id: string;
  timestamp: number;        // Unix ms
  honeypot_id: string;

  // Source info
  source_ip: string;
  source_port: number;
  dest_port: number;
  protocol: string;

  // Timing (for SNN)
  inter_arrival_time_ms: number;  // Time since last spike from this IP

  // Classification
  attack_type: 'scan' | 'exploit' | 'brute_force' | 'unknown';
  suspected_family: string | null;  // Mirai, Mozi, Hajime, etc.
  confidence: number;               // 0-1

  // Payload info
  payload_size_bytes: number;
  payload_hash: string | null;

  // Session info
  session_duration_ms: number;

  // Raw data (for analysis)
  raw: {
    user_agent?: string;
    headers?: Record<string, string>;
    payload_preview?: string;  // First 100 chars
  };
}

/**
 * Aggregated telemetry for pattern analysis
 */
interface TelemetrySummary {
  last_updated: string;
  total_events: number;
  unique_source_ips: number;
  attack_type_distribution: Record<string, number>;
  family_distribution: Record<string, number>;
  avg_inter_arrival_time_ms: number;
  timing_pattern: 'uniform' | 'gaussian' | 'poisson' | 'unknown';
  top_ports: Array<{ port: number; count: number }>;
  spike_rate_per_minute: number;
}

// === SPIKE LOGGER ==================================================

class SpikeLogger {
  private lastSpikeTime: Map<string, number> = new Map();  // IP -> timestamp
  private eventCount: number = 0;

  constructor() {
    if (!existsSync(INTEL_DIR)) {
      mkdirSync(INTEL_DIR, { recursive: true });
    }
    this.loadState();
  }

  private loadState(): void {
    try {
      const data = readFileSync(TELEMETRY_FILE, 'utf-8');
      const summary: TelemetrySummary = JSON.parse(data);
      this.eventCount = summary.total_events;
    } catch {
      this.eventCount = 0;
    }
  }

  /**
   * Log a spike event from honeypot attack
   */
  logSpike(event: Omit<SpikeEvent, 'id' | 'timestamp' | 'inter_arrival_time_ms'>): SpikeEvent {
    const now = Date.now();
    const id = `spike_${now}_${Math.random().toString(36).substr(2, 9)}`;

    // Calculate inter-arrival time
    const lastTime = this.lastSpikeTime.get(event.source_ip) || now;
    const iat = now - lastTime;
    this.lastSpikeTime.set(event.source_ip, now);

    const spike: SpikeEvent = {
      ...event,
      id,
      timestamp: now,
      inter_arrival_time_ms: iat,
    };

    // Append to JSONL
    appendFileSync(SPIKE_FILE, JSON.stringify(spike) + '\n');
    this.eventCount++;

    return spike;
  }

  /**
   * Log multiple spikes from a battle
   */
  logBattle(battleId: string, events: Array<{
    source_ip: string;
    source_port: number;
    dest_port: number;
    protocol: string;
    attack_type: SpikeEvent['attack_type'];
    payload_size_bytes: number;
    session_duration_ms: number;
    raw?: SpikeEvent['raw'];
  }>): SpikeEvent[] {
    const spikes: SpikeEvent[] = [];

    for (const e of events) {
      const spike = this.logSpike({
        honeypot_id: battleId,
        source_ip: e.source_ip,
        source_port: e.source_port,
        dest_port: e.dest_port,
        protocol: e.protocol,
        attack_type: e.attack_type,
        suspected_family: this.classifyFamily(e),
        confidence: 0.5,  // Will be updated by SNN
        payload_size_bytes: e.payload_size_bytes,
        payload_hash: null,
        session_duration_ms: e.session_duration_ms,
        raw: e.raw || {},
      });
      spikes.push(spike);
    }

    this.updateTelemetry();
    return spikes;
  }

  /**
   * Attempt to classify bot family based on behavior
   */
  private classifyFamily(event: {
    dest_port: number;
    protocol: string;
    attack_type: string;
  }): string | null {
    // Mirai signatures
    if ([23, 2323, 7547].includes(event.dest_port) && event.attack_type === 'brute_force') {
      return 'Mirai';
    }

    // Mozi signatures
    if (event.dest_port === 6000 && event.protocol === 'DHT') {
      return 'Mozi';
    }

    // Hajime signatures
    if ([23, 2323, 53589].includes(event.dest_port) && event.attack_type === 'brute_force') {
      return 'Hajime';
    }

    // SSH brute force (generic)
    if (event.dest_port === 22 && event.attack_type === 'brute_force') {
      return 'SSH-Brute';
    }

    // RDP scanning
    if (event.dest_port === 3389) {
      return 'RDP-Scanner';
    }

    // SMB scanning
    if (event.dest_port === 445) {
      return 'SMB-Scanner';
    }

    return null;
  }

  /**
   * Update telemetry summary
   */
  updateTelemetry(): void {
    // Read all spike events
    let events: SpikeEvent[] = [];
    try {
      const lines = readFileSync(SPIKE_FILE, 'utf-8').trim().split('\n');
      events = lines.map(line => JSON.parse(line));
    } catch {
      return;
    }

    // Calculate statistics
    const uniqueIPs = new Set(events.map(e => e.source_ip));
    const attackTypes: Record<string, number> = {};
    const families: Record<string, number> = {};
    const ports: Record<number, number> = {};
    let totalIAT = 0;
    let iatCount = 0;

    for (const e of events) {
      attackTypes[e.attack_type] = (attackTypes[e.attack_type] || 0) + 1;

      if (e.suspected_family) {
        families[e.suspected_family] = (families[e.suspected_family] || 0) + 1;
      }

      ports[e.dest_port] = (ports[e.dest_port] || 0) + 1;

      if (e.inter_arrival_time_ms > 0) {
        totalIAT += e.inter_arrival_time_ms;
        iatCount++;
      }
    }

    // Detect timing pattern
    const timingPattern = this.detectTimingPattern(events);

    // Top ports
    const topPorts = Object.entries(ports)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([port, count]) => ({ port: parseInt(port), count }));

    // Calculate spike rate
    const oldestEvent = events[0]?.timestamp || Date.now();
    const newestEvent = events[events.length - 1]?.timestamp || Date.now();
    const durationMinutes = (newestEvent - oldestEvent) / 60000 || 1;
    const spikeRate = events.length / durationMinutes;

    const summary: TelemetrySummary = {
      last_updated: new Date().toISOString(),
      total_events: events.length,
      unique_source_ips: uniqueIPs.size,
      attack_type_distribution: attackTypes,
      family_distribution: families,
      avg_inter_arrival_time_ms: iatCount > 0 ? totalIAT / iatCount : 0,
      timing_pattern: timingPattern,
      top_ports: topPorts,
      spike_rate_per_minute: spikeRate,
    };

    writeFileSync(TELEMETRY_FILE, JSON.stringify(summary, null, 2));
  }

  /**
   * Detect timing pattern (uniform, gaussian, poisson, unknown)
   */
  private detectTimingPattern(events: SpikeEvent[]): TelemetrySummary['timing_pattern'] {
    const iats = events
      .filter(e => e.inter_arrival_time_ms > 0)
      .map(e => e.inter_arrival_time_ms);

    if (iats.length < 10) return 'unknown';

    const mean = iats.reduce((a, b) => a + b, 0) / iats.length;
    const variance = iats.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / iats.length;
    const stdDev = Math.sqrt(variance);

    // Coefficient of variation
    const cv = stdDev / mean;

    // Uniform: low CV (0.1-0.3)
    // Gaussian: medium CV (0.3-0.6)
    // Poisson: high CV (~1.0)

    if (cv < 0.3) return 'uniform';
    if (cv < 0.7) return 'gaussian';
    return 'poisson';
  }

  /**
   * Get events for SNN training
   */
  getEventsForSNN(limit: number = 1000): SpikeEvent[] {
    try {
      const lines = readFileSync(SPIKE_FILE, 'utf-8').trim().split('\n');
      return lines.slice(-limit).map(line => JSON.parse(line));
    } catch {
      return [];
    }
  }

  /**
   * Export to Brian2-compatible format
   */
  exportForBrian2(): {
    spike_times: number[];
    neuron_ids: number[];
    labels: string[];
  } {
    const events = this.getEventsForSNN();

    // Map IPs to neuron IDs
    const ipToNeuron = new Map<string, number>();
    let nextNeuronId = 0;

    const spike_times: number[] = [];
    const neuron_ids: number[] = [];
    const labels: string[] = [];

    for (const e of events) {
      if (!ipToNeuron.has(e.source_ip)) {
        ipToNeuron.set(e.source_ip, nextNeuronId++);
      }

      spike_times.push(e.timestamp);
      neuron_ids.push(ipToNeuron.get(e.source_ip)!);
      labels.push(e.suspected_family || 'unknown');
    }

    return { spike_times, neuron_ids, labels };
  }

  /**
   * Get current telemetry summary
   */
  getTelemetry(): TelemetrySummary | null {
    try {
      const data = readFileSync(TELEMETRY_FILE, 'utf-8');
      return JSON.parse(data);
    } catch {
      return null;
    }
  }
}

// === EXPORT ========================================================

export { SpikeLogger, SpikeEvent, TelemetrySummary };
