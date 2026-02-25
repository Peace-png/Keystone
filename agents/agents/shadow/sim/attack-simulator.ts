#!/usr/bin/env bun
/**
 * ATTACK SIMULATOR - Generates realistic attack traffic for Shadow Fort
 *
 * Usage: bun run sim/attack-simulator.ts --duration=120 --intensity=medium
 *
 * Duration: minutes (default: 120 = 2 hours)
 * Intensity: low, medium, high, apocalyptic
 */

import { spawn } from 'child_process';

const DURATION_MINUTES = parseInt(process.argv.find(a => a.startsWith('--duration='))?.split('=')[1] || '120');
const INTENSITY = process.argv.find(a => a.startsWith('--intensity='))?.split('=')[1] || 'medium';

// Attack configuration
const INTENSITY_SETTINGS = {
  low: { attacksPerMinute: 2, burstChance: 0.1 },
  medium: { attacksPerMinute: 5, burstChance: 0.2 },
  high: { attacksPerMinute: 15, burstChance: 0.3 },
  apocalyptic: { attacksPerMinute: 50, burstChance: 0.5 },
};

// Attacker profiles (realistic bot/scanner behavior)
const ATTACKER_PROFILES = [
  // SSH Brute Force Bots
  {
    name: 'ssh_brute_force',
    type: 'ssh',
    ports: [22, 2222],
    credentials: [
      ['root', 'root'],
      ['root', 'password'],
      ['root', 'admin'],
      ['admin', 'admin'],
      ['admin', '123456'],
      ['test', 'test'],
      ['user', 'user'],
      ['ubuntu', 'ubuntu'],
      ['pi', 'raspberry'],
      ['oracle', 'oracle'],
    ],
    commands: ['whoami', 'id', 'uname -a', 'cat /etc/passwd', 'ls -la'],
  },

  // SMB Scanners ( EternalBlue wannabes)
  {
    name: 'smb_scanner',
    type: 'smb',
    ports: [445, 139],
    payloads: ['SMBv1 negotiate', 'trans2 probe', 'NTLM auth attempt'],
  },

  // Telnet Botnet
  {
    name: 'telnet_botnet',
    type: 'telnet',
    ports: [23, 2323],
    credentials: [
      ['admin', 'admin'],
      ['root', 'xc3511'],
      ['root', 'vizxv'],
      ['admin', 'admin123'],
      ['root', 'default'],
    ],
    commands: ['busybox', 'cat /proc/cpuinfo', 'echo "owned"'],
  },

  // HTTP/WordPress Scanners
  {
    name: 'http_scanner',
    type: 'http',
    ports: [80, 443, 8080],
    paths: [
      '/wp-login.php',
      '/admin',
      '/phpmyadmin',
      '/.env',
      '/config.php',
      '/backup.sql',
      '/wp-config.php.bak',
      '/.git/config',
    ],
  },

  // Port Scanners
  {
    name: 'port_scanner',
    type: 'scan',
    ports: [21, 22, 23, 25, 80, 110, 143, 443, 445, 993, 995, 1433, 3306, 3389, 5432, 8080],
  },
];

// Generate random IP (simulating different attackers)
function randomIP(): string {
  // Mix of known scanner IPs + random
  const knownScanners = [
    '45.33.32.',   // Shodan-adjacent
    '185.220.101.', // Tor exit nodes
    '192.241.',    // DigitalOcean scanners
    '167.99.',     // DO scanners
    '159.65.',     // DO scanners
    '178.128.',    // DO scanners
  ];

  if (Math.random() < 0.3) {
    // Known scanner range
    const base = knownScanners[Math.floor(Math.random() * knownScanners.length)];
    return base + Math.floor(Math.random() * 256);
  } else {
    // Random IP
    return `${Math.floor(Math.random() * 223) + 1}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}.${Math.floor(Math.random() * 256)}`;
  }
}

// Generate realistic timestamp
function timestamp(): string {
  return new Date().toISOString();
}

