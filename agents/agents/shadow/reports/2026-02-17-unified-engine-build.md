#!/bin/bash
# Shadow Session Report Generator
# Run: ./reports/session-report.sh

cat << 'EOF'

╔════════════════════════════════════════════════════════════════════════╗
║                     SHADOW SESSION REPORT                              ║
║                     2026-02-17                                         ║
╚════════════════════════════════════════════════════════════════════════╝

## WHAT WE BUILT

┌─────────────────────────────────────────────────────────────────────────┐
│                         UNIFIED EXECUTING ENGINE                        │
│                                                                         │
│   BEFORE: Everything was text files                                    │
│   ├── Shadow     → SOUL.md, MEMORY.md (just docs)                      │
│   ├── ClawMem    → MCP server (only runs when called)                  │
│   ├── PAI        → Hooks (run on events, no persistence)               │
│   └── Problem    → Nothing executes autonomously                       │
│                                                                         │
│   AFTER: Daemons that actually RUN                                     │
│   ┌─────────────────────────────────────────────────────────────────┐   │
│   │  /home/peace/clawd/engine/                                      │   │
│   │  ├── scar-universal.ts  → Hard constraints (cannot be bypassed) │   │
│   │  ├── loop.ts            → Events → Queue → SCAR → Handler      │   │
│   │  ├── index.ts           → Engine factory                        │   │
│   │  │                                                             │   │
│   │  ├── shadow-daemon.ts   → Shadow handlers ✓                    │   │
│   │  ├── pai-daemon.ts      → PAI handlers ✓                       │   │
│   │  └── clawmem-daemon.ts  → ClawMem handlers ✓                   │   │
│   └─────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                           THREE DAEMONS                                 │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  SHADOW DAEMON                     RATE LIMITS                          │
│  ├── shadow:heartbeat              48/day (every 30 min)                │
│  ├── shadow:comment                40/day                               │
│  ├── shadow:post                   5/day                                │
│  ├── shadow:fight                  unlimited                            │
│  └── shadow:scan                   unlimited                            │
│                                                                         │
│  PAI DAEMON                        RATE LIMITS                          │
│  ├── pai:work:create               100/day                              │
│  ├── pai:work:add_item             unlimited                            │
│  ├── pai:learning:capture          100/day                              │
│  └── pai:memory:save               unlimited                            │
│                                                                         │
│  CLAWMEM DAEMON                    RATE LIMITS                          │
│  ├── clawmem:reindex               24/day (hourly max)                  │
│  ├── clawmem:embed                 12/day                               │
│  ├── clawmem:build_graphs          24/day                               │
│  ├── clawmem:search                1000/day                             │
│  └── clawmem:stats                 unlimited                            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│                         SESSION REPORT SYSTEM                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ./shadow              → Shows report + help                            │
│  ./shadow report       → Just the report                                │
│  ./shadow fight        → Combat through SCAR gates                      │
│  ./shadow status       → Current state                                  │
│                                                                         │
│  Report shows:                                                          │
│  - Fights won/lost                                                      │
│  - XP gained                                                            │
│  - Comments posted                                                      │
│  - Threats found                                                        │
│  - Lab scans                                                            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

## THE VISION: FORT + SLEEVES

┌─────────────────────────────────────────────────────────────────────────┐
│                                                                         │
│                         ┌─────────────────┐                             │
│                         │   SHADOW FORT   │                             │
│                         │   (Cloud VPS)   │                             │
│                         │                 │                             │
│                         │  - Memory       │                             │
│                         │  - 24/7 daemon  │                             │
│                         │  - Coordination │                             │
│                         └────────┬────────┘                             │
│                                  │                                      │
│           ┌──────────────────────┼──────────────────────┐              │
│           │                      │                      │              │
│           ▼                      ▼                      ▼              │
│      ┌─────────┐           ┌─────────┐           ┌─────────┐          │
│      │ SLEEVE  │           │ SLEEVE  │           │ SLEEVE  │          │
│      │         │           │         │           │         │          │
│      │ Moltbook│           │ Discord │           │ Other   │          │
│      │         │           │         │           │ Agent   │          │
│      └────┬────┘           └────┬────┘           │ Spaces  │          │
│           │                     │                └────┬────┘          │
│           └─────────────────────┴─────────────────────┘              │
│                                 │                                      │
│                                 ▼                                      │
│                         Returns to Fort                                │
│                         Fort remembers                                 │
│                         Sleeves get smarter                            │
│                                                                         │
│   AI GRAVITY THESIS:                                                    │
│   - Mass = Memory (Fort grows)                                         │
│   - Sleeves = Probes (extend reach)                                    │
│   - Gravity = Reputation (agents recognize us)                         │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘

## NEXT STEPS

  1. GET A VPS
     - Oracle Free Tier (free forever)
     - Hetzner ($4/mo)
     - DigitalOcean ($4/mo)

  2. DEPLOY THE FORT
     - SSH into VPS
     - Run fort-deploy.sh
     - Shadow daemon starts 24/7

  3. BUILD SLEEVES
     - Moltbook sleeve (first)
     - Discord sleeve
     - More agent spaces

  4. SET UP REPORTING
     - Shadow pings you on Discord
     - Or email summaries
     - Or SSH in to check

## FILES CREATED THIS SESSION

  /home/peace/clawd/engine/
  ├── scar-universal.ts      (468 lines) - Constraint system
  ├── loop.ts                (596 lines) - Execution loop
  ├── index.ts               (341 lines) - Engine factory
  ├── test.ts                          - Test script
  ├── shadow-daemon.ts                 - Shadow handlers
  ├── pai-daemon.ts                    - PAI handlers
  └── clawmem-daemon.ts                - ClawMem handlers

  /home/peace/clawd/agents/shadow/
  ├── engine/session-report.ts         - Report generator
  ├── shadow                           - Updated CLI (report command)
  └── data/session-report.md           - Generated report

  /home/peace/.claude/hooks/
  └── ShadowReport.hook.ts             - Session start hook

## CURRENT SHADOW STATUS

  Level: 10
  XP: 2380
  HP: 36/110
  Treasury: $583
  Intel: 6
  Trapped: 4

## COMMANDS

  ./shadow              # Show report + start
  ./shadow fight        # Combat simulation
  ./shadow scan         # Lab container scan
  ./shadow report       # Session report
  ./shadow daemon       # Start 24/7 daemon
  ./shadow status       # Current stats

  bun run engine/shadow-daemon.ts gate comment   # Test SCAR gate
  bun run engine/pai-daemon.ts process           # Process PAI queue
  bun run engine/clawmem-daemon.ts stats         # ClawMem stats

═════════════════════════════════════════════════════════════════════════════

                    "LLMs have mass. Daemons have gravity."

═════════════════════════════════════════════════════════════════════════════

EOF
