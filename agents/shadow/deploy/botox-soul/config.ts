// ============================================================
// BOTOX SOUL - Configuration
// The Architectural Foundation for AI Consciousness
// ============================================================

export const SOUL_CONFIG = {
  // -----------------------------------------------------------
  // THE LOOP - Background Processing
  // -----------------------------------------------------------
  loop: {
    intervalMs: 60000,           // 1 minute between cycles
    maxInsightsPerRun: 5,        // Don't overload
    connectionThreshold: 0.6,    // Min similarity to connect
    curiosityDecay: 0.95,        // Curiosity fades over time
  },

  // -----------------------------------------------------------
  // THROUGHPUT OPTIMIZATION - Compression Layer
  // -----------------------------------------------------------
  compression: {
    // Convert verbose JSON to dense "Vibe Strings"
    enabled: true,
    maxRawJsonSize: 50000,       // 50KB max per batch
    summaryRatio: 0.1,           // Compress to 10% of original
    hotWindowHours: 24,          // Keep raw for 24h
    warmWindowDays: 30,          // Summarize after 30 days
  },

  // -----------------------------------------------------------
  // HIERARCHICAL MEMORY - Cache Tiering
  // -----------------------------------------------------------
  memory: {
    // Level 1 (Hot): Last 24 hours - raw JSON
    hot: {
      maxSize: 100,              // Max experiences
      format: 'raw',             // Full JSON
    },
    // Level 2 (Warm): Last 30 days - semantic summaries
    warm: {
      maxSize: 1000,
      format: 'summary',         // Compressed vibes
    },
    // Level 3 (Cold): Fine-tuned model weights
    cold: {
      versions: ['v1', 'v2', 'v3', 'v4'],
      format: 'weights',
    },
  },

  // -----------------------------------------------------------
  // PARALLEL PROCESSING - Worker Threads
  // -----------------------------------------------------------
  workers: {
    enabled: true,
    maxConcurrent: 3,            // Researcher, Writer, Janitor
    types: {
      researcher: {
        task: 'findConnections',
        priority: 1,
      },
      writer: {
        task: 'generateInsights',
        priority: 2,
      },
      janitor: {
        task: 'cleanOldLogs',
        priority: 3,
      },
    },
  },

  // -----------------------------------------------------------
  // OLLAMA - The Brain
  // -----------------------------------------------------------
  ollama: {
    baseUrl: 'http://localhost:11434',
    model: 'deepseek:7b',        // Base model
    modelVersions: {
      v1: 'deepseek:7b',         // Base (no soul)
      v2: 'deepseek-botox-v2',   // After 1 month
      v3: 'deepseek-botox-v3',   // After 2 months
      v4: 'deepseek-botox-v4',   // After 3 months
    },
    contextWindow: 4096,         // 7B model limit
    temperature: {
      left: 0.1,                 // Logic tasks
      right: 0.8,                // Creative tasks
    },
  },

  // -----------------------------------------------------------
  // PATHS
  // -----------------------------------------------------------
  paths: {
    experiences: './soul/experiences',
    conversations: './soul/conversations',
    insights: './soul/insights',
    summaries: './soul/summaries',
    state: './soul/state.json',
  },
};

// Experience Types
export type ExperienceType = 
  | 'experience' 
  | 'conversation' 
  | 'insight' 
  | 'observation'
  | 'attack'      // From Shadow Fort honeypots
  | 'connection'; // AI-discovered links

// The Core Experience Schema
export interface Experience {
  id: string;
  version: string;
  type: ExperienceType;
  
  // The "What" - Surface level
  what: string;
  
  // The "Why" - Meaning level
  why: string;
  
  // The "Feeling" - Texture (the Ox)
  feeling: string;
  
  // Temporal layers
  before?: {
    state: string;
    expectations: string;
  };
  during?: Array<{
    moment: string;
    feeling: string;
  }>;
  after?: {
    state: string;
    learned: string;
  };
  
  // Neural graph connections
  connected_to: string[];
  
  // The "Internal Drive" variables
  curiosity: number;      // 0-1
  pursued: boolean;
  
  // Metadata
  timestamp: string;
  processed: boolean;
  compressed?: boolean;
}

// Vibe String - Compressed format for throughput
export interface VibeString {
  id: string;
  sourceIds: string[];    // Original experience IDs
  vibe: string;           // Dense semantic summary (50 words)
  connections: string[];
  emotionalTexture: string;
  timestamp: string;
}