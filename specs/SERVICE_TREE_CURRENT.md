# KEYSTONE SERVICE TREE (Current State)

**Generated:** 2026-03-04
**Source:** Actual code implementation, not documentation

---

## LAYERED ARCHITECTURE MODEL

Keystone is a **layered agent operating system**. Each layer has clear responsibilities.

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  LAYER 5: MEMORY                                                            │
│  ClawMem index • SESSION.md • SOUL.md • PARKING_LOT.md                      │
│  (persistence, retrieval, knowledge)                                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  LAYER 4: REFLECTION                                                        │
│  EVENTS logging • scar-session-checkpoint.ts • SCAR advisory generation     │
│  (session-end analysis, principle surfacing)                                │
├─────────────────────────────────────────────────────────────────────────────┤
│  LAYER 3: COGNITIVE                                                         │
│  SCAR principle enforcement • Cognitive firewall • Shadow intelligence      │
│  (reasoning, safety, decision filtering)                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  LAYER 2: SERVICE                                                           │
│  CORE • SEARCH • SHADOW • FIREWALL • SCAR • WITNESS (future)                │
│  (daemons, background processing, API clients)                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  LAYER 1: BOOT                                                              │
│  START-KEYSTONE.cmd • CHECK_IDENTITY.bat • Service launch + health checks   │
│  (initialization, identity verification, orchestration)                      │
└─────────────────────────────────────────────────────────────────────────────┘
```

**Why layers matter:**
1. Future contributors understand the system faster
2. Services don't drift into unclear responsibilities
3. Reasoning, safety, and memory are clearly separated

---

## A) ZOOMED-OUT: FULL SYSTEM TREE

```
KEYSTONE INFRASTRUCTURE
│
├── BOOT SEQUENCE (START-KEYSTONE.cmd)
│   │
│   ├── [1/4] Ollama (GPU) ───────────────────────────────────── external
│   │   └── curl http://localhost:11434/api/tags
│   │
│   ├── [2/4] SERVICES (parallel launch)
│   │   │
│   │   ├── CORE (pai-daemon.ts) ──────────────────────────────┐
│   │   ├── SEARCH (clawmem-daemon.ts) ────────────────────────┤ unified
│   │   ├── SHADOW (shadow-daemon.ts) ─────────────────────────┤ engine
│   │   ├── FIREWALL (cognitive-firewall.ts) ──────────────────┤ loop
│   │   └── SCAR (scar-daemon.ts) ─────────────────────────────┘
│   │
│   ├── [3/4] HEALTH SUMMARY
│   │   └── 6/7 services (Witness SKIP)
│   │
│   └── [4/4] CLAUDE CODE (wt.exe)
│       └── Node.js runs @anthropic-ai/claude-code/cli.js
│
├── CONSTITUTION (behavioral rules)
│   ├── SOUL.md ────── 13 principles (P1-P13) with YIN/YANG/CONSTRAINTS
│   ├── USER.md ────── Human profile, workflow rules, memory authority
│   ├── VOICE.md ───── Communication style (story mode, vocabulary)
│   └── SESSION.md ─── Session handoff + EVENTS section + SCAR advisories
│
├── PERSISTENCE LAYERS
│   ├── ClawMem Index ───── ~/.cache/clawmem/index.sqlite (744+ docs)
│   ├── SCAR State ──────── agents/scar-daemon/state.json
│   ├── Firewall Logs ───── agents/firewall/logs/
│   └── Shadow State ────── agents/shadow/state/
│
└── MECHANISMS
    ├── PARKING_LOT.md ─── Open issues (non-blocking, boot reminder)
    ├── CHECK_IDENTITY.bat  P11 enforcement (git identity before action)
    └── SCAR Checkpoint ─── Session-end reflection via scar-session-checkpoint.ts
```

---

## B) SERVICE SUBTREES

### CORE (pai-daemon.ts)

**Role:** Unified engine orchestrator - wires PAI hooks to executing architecture

```
CORE (pai-daemon.ts)
│
├── INPUT
│   └── ~/.claude/MEMORY/STATE/pai-queue.jsonl (hook enqueues)
│
├── RESPONSIBILITIES
│   ├── Watch queue file for new work items
│   ├── Process through SCAR-gated loop
│   ├── Manage WORK/ directory lifecycle
│   └── Coordinate with unified engine (index.ts)
│
├── OUTPUT
│   ├── ~/.claude/MEMORY/WORK/<session>/  (work artifacts)
│   └── ~/.claude/MEMORY/LEARNING/        (captured learnings)
│
├── STATE
│   └── Window: "Keystone Core*"
│
└── HEALTH CHECK
    └── tasklist /FI "WINDOWTITLE eq Keystone Core*"
