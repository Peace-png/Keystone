// ============================================================
// BOTOX SOUL - Sync Utilities
// Local ↔ Cloud synchronization
// ============================================================
//
// THE ARCHITECTURE:
//
//   LOCAL (Work here, generate JSONs)
//     ↓ Push
//   CLOUD (Store everything, run loop)
//     ↓ Pull
//   LOCAL (Read what happened while you slept)
//
// ============================================================

import { SOUL_CONFIG, type Experience } from './config';
import { compressExperience, type VibeString } from './compression';

// -----------------------------------------------------------
// SYNC CONFIGURATION
// -----------------------------------------------------------

export interface SyncConfig {
  cloudHost: string;
  cloudUser: string;
  cloudPath: string;
  localPath: string;
  sshKey?: string;
}

const DEFAULT_SYNC_CONFIG: SyncConfig = {
  cloudHost: '',  // Set via env or config
  cloudUser: 'root',
  cloudPath: '/root/botox-soul',
  localPath: './soul',
};

// -----------------------------------------------------------
// PUSH - Send local experiences to cloud
// -----------------------------------------------------------

export async function pushToCloud(config: SyncConfig = DEFAULT_SYNC_CONFIG): Promise<{
  pushed: number;
  errors: string[];
}> {
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);
  const fs = await import('fs/promises');
  const path = await import('path');
  
  const errors: string[] = [];
  let pushed = 0;
  
  try {
    // Build rsync command
    const source = path.join(config.localPath, 'experiences') + '/';
    const dest = `${config.cloudUser}@${config.cloudHost}:${config.cloudPath}/experiences/`;
    
    console.log(`[PUSH] Syncing experiences to ${config.cloudHost}...`);
    
    const { stdout, stderr } = await execAsync(
      `rsync -avz --progress "${source}" "${dest}"`,
      { maxBuffer: 10 * 1024 * 1024 }
    );
    
    // Count pushed files
    const files = (await fs.readdir(path.join(config.localPath, 'experiences')))
      .filter(f => f.endsWith('.json'));
    pushed = files.length;
    
    if (stderr && !stderr.includes('sending incremental file list')) {
      errors.push(stderr);
    }
    
    console.log(`[PUSH] ✓ ${pushed} experiences synced`);
    
  } catch (error) {
    errors.push(String(error));
    console.error(`[PUSH] ✗ Error: ${error}`);
  }
  
  return { pushed, errors };
}

// -----------------------------------------------------------
// PULL - Get cloud insights to local
// -----------------------------------------------------------

export async function pullFromCloud(config: SyncConfig = DEFAULT_SYNC_CONFIG): Promise<{
  pulled: number;
  insights: string[];
  errors: string[];
}> {
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);
  
  const errors: string[] = [];
  const insights: string[] = [];
  let pulled = 0;
  
  try {
    // Pull insights
    const source = `${config.cloudUser}@${config.cloudHost}:${config.cloudPath}/insights/`;
    const dest = config.localPath + '/insights/';
    
    console.log(`[PULL] Fetching insights from ${config.cloudHost}...`);
    
    const { stdout, stderr } = await execAsync(
      `rsync -avz "${source}" "${dest}"`,
      { maxBuffer: 10 * 1024 * 1024 }
    );
    
    // Count pulled files
    const match = stdout.match(/received (\d+) files/);
    pulled = match ? parseInt(match[1]) : 0;
    
    if (stderr && !stderr.includes('receiving file list')) {
      errors.push(stderr);
    }
    
    console.log(`[PULL] ✓ ${pulled} insights fetched`);
    
    // Read insights for summary
    const fs = await import('fs/promises');
    const path = await import('path');
    const files = await fs.readdir(dest).catch(() => [] as string[]);
    
    for (const file of files.slice(0, 10)) {
      if (!file.endsWith('.json')) continue;
      try {
        const content = await fs.readFile(path.join(dest, file), 'utf-8');
        const insight = JSON.parse(content);
        insights.push(insight.insight || insight.what || 'Unknown insight');
      } catch {}
    }
    
  } catch (error) {
    errors.push(String(error));
    console.error(`[PULL] ✗ Error: ${error}`);
  }
  
  return { pulled, insights, errors };
}

