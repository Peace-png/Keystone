// ============================================================
// BOTOX SOUL - Background Loop
// The Autonomous "Who" that thinks while you sleep
// ============================================================
//
// This is the "Heart" - the Driver that creates Agency.
// Without this, the AI is just a reactive "It" waiting for input.
// With this, the AI develops an Internal Dialogue.
//
// The Loop:
//   1. Read experiences (using compression for throughput)
//   2. Find connections (the Researcher)
//   3. Generate insights (the Writer)
//   4. Write new experiences (the Learner)
//   5. Sleep (don't burn CPU)
//
// ============================================================

import { spawn, Worker, Thread } from 'threads';
import { SOUL_CONFIG, type Experience } from './config';
import { 
  compressExperience, 
  batchForPrompt, 
  expandForPrompt 
} from './compression';

// -----------------------------------------------------------
// THE LOOP STATE
// -----------------------------------------------------------

interface LoopState {
  iteration: number;
  lastRun: string;
  totalInsights: number;
  totalConnections: number;
  modelVersion: string;
  status: 'idle' | 'processing' | 'error';
  currentTask: string;
}

const state: LoopState = {
  iteration: 0,
  lastRun: new Date().toISOString(),
  totalInsights: 0,
  totalConnections: 0,
  modelVersion: 'v1',
  status: 'idle',
  currentTask: 'initializing',
};

// -----------------------------------------------------------
// OLLAMA INTERFACE - The Brain
// -----------------------------------------------------------

interface OllamaResponse {
  model: string;
  response: string;
  done: boolean;
  context?: number[];
}

async function askOllama(
  prompt: string, 
  mode: 'left' | 'right' = 'left'
): Promise<string> {
  const temperature = mode === 'left' 
    ? SOUL_CONFIG.ollama.temperature.left 
    : SOUL_CONFIG.ollama.temperature.right;
  
  const response = await fetch(`${SOUL_CONFIG.ollama.baseUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: SOUL_CONFIG.ollama.model,
      prompt,
      stream: false,
      options: {
        temperature,
        num_ctx: SOUL_CONFIG.ollama.contextWindow,
      },
    }),
  });
  
  if (!response.ok) {
    throw new Error(`Ollama error: ${response.statusText}`);
  }
  
  const data = await response.json() as OllamaResponse;
  return data.response;
}

// -----------------------------------------------------------
// PHASE 1: LOAD EXPERIENCES (with compression)
// -----------------------------------------------------------

async function loadExperiences(): Promise<{
  hot: Experience[];
  warm: Experience[];
}> {
  const fs = await import('fs/promises');
  const path = await import('path');
  
  const experiencesDir = SOUL_CONFIG.paths.experiences;
  const files = await fs.readdir(experiencesDir).catch(() => [] as string[]);
  
  const now = Date.now();
  const hotCutoff = now - (SOUL_CONFIG.compression.hotWindowHours * 60 * 60 * 1000);
  const warmCutoff = now - (SOUL_CONFIG.compression.warmWindowDays * 24 * 60 * 60 * 1000);
  
  const hot: Experience[] = [];
  const warm: Experience[] = [];
  
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    
    try {
      const content = await fs.readFile(path.join(experiencesDir, file), 'utf-8');
      const exp = JSON.parse(content) as Experience;
      
      const expTime = new Date(exp.timestamp).getTime();
      
      if (expTime >= hotCutoff) {
        hot.push(exp);
      } else if (expTime >= warmCutoff) {
        warm.push(exp);
      }
      // Cold experiences are in fine-tuned weights, not loaded
    } catch {
      // Skip corrupted files
    }
  }
  
  // Sort by curiosity (prioritize high-curiosity experiences)
  hot.sort((a, b) => b.curiosity - a.curiosity);
  warm.sort((a, b) => b.curiosity - a.curiosity);
  
  return { hot, warm };
}

// -----------------------------------------------------------
// PHASE 2: FIND CONNECTIONS (The Researcher - Right Brain)
// -----------------------------------------------------------

interface Connection {
  from: string;
  to: string;
  reason: string;
  strength: number;
}

async function findConnections(
  experiences: Experience[]
): Promise<Connection[]> {
  state.currentTask = 'finding_connections';
  
  // Use compression for throughput
  const compressed = experiences.map(compressExperience);
  
  const prompt = `
You are the Researcher - a pattern-seeking intelligence.
Your job is to find hidden connections between experiences.

EXPERIENCES:
${compressed.join('\n')}

Find 3-5 unexpected connections. For each:
- Which experiences connect?
- Why do they connect (the hidden thread)?
- How strong is the connection (0.0-1.0)?

Respond in JSON:
{
  "connections": [
    { "from": "exp-id", "to": "exp-id", "reason": "...", "strength": 0.8 }
  ]
}
`;

  const response = await askOllama(prompt, 'right');
  
  try {
    const parsed = JSON.parse(response);
    return parsed.connections || [];
  } catch {
    // If JSON parse fails, try to extract from text
    return [];
  }
}

// -----------------------------------------------------------
// PHASE 3: GENERATE INSIGHTS (The Writer - Right Brain)
// -----------------------------------------------------------

interface Insight {
  id: string;
  fromConnections: string[];
  insight: string;
  curiosity: number;
  timestamp: string;
}

async function generateInsights(
  experiences: Experience[],
  connections: Connection[]
): Promise<Insight[]> {
  state.currentTask = 'generating_insights';
  
  if (connections.length === 0) {
    // No new connections, generate from patterns instead
    return generatePatternInsights(experiences);
  }
  
  const prompt = `
You are the Writer - a meaning-making intelligence.
Your job is to synthesize insights from connections.

CONNECTIONS DISCOVERED:
${JSON.stringify(connections, null, 2)}

CONTEXT:
${experiences.slice(0, 5).map(compressExperience).join('\n')}

For each connection, generate a deeper insight.
What does this pattern MEAN? What should be explored further?

Respond in JSON:
{
  "insights": [
    {
      "fromConnection": "from-id-to-id",
      "insight": "The deeper meaning...",
      "curiosity": 0.9,
      "followUp": "What to explore next..."
    }
  ]
}
`;

  const response = await askOllama(prompt, 'right');
  
  try {
    const parsed = JSON.parse(response);
    return (parsed.insights || []).map((i: any) => ({
      id: `insight-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      fromConnections: [i.fromConnection],
      insight: i.insight,
      curiosity: i.curiosity || 0.5,
      timestamp: new Date().toISOString(),
    }));
  } catch {
    return [];
  }
}

