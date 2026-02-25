/**
 * Unified Engine - Entry Point
 *
 * This module provides the unified executing architecture for all AI systems:
 * - PAI (hooks, memory, skills)
 * - ClawMem (MCP server, search, indexing)
 * - Shadow (daemon, SCAR constraints)
 * - Future agents and systems
 *
 * USAGE:
 *
 * ```typescript
 * import { createEngine } from './engine';
 *
 * // Create engine with default SCAR constraints
 * const engine = createEngine({
 *   name: 'unified-engine',
 *   systems: ['pai', 'clawmem', 'shadow']
 * });
 *
 * // Start the loop
 * await engine.start();
 *
 * // Enqueue work
 * await engine.enqueue(
 *   { type: 'pai:hook', source: 'manual' },
 *   { hook: 'Stop', transcriptPath: '/path/to/transcript' }
 * );
 *
 * // Stop gracefully
 * await engine.stop();
 * ```
 */

import { UniversalSCAR, createSCAR, type Constraint, type Action } from './scar-universal';
import { UnifiedLoop, createUnifiedLoop, type UnifiedState, type ActionHandler, type WorkSource, type Priority } from './loop';

// =============================================================================
// Re-exports
// =============================================================================

export { UniversalSCAR, createSCAR } from './scar-universal';
export type { Constraint, ConstraintCategory, Action as ScarAction, GateResult } from './scar-universal';

export { UnifiedLoop, createUnifiedLoop } from './loop';
export type { UnifiedState, ActionHandler, WorkSource, Priority, WorkItem, HandlerResult, Observation } from './loop';

// =============================================================================
// Engine Configuration
// =============================================================================

export interface EngineConfig {
  name: string;
  systems: ('pai' | 'clawmem' | 'shadow' | string)[];

  // SCAR configuration
  constraints?: Constraint<UnifiedState>[];
  pauseFile?: string;

  // Loop configuration
  idleMs?: number;
  maxQueueSize?: number;
  observationLog?: string;

  // Rate limits (applied to all systems)
  rateLimits?: {
    [actionType: string]: { max: number; windowMs: number };
  };
}

// =============================================================================
// Default Constraints
// =============================================================================

import {
  createRateLimitConstraint,
  createDailyLimitConstraint,
  createContentPatternConstraint,
  createContentLengthConstraint,
  createPauseFileConstraint
} from './scar-universal';

/**
 * Create default constraints for common actions
 */
function createDefaultConstraints(config: EngineConfig): Constraint<UnifiedState>[] {
  const constraints: Constraint<UnifiedState>[] = [];

  // Pause file constraint
  if (config.pauseFile) {
    constraints.push(createPauseFileConstraint(
      config.pauseFile,
      (path) => {
        try {
          require('fs').existsSync(path);
          return true;
        } catch {
          return false;
        }
      }
    ));
  }

  // Rate limits from config
  if (config.rateLimits) {
    for (const [action, limit] of Object.entries(config.rateLimits)) {
      constraints.push(createRateLimitConstraint(action, limit.max, limit.windowMs));
    }
  }

  // Default content constraints
  constraints.push(createContentLengthConstraint(1, 100000));

  // Forbidden patterns (security)
  constraints.push(createContentPatternConstraint('security', [
    /password\s*=\s*['"][^'"]+['"]/i,
    /api[_-]?key\s*=\s*['"][^'"]+['"]/i,
    /secret\s*=\s*['"][^'"]+['"]/i,
  ], 'Blocks content containing secrets'));

  return constraints;
}

// =============================================================================
// Engine Class
// =============================================================================

export class UnifiedEngine {
  private loop: UnifiedLoop;
  private scar: UniversalSCAR<UnifiedState>;
  private config: EngineConfig;
  private started: boolean = false;

