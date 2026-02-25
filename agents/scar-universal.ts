/**
 * SCAR Universal - Hard Constraint Enforcement System
 *
 * Derived from Shadow's SCAR (Shadow's Architectural Immune Response)
 * Generalized for use across all systems: PAI, ClawMem, Shadow, and future agents
 *
 * PHILOSOPHY:
 * Every perk is a poophole. SCARs are not perks - they are immutable
 * boundaries that define safe operation. They CANNOT be bypassed.
 *
 * USAGE:
 * 1. Create a UniversalSCAR instance
 * 2. Register constraints
 * 3. Call gate() before ANY action
 * 4. Only proceed if gate() returns { allowed: true }
 */

// =============================================================================
// Types
// =============================================================================

export interface Action {
  type: string;
  subtype?: string;
  source: string;      // 'pai' | 'clawmem' | 'shadow' | etc.
  timestamp: number;
}

export interface ConstraintContext {
  action: Action;
  data: unknown;
  state: Record<string, unknown>;
}

export interface ValidationResult {
  valid: boolean;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export interface Violation {
  action: Action;
  constraintName: string;
  reason: string;
  timestamp: number;
  data?: unknown;
}

export interface GateResult {
  allowed: boolean;
  reason?: string;
  constraint?: string;
  violations?: Violation[];
}

export type ConstraintCategory = 'rate' | 'content' | 'behavior' | 'state' | 'network';

export interface Constraint<TState = Record<string, unknown>> {
  name: string;
  category: ConstraintCategory;
  description: string;
  validate: (context: ConstraintContext, state: TState) => ValidationResult;
  onViolation?: (violation: Violation) => void | Promise<void>;
  priority?: number;  // Higher = checked first
}

export interface SCARConfig {
  name: string;
  logFile?: string;
  pauseFile?: string;
  onViolation?: (violation: Violation) => void | Promise<void>;
}

// =============================================================================
// Built-in Constraints
// =============================================================================

/**
 * Rate Limit Constraint
 *
 * Enforces rate limits per action type with configurable windows
 */
export function createRateLimitConstraint(
  actionType: string,
  maxActions: number,
  windowMs: number
): Constraint {
  return {
    name: `rate-limit:${actionType}`,
    category: 'rate',
    description: `Max ${maxActions} ${actionType} actions per ${windowMs}ms`,
    validate: (context, state) => {
      const key = `rate:${actionType}`;
      const now = Date.now();
      const timestamps = (state[key] as number[] | undefined) || [];

      // Filter to within window
      const recentTimestamps = timestamps.filter(t => now - t < windowMs);

      if (recentTimestamps.length >= maxActions) {
        const oldestInWindow = Math.min(...recentTimestamps);
        const waitMs = windowMs - (now - oldestInWindow);

        return {
          valid: false,
          reason: `Rate limit exceeded for ${actionType}. Try again in ${Math.ceil(waitMs / 1000)}s.`,
          metadata: { current: recentTimestamps.length, max: maxActions, waitMs }
        };
      }

      return { valid: true };
    }
  };
}

/**
 * Daily Limit Constraint
 *
 * Enforces daily action limits with automatic reset at midnight
 */
export function createDailyLimitConstraint(
  actionType: string,
  maxPerDay: number
): Constraint {
  return {
    name: `daily-limit:${actionType}`,
    category: 'rate',
    description: `Max ${maxPerDay} ${actionType} actions per day`,
    validate: (context, state) => {
      const key = `daily:${actionType}`;
      const today = new Date().toDateString();
      const dayState = state[key] as { date: string; count: number } | undefined;

      // Reset if new day
      if (!dayState || dayState.date !== today) {
        return { valid: true, metadata: { reset: true } };
      }

      if (dayState.count >= maxPerDay) {
        return {
          valid: false,
          reason: `Daily limit reached for ${actionType} (${maxPerDay}/day)`,
          metadata: { current: dayState.count, max: maxPerDay }
        };
      }

      return { valid: true };
    }
  };
}

/**
 * Content Pattern Constraint
 *
 * Blocks content matching forbidden patterns
 */
export function createContentPatternConstraint(
  name: string,
  patterns: RegExp[],
  description?: string
): Constraint {
  return {
    name: `content-pattern:${name}`,
    category: 'content',
    description: description || `Blocks content matching ${patterns.length} pattern(s)`,
    validate: (context) => {
      const data = context.data as { content?: string; text?: string; body?: string };
      const content = data?.content || data?.text || data?.body || '';

      if (typeof content !== 'string') {
        return { valid: true }; // No string content to check
      }

      for (const pattern of patterns) {
        if (pattern.test(content)) {
          return {
            valid: false,
            reason: `Content matches forbidden pattern: ${pattern.toString()}`,
            metadata: { pattern: pattern.toString(), matched: true }
          };
        }
      }

      return { valid: true };
    }
  };
}

/**
 * Content Length Constraint
 *
 * Validates content length bounds
 */
export function createContentLengthConstraint(
  minLen: number,
  maxLen: number
): Constraint {
  return {
    name: `content-length`,
    category: 'content',
    description: `Content must be ${minLen}-${maxLen} characters`,
    validate: (context) => {
      const data = context.data as { content?: string; text?: string; body?: string };
      const content = data?.content || data?.text || data?.body || '';

      if (typeof content !== 'string') {
        return { valid: true };
      }

      if (content.length < minLen) {
        return {
          valid: false,
          reason: `Content too short: ${content.length} < ${minLen}`,
          metadata: { length: content.length, min: minLen }
        };
      }

      if (content.length > maxLen) {
        return {
          valid: false,
          reason: `Content too long: ${content.length} > ${maxLen}`,
          metadata: { length: content.length, max: maxLen }
        };
      }

      return { valid: true };
    }
  };
}

/**
 * Behavior Constraint
 *
 * Enforces behavioral rules (no self-action, no duplicates, etc.)
 */
export function createBehaviorConstraint(
  name: string,
  rule: (context: ConstraintContext, state: Record<string, unknown>) => ValidationResult,
  description?: string
): Constraint {
  return {
    name: `behavior:${name}`,
    category: 'behavior',
    description: description || name,
    validate: rule
  };
}

/**
 * Pause File Constraint
 *
 * Blocks all actions when pause file exists
 */
export function createPauseFileConstraint(
  pauseFilePath: string,
  fileExists: (path: string) => boolean
): Constraint {
  return {
    name: 'pause-file',
    category: 'state',
    description: 'Blocks actions when pause file exists',
    priority: 1000, // Check first
    validate: () => {
      if (fileExists(pauseFilePath)) {
        return {
          valid: false,
          reason: 'System paused via pause file',
          metadata: { pauseFile: pauseFilePath }
        };
      }
      return { valid: true };
    }
  };
}

// =============================================================================
// Universal SCAR Class
// =============================================================================

export class UniversalSCAR<TState extends Record<string, unknown> = Record<string, unknown>> {
  private constraints: Constraint<TState>[] = [];
  private config: SCARConfig;
  private violationLog: Violation[] = [];