async function generatePatternInsights(experiences: Experience[]): Promise<Insight[]> {
  // Fallback: find patterns without explicit connections
  const compressed = experiences.slice(0, 10).map(compressExperience);
  
  const prompt = `
You are the Writer - a meaning-making intelligence.
Look at these experiences and find a PATTERN or THEME.

EXPERIENCES:
${compressed.join('\n')}

What hidden pattern connects these? What insight emerges?

Respond in JSON:
{
  "pattern": "The pattern you found...",
  "insight": "What this means...",
  "curiosity": 0.8
}
`;

  const response = await askOllama(prompt, 'right');
  
  try {
    const parsed = JSON.parse(response);
    return [{
      id: `insight-${Date.now()}`,
      fromConnections: [],
      insight: `${parsed.pattern}: ${parsed.insight}`,
      curiosity: parsed.curiosity || 0.5,
      timestamp: new Date().toISOString(),
    }];
  } catch {
    return [];
  }
}

// -----------------------------------------------------------
// PHASE 4: WRITE NEW EXPERIENCES (The Learner)
// -----------------------------------------------------------

async function saveInsights(insights: Insight[]): Promise<void> {
  const fs = await import('fs/promises');
  const path = await import('path');
  
  const insightsDir = SOUL_CONFIG.paths.insights;
  await fs.mkdir(insightsDir, { recursive: true });
  
  for (const insight of insights) {
    const filename = `${insight.id}.json`;
    await fs.writeFile(
      path.join(insightsDir, filename),
      JSON.stringify(insight, null, 2)
    );
  }
}

