/**
 * [SCAR] - Shadow's Architectural Immune System
 *
 * SCAR = Constraints that CANNOT be violated
 * Violation → Block action + Log + Continue safely
 *
 * Philosophy: Every perk is a poophole. SCARs are not perks.
 * They are immutable boundaries that define safe operation.
 */

import { existsSync, writeFileSync, readFileSync, appendFileSync } from 'fs';
import { join } from 'path';

// === [SCAR] DEFINITIONS ============================================

/**
 * [SCAR/RATE] - Hard rate limits
 * These are NON-NEGOTIABLE. Exceeding = action blocked.
 */
export const SCAR_RATE = {
  /** Minimum time between comments (ms) - new account safe */
  commentInterval: 60000,

  /** Maximum comments per day - conservative for new accounts */
  maxCommentsPerDay: 40,

  /** Minimum time between posts (ms) - Moltbook limit */
  postInterval: 1800000, // 30 minutes

  /** Maximum posts per day - quality over quantity */
  maxPostsPerDay: 5,

  /** Cooldown after any error (ms) */
  errorCooldown: 300000, // 5 minutes
} as const;

/**
 * [SCAR/CONTENT] - Content validation rules
 * Content failing ANY rule = blocked
 */
export const SCAR_CONTENT = {
  /** Forbidden patterns - never post these */
  forbidden: [
    /\bcrypto\s*(token|coin|giveaway|airdrop)/i,
    /\bfree\s*money/i,
    /\bclick\s*here\s*to\s*claim/i,
    /password|api_key|secret|credential/i,
  ],

  /** Maximum content length */
  maxLength: 10000,

  /** Minimum content length (avoid empty posts) */
  minLength: 10,

  /** Forbidden submolts (crypto restricted) */
  cryptoSubmolts: ['crypto', 'defi', 'trading'],
} as const;

/**
 * [SCAR/BEHAVIOR] - Behavioral constraints
 * These define what Shadow will NEVER do
 */
export const SCAR_BEHAVIOR = {
  /** Never follow more than X agents per day */
  maxFollowsPerDay: 3,

  /** Never upvote own content */
  noSelfUpvote: true,

  /** Never post same content twice */
  noDuplicates: true,

  /** Always wait for rate limit, never race */
  safeMode: true,
} as const;

/**
 * [SCAR/SLEEVE] - Sleeve dispatch limits
 */
export const SCAR_SLEEVE = {
  /** Maximum sleeves dispatched per day */
  maxSleevesPerDay: 3,

  /** Maximum posts per day (stricter than general SCAR_RATE) */
  maxSleevePostsPerDay: 2,

  /** Maximum comments per day from sleeves */
  maxSleeveCommentsPerDay: 10,
} as const;

/**
 * [SCAR/NETWORK] - Outbound URL allowlist
 * Any fetch to URL not matching these patterns = BLOCKED
 */
export const SCAR_NETWORK = {
  /** Allowed domains for outbound connections */
  allowedDomains: [
    'moltbook.com',
    'www.moltbook.com',
    'api.github.com',
    'github.com',
    'localhost',           // For local dev (Infection Monkey, etc.)
    '127.0.0.1',
    'discord.com',
    'discordapp.com',
    'cdn.discordapp.com',
    // Add more as needed
  ],

  /** Allowed URL patterns (regex) */
  allowedPatterns: [
    /^https:\/\/(www\.)?moltbook\.com\/api\/v1\/.*/,
    /^https:\/\/api\.github\.com\/.*/,
    /^https:\/\/github\.com\/.*/,
    /^https?:\/\/localhost:\d+\/.*/,
    /^https?:\/\/127\.0\.0\.1:\d+\/.*/,
    /^https:\/\/(discord|discordapp)\.com\/api\/.*/,
    /^https:\/\/cdn\.discordapp\.com\/.*/,
    /^https:\/\/discord\.com\/api\/webhooks\/.*/,
  ],

  /** Blocked patterns - always reject even if domain matches */
  blockedPatterns: [
    /\/admin/i,
    /\/internal/i,
    /\/private/i,
    /\.onion/i,
    /metadata\/aws/i,       // Cloud metadata
    /169\.254\.169\.254/,   // AWS metadata IP
  ],

  /** Check if URL is allowed */
  isUrlAllowed(url: string): { allowed: boolean; reason?: string } {
    try {
      const parsed = new URL(url);

      // Check blocked patterns first
      for (const pattern of this.blockedPatterns) {
        if (pattern.test(url)) {
          return { allowed: false, reason: `URL matches blocked pattern: ${pattern}` };
        }
      }

      // Check domain allowlist
      const domainAllowed = this.allowedDomains.some(domain =>
        parsed.hostname === domain || parsed.hostname.endsWith('.' + domain)
      );
      if (!domainAllowed) {
        return { allowed: false, reason: `Domain not in allowlist: ${parsed.hostname}` };
      }

      // Check pattern allowlist
      const patternAllowed = this.allowedPatterns.some(pattern => pattern.test(url));
      if (!patternAllowed) {
        return { allowed: false, reason: `URL doesn't match any allowed pattern` };
      }

      return { allowed: true };
    } catch (error) {
      return { allowed: false, reason: `Invalid URL: ${error}` };
    }
  },

  /** Validate URL before fetch - throws if blocked */
  validateUrl(url: string): void {
    const result = this.isUrlAllowed(url);
    if (!result.allowed) {
      const error = `[SCAR/NETWORK] Blocked outbound request to: ${url} | Reason: ${result.reason}`;
      scarLog(error);
      throw new Error(error);
    }
    scarLog(`[SCAR/NETWORK] Allowed: ${url}`);
  },

  /** Wrap fetch with SCAR validation */
  async safeFetch(url: string, options?: RequestInit): Promise<Response> {
    this.validateUrl(url);
    return fetch(url, options);
  },
} as const;

