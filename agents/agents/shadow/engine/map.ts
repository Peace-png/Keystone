#!/usr/bin/env bun
/**
 * THE MAP - Where scouts can go
 *
 * Whitelist system. If it's not on the map, you can't go there.
 * Keeps Shadow legal and ethical.
 */

import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { scarLog } from './scar';

// === PATHS =========================================================

const SOUL_DIR = join(__dirname, '..', 'soul');
const MAP_FILE = join(SOUL_DIR, 'intel', 'map.json');

// === TYPES =========================================================

interface AllowedRange {
  cidr: string;
  name: string;
  type: 'lab' | 'honeypot' | 'public' | 'research';
  added: string;
  notes: string;
}

interface AllowedHost {
  ip: string;
  name: string;
  type: 'local' | 'cloud' | 'honeypot';
  added: string;
  notes: string;
}

interface AllowedDomain {
  domain: string;
  name: string;
  type: 'honeypot' | 'research';
  added: string;
  notes: string;
}

interface MapConfig {
  version: string;
  lastUpdated: string;
  description: string;
  allowed: {
    ranges: AllowedRange[];
    hosts: AllowedHost[];
    domains: AllowedDomain[];
  };
  forbidden: {
    description: string;
    ranges: string[];
    keywords: string[];
  };
  rules: {
    defaultAction: 'deny' | 'allow';
    requireConfirmation: boolean;
    logAllAttempts: boolean;
  };
}

// === MAP MANAGER ===================================================

class MapManager {
  private config: MapConfig;

  constructor() {
    this.load();
  }

  private load(): void {
    try {
      const data = readFileSync(MAP_FILE, 'utf-8');
      this.config = JSON.parse(data);
    } catch {
      // Create default map
      this.config = this.getDefaultMap();
      this.save();
    }
  }

  private getDefaultMap(): MapConfig {
    return {
      version: '1.0',
      lastUpdated: new Date().toISOString(),
      description: 'THE MAP - Where Shadow\'s scouts can go',
      allowed: {
        ranges: [
          {
            cidr: '172.17.0.0/16',
            name: 'Local Docker Lab',
            type: 'lab',
            added: new Date().toISOString().split('T')[0],
            notes: 'Default local testing'
          }
        ],
        hosts: [],
        domains: []
      },
      forbidden: {
        description: 'Always blocked, even if in allowed range',
        ranges: [],
        keywords: ['bank', 'gov', 'military', 'hospital', 'healthcare', 'critical', 'infrastructure']
      },
      rules: {
        defaultAction: 'deny',
        requireConfirmation: true,
        logAllAttempts: true
      }
    };
  }

  private save(): void {
    this.config.lastUpdated = new Date().toISOString();
    writeFileSync(MAP_FILE, JSON.stringify(this.config, null, 2));
  }

  /**
   * Check if an IP is on the map (allowed to visit)
   */
  canVisit(ip: string): { allowed: boolean; reason: string } {
    // First check forbidden keywords (for hostnames if we have them)
    const lowerIP = ip.toLowerCase();
    for (const keyword of this.config.forbidden.keywords) {
      if (lowerIP.includes(keyword)) {
        this.logAttempt(ip, false, `Forbidden keyword: ${keyword}`);
        return { allowed: false, reason: `Forbidden: contains "${keyword}"` };
      }
    }

    // Check exact host matches
    for (const host of this.config.allowed.hosts) {
      if (host.ip === ip) {
        this.logAttempt(ip, true, `Matched host: ${host.name}`);
        return { allowed: true, reason: `Allowed: ${host.name}` };
      }
    }

    // Check CIDR ranges
    for (const range of this.config.allowed.ranges) {
      if (this.ipInCIDR(ip, range.cidr)) {
        this.logAttempt(ip, true, `Matched range: ${range.name}`);
        return { allowed: true, reason: `Allowed: ${range.name}` };
      }
    }

    // Default deny
    this.logAttempt(ip, false, 'Not on map');
    return { allowed: false, reason: 'Not on the map - access denied' };
  }

  /**
   * Check if IP is in CIDR range
   */
  private ipInCIDR(ip: string, cidr: string): boolean {
    try {
      const [range, bits] = cidr.split('/');
      const mask = parseInt(bits);

      // Convert IPs to numbers
      const ipNum = this.ipToNumber(ip);
      const rangeNum = this.ipToNumber(range);

      if (ipNum === null || rangeNum === null) return false;

      // Calculate network mask
      const networkMask = (0xFFFFFFFF << (32 - mask)) >>> 0;

      return (ipNum & networkMask) === (rangeNum & networkMask);
    } catch {
      return false;
    }
  }

  /**
   * Convert IP string to number
   */
  private ipToNumber(ip: string): number | null {
    try {
      const parts = ip.split('.').map(Number);
      if (parts.length !== 4) return null;
      return (parts[0] << 24) + (parts[1] << 16) + (parts[2] << 8) + parts[3];
    } catch {
      return null;
    }
  }