// Simulate an attack
function simulateAttack(logFile: string): string {
  const profile = ATTACKER_PROFILES[Math.floor(Math.random() * ATTACKER_PROFILES.length)];
  const ip = randomIP();
  const port = profile.ports[Math.floor(Math.random() * profile.ports.length)];

  let attackLog = '';

  switch (profile.type) {
    case 'ssh':
    case 'telnet':
      const cred = profile.credentials![Math.floor(Math.random() * profile.credentials!.length)];
      attackLog = `[${timestamp()}] ${profile.name.toUpperCase()} | ${ip}:${port} | CRED: ${cred[0]}/${cred[1]}`;
      if (Math.random() < 0.4) {
        const cmd = profile.commands![Math.floor(Math.random() * profile.commands!.length)];
        attackLog += ` | CMD: ${cmd}`;
      }
      break;

    case 'smb':
      const payload = profile.payloads![Math.floor(Math.random() * profile.payloads!.length)];
      attackLog = `[${timestamp()}] ${profile.name.toUpperCase()} | ${ip}:${port} | ${payload}`;
      break;

    case 'http':
      const path = profile.paths![Math.floor(Math.random() * profile.paths!.length)];
      attackLog = `[${timestamp()}] ${profile.name.toUpperCase()} | ${ip}:${port} | GET ${path}`;
      break;

    case 'scan':
      attackLog = `[${timestamp()}] ${profile.name.toUpperCase()} | ${ip} → port ${port} | SYN`;
      break;
  }

  return attackLog;
}

// Main simulation loop
async function runSimulation() {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  SHADOW FORT - ATTACK SIMULATOR                                ║');
  console.log('╠═══════════════════════════════════════════════════════════════╣');
  console.log(`║  Duration: ${DURATION_MINUTES} minutes                                        ║`);
  console.log(`║  Intensity: ${INTENSITY.toUpperCase()}                                          ║`);
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log('');

  const settings = INTENSITY_SETTINGS[INTENSITY as keyof typeof INTENSITY_SETTINGS];
  const totalAttacks = DURATION_MINUTES * settings.attacksPerMinute;
  const intervalMs = (DURATION_MINUTES * 60 * 1000) / totalAttacks;

  console.log(`Expected attacks: ~${totalAttacks}`);
  console.log(`Interval: ~${Math.round(intervalMs / 1000)}s between attacks`);
  console.log('');
  console.log('Starting simulation...');
  console.log('─'.repeat(70));

  let attackCount = 0;
  const startTime = Date.now();
  const endTime = startTime + (DURATION_MINUTES * 60 * 1000);

  while (Date.now() < endTime) {
    // Check for burst
    const isBurst = Math.random() < settings.burstChance;
    const burstCount = isBurst ? Math.floor(Math.random() * 10) + 5 : 1;

    for (let i = 0; i < burstCount; i++) {
      attackCount++;
      const attack = simulateAttack('sim/attack-stream.log');
      console.log(attack);

      // Write to log file
      await Bun.write('sim/attack-stream.log', attack + '\n', { createPath: true });
    }

    // Wait for next attack
    await new Promise(r => setTimeout(r, intervalMs / (isBurst ? burstCount : 1)));

    // Progress update every minute
    if (attackCount % settings.attacksPerMinute === 0) {
      const elapsed = Math.round((Date.now() - startTime) / 60000);
      const remaining = DURATION_MINUTES - elapsed;
      console.log(`─ [${elapsed}m elapsed, ${remaining}m remaining, ${attackCount} attacks] ─`);
    }
  }

  console.log('─'.repeat(70));
  console.log('');
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  SIMULATION COMPLETE                                           ║');
  console.log('╠═══════════════════════════════════════════════════════════════╣');
  console.log(`║  Total attacks: ${attackCount}                                          ║`);
  console.log(`║  Duration: ${DURATION_MINUTES} minutes                                       ║`);
  console.log('║  Log: sim/attack-stream.log                                    ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
}

// Run if called directly
runSimulation().catch(console.error);
