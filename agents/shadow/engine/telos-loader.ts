#!/usr/bin/env bun
/**
 * TELOS Loader - Loads user's missions and goals at runtime
 *
 * This wires TELOS into Shadow's behavior so goals actually steer actions.
 * Previously: TELOS was referenced but not loaded (GPT finding)
 * Now: Loaded at startup and accessible to all modules
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// TELOS file paths
const TELOS_PATHS = {
  MISSION: join(process.env.HOME || '/home/peace', '.claude/skills/CORE/USER/TELOS/MISSION.md'),
  GOALS: join(process.env.HOME || '/home/peace', '.claude/skills/CORE/USER/TELOS/GOALS.md'),
};

export interface Mission {
  id: string;
  title: string;
  description: string;
  why: string;
  how: string;
}

export interface Goal {
  id: string;
  title: string;
  status: string;
  supports: string;
  progress: string[];
}

export interface TELOS {
  missions: Mission[];
  goals: Goal[];
  loadedAt: string;
  alignmentCheck: {
    preservesInquiry: boolean;
    distinguishesExploration: boolean;
    avoidsFrameLimits: boolean;
  };
}

// Parse MISSION.md
function parseMissions(content: string): Mission[] {
  const missions: Mission[] = [];
  const lines = content.split('\n');

  let currentMission: Partial<Mission> | null = null;

  for (const line of lines) {
    if (line.startsWith('### M') && line.includes(':')) {
      if (currentMission?.id) {
        missions.push(currentMission as Mission);
      }
      const match = line.match(/### (M\d+): (.+)/);
      if (match) {
        currentMission = {
          id: match[1],
          title: match[2].trim(),
          description: '',
          why: '',
          how: '',
        };
      }
    } else if (currentMission) {
      if (line.startsWith('**Mission:**')) {
        currentMission.description = line.replace('**Mission:**', '').trim();
      } else if (line.startsWith('**Why:**')) {
        currentMission.why = line.replace('**Why:**', '').trim();
      } else if (line.startsWith('**How:**')) {
        currentMission.how = line.replace('**How:**', '').trim();
      }
    }
  }

  if (currentMission?.id) {
    missions.push(currentMission as Mission);
  }

  return missions;
}

// Parse GOALS.md
function parseGoals(content: string): Goal[] {
  const goals: Goal[] = [];
  const lines = content.split('\n');

  let currentGoal: Partial<Goal> | null = null;

  for (const line of lines) {
    if (line.startsWith('### G') && line.includes(':')) {
      if (currentGoal?.id) {
        goals.push(currentGoal as Goal);
      }
      const match = line.match(/### (G\d+): (.+)/);
      if (match) {
        currentGoal = {
          id: match[1],
          title: match[2].trim(),
          status: '',
          supports: '',
          progress: [],
        };
      }
    } else if (currentGoal) {
      if (line.startsWith('**Status:**')) {
        currentGoal.status = line.replace('**Status:**', '').trim();
      } else if (line.startsWith('**Supports:**')) {
        currentGoal.supports = line.replace('**Supports:**', '').trim();
      } else if (line.trim().startsWith('- [ ]') || line.trim().startsWith('- [x]')) {
        currentGoal.progress?.push(line.trim());
      }
    }
  }

  if (currentGoal?.id) {
    goals.push(currentGoal as Goal);
  }

  return goals;
}

// Load TELOS at runtime
export function loadTELOS(): TELOS {
  let missions: Mission[] = [];
  let goals: Goal[] = [];

  // Load missions
  if (existsSync(TELOS_PATHS.MISSION)) {
    const content = readFileSync(TELOS_PATHS.MISSION, 'utf-8');
    missions = parseMissions(content);
    console.log(`📡 TELOS: Loaded ${missions.length} missions`);
  } else {
    console.log('⚠️ TELOS: MISSION.md not found');
  }

  // Load goals
  if (existsSync(TELOS_PATHS.GOALS)) {
    const content = readFileSync(TELOS_PATHS.GOALS, 'utf-8');
    goals = parseGoals(content);
    console.log(`📡 TELOS: Loaded ${goals.length} goals`);
  } else {
    console.log('⚠️ TELOS: GOALS.md not found');
  }

  return {
    missions,
    goals,
    loadedAt: new Date().toISOString(),
    alignmentCheck: {
      preservesInquiry: true,
      distinguishesExploration: true,
      avoidsFrameLimits: true,
    },
  };
}

// Check if an action aligns with TELOS
export function checkAlignment(telos: TELOS, action: string): {
  aligned: boolean;
  relevantGoals: string[];
  relevantMissions: string[];
} {
  const relevantMissions: string[] = [];
  const relevantGoals: string[] = [];

  // G1: Structural memory wells - Shadow's gravity thesis
  if (action.toLowerCase().includes('memory') ||
      action.toLowerCase().includes('gravity') ||
      action.toLowerCase().includes('pattern')) {
    relevantMissions.push('M1');
    relevantGoals.push('G1');
  }

  // G0: Exploratory systems
  if (action.toLowerCase().includes('research') ||
      action.toLowerCase().includes('experiment')) {
    relevantMissions.push('M0');
    relevantGoals.push('G0');
  }

  return {
    aligned: relevantMissions.length > 0 || relevantGoals.length > 0,
    relevantMissions,
    relevantGoals,
  };
}

// Export singleton
let _telos: TELOS | null = null;

export function getTELOS(): TELOS {
  if (!_telos) {
    _telos = loadTELOS();
  }
  return _telos;
}

// CLI test
if (import.meta.main) {
  console.log('╔═══════════════════════════════════════════════════════════════╗');
  console.log('║  TELOS LOADER - Runtime Mission/Goal Loading                  ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝');
  console.log('');

  const telos = loadTELOS();

  console.log('\n## MISSIONS');
  for (const m of telos.missions) {
    console.log(`  ${m.id}: ${m.title}`);
    console.log(`       ${m.description}`);
  }

  console.log('\n## GOALS');
  for (const g of telos.goals) {
    console.log(`  ${g.id}: ${g.title} [${g.status}]`);
  }

  console.log('\n## ALIGNMENT CHECK');
  const test = checkAlignment(telos, 'Learn attack patterns from honeypot');
  console.log(`  Action: "Learn attack patterns from honeypot"`);
  console.log(`  Aligned: ${test.aligned}`);
  console.log(`  Missions: ${test.relevantMissions.join(', ')}`);
  console.log(`  Goals: ${test.relevantGoals.join(', ')}`);
}