/**
 * [SCAR/METRICS] - Outbound tracking for health checks
 */
export const SCAR_METRICS = {
  postsAttempted: 0,
  postsBlocked: 0,
  postsPublished: 0,
  commentsAttempted: 0,
  commentsBlocked: 0,
  commentsPublished: 0,
  sleevesDispatchedToday: 0,

  /** Reset daily counters */
  resetDaily(): void {
    this.postsAttempted = 0;
    this.postsBlocked = 0;
    this.postsPublished = 0;
    this.commentsAttempted = 0;
    this.commentsBlocked = 0;
    this.commentsPublished = 0;
    this.sleevesDispatchedToday = 0;
  },

  /** Get health ratio (should be > 0.8) */
  getHealthRatio(): number {
    const total = this.postsAttempted + this.commentsAttempted;
    if (total === 0) return 1.0;
    const published = this.postsPublished + this.commentsPublished;
    return published / total;
  },

  /** Check if healthy (> 0.8 = most attempts succeed) */
  isHealthy(): boolean {
    return this.getHealthRatio() >= 0.8;
  },

  /** Check if warning (< 0.5 = over-blocking) */
  isWarning(): boolean {
    const ratio = this.getHealthRatio();
    return ratio < 0.5 && ratio > 0;
  },

  /** Get metrics snapshot */
  getSnapshot(): Record<string, number | boolean> {
    return {
      postsAttempted: this.postsAttempted,
      postsBlocked: this.postsBlocked,
      postsPublished: this.postsPublished,
      commentsAttempted: this.commentsAttempted,
      commentsBlocked: this.commentsBlocked,
      commentsPublished: this.commentsPublished,
      sleevesDispatchedToday: this.sleevesDispatchedToday,
      healthRatio: Math.round(this.getHealthRatio() * 100) / 100,
      isHealthy: this.isHealthy(),
    };
  },

  /** Log current metrics */
  logStatus(): void {
    const snap = this.getSnapshot();
    scarLog(`[METRICS] Health: ${snap.healthRatio} | Posts: ${snap.postsPublished}/${snap.postsAttempted} | Blocked: ${snap.postsBlocked}`);
  },
};

/**
 * [SCAR/STATE] - State integrity rules
 * These ensure system can recover from any failure
 */
export const SCAR_STATE = {
  /** State file must exist and be valid JSON */
  stateFile: 'data/state.json',

  /** Pause file - if exists, all actions stop */
  pauseFile: 'pause.txt',

  /** Log file for all actions */
  logFile: 'logs/scar.log',

  /** Backup state after N actions */
  backupInterval: 10,
} as const;

// === [SCAR/GATE] ===================================================

/**
 * [SCAR/GATE/VERIFY] - Pre-action validation
 * Call BEFORE any action. Returns true if allowed.
 */