  constructor(config: SCARConfig) {
    this.config = config;
  }

  /**
   * Register a single constraint
   */
  register(constraint: Constraint<TState>): this {
    this.constraints.push(constraint);
    // Sort by priority (higher first)
    this.constraints.sort((a, b) => (b.priority || 0) - (a.priority || 0));
    return this;
  }

  /**
   * Register multiple constraints
   */
  registerMany(constraints: Constraint<TState>[]): this {
    for (const c of constraints) {
      this.register(c);
    }
    return this;
  }

  /**
   * Remove a constraint by name
   */
  remove(name: string): boolean {
    const index = this.constraints.findIndex(c => c.name === name);
    if (index !== -1) {
      this.constraints.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Get all registered constraints
   */
  getConstraints(): Constraint<TState>[] {
    return [...this.constraints];
  }

  /**
   * The Gate - Call before ANY action
   *
   * Returns { allowed: true } only if ALL constraints pass
   */
  gate(action: Action, data: unknown, state: TState): GateResult {
    const context: ConstraintContext = {
      action,
      data,
      state
    };

    const violations: Violation[] = [];

    for (const constraint of this.constraints) {
      const result = constraint.validate(context, state);

      if (!result.valid) {
        const violation: Violation = {
          action,
          constraintName: constraint.name,
          reason: result.reason || 'Constraint violated',
          timestamp: Date.now(),
          data
        };

        violations.push(violation);
        this.violationLog.push(violation);

        // Call violation handlers
        constraint.onViolation?.(violation);
        this.config.onViolation?.(violation);

        // Log violation
        this.logViolation(violation);

        // Return first violation (constraints sorted by priority)
        return {
          allowed: false,
          reason: result.reason,
          constraint: constraint.name,
          violations
        };
      }
    }

    return { allowed: true, violations: [] };
  }

  /**
   * Get violation history
   */
  getViolations(limit?: number): Violation[] {
    if (limit) {
      return this.violationLog.slice(-limit);
    }
    return [...this.violationLog];
  }

  /**
   * Clear violation history
   */
  clearViolations(): void {
    this.violationLog = [];
  }

  /**
   * Export constraints configuration
   */
  exportConfig(): { constraints: { name: string; category: string; description: string }[] } {
    return {
      constraints: this.constraints.map(c => ({
        name: c.name,
        category: c.category,
        description: c.description
      }))
    };
  }

  private logViolation(violation: Violation): void {
    const timestamp = new Date(violation.timestamp).toISOString();
    const line = `[${timestamp}] [${violation.constraintName}] ${violation.reason}\n`;

    // Log to console
    console.error(`[SCAR BLOCKED] ${violation.constraintName}: ${violation.reason}`);

    // Could also write to file if config.logFile is set
    if (this.config.logFile) {
      try {
        // In real implementation, would use fs.appendFileSync
        // For now, just console
      } catch {
        // Ignore logging errors
      }
    }
  }
}

// =============================================================================
// Factory Function
// =============================================================================

/**
 * Create a SCAR instance with common constraints
 */
export function createSCAR<TState extends Record<string, unknown> = Record<string, unknown>>(
  config: SCARConfig,
  options?: {
    defaultRateLimits?: Map<string, { max: number; windowMs: number }>;
    forbiddenPatterns?: RegExp[];
    pauseFile?: string;
    fileExists?: (path: string) => boolean;
  }
): UniversalSCAR<TState> {
  const scar = new UniversalSCAR<TState>(config);

  // Add pause file constraint if configured
  if (options?.pauseFile && options?.fileExists) {
    scar.register(createPauseFileConstraint(options.pauseFile, options.fileExists));
  }

  // Add rate limits if configured
  if (options?.defaultRateLimits) {
    for (const [action, limit] of options.defaultRateLimits) {
      scar.register(createRateLimitConstraint(action, limit.max, limit.windowMs));
    }
  }

  // Add forbidden patterns if configured
  if (options?.forbiddenPatterns && options.forbiddenPatterns.length > 0) {
    scar.register(createContentPatternConstraint('forbidden', options.forbiddenPatterns));
  }

  return scar;
}

// =============================================================================
// Exports
// =============================================================================

export default UniversalSCAR;
