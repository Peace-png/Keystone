# Unified Engine - Implementation Guide

## Quick Start

```typescript
import { createEngine } from './engine';

// 1. Create the engine
const engine = createEngine({
  name: 'clawd-engine',
  systems: ['pai', 'clawmem', 'shadow'],
  pauseFile: '/home/peace/clawd/pause.txt',
  rateLimits: {
    'pai:voice': { max: 60, windowMs: 60000 },      // 60 voice calls/min
    'clawmem:search': { max: 100, windowMs: 60000 }, // 100 searches/min
    'shadow:comment': { max: 40, windowMs: 86400000 } // 40 comments/day
  }
});

// 2. Register handlers for each system
engine.registerHandlers({
  // PAI handlers
  'pai:voice': async (payload, state) => {
    // Call voice server
    return { success: true, durationMs: 150 };
  },
  'pai:capture': async (payload, state) => {
    // Capture work/learning
    return { success: true, durationMs: 50 };
  },

  // ClawMem handlers
  'clawmem:search': async (payload, state) => {
    // Execute search
    return { success: true, durationMs: 200, output: [] };
  },
  'clawmem:index': async (payload, state) => {
    // Index document
    return { success: true, durationMs: 100 };
  },

  // Shadow handlers
  'shadow:scan': async (payload, state) => {
    // Run vulnerability scan
    return { success: true, durationMs: 5000 };
  },
  'shadow:comment': async (payload, state) => {
    // Post comment (SCAR will rate-limit)
    return { success: true, durationMs: 1000 };
  }
});

// 3. Start the engine
await engine.start();

// 4. Enqueue work
await engine.enqueue(
  { type: 'shadow:scan', source: 'timer' },
  { target: '172.17.0.2', ports: [22, 80, 443] }
);

// 5. Check metrics
const metrics = engine.getMetrics();
console.log(`Completed: ${metrics.totalCompleted}, Blocked: ${metrics.totalBlocked}`);
```

---

## Wiring PAI Hooks

Replace direct action hooks with unified bridge:

```typescript
// hooks/UnifiedBridge.hook.ts
import { getEngine } from '../engine/bridge';

export async function handleStop(transcriptPath: string) {
  const engine = getEngine();

  // Instead of acting directly, enqueue to unified loop
  await engine.enqueue(
    { type: 'pai:stop', source: 'hook' },
    { transcriptPath },
    { priority: 'high' }
  );
}

export async function handleVoice(message: string, voiceId: string) {
  const engine = getEngine();

  // SCAR will enforce rate limits
  const check = engine.checkGate(
    { type: 'pai:voice', source: 'hook' },
    { message, voiceId }
  );

  if (!check.allowed) {
    console.log(`Voice blocked: ${check.reason}`);
    return;
  }

  await engine.enqueue(
    { type: 'pai:voice', source: 'hook' },
    { message, voiceId },
    { priority: 'high' }
  );
}
```

---

## Wiring ClawMem MCP

Wrap MCP handlers through SCAR:

```typescript
// In ClawMem's mcp.ts
import { getEngine } from '../engine/bridge';

// Replace direct search with engine-routed search
server.registerTool(
  "search",
  { ... },
  async ({ query, limit }) => {
    const engine = getEngine();

    // Check SCAR gate first
    const check = engine.checkGate(
      { type: 'clawmem:search', source: 'mcp' },
      { query, limit }
    );

    if (!check.allowed) {
      return { content: [{ type: "text", text: `Blocked: ${check.reason}` }] };
    }

    // Enqueue to unified loop
    const workId = await engine.enqueue(
      { type: 'clawmem:search', source: 'mcp' },
      { query, limit }
    );

    // For synchronous MCP calls, we need to wait for result
    // This is a simplification - real impl would use async/await with handler
    return executeSearch(query, limit);
  }
);
```

---

## Migrating Shadow SCAR

Shadow's existing SCAR becomes a constraint set in unified engine:

```typescript
// engine/constraints/shadow.ts
import { createDailyLimitConstraint, createContentPatternConstraint } from '../scar-universal';

export const shadowConstraints = [
  // Rate limits (from scar.ts)
  createDailyLimitConstraint('comment', 40),
  createDailyLimitConstraint('post', 5),
  createDailyLimitConstraint('follow', 3),

  // Content constraints
  createContentPatternConstraint('shadow-forbidden', [
    /\bcrypto\s*(token|coin|giveaway|airdrop)/i,
    /\bfree\s*money/i,
    /password|api_key|secret|credential/i,
  ]),

  // Behavior constraints (custom)
  {
    name: 'no-self-upvote',
    category: 'behavior',
    description: 'Shadow cannot upvote its own content',
    validate: (context) => {
      const data = context.data as { targetAuthor?: string; selfId?: string };
      if (data.targetAuthor === data.selfId) {
        return { valid: false, reason: 'Cannot upvote own content' };
      }
      return { valid: true };
    }
  },

  {
    name: 'no-duplicates',
    category: 'behavior',
    description: 'No duplicate content within 24 hours',
    validate: (context, state) => {
      const data = context.data as { contentHash?: string };
      const recentHashes = (state['shadow:recentHashes'] as string[]) || [];

      if (data.contentHash && recentHashes.includes(data.contentHash)) {
        return { valid: false, reason: 'Duplicate content detected' };
      }
      return { valid: true };
    }
  }
];
```

---

## Architecture Benefits

| Aspect | Before | After |
|--------|--------|-------|
| **Constraint enforcement** | Per-system (only Shadow) | Universal (all systems) |
| **Execution visibility** | Fragmented logs | Unified observations |
| **Rate limiting** | Manual per-system | Centralized SCAR |
| **Graceful degradation** | Inconsistent | Built into loop |
| **Adding new systems** | Architect new loop | Register handlers + constraints |

---

## File Structure

```
/home/peace/clawd/
├── engine/
│   ├── index.ts              # Main export
│   ├── loop.ts               # Unified executing loop
│   ├── scar-universal.ts     # SCAR constraint system
│   ├── constraints/          # Built-in constraints
│   │   ├── shadow.ts         # Shadow-specific constraints
│   │   ├── pai.ts            # PAI-specific constraints
│   │   └── common.ts         # Shared constraints
│   └── bridge.ts             # Singleton engine instance
├── docs/
│   └── UNIFIED_ARCHITECTURE.md
└── pause.txt                 # Emergency pause file
```

---

## Emergency Controls

```bash
# Pause all execution
touch /home/peace/clawd/pause.txt

# Resume execution
rm /home/peace/clawd/pause.txt

# Check engine status (via CLI, once built)
bun run /home/peace/clawd/engine/cli.ts status

# View recent observations
bun run /home/peace/clawd/engine/cli.ts logs --tail 50
```

---

## Next Steps

1. **Phase 1** (Complete): Architecture design, SCAR universal, Loop implementation
2. **Phase 2**: Wire PAI hooks through unified bridge
3. **Phase 3**: Wire ClawMem MCP through unified SCAR
4. **Phase 4**: Migrate Shadow to use unified constraints
5. **Phase 5**: Build observability dashboard

---

*Implementation Guide - Track 8 & 9 Research Synthesis*
*Created: 2026-02-17*
