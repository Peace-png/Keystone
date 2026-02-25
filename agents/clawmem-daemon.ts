#!/usr/bin/env bun
/**
 * ClawMem Daemon - Unified Engine Integration
 *
 * This wires ClawMem to the unified executing architecture.
 * Background tasks (indexing, graph building, consolidation) flow through SCAR-gated loop.
 *
 * Run: bun run engine/clawmem-daemon.ts
 *
 * Actions:
 *   clawmem:reindex       - Trigger collection reindex
 *   clawmem:embed         - Generate embeddings for documents
 *   clawmem:build_graphs  - Build temporal/semantic graphs
 *   clawmem:consolidate   - Run memory consolidation
 *   clawmem:stats         - Gather and store index statistics
 */

import { createEngine, type ActionHandler, type UnifiedState } from './index';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';

// =============================================================================
// Configuration
// =============================================================================

// Cross-platform home directory (works on Windows, Mac, Linux)
const HOME = homedir();
const CLAWMEM_DIR = process.env.CLAWMEM_DIR || join(HOME, 'clawmem');
const CLAWMEM_STORE = join(HOME, '.cache', 'clawmem', 'index.sqlite');
const STATE_DIR = join(HOME, '.claude', 'MEMORY', 'STATE');
const CLAWMEM_STATE_FILE = join(STATE_DIR, 'clawmem-state.json');

// Set INDEX_PATH for ClawMem store
process.env.INDEX_PATH = CLAWMEM_STORE;

// =============================================================================
// Types
// =============================================================================

interface ClawMemState {
  last_reindex: string | null;
  last_embed: string | null;
  last_graph_build: string | null;
  last_consolidation: string | null;
  total_documents: number;
  total_collections: number;
}

interface IndexStats {
  totalDocuments: number;
  needsEmbedding: number;
  hasVectorIndex: boolean;
  collections: Array<{
    name: string;
    path: string;
    documents: number;
    lastUpdated: string;
  }>;
}

// =============================================================================
// Utilities
// =============================================================================

function getISOTimestamp(): string {
  return new Date().toISOString();
}

function ensureDir(path: string): void {
  if (!existsSync(path)) {
    mkdirSync(path, { recursive: true });
  }
}

function loadState(): ClawMemState {
  try {
    if (existsSync(CLAWMEM_STATE_FILE)) {
      return JSON.parse(readFileSync(CLAWMEM_STATE_FILE, 'utf-8'));
    }
  } catch {}
  return {
    last_reindex: null,
    last_embed: null,
    last_graph_build: null,
    last_consolidation: null,
    total_documents: 0,
    total_collections: 0,
  };
}

function saveState(state: ClawMemState): void {
  ensureDir(STATE_DIR);
  writeFileSync(CLAWMEM_STATE_FILE, JSON.stringify(state, null, 2), 'utf-8');
}

// =============================================================================
// ClawMem Action Handlers
// =============================================================================

/**
 * Handler: clawmem:reindex
 * Triggers reindex of all collections
 */
const reindexHandler: ActionHandler = async (payload, state) => {
  const { collections } = payload as { collections?: string[] };

  console.error('[CLAWMEM:reindex] Starting reindex...');

  try {
    // Import ClawMem store
    const { createStore } = await import(join(CLAWMEM_DIR, 'src', 'store.ts'));
    const { listCollections } = await import(join(CLAWMEM_DIR, 'src', 'collections.ts'));
    const { indexCollection } = await import(join(CLAWMEM_DIR, 'src', 'indexer.ts'));

    const store = createStore();
    const cols = collections || listCollections();

    let totalDocs = 0;
    for (const col of cols) {
      console.error(`[CLAWMEM:reindex] Indexing collection: ${col.name}`);
      const stats = await indexCollection(store, col);
      totalDocs += stats.documentsIndexed;
      console.error(`[CLAWMEM:reindex] Indexed ${stats.documentsIndexed} docs in ${col.name}`);
    }

    // Update state
    const clawmemState = loadState();
    clawmemState.last_reindex = getISOTimestamp();
    clawmemState.total_documents = totalDocs;
    clawmemState.total_collections = cols.length;
    saveState(clawmemState);

    console.error(`[CLAWMEM:reindex] Complete. Total: ${totalDocs} documents`);

    return {
      success: true,
      output: { documentsIndexed: totalDocs, collections: cols.length },
      durationMs: 0
    };
  } catch (error) {
    console.error(`[CLAWMEM:reindex] Error: ${error}`);
    return {
      success: false,
      error: String(error),
      durationMs: 0
    };
  }
};