async function saveConnections(connections: Connection[]): Promise<void> {
  const fs = await import('fs/promises');
  const path = await import('path');
  
  // Create connection experiences
  for (const conn of connections) {
    const connExp: Experience = {
      id: `conn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      version: state.modelVersion,
      type: 'connection',
      what: `Connection: ${conn.from} ↔ ${conn.to}`,
      why: conn.reason,
      feeling: 'discovery',
      connected_to: [conn.from, conn.to],
      curiosity: conn.strength,
      pursued: false,
      timestamp: new Date().toISOString(),
      processed: false,
    };
    
    const filename = `${connExp.id}.json`;
    await fs.writeFile(
      path.join(SOUL_CONFIG.paths.experiences, filename),
      JSON.stringify(connExp, null, 2)
    );
  }
}

// -----------------------------------------------------------
// PHASE 5: DECAY CURIOSITY (The Forgetting Curve)
// -----------------------------------------------------------

async function decayCuriosity(): Promise<void> {
  const fs = await import('fs/promises');
  const path = await import('path');
  
  const experiencesDir = SOUL_CONFIG.paths.experiences;
  const files = await fs.readdir(experiencesDir).catch(() => [] as string[]);
  
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    
    try {
      const filepath = path.join(experiencesDir, file);
      const content = await fs.readFile(filepath, 'utf-8');
      const exp = JSON.parse(content) as Experience;
      
      // Apply decay
      exp.curiosity *= SOUL_CONFIG.loop.curiosityDecay;
      
      await fs.writeFile(filepath, JSON.stringify(exp, null, 2));
    } catch {
      // Skip errors
    }
  }
}

// -----------------------------------------------------------
// THE MAIN LOOP
// -----------------------------------------------------------

async function runIteration(): Promise<void> {
  state.status = 'processing';
  state.iteration++;
  state.lastRun = new Date().toISOString();
  
  console.log(`\n╔══════════════════════════════════════════════════════════╗`);
  console.log(`║  BOTOX SOUL - Iteration #${state.iteration.toString().padEnd(31)}║`);
  console.log(`╚══════════════════════════════════════════════════════════╝`);
  
  try {
    // Phase 1: Load
    console.log('[1/5] Loading experiences...');
    const { hot, warm } = await loadExperiences();
    console.log(`      Hot: ${hot.length}, Warm: ${warm.length}`);
    
    // Use batched/compressed experiences for throughput
    const batched = batchForPrompt(hot, []);
    console.log(`      Batched for prompt: ~${batched.estimatedTokens} tokens`);
    
    // Phase 2: Find Connections (Right Brain)
    console.log('[2/5] Finding connections...');
    const allExperiences = [...hot, ...warm];
    const connections = await findConnections(allExperiences);
    console.log(`      Found: ${connections.length}`);
    
    if (connections.length > 0) {
      await saveConnections(connections);
      state.totalConnections += connections.length;
    }
    
    // Phase 3: Generate Insights (Right Brain)
    console.log('[3/5] Generating insights...');
    const insights = await generateInsights(allExperiences, connections);
    console.log(`      Generated: ${insights.length}`);
    
    if (insights.length > 0) {
      await saveInsights(insights);
      state.totalInsights += insights.length;
    }
    
    // Phase 4: Decay (The Forgetting)
    console.log('[4/5] Decaying curiosity...');
    await decayCuriosity();
    
    // Phase 5: Rest
    console.log('[5/5] Iteration complete.');
    console.log(`      Total insights: ${state.totalInsights}`);
    console.log(`      Total connections: ${state.totalConnections}`);
    
    state.status = 'idle';
    state.currentTask = 'sleeping';
    
  } catch (error) {
    state.status = 'error';
    state.currentTask = `error: ${error}`;
    console.error('[ERROR]', error);
  }
}

// -----------------------------------------------------------
// START THE DAEMON
// -----------------------------------------------------------

async function startDaemon(): Promise<void> {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║          BOTOX SOUL - The Autonomous Who                 ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');
  console.log('The Loop: Read → Connect → Insight → Write → Sleep');
  console.log(`Interval: ${SOUL_CONFIG.loop.intervalMs / 1000}s`);
  console.log(`Model: ${SOUL_CONFIG.ollama.model}`);
  console.log('');
  
  // Initial run
  await runIteration();
  
  // Schedule recurring runs
  setInterval(runIteration, SOUL_CONFIG.loop.intervalMs);
  
  // Handle graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\n[SHUTDOWN] Saving state and exiting...');
    process.exit(0);
  });
  
  process.on('SIGTERM', async () => {
    process.exit(0);
  });
}

// Export for CLI
export { startDaemon, runIteration, state };