// -----------------------------------------------------------
// SYNC - Full bidirectional sync
// -----------------------------------------------------------

export async function fullSync(config: SyncConfig = DEFAULT_SYNC_CONFIG): Promise<{
  pushed: number;
  pulled: number;
  newInsights: string[];
  errors: string[];
}> {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║               BOTOX SOUL - FULL SYNC                     ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');
  
  // Push local experiences
  const pushResult = await pushToCloud(config);
  
  // Pull cloud insights
  const pullResult = await pullFromCloud(config);
  
  console.log('\n[SYNC COMPLETE]');
  console.log(`  Pushed: ${pushResult.pushed} experiences`);
  console.log(`  Pulled: ${pullResult.pulled} insights`);
  
  if (pullResult.insights.length > 0) {
    console.log('\n[NEW INSIGHTS]');
    pullResult.insights.slice(0, 5).forEach((insight, i) => {
      console.log(`  ${i + 1}. ${insight.slice(0, 100)}...`);
    });
  }
  
  return {
    pushed: pushResult.pushed,
    pulled: pullResult.pulled,
    newInsights: pullResult.insights,
    errors: [...pushResult.errors, ...pullResult.errors],
  };
}

// -----------------------------------------------------------
// STATUS - Check sync state
// -----------------------------------------------------------

export async function checkSyncStatus(config: SyncConfig = DEFAULT_SYNC_CONFIG): Promise<{
  localExperiences: number;
  localInsights: number;
  cloudReachable: boolean;
  lastSync?: string;
}> {
  const fs = await import('fs/promises');
  const { exec } = await import('child_process');
  const { promisify } = await import('util');
  const execAsync = promisify(exec);
  
  // Count local files
  let localExperiences = 0;
  let localInsights = 0;
  
  try {
    const expFiles = await fs.readdir(config.localPath + '/experiences');
    localExperiences = expFiles.filter(f => f.endsWith('.json')).length;
  } catch {}
  
  try {
    const insFiles = await fs.readdir(config.localPath + '/insights');
    localInsights = insFiles.filter(f => f.endsWith('.json')).length;
  } catch {}
  
  // Check cloud reachability
  let cloudReachable = false;
  try {
    await execAsync(`ssh -o ConnectTimeout=5 ${config.cloudUser}@${config.cloudHost} echo ok`);
    cloudReachable = true;
  } catch {}
  
  return {
    localExperiences,
    localInsights,
    cloudReachable,
  };
}

// -----------------------------------------------------------
// WATCH - Continuous sync daemon
// -----------------------------------------------------------

export async function startSyncWatcher(
  config: SyncConfig = DEFAULT_SYNC_CONFIG,
  intervalMs: number = 60000
): Promise<void> {
  console.log('[SYNC WATCHER] Starting...');
  console.log(`  Interval: ${intervalMs / 1000}s`);
  console.log(`  Cloud: ${config.cloudHost}`);
  console.log('');
  
  // Initial sync
  await fullSync(config);
  
  // Schedule recurring sync
  setInterval(async () => {
    console.log(`\n[${new Date().toISOString()}] Scheduled sync...`);
    await fullSync(config);
  }, intervalMs);
  
  console.log('[SYNC WATCHER] Running. Press Ctrl+C to stop.');
}

// -----------------------------------------------------------
// EXPORT CONFIG FOR CLI
// -----------------------------------------------------------

export function loadSyncConfig(): SyncConfig {
  return {
    ...DEFAULT_SYNC_CONFIG,
    cloudHost: process.env.BOTOX_CLOUD_HOST || '',
    cloudUser: process.env.BOTOX_CLOUD_USER || 'root',
    cloudPath: process.env.BOTOX_CLOUD_PATH || '/root/botox-soul',
    localPath: process.env.BOTOX_LOCAL_PATH || './soul',
  };
}