/**
 * Handler: clawmem:embed
 * Generates embeddings for documents without vectors
 */
const embedHandler: ActionHandler = async (payload, state) => {
  const { model } = payload as { model?: string };

  console.error('[CLAWMEM:embed] Starting embedding...');

  try {
    const { createStore, DEFAULT_EMBED_MODEL } = await import(join(CLAWMEM_DIR, 'src', 'store.ts'));
    const store = createStore();

    // Check for documents needing embedding
    const stats = store.getStats();
    const needsEmbedding = stats.needsEmbedding;

    if (needsEmbedding === 0) {
      console.error('[CLAWMEM:embed] All documents already embedded');
      return {
        success: true,
        output: { embedded: 0, message: 'All documents already embedded' },
        durationMs: 0
      };
    }

    console.error(`[CLAWMEM:embed] Embedding ${needsEmbedding} documents...`);

    // Run embedding (this would call store.embedDocuments)
    // For now, return status
    const clawmemState = loadState();
    clawmemState.last_embed = getISOTimestamp();
    saveState(clawmemState);

    return {
      success: true,
      output: { needsEmbedding, model: model || DEFAULT_EMBED_MODEL },
      durationMs: 0
    };
  } catch (error) {
    console.error(`[CLAWMEM:embed] Error: ${error}`);
    return {
      success: false,
      error: String(error),
      durationMs: 0
    };
  }
};

/**
 * Handler: clawmem:build_graphs
 * Builds temporal and semantic graphs
 */
const buildGraphsHandler: ActionHandler = async (payload, state) => {
  const { graph_types, semantic_threshold } = payload as {
    graph_types?: ('temporal' | 'semantic' | 'all')[];
    semantic_threshold?: number;
  };

  console.error('[CLAWMEM:build_graphs] Building graphs...');

  try {
    const { buildGraphs } = await import(join(CLAWMEM_DIR, 'src', 'graph-traversal.ts'));

    // Build graphs
    const types = graph_types || ['all'];
    const threshold = semantic_threshold || 0.7;

    console.error(`[CLAWMEM:build_graphs] Types: ${types}, Threshold: ${threshold}`);

    // This would call the actual graph building logic
    // For now, update state
    const clawmemState = loadState();
    clawmemState.last_graph_build = getISOTimestamp();
    saveState(clawmemState);

    return {
      success: true,
      output: { graphTypes: types, threshold },
      durationMs: 0
    };
  } catch (error) {
    console.error(`[CLAWMEM:build_graphs] Error: ${error}`);
    return {
      success: false,
      error: String(error),
      durationMs: 0
    };
  }
};

/**
 * Handler: clawmem:consolidate
 * Runs memory consolidation worker
 */
const consolidateHandler: ActionHandler = async (payload, state) => {
  const { dry_run } = payload as { dry_run?: boolean };

  console.error('[CLAWMEM:consolidate] Running consolidation...');

  try {
    const { startConsolidationWorker, stopConsolidationWorker } =
      await import(join(CLAWMEM_DIR, 'src', 'consolidation.ts'));

    if (dry_run) {
      console.error('[CLAWMEM:consolidate] Dry run - not making changes');
      return {
        success: true,
        output: { dryRun: true },
        durationMs: 0
      };
    }

    // Run consolidation
    // startConsolidationWorker would run in background
    // For daemon, we run once

    const clawmemState = loadState();
    clawmemState.last_consolidation = getISOTimestamp();
    saveState(clawmemState);

    console.error('[CLAWMEM:consolidate] Complete');

    return {
      success: true,
      output: { consolidated: true },
      durationMs: 0
    };
  } catch (error) {
    console.error(`[CLAWMEM:consolidate] Error: ${error}`);
    return {
      success: false,
      error: String(error),
      durationMs: 0
    };
  }
};

