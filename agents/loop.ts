/**
 * Unified Executing Loop
 *
 * The central execution engine that coordinates all AI system actions.
 * Every action flows through this loop, passing through SCAR gates
 * before execution.
 *
 * ARCHITECTURE:
 *
 *   Events/Timers/MCP/Hooks → Queue → SCAR Gate → Handler → Observer
 *                                     │
 *                                     ▼
 *                              [BLOCKED] → Log + Skip
 *
 * GUARANTEES:
 * - No action executes without passing SCAR
 * - All actions are observable (logged/metric'd)
 * - Component failures don't crash the system
 * - State is consistent and recoverable
 */

import { UniversalSCAR, type Action, type GateResult } from './scar-universal';

// =============================================================================
// Types
// =============================================================================

export type WorkSource = 'timer' | 'event' | 'mcp' | 'hook' | 'manual';

export type Priority = 'low' | 'normal' | 'high' | 'critical';

export interface WorkItem {
  id: string;
  source: WorkSource;
  action: Action;
  payload: unknown;
  priority: Priority;
  timestamp: number;
  attempts: number;
  maxAttempts: number;
  scheduledFor?: number;  // For delayed execution
  metadata?: Record<string, unknown>;
}

export interface HandlerResult {
  success: boolean;
  output?: unknown;
  error?: string;
  durationMs: number;
}

export type ActionHandler = (
  payload: unknown,
  state: UnifiedState
) => Promise<HandlerResult>;

export interface Observation {
  id: string;
  timestamp: number;
  type: ObservationType;
  workId: string;
  action: Action;
  data: Record<string, unknown>;
}

export type ObservationType =
  | 'work:enqueued'
  | 'work:received'
  | 'work:blocked'
  | 'work:executing'
  | 'work:completed'
  | 'work:failed'
  | 'work:retrying'
  | 'work:expired'
  | 'loop:started'
  | 'loop:paused'
  | 'loop:resumed'
  | 'loop:error';

export interface UnifiedState {
  // Global state
  loopStatus: 'running' | 'paused' | 'stopped';
  lastActivity: number;

  // Per-namespace state (PAI, ClawMem, Shadow, etc.)
  namespaces: Record<string, Record<string, unknown>>;

  // Metrics
  metrics: {
    totalEnqueued: number;
    totalCompleted: number;
    totalBlocked: number;
    totalFailed: number;
  };
}

export interface LoopConfig {
  name: string;
  idleMs: number;
  maxQueueSize: number;
  observationLog?: string;
  stateFile?: string;
}

// =============================================================================
// Priority Queue Implementation
// =============================================================================

class PriorityQueue<T extends { priority: Priority; timestamp: number }> {
  private items: T[] = [];
  private maxSize: number;

  constructor(maxSize: number = 10000) {
    this.maxSize = maxSize;
  }

  enqueue(item: T): boolean {
    if (this.items.length >= this.maxSize) {
      return false;
    }

    this.items.push(item);
    this.sort();
    return true;
  }

  dequeue(): T | null {
    return this.items.shift() || null;
  }

  peek(): T | null {
    return this.items[0] || null;
  }

  size(): number {
    return this.items.length;
  }

  clear(): void {
    this.items = [];
  }

  private sort(): void {
    const priorityOrder: Record<Priority, number> = {
      critical: 0,
      high: 1,
      normal: 2,
      low: 3
    };

    this.items.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return a.timestamp - b.timestamp;  // FIFO within same priority
    });
  }
}

// =============================================================================
// Observer Implementation
// =============================================================================

class Observer {
  private observations: Observation[] = [];
  private maxSize: number = 10000;
  private logFile?: string;

  constructor(logFile?: string) {
    this.logFile = logFile;
  }

  record(
    type: ObservationType,
    workId: string,
    action: Action,
    data: Record<string, unknown>
  ): Observation {
    const observation: Observation = {
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      type,
      workId,
      action,
      data
    };

    this.observations.push(observation);

    // Trim old observations
    if (this.observations.length > this.maxSize) {
      this.observations = this.observations.slice(-this.maxSize);
    }

    // Log to console
    this.log(observation);

    return observation;
  }

  getRecent(limit: number = 100): Observation[] {
    return this.observations.slice(-limit);
  }

  getByType(type: ObservationType, limit?: number): Observation[] {
    const filtered = this.observations.filter(o => o.type === type);
    return limit ? filtered.slice(-limit) : filtered;
  }