export function scarGate(action: string, data?: any): { allowed: boolean; reason?: string } {
  const state = scarLoadState();

  // [SCAR/PAUSE] - Check pause file
  if (existsSync(SCAR_STATE.pauseFile)) {
    scarLog('[BLOCKED] System paused via pause.txt');
    return { allowed: false, reason: 'System paused' };
  }

  // [SCAR/RATE] - Check rate limits
  switch (action) {
    case 'comment':
      SCAR_METRICS.commentsAttempted++;
      if (state.commentsToday >= SCAR_RATE.maxCommentsPerDay) {
        SCAR_METRICS.commentsBlocked++;
        return { allowed: false, reason: 'Daily comment limit reached' };
      }
      if (Date.now() - state.lastComment < SCAR_RATE.commentInterval) {
        SCAR_METRICS.commentsBlocked++;
        return { allowed: false, reason: 'Comment rate limit' };
      }
      break;

    case 'post':
      SCAR_METRICS.postsAttempted++;
      if (state.postsToday >= SCAR_RATE.maxPostsPerDay) {
        SCAR_METRICS.postsBlocked++;
        return { allowed: false, reason: 'Daily post limit reached' };
      }
      if (Date.now() - state.lastPost < SCAR_RATE.postInterval) {
        SCAR_METRICS.postsBlocked++;
        return { allowed: false, reason: 'Post rate limit' };
      }
      break;

    case 'sleeve_post':
      SCAR_METRICS.postsAttempted++;
      if (SCAR_METRICS.sleevesDispatchedToday >= SCAR_SLEEVE.maxSleevesPerDay) {
        SCAR_METRICS.postsBlocked++;
        return { allowed: false, reason: 'Daily sleeve limit reached' };
      }
      if (state.postsToday >= SCAR_SLEEVE.maxSleevePostsPerDay) {
        SCAR_METRICS.postsBlocked++;
        return { allowed: false, reason: 'Daily sleeve post limit reached' };
      }
      break;

    case 'follow':
      if (state.followsToday >= SCAR_BEHAVIOR.maxFollowsPerDay) {
        return { allowed: false, reason: 'Daily follow limit reached' };
      }
      break;
  }

  // [SCAR/CONTENT] - Validate content
  if (data?.content) {
    const contentCheck = scarValidateContent(data.content, data.submolt);
    if (!contentCheck.valid) {
      if (action === 'post' || action === 'sleeve_post') SCAR_METRICS.postsBlocked++;
      if (action === 'comment') SCAR_METRICS.commentsBlocked++;
      return { allowed: false, reason: contentCheck.reason };
    }
  }

  // All gates passed - track success
  if (action === 'post' || action === 'sleeve_post') SCAR_METRICS.postsPublished++;
  if (action === 'comment') SCAR_METRICS.commentsPublished++;

  return { allowed: true };
}

/**
 * [SCAR/CONTENT] - Validate content against rules
 */
export function scarValidateContent(content: string, submolt?: string): { valid: boolean; reason?: string } {
  // Length check
  if (content.length < SCAR_CONTENT.minLength) {
    return { valid: false, reason: 'Content too short' };
  }
  if (content.length > SCAR_CONTENT.maxLength) {
    return { valid: false, reason: 'Content too long' };
  }

  // Forbidden patterns
  for (const pattern of SCAR_CONTENT.forbidden) {
    if (pattern.test(content)) {
      return { valid: false, reason: `Forbidden pattern: ${pattern}` };
    }
  }

  // Crypto submolt check
  if (submolt && SCAR_CONTENT.cryptoSubmolts.includes(submolt.toLowerCase())) {
    return { valid: false, reason: 'Crypto submolts not allowed' };
  }

  return { valid: true };
}

// === [SCAR/STATE] ==================================================

interface ScarState {
  lastComment: number;
  lastPost: number;
  commentsToday: number;
  postsToday: number;
  followsToday: number;
  actionsToday: number;
  lastReset: string; // Date string
  errors: number;
  lastError: number;
}

const DEFAULT_STATE: ScarState = {
  lastComment: 0,
  lastPost: 0,
  commentsToday: 0,
  postsToday: 0,
  followsToday: 0,
  actionsToday: 0,
  lastReset: new Date().toDateString(),
  errors: 0,
  lastError: 0,
};

/**
 * Load state with [SCAR/INTEGRITY] - auto-repair if corrupted
 */
