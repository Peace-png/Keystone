// ============================================================
// BOTOX SOUL - Compression Layer
// Throughput Optimization: JSON → Vibe Strings
// ============================================================
//
// The Physics:
//   Raw JSON = High Viscosity (slow flow through context window)
//   Vibe String = Low Viscosity (fast flow, high information density)
//
// This is the "Sieve Protocol" - filter the rocks before
// sending water through the pipe.
// ============================================================

import type { Experience, VibeString } from './config';

// -----------------------------------------------------------
// THE COMPRESSOR - JSON to Vibe String
// -----------------------------------------------------------

export function compressExperience(exp: Experience): string {
  // The "Vibe" - dense semantic summary
  // Target: 50 words or less, capture essence + texture
  
  const parts: string[] = [];
  
  // Core: What + Why (the Left Brain)
  parts.push(`[${exp.id}] ${exp.what}`);
  if (exp.why) parts.push(`→ ${exp.why}`);
  
  // Texture: The Feeling (the Right Brain / Ox)
  if (exp.feeling) parts.push(`(${exp.feeling})`);
  
  // Connection hint
  if (exp.connected_to.length > 0) {
    parts.push(`↔ [${exp.connected_to.slice(0, 3).join(', ')}]`);
  }
  
  // Curiosity marker (the Internal Drive)
  if (exp.curiosity >= 0.7) parts.push('★');
  
  return parts.join(' ');
}