  /**
   * Log access attempt
   */
  private logAttempt(target: string, allowed: boolean, reason: string): void {
    if (this.config.rules.logAllAttempts) {
      const status = allowed ? '✅' : '❌';
      scarLog(`[MAP] ${status} ${target} - ${reason}`);
    }
  }

  /**
   * Add a new allowed range
   */
  addRange(cidr: string, name: string, type: AllowedRange['type'], notes: string = ''): void {
    // Check for forbidden keywords in name
    for (const keyword of this.config.forbidden.keywords) {
      if (name.toLowerCase().includes(keyword)) {
        scarLog(`[MAP] ❌ Cannot add "${name}" - forbidden keyword: ${keyword}`);
        return;
      }
    }

    this.config.allowed.ranges.push({
      cidr,
      name,
      type,
      added: new Date().toISOString().split('T')[0],
      notes
    });
    this.save();
    scarLog(`[MAP] ✅ Added range: ${name} (${cidr})`);
  }

  /**
   * Add a new allowed host
   */
  addHost(ip: string, name: string, type: AllowedHost['type'], notes: string = ''): void {
    // Check for forbidden keywords
    for (const keyword of this.config.forbidden.keywords) {
      if (name.toLowerCase().includes(keyword) || ip.toLowerCase().includes(keyword)) {
        scarLog(`[MAP] ❌ Cannot add "${name}" - forbidden keyword: ${keyword}`);
        return;
      }
    }

    this.config.allowed.hosts.push({
      ip,
      name,
      type,
      added: new Date().toISOString().split('T')[0],
      notes
    });
    this.save();
    scarLog(`[MAP] ✅ Added host: ${name} (${ip})`);
  }

  /**
   * Add a new allowed domain
   */
  addDomain(domain: string, name: string, type: AllowedDomain['type'], notes: string = ''): void {
    // Check for forbidden keywords
    for (const keyword of this.config.forbidden.keywords) {
      if (domain.toLowerCase().includes(keyword) || name.toLowerCase().includes(keyword)) {
        scarLog(`[MAP] ❌ Cannot add "${domain}" - forbidden keyword: ${keyword}`);
        return;
      }
    }

    this.config.allowed.domains.push({
      domain,
      name,
      type,
      added: new Date().toISOString().split('T')[0],
      notes
    });
    this.save();
    scarLog(`[MAP] ✅ Added domain: ${name} (${domain})`);
  }

  /**
   * Add a forbidden keyword
   */
  addForbiddenKeyword(keyword: string): void {
    if (!this.config.forbidden.keywords.includes(keyword.toLowerCase())) {
      this.config.forbidden.keywords.push(keyword.toLowerCase());
      this.save();
      scarLog(`[MAP] 🚫 Added forbidden keyword: ${keyword}`);
    }
  }

  /**
   * Show the current map
   */
  showMap(): void {
    scarLog('\n╔══════════════════════════════════════════════════════════╗');
    scarLog('║                      THE MAP                             ║');
    scarLog('╚══════════════════════════════════════════════════════════╝');
    scarLog('');

    scarLog('ALLOWED RANGES:');
    if (this.config.allowed.ranges.length === 0) {
      scarLog('  (none)');
    } else {
      for (const r of this.config.allowed.ranges) {
        scarLog(`  ✅ ${r.cidr} - ${r.name} [${r.type}]`);
      }
    }

    scarLog('');
    scarLog('ALLOWED HOSTS:');
    if (this.config.allowed.hosts.length === 0) {
      scarLog('  (none)');
    } else {
      for (const h of this.config.allowed.hosts) {
        scarLog(`  ✅ ${h.ip} - ${h.name} [${h.type}]`);
      }
    }

    scarLog('');
    scarLog('ALLOWED DOMAINS:');
    if (this.config.allowed.domains.length === 0) {
      scarLog('  (none)');
    } else {
      for (const d of this.config.allowed.domains) {
        scarLog(`  ✅ ${d.domain} - ${d.name} [${d.type}]`);
      }
    }

    scarLog('');
    scarLog('FORBIDDEN KEYWORDS:');
    scarLog(`  🚫 ${this.config.forbidden.keywords.join(', ')}`);

    scarLog('');
    scarLog(`Default: ${this.config.rules.defaultAction.toUpperCase()}`);
    scarLog(`Last updated: ${this.config.lastUpdated}`);
  }

  /**
   * Get all allowed IPs (for scanning)
   */
  getAllowedTargets(): string[] {
    const targets: string[] = [];

    // Add all host IPs
    for (const host of this.config.allowed.hosts) {
      targets.push(host.ip);
    }

    // For ranges, we could expand them, but for now just note they exist
    // In practice, you'd want to scan specific hosts within ranges

    return targets;
  }

  /**
   * Get allowed ranges
   */
  getAllowedRanges(): AllowedRange[] {
    return this.config.allowed.ranges;
  }
}

// === EXPORT ========================================================

export { MapManager, MapConfig, AllowedRange, AllowedHost, AllowedDomain };