  private log(observation: Observation): void {
    const timestamp = new Date(observation.timestamp).toISOString();
    console.log(`[${timestamp}] [${observation.type}] ${observation.action.type} (${observation.workId.slice(0, 8)})`);
  }
}

// =============================================================================
// Unified Loop Implementation
// =============================================================================

export class UnifiedLoop {
  private queue: PriorityQueue<WorkItem>;
  private scar: UniversalSCAR<UnifiedState>;
  private handlers: Map<string, ActionHandler> = new Map();
  private observer: Observer;
  private config: LoopConfig;

  private state: UnifiedState;
  private running: boolean = false;
  private paused: boolean = false;

  private intervalId?: ReturnType<typeof setInterval>;
  private timerHandlers: Map<string, () => void> = new Map();

  constructor(
    scar: UniversalSCAR<UnifiedState>,
    config: LoopConfig
  ) {
    this.scar = scar;
    this.config = config;
    this.queue = new PriorityQueue(config.maxQueueSize);
    this.observer = new Observer(config.observationLog);

    this.state = {
      loopStatus: 'stopped',
      lastActivity: Date.now(),
      namespaces: {},
      metrics: {
        totalEnqueued: 0,
        totalCompleted: 0,
        totalBlocked: 0,
        totalFailed: 0
      }
    };
  }

  // ===========================================================================
  // Core Loop
  // ===========================================================================

  /**
   * Start the executing loop
   */
  async start(): Promise<void> {
    if (this.running) {
      console.warn('Loop already running');
      return;
    }

    this.running = true;
    this.paused = false;
    this.state.loopStatus = 'running';

    this.observer.record('loop:started', 'system', { type: 'loop' }, { config: this.config });

    // Main loop
    while (this.running) {
      if (this.paused) {
        await this.sleep(1000);
        continue;
      }

      const work = this.queue.dequeue();

      if (!work) {
        await this.sleep(this.config.idleMs);
        continue;
      }

      // Check scheduled time
      if (work.scheduledFor && work.scheduledFor > Date.now()) {
        // Re-queue for later
        this.queue.enqueue(work);
        await this.sleep(this.config.idleMs);
        continue;
      }

      await this.processWork(work);
      this.state.lastActivity = Date.now();
    }
  }

  /**
   * Stop the executing loop gracefully
   */
  async stop(): Promise<void> {
    this.running = false;
    this.state.loopStatus = 'stopped';

    // Clear timers
    for (const [, handler] of this.timerHandlers) {
      handler();
    }
    this.timerHandlers.clear();

    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  /**
   * Pause the loop (can be resumed)
   */
  pause(): void {
    this.paused = true;
    this.state.loopStatus = 'paused';
    this.observer.record('loop:paused', 'system', { type: 'loop' }, {});
  }

  /**
   * Resume a paused loop
   */
  resume(): void {
    this.paused = false;
    this.state.loopStatus = 'running';
    this.observer.record('loop:resumed', 'system', { type: 'loop' }, {});
  }

  // ===========================================================================
  // Work Processing
  // ===========================================================================

  /**
   * Process a single work item
   */
  private async processWork(work: WorkItem): Promise<void> {
    this.observer.record('work:received', work.id, work.action, {
      source: work.source,
      priority: work.priority
    });

    // 1. SCAR Gate - CRITICAL: This cannot be bypassed
    const gate = this.scar.gate(work.action, work.payload, this.state);

    if (!gate.allowed) {
      this.observer.record('work:blocked', work.id, work.action, {
        reason: gate.reason,
        constraint: gate.constraint
      });
      this.state.metrics.totalBlocked++;
      return;
    }

    // 2. Find handler
    const handlerKey = this.getHandlerKey(work.action);
    const handler = this.handlers.get(handlerKey);

    if (!handler) {
      this.observer.record('work:failed', work.id, work.action, {
        error: `No handler for action: ${handlerKey}`
      });
      this.state.metrics.totalFailed++;
      return;
    }

    // 3. Execute handler
    this.observer.record('work:executing', work.id, work.action, {});

    try {
      const result = await handler(work.payload, this.state);

      if (result.success) {
        this.observer.record('work:completed', work.id, work.action, {
          durationMs: result.durationMs,
          output: result.output
        });
        this.state.metrics.totalCompleted++;
      } else {
        throw new Error(result.error || 'Handler returned failure');
      }

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);

      this.observer.record('work:failed', work.id, work.action, {
        error: errorMessage,
        attempt: work.attempts
      });

      // Retry logic
      if (work.attempts < work.maxAttempts) {
        work.attempts++;
        this.observer.record('work:retrying', work.id, work.action, {
          attempt: work.attempts,
          maxAttempts: work.maxAttempts
        });
        this.queue.enqueue(work);
      } else {
        this.observer.record('work:expired', work.id, work.action, {
          attempts: work.attempts,
          error: errorMessage
        });
        this.state.metrics.totalFailed++;
      }
    }
  }

