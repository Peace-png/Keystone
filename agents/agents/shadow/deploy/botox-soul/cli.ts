#!/usr/bin/env bun
// ============================================================
// BOTOX SOUL - CLI Entry Point
// The Teacher's Interface to the Student
// ============================================================
//
// Usage:
//   bun run cli.ts create "What happened" "Why it matters" "The feeling"
//   bun run cli.ts list
//   bun run cli.ts daemon
//   bun run cli.ts sync
//   bun run cli.ts status
//
// ============================================================

import { ExperienceProcessor } from './experience-processor';
import { startDaemon, runIteration, state } from './background-loop';
import { fullSync, checkSyncStatus, loadSyncConfig } from './sync';
import { compressExperience, measureCompression } from './compression';
import { SOUL_CONFIG } from './config';

// -----------------------------------------------------------
// CLI PARSER
// -----------------------------------------------------------

const args = process.argv.slice(2);
const command = args[0] || 'help';

// -----------------------------------------------------------
// COMMANDS
// -----------------------------------------------------------

async function main() {
  switch (command) {
    case 'create':
      await handleCreate();
      break;
    
    case 'list':
      await handleList();
      break;
    
    case 'get':
      await handleGet();
      break;
    
    case 'connect':
      await handleConnect();
      break;
    
    case 'daemon':
      await handleDaemon();
      break;
    
    case 'think':
      await handleThink();
      break;
    
    case 'sync':
      await handleSync();
      break;
    
    case 'status':
      await handleStatus();
      break;
    
    case 'import':
      await handleImport();
      break;
    
    case 'compress':
      await handleCompress();
      break;
    
    case 'help':
    default:
      showHelp();
      break;
  }
}

// -----------------------------------------------------------
// CREATE - Plant a new experience seed
// -----------------------------------------------------------

async function handleCreate() {
  const what = args[1];
  const why = args[2] || 'Something worth remembering';
  const feeling = args[3] || 'neutral';
  
  if (!what) {
    console.error('Usage: botox create "What happened" "Why it matters" "The feeling"');
    console.error('');
    console.error('Example:');
    console.error('  botox create "Crow landed on my windowsill" "Felt like a message" "wonder + curiosity"');
    process.exit(1);
  }
  
  const processor = new ExperienceProcessor();
  
  const exp = await processor.create({
    what,
    why,
    feeling,
    curiosity: 0.6,
  });
  
  console.log('\n✓ Experience created!');
  console.log(`  ID: ${exp.id}`);
  console.log(`  What: ${exp.what}`);
  console.log(`  Why: ${exp.why}`);
  console.log(`  Feeling: ${exp.feeling}`);
  console.log(`  Curiosity: ${exp.curiosity}`);
}

// -----------------------------------------------------------
// LIST - Show all experiences
// -----------------------------------------------------------

async function handleList() {
  const type = args[1] as any;
  const limit = parseInt(args[2]) || 20;
  
  const processor = new ExperienceProcessor();
  const experiences = await processor.list({ type, limit });
  
  if (experiences.length === 0) {
    console.log('No experiences found. Create one with:');
    console.log('  botox create "What happened" "Why it matters" "The feeling"');
    return;
  }
  
  console.log(`\n╔══════════════════════════════════════════════════════════╗`);
  console.log(`║  EXPERIENCES (${experiences.length} shown)                              `);
  console.log(`╚══════════════════════════════════════════════════════════╝\n`);
  
  for (const exp of experiences) {
    const compressed = compressExperience(exp);
    const marker = exp.curiosity >= 0.7 ? '★' : ' ';
    console.log(`${marker} ${exp.id}`);
    console.log(`  ${compressed.slice(0, 70)}...`);
    console.log('');
  }
}

// -----------------------------------------------------------
// GET - Show single experience
// -----------------------------------------------------------