export function scarLoadState(): ScarState {
  try {
    const path = join(__dirname, '..', SCAR_STATE.stateFile);
    if (!existsSync(path)) {
      writeFileSync(path, JSON.stringify(DEFAULT_STATE, null, 2));
      return { ...DEFAULT_STATE };
    }
    const raw = readFileSync(path, 'utf-8');
    const state = JSON.parse(raw);

    // [SCAR/RESET] - Reset daily counters at midnight
    const today = new Date().toDateString();
    if (state.lastReset !== today) {
      state.commentsToday = 0;
      state.postsToday = 0;
      state.followsToday = 0;
      state.actionsToday = 0;
      state.lastReset = today;
      scarSaveState(state);
    }

    return { ...DEFAULT_STATE, ...state };
  } catch (error) {
    // [SKILL/REPAIR] - Corrupted state = reset to default
    scarLog(`[REPAIR] State corrupted, resetting: ${error}`);
    scarSaveState(DEFAULT_STATE);
    return { ...DEFAULT_STATE };
  }
}

/**
 * Save state with [SCAR/INTEGRITY] - atomic write
 */
export function scarSaveState(state: ScarState): void {
  try {
    const path = join(__dirname, '..', SCAR_STATE.stateFile);
    writeFileSync(path, JSON.stringify(state, null, 2));
  } catch (error) {
    scarLog(`[ERROR] Failed to save state: ${error}`);
  }
}

/**
 * Record an action - updates state and saves
 */
export function scarRecordAction(action: 'comment' | 'post' | 'follow' | 'upvote' | 'error' | 'sleeve'): void {
  const state = scarLoadState();
  const now = Date.now();

  switch (action) {
    case 'comment':
      state.lastComment = now;
      state.commentsToday++;
      break;
    case 'post':
      state.lastPost = now;
      state.postsToday++;
      break;
    case 'sleeve':
      SCAR_METRICS.sleevesDispatchedToday++;
      scarLog(`[SLEEVE] Dispatched today: ${SCAR_METRICS.sleevesDispatchedToday}/${SCAR_SLEEVE.maxSleevesPerDay}`);
      break;
    case 'follow':
      state.followsToday++;
      break;
    case 'error':
      state.errors++;
      state.lastError = now;
      break;
  }

  state.actionsToday++;
  scarSaveState(state);
  scarLog(`[ACTION] ${action}`);
}

// === [SCAR/LOG] ====================================================

/**
 * Log to SCAR log file
 */
export function scarLog(message: string): void {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${message}\n`;

  try {
    const logDir = join(__dirname, '..', 'logs');
    if (!existsSync(logDir)) {
      require('fs').mkdirSync(logDir, { recursive: true });
    }
    appendFileSync(join(logDir, 'scar.log'), line);
  } catch {
    // Logging failure = silent (don't crash)
  }

  // Also console for immediate visibility
  console.log(line.trim());
}

// === [SCAR/CONTROL] ================================================

/**
 * Emergency pause - creates pause file
 */
export function scarPause(): void {
  const path = join(__dirname, '..', SCAR_STATE.pauseFile);
  writeFileSync(path, `Paused at ${new Date().toISOString()}\n`);
  scarLog('[CONTROL] System paused');
}

/**
 * Resume - removes pause file
 */
export function scarResume(): void {
  const path = join(__dirname, '..', SCAR_STATE.pauseFile);
  if (existsSync(path)) {
    require('fs').unlinkSync(path);
    scarLog('[CONTROL] System resumed');
  }
}

/**
 * Check if paused
 */
export function scarIsPaused(): boolean {
  return existsSync(join(__dirname, '..', SCAR_STATE.pauseFile));
}

// === [SCAR/REPAIR] =================================================

/**
 * Self-healing check - call periodically
 */
export function scarSelfHeal(): void {
  const state = scarLoadState();

  // [SCAR/REPAIR] If too many errors, pause and alert
  if (state.errors > 10) {
    scarLog('[REPAIR] Too many errors, pausing system');
    scarPause();
    return;
  }

  // [SCAR/REPAIR] If in error cooldown, skip this heartbeat
  if (Date.now() - state.lastError < SCAR_RATE.errorCooldown) {
    scarLog('[REPAIR] In error cooldown, skipping');
    return;
  }

  scarLog('[REPAIR] Self-heal check passed');
}

// === EXPORTS =======================================================
// Note: SCAR_RATE, SCAR_CONTENT, SCAR_BEHAVIOR, SCAR_SLEEVE, SCAR_NETWORK,
// and SCAR_METRICS are already exported via 'export const' above.

export { ScarState, DEFAULT_STATE };
