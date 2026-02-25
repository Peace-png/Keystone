# SESSION SUMMARY - 2026-02-24

## Keystone AI Infrastructure

### The Big Picture

```
┌─────────────────────────────────────────────────────────────┐
│                  KEYSTONE AI INFRASTRUCTURE                  │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  LAYER 1: Core (Identity & Skills)                          │
│  - Nova AI Assistant (Quantum Observer persona)             │
│  - LIGHTHOUSE goal system                                   │
│  - Skills system (Journalism, OSINT, RedTeam, etc.)         │
│                                                              │
│  LAYER 2: Agents (Background Services)                       │
│  - Unified engine (runs all services)                       │
│  - Shadow agent (cybersecurity)                             │
│  - SCAR (immune system - rate limits, rules)                │
│                                                              │
│  LAYER 3: Search (File Indexing)                            │
│  - Vector search (GPU powered via Ollama)                   │
│  - MCP server named "keystone"                              │
│                                                              │
│  LAYER 4: Knowledge Base (PARA Method)                      │
│  - 1-projects/ - Active work                                │
│  - 2-areas/ - Responsibilities (includes LIGHTHOUSE)        │
│  - 3-resources/ - Reference material                        │
│  - 4-archive/ - Inactive                                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## How To Start

```
Double-click: C:\Users\peace\START-KEYSTONE.cmd
```

This starts:
- Ollama (GPU)
- All 3 background services
- Claude Code
- Auto-saves on exit

---

## Search Commands

```bash
SEARCH.bat search "query"      # Text search
SEARCH.bat vsearch "query"     # Vector search (GPU)
SEARCH.bat status              # Check index
SEARCH.bat update              # Index new files
```

---

## Folder Structure

```
Desktop\Keystone\
│
├── core/               ← AI identity, skills, Nova
│   ├── soul.md         ← Nova's personality
│   ├── lighthouse/     ← Goals system (also in knowledge/)
│   └── skills/         ← Special abilities
│
├── agents/             ← Background services
│   ├── scar-universal.ts   ← SCAR engine
│   └── agents/shadow/      ← Cybersecurity agent
│
├── search/             ← File search engine
│
├── knowledge/          ← Your knowledge base (PARA)
│   ├── 1-projects/     ← Active work
│   ├── 2-areas/        ← Responsibilities
│   │   └── lighthouse/ ← Goals, mission, projects
│   ├── 3-resources/    ← Reference
│   ├── 4-archive/      ← Inactive
│   ├── README.md       ← How to use
│   └── TEMPLATE.md     ← New doc template
│
├── settings/           ← Configuration
├── database/           ← Search index
├── models/             ← AI models
├── config/             ← Config files
└── memory/             ← Saved memories
```

---

## SCAR (The Immune System)

Located in: `Desktop\Keystone\agents\`

**What it does:**
- Rate limits (40 comments/day, 5 posts/day)
- Content filtering (no crypto spam, no secrets)
- Network allowlist (only approved domains)
- Emergency pause button

**Key files:**
- `scar-universal.ts` - Main engine
- `agents/shadow/engine/scar.ts` - Shadow's rules

---

## LIGHTHOUSE (Goals System)

Located in: `core/lighthouse/` AND `knowledge/2-areas/lighthouse/`

21 files including:
- GOALS.md, MISSION.md, PROJECTS.md
- BELIEFS.md, CHALLENGES.md, IDEAS.md
- PREDICTIONS.md, WISDOM.md, WRONG.md

---

## Knowledge Base Rules

Based on research (LlamaIndex, Pinecone, PARA):

| Rule | Why |
|------|-----|
| 100-200 docs max | Quality over quantity |
| One idea per doc | Better retrieval |
| Summary at top (15 words) | Semantic weight |
| Your own words | Don't paste |
| PARA structure | Proven method |

---

## MCP Server

Named: `keystone` (was clawmem)

Config: `C:\Users\peace\.claude.json`

---

## Nova (AI Assistant)

**Identity:** Quantum Observer / The Periscope
**Location:** `core/soul.md`

**Missions:**
- M0: Protect the Space of Inquiry
- M1: Reveal the Hidden Variables
- M2: Defend Epistemic Humility

---

## What's Sovereign

Everything runs from ONE folder:
```
Desktop\Keystone\
```

No WSL dependencies. No external PAI/ClawMem folders. Keystone is the only source.

---

## Environment Variables

```bash
KEYSTONE_EMBED_URL=http://localhost:11434
KEYSTONE_LLM_URL=http://localhost:11434
INDEX_PATH=C:\Users\peace\.cache\keystone\index.sqlite
BUN_RUNTIME_TRANSPILER_CACHE_PATH=0
```

---

## Prerequisites

1. **Bun** - https://bun.sh
2. **Ollama** - https://ollama.ai
3. **GPU** - RTX 4070 (12GB VRAM)
4. **Claude Code** - via npm

---

## Your Communication Style

- Explain like you're 13 years old
- Use analogies, not abstractions
- "I don't get it" = switch to story mode
- Keep it simple, visual, practical

---

*Generated: 2026-02-24*
*This file is your backup. If you lose the chat, read this.*