```

---

### SEARCH (clawmem-daemon.ts)

**Role:** Memory indexing, embedding, graph building

```
SEARCH (clawmem-daemon.ts)
│
├── INPUT
│   ├── Collections: ~/clawmem/ (markdown, code, docs)
│   └── GPU: http://localhost:11434 (Ollama embed/LLM)
│
├── RESPONSIBILITIES
│   ├── clawmem:reindex      - Trigger collection reindex
│   ├── clawmem:embed        - Generate embeddings
│   ├── clawmem:build_graphs - Build temporal/semantic graphs
│   ├── clawmem:consolidate  - Memory consolidation
│   └── clawmem:stats        - Store index statistics
│
├── OUTPUT
│   ├── ~/.cache/clawmem/index.sqlite (744+ documents)
│   └── ~/.claude/MEMORY/STATE/clawmem-state.json
│
├── STATE
│   └── Window: "Keystone Search*"
│
└── HEALTH CHECK
    └── tasklist /FI "WINDOWTITLE eq Keystone Search*"

┌─────────────────────────────────────────────────────────────┐
│  ENV VARS (GPU config)                                      │
│  CLAWMEM_LLM_URL=http://localhost:11434                     │
│  CLAWMEM_RERANK_URL=http://localhost:11434                  │
│  CLAWMEM_EMBED_URL=http://localhost:11434                   │
│  CLAWMEM_NO_LOCAL_MODELS=false                              │
└─────────────────────────────────────────────────────────────┘
```

---

### SHADOW (shadow-daemon.ts)

**Role:** Cybersecurity agent - Moltbook API integration

```
SHADOW (shadow-daemon.ts)
│
├── INPUT
│   ├── Moltbook API: https://www.moltbook.com/api/v1
│   └── API key: process.env.MOLTBOOK_API_KEY || config/credentials.json
│
├── RESPONSIBILITIES
│   ├── shadow:ping         - Health check API
│   ├── shadow:status       - Get agent status
│   ├── shadow:sendMessage  - Send message to network
│   └── shadow:getMessages  - Retrieve messages
│
├── OUTPUT
│   └── agents/shadow/state/ (session state)
│
├── SCAR INTEGRATION
│   └── Uses scar.ts for rate limiting (SCAR_RATE)
│
├── STATE
│   └── Window: "Keystone Shadow*"
│
└── HEALTH CHECK
    └── tasklist /FI "WINDOWTITLE eq Keystone Shadow*"
```

---

### FIREWALL (cognitive-firewall.ts)

**Role:** Three-layer protection system

```
FIREWALL (cognitive-firewall.ts)
│
├── LAYERS
│   ├── Capability Layer - What actions are allowed
│   ├── Judgment Layer   - Pattern detection, intent analysis
│   └── Guardian Layer   - Hard constraints, HALT protocol
│
├── CONSTRAINTS
│   ├── Instruction override detection
│   ├── Identity theft prevention
│   ├── Data extraction blocking
│   └── 8 default constraints (constraints.json)
│
├── ACTIONS
│   ├── BLOCK  - Hard stop
│   ├── FLAG   - Log warning
│   ├── HALT   - System halt (writes HALT file)
│   └── TRANSFORM - Modify input
│
├── OUTPUT
│   ├── agents/firewall/constraints.json
│   ├── agents/firewall/logs/
│   └── agents/firewall/HALT (critical violation)
│
├── STATE
│   └── Window: "Keystone Firewall*"
│
└── HEALTH CHECK
    └── tasklist /FI "WINDOWTITLE eq Keystone Firewall*"
