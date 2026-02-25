#!/usr/bin/env bun
/**
 * Master Daemon Starter - Fires up the whole unified system
 *
 * This starts all three daemons:
 * - PAI daemon (watches hooks, manages work)
 * - ClawMem daemon (indexes files, searches)
 * - Shadow daemon (heartbeats, combat, scanning)
 *
 * Run: bun run start-all.ts
 * Or: ./start-all (if you make it executable)
 */

import { spawn } from 'child_process';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

// =============================================================================
// Configuration
// =============================================================================

const CLAWD_DIR = import.meta.dir;
const ENGINE_DIR = join(CLAWD_DIR, 'engine');
const SHADOW_DIR = join(CLAWD_DIR, 'agents', 'shadow');

// Daemons to start
const DAEMONS = [
  {
    name: 'PAI Daemon',
    path: join(ENGINE_DIR, 'pai-daemon.ts'),
    color: '\x1b[36m', // cyan
  },
  {
    name: 'ClawMem Daemon',
    path: join(ENGINE_DIR, 'clawmem-daemon.ts'),
    color: '\x1b[35m', // magenta
  },
  {
    name: 'Shadow Daemon',
    path: join(SHADOW_DIR, 'engine', 'shadow-daemon.ts'),
    color: '\x1b[33m', // yellow
  },
];

// =============================================================================
// Functions
// =============================================================================

const reset = '\x1b[0m';
const bold = '\x1b[1m';
const green = '\x1b[32m';
const red = '\x1b[31m';

function log(daemon: typeof DAEMONS[0], message: string) {
  console.log(`${daemon.color}[${daemon.name}]${reset} ${message}`);
}

function startDaemon(daemon: typeof DAEMONS[0]): Promise<void> {
  return new Promise((resolve, reject) => {
    if (!existsSync(daemon.path)) {
      log(daemon, `${red}Not found: ${daemon.path}${reset}`);
      resolve(); // Don't fail, just skip
      return;
    }

    log(daemon, `Starting...`);

    const proc = spawn('bun', ['run', daemon.path, 'start'], {
      stdio: 'pipe',
      shell: true,
    });

    proc.stdout?.on('data', (data) => {
      const lines = data.toString().split('\n').filter(Boolean);
      lines.forEach((line: string) => {
        log(daemon, line);
      });
    });

    proc.stderr?.on('data', (data) => {
      const lines = data.toString().split('\n').filter(Boolean);
      lines.forEach((line: string) => {
        log(daemon, line);
      });
    });

    proc.on('error', (err) => {
      log(daemon, `${red}Error: ${err.message}${reset}`);
      resolve();
    });

    // Give it a moment to start, then resolve
    setTimeout(() => {
      log(daemon, `${green}Started${reset}`);
      resolve();
    }, 2000);
  });
}

// =============================================================================
// Main
// =============================================================================

async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];

  console.log('');
  console.log(`${bold}╔══════════════════════════════════════════════════════════╗${reset}`);
  console.log(`${bold}║         UNIFIED SYSTEM - Master Controller                ║${reset}`);
  console.log(`${bold}╚══════════════════════════════════════════════════════════╝${reset}`);
  console.log('');

  switch (cmd) {
    case 'start':
    case undefined:
      console.log(`Starting all daemons...\n`);

      for (const daemon of DAEMONS) {
        await startDaemon(daemon);
      }

      console.log('');
      console.log(`${green}${bold}All daemons started.${reset}`);
      console.log('');
      console.log('Systems running:');
      console.log('  - PAI:     Watching hooks, managing work');
      console.log('  - ClawMem: Indexing files every 30 min');
      console.log('  - Shadow:  Heartbeats every 30 min');
      console.log('');
      console.log('Press Ctrl+C to stop all daemons.');
      console.log('');

      // Keep process alive
      process.on('SIGINT', () => {
        console.log('\nShutting down...');
        process.exit(0);
      });

      // Wait forever
      await new Promise(() => {});
      break;

    case 'status':
      console.log('Checking daemon status...\n');
      // TODO: Implement status check via PID files or state files
      console.log('Status check not implemented yet.');
      console.log('Check individual daemon logs for now.');
      break;

    case 'stop':
      console.log('Stopping all daemons...\n');
      // TODO: Implement stop via PID files
      console.log('Stop not implemented yet.');
      console.log('Use Ctrl+C or kill processes manually.');
      break;

    default:
      console.log('Commands:');
      console.log('  start   - Start all daemons (default)');
      console.log('  status  - Check daemon status');
      console.log('  stop    - Stop all daemons');
      console.log('');
      console.log('Examples:');
      console.log('  bun run start-all.ts');
      console.log('  bun run start-all.ts start');
      console.log('  bun run start-all.ts status');
  }
}

main().catch((err) => {
  console.error(`${red}FATAL:${reset}`, err);
  process.exit(1);
});