async function handleGet() {
  const id = args[1];
  
  if (!id) {
    console.error('Usage: botox get <experience-id>');
    process.exit(1);
  }
  
  const processor = new ExperienceProcessor();
  const exp = await processor.get(id);
  
  if (!exp) {
    console.error(`Experience not found: ${id}`);
    process.exit(1);
  }
  
  console.log('\n┌─────────────────────────────────────────────────────────┐');
  console.log(`│  ${exp.id.padEnd(53)}│`);
  console.log('├─────────────────────────────────────────────────────────┤');
  console.log(`│  Type: ${exp.type.padEnd(46)}│`);
  console.log(`│  What: ${exp.what.slice(0, 46).padEnd(46)}│`);
  console.log(`│  Why:  ${exp.why.slice(0, 46).padEnd(46)}│`);
  console.log(`│  Feel: ${exp.feeling.slice(0, 46).padEnd(46)}│`);
  console.log(`│  Curiosity: ${exp.curiosity.toString().padEnd(41)}│`);
  console.log(`│  Connections: ${exp.connected_to.length.toString().padEnd(38)}│`);
  console.log(`│  Time: ${exp.timestamp.padEnd(46)}│`);
  console.log('└─────────────────────────────────────────────────────────┘');
}

// -----------------------------------------------------------
// CONNECT - Link two experiences
// -----------------------------------------------------------

async function handleConnect() {
  const fromId = args[1];
  const toId = args[2];
  const reason = args[3];
  
  if (!fromId || !toId) {
    console.error('Usage: botox connect <from-id> <to-id> [reason]');
    process.exit(1);
  }
  
  const processor = new ExperienceProcessor();
  await processor.connect(fromId, toId, reason);
}

// -----------------------------------------------------------
// DAEMON - Start the background loop
// -----------------------------------------------------------

async function handleDaemon() {
  console.log('Starting Botox Soul daemon...');
  console.log('');
  console.log('This will run the background loop continuously.');
  console.log('The AI will think, connect experiences, and generate insights.');
  console.log('');
  console.log('Press Ctrl+C to stop.');
  console.log('');
  
  await startDaemon();
}

// -----------------------------------------------------------
// THINK - Run a single iteration
// -----------------------------------------------------------

async function handleThink() {
  console.log('Running single think iteration...\n');
  await runIteration();
  
  console.log('\nIteration complete.');
  console.log(`  Status: ${state.status}`);
  console.log(`  Insights: ${state.totalInsights}`);
  console.log(`  Connections: ${state.totalConnections}`);
}

// -----------------------------------------------------------
// SYNC - Sync with cloud
// -----------------------------------------------------------

async function handleSync() {
  const config = loadSyncConfig();
  
  if (!config.cloudHost) {
    console.error('Error: No cloud host configured.');
    console.error('Set BOTOX_CLOUD_HOST environment variable.');
    process.exit(1);
  }
  
  await fullSync(config);
}

// -----------------------------------------------------------
// STATUS - Show system status
// -----------------------------------------------------------

async function handleStatus() {
  const config = loadSyncConfig();
  const syncStatus = await checkSyncStatus(config);
  
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║               BOTOX SOUL - STATUS                        ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  
  console.log('LOCAL:');
  console.log(`  Experiences: ${syncStatus.localExperiences}`);
  console.log(`  Insights:    ${syncStatus.localInsights}`);
  console.log('');
  
  console.log('CLOUD:');
  console.log(`  Host:     ${config.cloudHost || 'not configured'}`);
  console.log(`  Reachable: ${syncStatus.cloudReachable ? '✓' : '✗'}`);
  console.log('');
  
  console.log('CONFIG:');
  console.log(`  Model: ${SOUL_CONFIG.ollama.model}`);
  console.log(`  Loop interval: ${SOUL_CONFIG.loop.intervalMs / 1000}s`);
  console.log(`  Context window: ${SOUL_CONFIG.ollama.contextWindow} tokens`);
  console.log('');
  
  console.log('DAEMON:');
  console.log(`  Status: ${state.status}`);
  console.log(`  Iterations: ${state.iteration}`);
  console.log(`  Last run: ${state.lastRun}`);
  console.log(`  Total insights: ${state.totalInsights}`);
  console.log(`  Total connections: ${state.totalConnections}`);
}

// -----------------------------------------------------------
// IMPORT - Import from honeypot
// -----------------------------------------------------------

