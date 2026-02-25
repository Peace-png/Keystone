# Keystone AI Infrastructure - The Full Picture

## The Three Layers

```
┌─────────────────────────────────────────────────────────────────┐
│                    KEYSTONE AI INFRASTRUCTURE                    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  LAYER 1: Core (Identity & Skills)                              │
│  Role: The main brain - hooks, memory, skills                   │
│                                                                  │
│  LAYER 2: Agents (Background Services)                          │
│  Role: Specialized agents - Shadow (cybersecurity game)         │
│                                                                  │
│  LAYER 3: Search (File Indexing)                                │
│  Role: File indexer - makes everything searchable               │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Layer 1: Core (Identity & Skills)

| Part | What It Does |
|------|--------------|
| **settings.json** | Your identity, AI name, voice settings |
| **hooks/** | Auto-run scripts during conversations |
| **skills/** | Special abilities (Journalism, OSINT, etc.) |
| **MEMORY/** | Saved memories, work items, learnings |

### Key Hooks

| Hook | When It Runs | What It Does |
|------|--------------|--------------|
| `SessionStart` | When we start talking | Loads context, memories |
| `UserPromptSubmit` | When you send a message | Can modify what I see |
| `Stop` | When I finish responding | Saves learnings, summaries |

### Skills Available

| Skill | What It's For |
|-------|---------------|
| **CORE** | Main system, identity, config |
| **Agents** | Create custom AI agents |
| **Journalism** | News reporting, fact-checking |
| **OSINT** | Open source intelligence gathering |
| **RedTeam** | Attack analysis with 32 agents |
| **Browser** | Web automation, screenshots |
| **Council** | Multi-agent debates |
| **Telos** | Life goals, project tracking |

---

## Layer 2: Agents (Background Services)

| Part | What It Does |
|------|--------------|
| **engine/** | Unified engine that runs everything |
| **shadow/** | Cybersecurity combat agent |

### Background Services

| Service | What It Does |
|---------|--------------|
| **Core Service** | Processes work queue, saves memories |
| **Search Service** | Indexes files, runs searches |
| **Shadow Service** | Plays cybersecurity game, scans |

### Shadow (Cybersecurity Agent)

| Part | What It Is |
|------|------------|
| **SOUL.md** | Shadow's identity - ruthless guardian |
| **CAPABILITIES.md** | 6 combat modes, abilities |
| **MISSIONS.md** | Game types (CTF, Breach, Duel) |

---

## Layer 3: Search (File Indexing)

| Part | What It Does |
|------|--------------|
| **store.ts** | SQLite database, search functions |
| **indexer.ts** | Reads files, creates chunks |
| **llm.ts** | Local LLM for embeddings |
| **mcp.ts** | MCP server so I can search |

---

## How They Connect

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  THIS CHAT  │────►│   HOOKS     │────►│  MEMORY     │
│             │     │             │     │  FILES      │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                    ┌─────────────┐             │
                    │   SEARCH    │◄────────────┘
                    │  (indexes)  │
                    └─────────────┘
                           │
                    ┌──────▼──────┐
                    │  SERVICES   │
                    │  (process   │
                    │   in background)
                    └─────────────┘
```

---

## Quick Commands

| Want to... | Command |
|------------|---------|
| Start everything | Double-click `START-KEYSTONE.cmd` on Desktop |
| Search your files | `SEARCH.bat search "query"` |
| Check status | `SEARCH.bat status` |
| Index files | `SEARCH.bat update` |

---

## Folder Structure

```
Desktop\Keystone\
├── core/           ← AI identity, skills, Nova
├── agents/         ← Background agents
├── search/         ← File search engine
├── settings/       ← Your configuration
├── database/       ← Search index
├── models/         ← AI models
├── config/         ← Config files
└── memory/         ← Saved memories
```

---

*Last updated: 2026-02-24*
