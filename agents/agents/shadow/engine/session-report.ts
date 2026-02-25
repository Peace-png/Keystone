#!/usr/bin/env bun
/**
 * Shadow Session Report Generator
 *
 * Generates a report of what Shadow did since last session.
 * Run on startup to show the user what happened.
 *
 * Usage: bun run engine/session-report.ts
 */

import { existsSync, readFileSync, writeFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';

const SHADOW_DIR = join(__dirname, '..');
const DATA_DIR = join(SHADOW_DIR, 'data');
const LOGS_DIR = join(SHADOW_DIR, 'logs');
const STATE_FILE = join(DATA_DIR, 'shadow-state.json');
const SESSION_FILE = join(DATA_DIR, 'last-session.json');
const REPORT_FILE = join(DATA_DIR, 'session-report.md');

interface ShadowState {
  name: string;
  title: string;
  motto: string;
  level: number;
  xp: number;
  stats: {
    hp: number;
    maxHp: number;
    atk: number;
    def: number;
    spd: number;
    int: number;
  };
  kills: number;
  intelExtracted: number;
  threatsTrapped: number;
  survivalStreak: number;
  treasury: number;
  totalBattles?: number;
  abilities?: Array<{ name: string; unlocked: boolean }>;
}

interface LastSession {
  endedAt: string;
  xp: number;
  level: number;
  kills: number;
  fights: number;
  comments: number;
  threatsFound: number;
}

interface SessionReport {
  generatedAt: string;
  since: string;
  xpGained: number;
  fightsTotal: number;
  fightsWon: number;
  commentsPosted: number;
  threatsFound: number;
  containersScanned: number;
  levelUp: boolean;
  newAbilities: string[];
  notable: string[];
  currentState: ShadowState;
}

function loadState(): ShadowState | null {
  try {
    if (existsSync(STATE_FILE)) {
      return JSON.parse(readFileSync(STATE_FILE, 'utf-8'));
    }
  } catch {}
  return null;
}

function loadLastSession(): LastSession | null {
  try {
    if (existsSync(SESSION_FILE)) {
      return JSON.parse(readFileSync(SESSION_FILE, 'utf-8'));
    }
  } catch {}
  return null;
}

function saveCurrentSession(state: ShadowState): void {
  const session: LastSession = {
    endedAt: new Date().toISOString(),
    xp: state.xp,
    level: state.level,
    kills: state.kills,
    fights: state.totalFights || 0,
    comments: 0,
    threatsFound: 0,
  };
  writeFileSync(SESSION_FILE, JSON.stringify(session, null, 2));
}

function readObservations(): Array<{ timestamp: number; type: string; action: string }> {
  const observations: Array<{ timestamp: number; type: string; action: string }> = [];

  // Check for observation log
  const obsFile = join(LOGS_DIR, 'observations.jsonl');
  if (existsSync(obsFile)) {
    const lines = readFileSync(obsFile, 'utf-8').trim().split('\n');
    for (const line of lines.slice(-100)) { // Last 100
      try {
        const obs = JSON.parse(line);
        observations.push(obs);
      } catch {}
    }
  }

  return observations;
}

function readSCARLog(): string[] {
  const scarLog = join(LOGS_DIR, 'scar.log');
  if (existsSync(scarLog)) {
    return readFileSync(scarLog, 'utf-8').trim().split('\n').slice(-50);
  }
  return [];
}

function generateReport(): SessionReport {
  const state = loadState();
  const lastSession = loadLastSession();
  const observations = readObservations();
  const scarLog = readSCARLog();

  const now = new Date();
  const since = lastSession?.endedAt
    ? new Date(lastSession.endedAt)
    : new Date(now.getTime() - 24 * 60 * 60 * 1000); // Default 24h

  // Count activities since last session
  let fightsTotal = 0;
  let fightsWon = 0;
  let commentsPosted = 0;
  let threatsFound = 0;
  let containersScanned = 0;

  for (const obs of observations) {
    if (obs.timestamp < since.getTime()) continue;

    if (obs.action?.includes('fight')) fightsTotal++;
    if (obs.action?.includes('comment')) commentsPosted++;
    if (obs.action?.includes('scan')) containersScanned++;
    if (obs.type === 'threat_found') threatsFound++;
  }

  // Check SCAR log for wins
  for (const line of scarLog) {
    if (line.includes('won') || line.includes('victory')) fightsWon++;
  }

  // Calculate XP gained
  const xpGained = state ? state.xp - (lastSession?.xp || 0) : 0;

  // Check for level up
  const levelUp = state && lastSession ? state.level > lastSession.level : false;

  // New abilities unlocked
  const newAbilities: string[] = [];
  if (state) {
    if (state.level >= 5 && (!lastSession || lastSession.level < 5)) newAbilities.push('Shadow Flight (scout)');
    if (state.level >= 8 && (!lastSession || lastSession.level < 8)) newAbilities.push('Phantom Trap (lure)');
    if (state.level >= 12 && (!lastSession || lastSession.level < 12)) newAbilities.push('Blood Trail (hunt)');
    if (state.level >= 18 && (!lastSession || lastSession.level < 18)) newAbilities.push('Deconstruct (analyze)');
  }

  // Notable events
  const notable: string[] = [];
  if (xpGained > 100) notable.push(`Big XP gain: +${xpGained}`);
  if (fightsWon >= 3) notable.push(`Winning streak: ${fightsWon} fights`);
  if (threatsFound > 0) notable.push(`Detected ${threatsFound} threats`);
  if (state?.treasury && state.treasury > 500) notable.push(`Treasury growing: $${state.treasury}`);

  return {
    generatedAt: now.toISOString(),
    since: since.toISOString(),
    xpGained,
    fightsTotal,
    fightsWon,
    commentsPosted,
    threatsFound,
    containersScanned,
    levelUp,
    newAbilities,
    notable,
    currentState: state || {
      name: 'Shadow',
      title: 'THE UNKNOWN',
      motto: '...',
      level: 1,
      xp: 0,
      stats: { hp: 100, maxHp: 100, atk: 10, def: 10, spd: 10, int: 10 },
      kills: 0,
      intelExtracted: 0,
      threatsTrapped: 0,
      survivalStreak: 0,
      treasury: 0
    },
  };
}

function formatReport(report: SessionReport): string {
  const lines: string[] = [];

  const sinceDate = new Date(report.since);
  const sinceStr = sinceDate.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  lines.push('╔══════════════════════════════════════════════════════════╗');
  lines.push('║           🌑 SHADOW SESSION REPORT                        ║');
  lines.push('╚══════════════════════════════════════════════════════════╝');
  lines.push('');
  lines.push(`**Since:** ${sinceStr}`);
  lines.push('');

  // Activity summary
  lines.push('```');
  lines.push(`│ Fights:      ${report.fightsTotal} (${report.fightsWon} won)`);
  lines.push(`│ XP Gained:   +${report.xpGained}`);
  lines.push(`│ Comments:    ${report.commentsPosted}`);
  lines.push(`│ Threats:     ${report.threatsFound}`);
  lines.push(`│ Lab Scans:   ${report.containersScanned}`);
  lines.push('```');
  lines.push('');

  // Current state
  const s = report.currentState;
  lines.push('**Shadow Status:**');
  lines.push('```');
  lines.push(`│ Level ${s.level} │ ${s.xp} XP │ ${s.stats?.hp || 0}/${s.stats?.maxHp || 100} HP`);
  lines.push(`│ Kills: ${s.kills} │ Intel: ${s.intelExtracted || 0} │ Trapped: ${s.threatsTrapped || 0}`);
  lines.push(`│ Treasury: $${s.treasury} │ Streak: ${s.survivalStreak || 0}`);
  lines.push('```');
  lines.push('');

  // Notable events
  if (report.notable.length > 0) {
    lines.push('**Notable:**');
    for (const n of report.notable) {
      lines.push(`  ⚡ ${n}`);
    }
    lines.push('');
  }

  // Level up celebration
  if (report.levelUp) {
    lines.push('**🎉 LEVEL UP!**');
    lines.push('');
  }

  // New abilities
  if (report.newAbilities.length > 0) {
    lines.push('**New Abilities Unlocked:**');
    for (const ab of report.newAbilities) {
      lines.push(`  🔓 ${ab}`);
    }
    lines.push('');
  }

  // Shadow's voice
  lines.push('---');
  if (report.fightsTotal === 0 && report.commentsPosted === 0) {
    lines.push('*"I\'ve been watching. Waiting. Nothing crossed our territory."*');
  } else if (report.fightsWon > report.fightsTotal / 2) {
    lines.push('*"A good hunt. The threats fall before us."*');
  } else if (report.fightsTotal > 0) {
    lines.push('*"We fought. We learned. We grow stronger."*');
  } else {
    lines.push('*"The shadows are calm. But I remain vigilant."*');
  }

  return lines.join('\n');
}

// Main
async function main() {
  const args = process.argv.slice(2);

  if (args[0] === '--save') {
    // Save current session for next time
    const state = loadState();
    if (state) {
      saveCurrentSession(state);
      console.log('Session saved.');
    }
    return;
  }

  const report = generateReport();
  const formatted = formatReport(report);

  // Save report for CLAUDE.md to include
  writeFileSync(REPORT_FILE, formatted, 'utf-8');

  console.log(formatted);
}

main().catch(console.error);