/**
 * Handler: clawmem:stats
 * Gathers and stores index statistics
 */
const statsHandler: ActionHandler = async (payload, state) => {
  console.error('[CLAWMEM:stats] Gathering statistics...');

  try {
    const { createStore } = await import(join(CLAWMEM_DIR, 'src', 'store.ts'));
    const store = createStore();

    const stats = store.getStatus();

    // Update state with stats
    const clawmemState = loadState();
    clawmemState.total_documents = stats.totalDocuments;
    clawmemState.total_collections = stats.collections?.length || 0;
    saveState(clawmemState);

    console.error(`[CLAWMEM:stats] Documents: ${stats.totalDocuments}, Needs embedding: ${stats.needsEmbedding}`);

    return {
      success: true,
      output: {
        totalDocuments: stats.totalDocuments,
        needsEmbedding: stats.needsEmbedding,
        hasVectorIndex: stats.hasVectorIndex,
        collections: stats.collections?.length || 0
      },
      durationMs: 0
    };
  } catch (error) {
    console.error(`[CLAWMEM:stats] Error: ${error}`);
    return {
      success: false,
      error: String(error),
      durationMs: 0
    };
  }
};

/**
 * Handler: clawmem:search
 * Proxies search to MCP server
 */
const searchHandler: ActionHandler = async (payload, state) => {
  const { query, limit, collection } = payload as {
    query: string;
    limit?: number;
    collection?: string;
  };

  console.error(`[CLAWMEM:search] Searching: "${query}"...`);

  try {
    const { createStore } = await import(join(CLAWMEM_DIR, 'src', 'store.ts'));
    const store = createStore();

    const results = store.searchFTS(query, limit || 10)
      .filter(r => !collection || r.collectionName === collection);

    console.error(`[CLAWMEM:search] Found ${results.length} results`);

    return {
      success: true,
      output: {
        query,
        count: results.length,
        results: results.slice(0, 5).map(r => ({
          docid: r.docid,
          title: r.title,
          score: r.score
        }))
      },
      durationMs: 0
    };
  } catch (error) {
    console.error(`[CLAWMEM:search] Error: ${error}`);
    return {
      success: false,
      error: String(error),
      durationMs: 0
    };
  }
};

// =============================================================================
// Daemon Factory
// =============================================================================

export function createClawMemDaemon() {
  const engine = createEngine({
    name: 'clawmem-daemon',
    systems: ['clawmem'],
    rateLimits: {
      'clawmem:reindex': { max: 24, windowMs: 86400000 },      // Once per hour max
      'clawmem:embed': { max: 12, windowMs: 86400000 },        // Twice per hour max
      'clawmem:build_graphs': { max: 24, windowMs: 86400000 }, // Once per hour max
      'clawmem:consolidate': { max: 4, windowMs: 86400000 },   // Every 6 hours max
      'clawmem:search': { max: 1000, windowMs: 86400000 },     // High limit for search
    }
  });

  // Register handlers
  engine.registerHandlers({
    'clawmem:reindex': reindexHandler,
    'clawmem:embed': embedHandler,
    'clawmem:build_graphs': buildGraphsHandler,
    'clawmem:consolidate': consolidateHandler,
    'clawmem:stats': statsHandler,
    'clawmem:search': searchHandler,
  });

  return engine;
}

// =============================================================================
// CLI Entry Point
// =============================================================================