```

---

### SCAR (scar-daemon.ts + scar-session-checkpoint.ts)

**Role:** Living Conscience - principle enforcement through matching

```
SCAR SUBSYSTEM
│
├── DAEMON (scar-daemon.ts)
│   │
│   ├── INPUT
│   │   └── constitution/SOUL.md (13 principles P1-P13)
│   │
│   ├── PHASE 1: PARSER ✅
│   │   ├── Extract RULE from each principle
│   │   ├── Extract triggers (action keywords)
│   │   ├── Extract ORIGIN (where it came from)
│   │   ├── Extract CONSEQUENCE LEVEL
│   │   ├── Extract YIN (the wound - what went wrong)
│   │   ├── Extract YANG (the consequence - harm caused)
│   │   ├── Extract CONSTRAINTS (repair rules)
│   │   └── Extract REMEMBER (narrative/quote)
│   │
│   ├── PHASE 2: ENRICHED MATCH ✅
│   │   ├── MatchResult.advisory.wound
│   │   ├── MatchResult.advisory.consequence
│   │   ├── MatchResult.advisory.checks[]
│   │   └── MatchResult.advisory.remember
│   │
│   ├── MATCHING LOGIC
│   │   ├── Score: 0.3 per trigger match
│   │   ├── Threshold: >= 0.6 AND >= 2 triggers
│   │   └── Returns: { matched, scar, relevance, reason, advisory }
│   │
│   └── STATE
│       └── agents/scar-daemon/state.json (matches triggered, recent)
│
├── SESSION CHECKPOINT (scar-session-checkpoint.ts)
│   │
│   ├── INPUT
│   │   └── SESSION.md "## EVENTS (for SCAR)" section ONLY
│   │
│   ├── PHASE 3: INTEGRATION ✅
│   │   ├── Extract only EVENTS bullets (not philosophy)
│   │   ├── Run SCAR.match() on extracted events
│   │   ├── Compute events hash for de-dupe
│   │   └── Append advisory to SESSION.md if new
│   │
│   ├── TAGS PARSING
│   │   ├── domain: scar | witness | memory | core | search | shadow | firewall | git | boot
│   │   ├── risk: low | medium | high
│   │   ├── artifact: filename
│   │   └── signal: verification | failure | mismatch | config | deletion | security | performance
│   │
│   ├── DE-DUPE STRATEGY
│   │   ├── Marker: <!-- SCAR_ADVISORY: P5 <events_hash> -->
│   │   ├── Hash: SHA256(events).slice(0, 8)
│   │   └── Skip if marker exists in SESSION.md
│   │
│   └── OUTPUT
│       └── Appends "## SCAR Advisories" section to SESSION.md
│
├── HEALTH CHECK
│   └── agents/scar-daemon/heartbeat file exists
│
└── COMMANDS
    ├── bun run scar-daemon.ts start    - Start daemon
    ├── bun run scar-daemon.ts match "X" - Test match
    ├── bun run scar-daemon.ts list     - List loaded scars
    └── bun run scar-session-checkpoint.ts run - Session end checkpoint