  // ===========================================================================
  // Enqueue Interface
  // ===========================================================================

  /**
   * Enqueue work for execution
   */
  async enqueue(
    action: Omit<Action, 'timestamp'>,
    payload: unknown,
    options?: {
      source?: WorkSource;
      priority?: Priority;
      maxAttempts?: number;
      scheduledFor?: number;
    }
  ): Promise<string> {
    const fullAction: Action = {
      ...action,
      timestamp: Date.now()
    };

    const work: WorkItem = {
      id: crypto.randomUUID(),
      source: options?.source || 'manual',
      action: fullAction,
      payload,
      priority: options?.priority || 'normal',
      timestamp: Date.now(),
      attempts: 0,
      maxAttempts: options?.maxAttempts ?? 3,
      scheduledFor: options?.scheduledFor
    };

    const success = this.queue.enqueue(work);

    if (!success) {
      throw new Error('Queue is full');
    }

    this.state.metrics.totalEnqueued++;

    this.observer.record('work:enqueued', work.id, fullAction, {
      source: work.source,
      priority: work.priority
    });

    return work.id;
  }

  // ===========================================================================
  // Handler Registration
  // ===========================================================================

  /**
   * Register an action handler
   */
  registerHandler(actionType: string, handler: ActionHandler): void {
    this.handlers.set(actionType, handler);
  }

  /**
   * Register multiple handlers
   */
  registerHandlers(handlers: Record<string, ActionHandler>): void {
    for (const [action, handler] of Object.entries(handlers)) {
      this.registerHandler(action, handler);
    }
  }

  /**
   * Remove a handler
   */
  removeHandler(actionType: string): boolean {
    return this.handlers.delete(actionType);
  }

  private getHandlerKey(action: Action): string {
    return action.subtype ? `${action.type}:${action.subtype}` : action.type;
  }

  // ===========================================================================
  // Timer Registration
  // ===========================================================================

  /**
   * Register a periodic timer that enqueues work
   */
  registerTimer(
    name: string,
    intervalMs: number,
    action: Omit<Action, 'timestamp'>,
    payload: () => unknown
  ): void {
    const id = setInterval(async () => {
      try {
        const dynamicPayload = payload();
        await this.enqueue(
          { ...action, source: 'timer' },
          dynamicPayload,
          { source: 'timer' }
        );
      } catch (error) {
        console.error(`Timer ${name} error:`, error);
      }
    }, intervalMs);

    this.timerHandlers.set(name, () => clearInterval(id));
  }

  /**
   * Remove a timer
   */
  removeTimer(name: string): boolean {
    const handler = this.timerHandlers.get(name);
    if (handler) {
      handler();
      this.timerHandlers.delete(name);
      return true;
    }
    return false;
  }

  // ===========================================================================
  // State Access
  // ===========================================================================

  getState(): UnifiedState {
    return { ...this.state };
  }

  getNamespaceState(namespace: string): Record<string, unknown> | undefined {
    return this.state.namespaces[namespace];
  }

  setNamespaceState(namespace: string, state: Record<string, unknown>): void {
    this.state.namespaces[namespace] = state;
  }

  getMetrics(): UnifiedState['metrics'] {
    return { ...this.state.metrics };
  }

  getQueueSize(): number {
    return this.queue.size();
  }

  getObservations(limit?: number): Observation[] {
    return this.observer.getRecent(limit);
  }

  // ===========================================================================
  // Utilities
  // ===========================================================================

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// =============================================================================
// Factory Function
// =============================================================================

export function createUnifiedLoop(
  scar: UniversalSCAR<UnifiedState>,
  config?: Partial<LoopConfig>
): UnifiedLoop {
  return new UnifiedLoop(scar, {
    name: 'unified-loop',
    idleMs: 100,
    maxQueueSize: 10000,
    ...config
  });
}

// =============================================================================
// Exports
// =============================================================================

export default UnifiedLoop;