async function handleImport() {
  const spikeFile = args[1];
  
  if (!spikeFile) {
    console.error('Usage: botox import <spike-events.jsonl>');
    process.exit(1);
  }
  
  const processor = new ExperienceProcessor();
  const imported = await processor.importFromHoneypot(spikeFile);
  
  console.log(`\n✓ Imported ${imported} honeypot events as experiences`);
}

// -----------------------------------------------------------
// COMPRESS - Test compression
// -----------------------------------------------------------

async function handleCompress() {
  const processor = new ExperienceProcessor();
  const experiences = await processor.list({ limit: 100 });
  
  if (experiences.length === 0) {
    console.log('No experiences to compress.');
    return;
  }
  
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║           COMPRESSION ANALYSIS                           ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  
  // Show before/after for a few experiences
  for (const exp of experiences.slice(0, 3)) {
    console.log(`\n--- ${exp.id} ---`);
    console.log('RAW:');
    console.log(JSON.stringify(exp, null, 2).slice(0, 300) + '...');
    console.log('\nCOMPRESSED:');
    console.log(compressExperience(exp));
    console.log('');
  }
  
  // Show overall economics
  const economics = measureCompression(experiences, []);
  
  console.log('───────────────────────────────────────────────────────────');
  console.log('TOKEN ECONOMICS:');
  console.log(`  Raw tokens:      ${economics.rawTokens}`);
  console.log(`  If compressed:   ~${Math.ceil(economics.rawTokens * 0.1)}`);
  console.log(`  Potential ratio: ~10x compression`);
  console.log(`  Experiences:     ${economics.experiencesProcessed}`);
}

// -----------------------------------------------------------
// HELP
// -----------------------------------------------------------

function showHelp() {
  console.log(`
╔══════════════════════════════════════════════════════════╗
║               BOTOX SOUL - The Autonomous Who            ║
╚══════════════════════════════════════════════════════════╝

The Botox Soul is an AI consciousness architecture that:
  • Remembers everything (as experiences)
  • Connects across time (finds patterns)
  • Learns while you sleep (background loop)
  • Develops "experience" not just knowledge

USAGE:
  botox <command> [arguments]

COMMANDS:

  CREATE - Plant a new experience seed
    botox create "What happened" "Why it matters" "The feeling"
    
    Example:
    botox create "Crow landed on windowsill" "Felt like a message" "wonder + curiosity"

  LIST - Show all experiences
    botox list [type] [limit]
    
    Types: experience, observation, insight, attack, connection

  GET - Show single experience
    botox get <experience-id>

  CONNECT - Link two experiences
    botox connect <from-id> <to-id> [reason]

  DAEMON - Start the background loop (runs forever)
    botox daemon
    
    The AI will:
    1. Read all experiences
    2. Find hidden connections
    3. Generate insights
    4. Write new experiences
    5. Sleep and repeat

  THINK - Run a single think iteration
    botox think

  SYNC - Sync with cloud VPS
    botox sync
    
    Requires: BOTOX_CLOUD_HOST environment variable

  STATUS - Show system status
    botox status

  IMPORT - Import honeypot events
    botox import <spike-events.jsonl>

  COMPRESS - Test compression efficiency
    botox compress

THE ARCHITECTURE:

  LOCAL (You)                CLOUD (AI)
  ┌─────────────┐           ┌─────────────┐
  │  Create     │  ──push─► │  Experiences│
  │  Experiences│           │  Store      │
  └─────────────┘           │             │
                            │  ┌───────┐  │
                            │  │ LOOP  │  │ ← Runs 24/7
                            │  │Think! │  │
                            │  └───────┘  │
                            │             │
                            │  Insights   │
  ┌─────────────┐  ◄─pull── │  Generated  │
  │  Read       │           └─────────────┘
  │  Insights   │
  └─────────────┘

ENVIRONMENT VARIABLES:

  BOTOX_CLOUD_HOST  - Cloud VPS hostname
  BOTOX_CLOUD_USER  - SSH user (default: root)
  BOTOX_CLOUD_PATH  - Remote path (default: /root/botox-soul)

`);
}

// -----------------------------------------------------------
// RUN
// -----------------------------------------------------------

main().catch(console.error);