```

---

### WITNESS (DISABLED)

**Role:** Cryptographic file integrity verification

```
WITNESS (DISABLED)
│
├── STATUS: SKIP (disabled in START-KEYSTONE.cmd)
│
├── INTENDED ROLE
│   ├── SHA-256 hash verification of files
│   ├── Detect unauthorized modifications
│   └── State invariance proof (observation doesn't change observer)
│
├── WHY DISABLED
│   └── Batch file syntax issues (nested if ERRORLEVEL blocks)
│
├── UNIQUE CAPABILITY
│   └── ONLY service doing cryptographic file integrity verification
│       (SCAR does JSON state repair, not hash verification)
│
├── FUTURE PATH
│   └── zkVM implementation for ZK-verified observer
│
└── BOOT OUTPUT
    └── "Witness SKIP"
```

---

## C) COMBINED FLOW: EVENT → LOGGING → SCAR → MEMORY

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         RUNTIME PIPELINE                                     │
└─────────────────────────────────────────────────────────────────────────────┘

  USER ACTION                    AI RESPONSE                   CAPTURE
       │                              │                            │
       ▼                              ▼                            ▼
  ┌─────────┐                  ┌─────────────┐            ┌──────────────┐
  │ Prompt  │─────────────────▶│ Claude Code │───────────▶│ EVENTS section│
  └─────────┘                  └─────────────┘            │ (SESSION.md)  │
                                       │                   └───────┬──────┘
                                       │                           │
                              ┌────────┴────────┐                 │
                              │                 │                 │
                              ▼                 ▼                 ▼
                       ┌──────────┐     ┌──────────┐     ┌───────────────┐
                       │ CORE     │     │ FIREWALL │     │ SCAR CHECKPOINT│
                       │ (queue)  │     │ (check)  │     │ (session end)  │
                       └──────────┘     └──────────┘     └───────┬───────┘
                              │                 │                 │
                              │                 │                 ▼
                              │                 │         ┌───────────────────┐
                              │                 │         │ Extract EVENTS     │
                              │                 │         │ (Intent/Action/   │
                              │                 │         │  Outcome + Tags)  │
                              │                 │         └─────────┬─────────┘
                              │                 │                   │
                              │                 │                   ▼
                              │                 │         ┌───────────────────┐
                              │                 │         │ SCAR.match()      │
                              │                 │         │ (trigger check)   │
                              │                 │         └─────────┬─────────┘
                              │                 │                   │
                              │                 │           ┌───────┴───────┐
                              │                 │           │               │
                              │                 │           ▼               ▼
                              │                 │    ┌──────────┐    ┌──────────┐
                              │                 │    │ MATCHED  │    │ NO MATCH │
                              │                 │    │ (P5-P13) │    │ (skip)   │
                              │                 │    └────┬─────┘    └──────────┘
                              │                 │         │
                              │                 │         ▼
                              │                 │    ┌────────────────────┐
                              │                 │    │ Check de-dupe      │
                              │                 │    │ (marker exists?)   │
                              │                 │    └─────────┬──────────┘
                              │                 │              │
                              │                 │      ┌───────┴───────┐
                              │                 │      │               │
                              │                 │      ▼               ▼
                              │                 │ ┌─────────┐   ┌──────────┐
                              │                 │ │ NEW     │   │ DUPLICATE│
                              │                 │ │ (append)│   │ (skip)   │
                              │                 │ └────┬────┘   └──────────┘
                              │                 │      │
                              ▼                 ▼      ▼
                       ┌──────────────────────────────────────────────────┐
                       │                  MEMORY LAYERS                    │
                       ├──────────────────────────────────────────────────┤
                       │ ClawMem Index ──── ~/.cache/clawmem/index.sqlite │
                       │ SESSION.md ──────── constitution/SESSION.md      │
                       │ SOUL.md ──────────── constitution/SOUL.md         │
                       │ PARKING_LOT.md ───── (open issues)               │
                       └──────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  SESSION LIFECYCLE                                                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  BOOT ─────────▶ RUNTIME ─────────▶ SESSION END ─────────▶ SHUTDOWN        │
│    │                │                    │                      │           │
│    │                │                    │                      │           │
│    ▼                ▼                    ▼                      ▼           │
│ CHECK_IDENTITY   EVENTS logged    SCAR checkpoint       ClawMem reindex    │
│ Services start   to SESSION.md    runs match()          Final save         │
│ Parking Lot msg  by AI            Appends advisory                         │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## D) FILE TOUCHPOINTS MAP

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         FILE TOUCHPOINTS                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  START-KEYSTONE.cmd                                                          │
│  ├── READS: CHECK_IDENTITY.bat                                               │
│  ├── READS: PARKING_LOT.md (boot reminder)                                   │
│  └── LAUNCHES: 5 services                                                    │
│                                                                              │
│  scar-daemon.ts                                                              │
│  ├── READS: constitution/SOUL.md (13 principles)                             │
│  └── WRITES: agents/scar-daemon/state.json, heartbeat                        │
│                                                                              │
│  scar-session-checkpoint.ts                                                  │
│  ├── READS: constitution/SESSION.md (EVENTS section)                         │
│  └── APPENDS: constitution/SESSION.md (SCAR Advisories)                      │
│                                                                              │
│  clawmem-daemon.ts                                                           │
│  ├── READS: ~/clawmem/ (collections)                                         │
│  └── WRITES: ~/.cache/clawmem/index.sqlite                                   │
│                                                                              │
│  cognitive-firewall.ts                                                       │
│  ├── READS: agents/firewall/constraints.json                                 │
│  └── WRITES: agents/firewall/logs/, HALT                                     │
│                                                                              │
│  CONSTITUTION FILES (behavioral source of truth)                             │
│  ├── SOUL.md ───── 13 principles (P1-P13)                                    │
│  ├── USER.md ───── Human profile, workflow rules                             │
│  ├── VOICE.md ──── Communication style                                       │
│  └── SESSION.md ── Session handoff + EVENTS + SCAR Advisories                │
│                                                                              │
│  MECHANISM FILES                                                             │
│  ├── PARKING_LOT.md ─── Open issues (boot reminder)                          │
│  └── CHECK_IDENTITY.bat  P11 enforcement (git identity)                      │
│                                                                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## E) QUICK REFERENCE COMMANDS

```bash
# Boot sequence
cd C:\Users\peace\Desktop\Keystone
START-KEYSTONE.cmd

# SCAR commands
bun run scar-daemon.ts list              # List all 13 principles
bun run scar-daemon.ts match "delete folder"  # Test match
bun run scar-daemon.ts status            # Show daemon status
bun run scar-session-checkpoint.ts run   # Session end checkpoint
bun run scar-session-checkpoint.ts events # Show extracted EVENTS

# ClawMem commands
bun run clawmem-daemon.ts reindex        # Rebuild search index

# Health checks (Windows)
tasklist /FI "WINDOWTITLE eq Keystone Core*"
tasklist /FI "WINDOWTITLE eq Keystone Search*"
tasklist /FI "WINDOWTITLE eq Keystone Shadow*"
tasklist /FI "WINDOWTITLE eq Keystone Firewall*"
# SCAR: check agents/scar-daemon/heartbeat file exists

# Verify constitution loaded
grep -c "### P" constitution/SOUL.md  # Should show 13
```

---

## F) PARKING LOT STATUS

| # | Issue | Status |
|---|-------|--------|
| 1 | Memory destination ambiguity | OPEN (rule added) |
| 2 | SCAR not wired to runtime | PARTIAL (Phase 3 checkpoint done) |
| 3 | ClawMem ingestion scope | OPEN |
| 4 | SOUL.md richness consumed | DONE (Phase 1+2+3) |

---

*This document reflects the actual implementation as of 2026-03-04.*