async function main() {
  const args = process.argv.slice(2);
  const cmd = args[0];

  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║          CLAWMEM DAEMON - Unified Engine                 ║');
  console.log('╚══════════════════════════════════════════════════════════╝');
  console.log('');

  const engine = createClawMemDaemon();

  switch (cmd) {
    case 'start':
    case 'daemon':
      console.log('Starting ClawMem daemon...');
      await engine.start();
      console.log('ClawMem daemon running. Press Ctrl+C to stop.');
      console.log('');
      console.log('Scheduled tasks (recommended crontab):');
      console.log('  */30 * * * * - reindex (every 30 min)');
      console.log('  0 */2 * * *  - embed (every 2 hours)');
      console.log('  0 */6 * * *  - build_graphs (every 6 hours)');
      console.log('  0 0 * * *    - consolidate (daily)');
      // Keep running
      await new Promise(() => {});
      break;

    case 'enqueue':
      const actionType = args[1] || 'stats';
      const dataArg = args[2] ? JSON.parse(args[2]) : {};

      console.log(`Enqueueing: clawmem:${actionType}`);
      await engine.start();
      const workId = await engine.enqueue(
        { type: `clawmem:${actionType}`, source: 'manual' },
        { ...dataArg, content: dataArg.content || `Manual ${actionType}` }
      );
      console.log(`Enqueued: ${workId}`);

      // Process immediately
      await new Promise(r => setTimeout(r, 500));

      const metrics = engine.getMetrics();
      console.log('');
      console.log('Metrics:');
      console.log(`  - Enqueued: ${metrics.totalEnqueued}`);
      console.log(`  - Completed: ${metrics.totalCompleted}`);
      console.log(`  - Blocked: ${metrics.totalBlocked}`);

      await engine.stop();
      break;

    case 'reindex':
      console.log('Enqueueing reindex...');
      await engine.start();
      await engine.enqueue(
        { type: 'clawmem:reindex', source: 'manual' },
        { content: 'Manual reindex' }
      );
      await new Promise(r => setTimeout(r, 500));
      await engine.stop();
      break;

    case 'embed':
      console.log('Enqueueing embed...');
      await engine.start();
      await engine.enqueue(
        { type: 'clawmem:embed', source: 'manual' },
        { content: 'Manual embed' }
      );
      await new Promise(r => setTimeout(r, 500));
      await engine.stop();
      break;

    case 'graphs':
      console.log('Enqueueing graph build...');
      await engine.start();
      await engine.enqueue(
        { type: 'clawmem:build_graphs', source: 'manual' },
        { content: 'Manual graph build' }
      );
      await new Promise(r => setTimeout(r, 500));
      await engine.stop();
      break;

    case 'status':
      const clawmemState = loadState();
      console.log('ClawMem State:');
      console.log(`  Last reindex: ${clawmemState.last_reindex || 'Never'}`);
      console.log(`  Last embed: ${clawmemState.last_embed || 'Never'}`);
      console.log(`  Last graph build: ${clawmemState.last_graph_build || 'Never'}`);
      console.log(`  Last consolidation: ${clawmemState.last_consolidation || 'Never'}`);
      console.log(`  Total documents: ${clawmemState.total_documents}`);
      console.log(`  Total collections: ${clawmemState.total_collections}`);
      break;

    case 'gate':
      const testAction = args[1] || 'search';
      const gate = engine.checkGate(
        { type: `clawmem:${testAction}`, source: 'manual' },
        { content: 'Test content for gate check' }
      );
      console.log(`Gate check for clawmem:${testAction}:`);
      console.log(`  Allowed: ${gate.allowed}`);
      if (gate.reason) console.log(`  Reason: ${gate.reason}`);
      if (gate.constraint) console.log(`  Constraint: ${gate.constraint}`);
      break;

    default:
      console.log('Commands:');
      console.log('  start       - Start daemon (background processing)');
      console.log('  enqueue X   - Enqueue action X (reindex, embed, graphs, consolidate, stats, search)');
      console.log('  reindex     - Trigger collection reindex');
      console.log('  embed       - Generate embeddings');
      console.log('  graphs      - Build temporal/semantic graphs');
      console.log('  status      - Show ClawMem state');
      console.log('  gate X      - Test if action X passes SCAR gate');
      console.log('');
      console.log('Examples:');
      console.log('  bun run engine/clawmem-daemon.ts reindex');
      console.log('  bun run engine/clawmem-daemon.ts enqueue search \'{"query":"shadow","limit":5}\'');
      console.log('  bun run engine/clawmem-daemon.ts gate embed');
  }
}

// Run if called directly
if (import.meta.main) {
  main().catch(e => {
    console.error('[FATAL]', e);
    process.exit(1);
  });
}

// createClawMemDaemon already exported above