export function compressBatch(experiences: Experience[]): VibeString {
  // Compress multiple experiences into one Vibe String
  // Used for Warm memory tier (30+ days old)
  
  const sourceIds = experiences.map(e => e.id);
  
  // Aggregate feelings
  const feelings = experiences
    .map(e => e.feeling)
    .filter(Boolean)
    .slice(0, 5);
  
  // Aggregate connections
  const allConnections = experiences
    .flatMap(e => e.connected_to)
    .filter(id => !sourceIds.includes(id));
  
  // Create dense vibe
  const vibe = experiences
    .map(e => compressExperience(e))
    .join(' | ')
    .slice(0, 500); // Cap at 500 chars
  
  // Emotional texture summary
  const emotionalTexture = synthesizeTexture(feelings);
  
  return {
    id: `vibe-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    sourceIds,
    vibe,
    connections: [...new Set(allConnections)].slice(0, 20),
    emotionalTexture,
    timestamp: new Date().toISOString(),
  };
}

// -----------------------------------------------------------
// TEXTURE SYNTHESIS - The "Ox" in 10 words
// -----------------------------------------------------------

function synthesizeTexture(feelings: string[]): string {
  if (feelings.length === 0) return 'neutral';
  
  // Right-Brain pattern matching
  // Group similar feelings into archetypes
  
  const archetypes: Record<string, string[]> = {
    fear: ['fear', 'scared', 'terrified', 'anxious', 'worry', 'dread'],
    joy: ['joy', 'happy', 'elated', 'excited', 'wonder', 'awe'],
    sadness: ['sad', 'grief', 'loss', 'melancholy', 'sorrow'],
    anger: ['anger', 'frustrated', 'rage', 'annoyed', 'irritated'],
    surprise: ['surprise', 'shocked', 'unexpected', 'sudden'],
    curiosity: ['curious', 'wonder', 'interesting', 'fascinated'],
    love: ['love', 'affection', 'care', 'warmth', 'connection'],
    pain: ['pain', 'hurt', 'suffering', 'ache'],
  };
  
  // Count archetype matches
  const counts: Record<string, number> = {};
  const lowerFeelings = feelings.join(' ').toLowerCase();
  
  for (const [archetype, keywords] of Object.entries(archetypes)) {
    for (const keyword of keywords) {
      if (lowerFeelings.includes(keyword)) {
        counts[archetype] = (counts[archetype] || 0) + 1;
      }
    }
  }
  
  // Find dominant archetype
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  
  if (sorted.length === 0) return 'neutral';
  
  // Return top 2 archetypes
  const top = sorted.slice(0, 2).map(([name]) => name);
  return top.join(' + ');
}

// -----------------------------------------------------------
// THE EXPANDER - Vibe String back to Context (for prompting)
// -----------------------------------------------------------

export function expandForPrompt(vibe: VibeString): string {
  // Convert compressed vibe back to prompt-friendly format
  // This is what gets sent to Ollama
  
  return `
<context_packet>
  <sources>${vibe.sourceIds.length} experiences</sources>
  <texture>${vibe.emotionalTexture}</texture>
  <essence>${vibe.vibe}</essence>
  <connections>${vibe.connections.slice(0, 5).join(', ')}</connections>
</context_packet>`;
}

// -----------------------------------------------------------
// BATCHING - The Sieve Protocol
// -----------------------------------------------------------

export interface BatchConfig {
  maxTokens: number;
  targetBatchSize: number;
}

export function batchForPrompt(
  experiences: Experience[],
  vibes: VibeString[],
  config: BatchConfig = { maxTokens: 3000, targetBatchSize: 10 }
): { hot: Experience[]; warm: VibeString[]; estimatedTokens: number } {
  
  // Estimate tokens (rough: 1 token ≈ 4 chars)
  const estimateTokens = (str: string) => Math.ceil(str.length / 4);
  
  let tokenCount = 0;
  const hot: Experience[] = [];
  const warm: VibeString[] = [];
  
  // Prioritize hot (raw) experiences - last 24h
  for (const exp of experiences) {
    const compressed = compressExperience(exp);
    const tokens = estimateTokens(compressed);
    
    if (tokenCount + tokens < config.maxTokens && hot.length < config.targetBatchSize) {
      hot.push(exp);
      tokenCount += tokens;
    }
  }
  
  // Fill remaining with warm (compressed) vibes
  for (const vibe of vibes) {
    const expanded = expandForPrompt(vibe);
    const tokens = estimateTokens(expanded);
    
    if (tokenCount + tokens < config.maxTokens) {
      warm.push(vibe);
      tokenCount += tokens;
    }
  }
  
  return { hot, warm, estimatedTokens: tokenCount };
}

// -----------------------------------------------------------
// TOKEN ECONOMICS - Monitor throughput efficiency
// -----------------------------------------------------------

export interface TokenEconomics {
  rawTokens: number;
  compressedTokens: number;
  compressionRatio: number;
  experiencesProcessed: number;
}

export function measureCompression(
  experiences: Experience[],
  vibes: VibeString[]
): TokenEconomics {
  // Calculate raw token count
  const rawJson = JSON.stringify(experiences);
  const rawTokens = Math.ceil(rawJson.length / 4);
  
  // Calculate compressed token count
  const compressedJson = JSON.stringify(vibes);
  const compressedTokens = Math.ceil(compressedJson.length / 4);
  
  return {
    rawTokens,
    compressedTokens,
    compressionRatio: rawTokens / compressedTokens,
    experiencesProcessed: experiences.length,
  };
}

// -----------------------------------------------------------
// EXAMPLE: The "womb-plane-fear" compression
// -----------------------------------------------------------

export const EXAMPLE_COMPRESSION = {
  raw: {
    node: 'womb-plane-fear',
    surface: 'Birth is like falling from a plane',
    why_it_arose: 'Mapping one primal fear onto another',
    layers: {
      surface: 'Two scenarios feel similar',
      deeper: 'Both are container failure + ejection',
      deepest: 'Birth trauma might be the original fear template',
    },
    connects_to: ['pre-linguistic-consciousness', 'why-vs-what', 'original-fear'],
    i_learned: {
      what: 'Fear might have a first template - the fall from safety',
      why_matters: 'Explains why falling dreams are universal',
      changes: 'Some fears are not learned - they are inherited from birth',
    },
  },
  compressed: '[womb-plane-fear] Birth = falling from plane → primal fear template (container failure + ejection) ↔ [pre-linguistic-consciousness, original-fear] ★',
  
  vibeString: {
    id: 'vibe-001',
    vibe: '[womb-plane-fear] Birth = falling from plane → primal fear template',
    emotionalTexture: 'fear + surprise',
    connections: ['pre-linguistic-consciousness', 'original-fear'],
  },
};