  constructor(config: EngineConfig) {
    this.config = config;

    // Create SCAR with constraints
    this.scar = createSCAR<UnifiedState>(
      { name: `${config.name}-scar` },
      { pauseFile: config.pauseFile }
    );

    // Register default constraints
    const defaultConstraints = createDefaultConstraints(config);
    this.scar.registerMany(defaultConstraints);

    // Register custom constraints
    if (config.constraints) {
      this.scar.registerMany(config.constraints);
    }

    // Create the loop
    this.loop = createUnifiedLoop(this.scar, {
      name: `${config.name}-loop`,
      idleMs: config.idleMs ?? 100,
      maxQueueSize: config.maxQueueSize ?? 10000,
      observationLog: config.observationLog
    });
  }

  // ===========================================================================
  // Lifecycle
  // ===========================================================================

  /**
   * Start the engine
   */
  async start(): Promise<void> {
    if (this.started) {
      console.warn('Engine already started');
      return;
    }

    this.started = true;

    // Start the loop (runs in background)
    this.loop.start();
  }

  /**
   * Stop the engine gracefully
   */
  async stop(): Promise<void> {
    await this.loop.stop();
    this.started = false;
  }

  /**
   * Pause the engine
   */
  pause(): void {
    this.loop.pause();
  }

  /**
   * Resume the engine
   */
  resume(): void {
    this.loop.resume();
  }

  // ===========================================================================
  // Work Enqueuing
  // ===========================================================================

  /**
   * Enqueue work for execution
   */
  async enqueue(
    action: {
      type: string;
      subtype?: string;
      source: WorkSource;
    },
    payload: unknown,
    options?: {
      priority?: Priority;
      maxAttempts?: number;
      scheduledFor?: number;
    }
  ): Promise<string> {
    return this.loop.enqueue(action, payload, options);
  }

  // ===========================================================================
  // Handler Registration
  // ===========================================================================

  /**
   * Register an action handler
   */
  registerHandler(actionType: string, handler: ActionHandler): void {
    this.loop.registerHandler(actionType, handler);
  }

  /**
   * Register multiple handlers
   */
  registerHandlers(handlers: Record<string, ActionHandler>): void {
    this.loop.registerHandlers(handlers);
  }

  // ===========================================================================
  // Constraint Management
  // ===========================================================================

  /**
   * Add a constraint
   */
  addConstraint(constraint: Constraint<UnifiedState>): void {
    this.scar.register(constraint);
  }

  /**
   * Remove a constraint
   */
  removeConstraint(name: string): boolean {
    return this.scar.remove(name);
  }

  /**
   * Get all constraints
   */
  getConstraints(): Constraint<UnifiedState>[] {
    return this.scar.getConstraints();
  }

  // ===========================================================================
  // State & Observability
  // ===========================================================================

  /**
   * Get engine state
   */
  getState(): UnifiedState {
    return this.loop.getState();
  }

  /**
   * Get metrics
   */
  getMetrics(): { totalEnqueued: number; totalCompleted: number; totalBlocked: number; totalFailed: number } {
    return this.loop.getMetrics();
  }

  /**
   * Get queue size
   */
  getQueueSize(): number {
    return this.loop.getQueueSize();
  }

  /**
   * Get recent observations
   */
  getObservations(limit?: number): Array<{
    id: string;
    timestamp: number;
    type: string;
    workId: string;
    action: { type: string; subtype?: string; source: string; timestamp: number };
    data: Record<string, unknown>;
  }> {
    return this.loop.getObservations(limit);
  }

  /**
   * Check if SCAR would allow an action (without executing)
   */
  checkGate(action: { type: string; subtype?: string; source: string }, payload: unknown): {
    allowed: boolean;
    reason?: string;
    constraint?: string;
  } {
    const state = this.loop.getState();
    const result = this.scar.gate(
      { ...action, timestamp: Date.now() },
      payload,
      state
    );
    return {
      allowed: result.allowed,
      reason: result.reason,
      constraint: result.constraint
    };
  }
}

// =============================================================================
// Factory Function
// =============================================================================

export function createEngine(config: EngineConfig): UnifiedEngine {
  return new UnifiedEngine(config);
}

// =============================================================================
// Default Export
// =============================================================================

export default UnifiedEngine;
