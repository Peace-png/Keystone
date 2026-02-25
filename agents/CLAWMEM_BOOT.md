# ClawMem Boot Protocol

**Purpose:** When a session starts in this territory, ClawMem should surface this context.

---

## Location: /home/peace/clawd/

This is the **clawd framework** - an agent workspace for building autonomous agents with persistent memory.

### What Lives Here

| Directory | What It Is |
|-----------|------------|
| `agents/shadow/` | Shadow - cybersecurity combat agent |
| `canvas/` | Web canvas (empty) |

### Session Start Protocol (from AGENTS.md)

When landing in clawd or its subdirectories, load:

1. **`SOUL.md`** - Agent philosophy (who agents are)
2. **`USER.md`** - Who you're helping (if exists)
3. **`memory/YYYY-MM-DD.md`** - Today + yesterday's context
4. **`MEMORY.md`** - Long-term curated memory (main sessions only)

### Key Files

- `AGENTS.md` - Workspace rules, session protocol, heartbeat guidance
- `BOOTSTRAP.md` - First-run setup (delete after use)
- `HEARTBEAT.md` - Periodic task triggers
- `TOOLS.md` - Local configuration notes

---

## Location: /home/peace/clawd/agents/shadow/

This is **Shadow** - an autonomous cybersecurity combat agent.

### What Shadow Is

1. **Game Version**: "Zero Day Battlegrounds" - esports where you train AI battle companions
2. **Service Version**: Hires out as security/research service ($9-99/month)
3. **Lab Version**: Runs vulnerability scanning in local Docker lab

### Shadow's Key Files

| File | Purpose |
|------|---------|
| `SOUL.md` | Shadow's identity - ruthless in combat, loyal guardian |
| `MEMORY.md` | What Shadow learned across sessions |
| `SESSION_SUMMARY.md` | Current state snapshot |
| `CAPABILITIES.md` | 6 combat modes, abilities |
| `MISSIONS.md` | Match types (CTF, Breach, Duel, etc.) |
| `THEORY_GRAVITY.md` | AI Gravity framework - mass = data, gravity = return rate |

### Shadow's Engine

```
engine/
├── shadow.ts         ← Core agent (stats, abilities)
├── monkey-bridge.ts  ← Battle runner (Infection Monkey)
├── soul.ts           ← Memory manager
├── spike-logger.ts   ← SNN data collection
└── map.ts            ← Territory boundaries (legal)
```

### Current Status

- Local lab: 4 vulnerable Docker containers running
- Key insight: "LLMs have mass. Daemons have gravity."
- Next: Deploy fort to VPS, wire Brian2 to spike data

---

## Connection to PAI

Clawd exists alongside PAI (`~/.claude/`) but is separate.

| System | Location | Purpose |
|--------|----------|---------|
| PAI | `~/.claude/` | Personal AI assistant (Nova) |
| clawd | `~/clawd/` | Agent framework for specialized agents |
| Desktop | `/mnt/c/Users/peace/Desktop/` | Research projects |

### TELOS Connection

Shadow relates to the user's TELOS goals:
- **G1**: Prove Structural Memory Wells Work
- Shadow tests: Does daemon persistence create "gravity" (return rate)?

Same thesis as Meditative Memory (Stem SNN), different substrate.

---

## What ClawMem Should Do On Boot

When session starts in `/home/peace/clawd/` or subdirectories:

1. Query: `clawmem query "session start context {location}"`
2. Surface: Current SESSION_SUMMARY, recent memory files
3. Load: Location-specific boot context (this file)

---

*Created: 2026-02-17*
*Purpose: Give ClawMem a boot protocol so sessions start with context*
