# Keystone AI Infrastructure

## THE SIMPLE WAY

```
Double-click: START-KEYSTONE.cmd (on your Desktop)
```

That's it. It will:
1. Start GPU acceleration
2. Start all background services
3. Open Claude Code
4. On exit, save everything automatically

---

## What's In This Folder

```
Keystone/
│
├── SEARCH.bat            ← Search your files
├── START-DAEMONS.bat     ← Start background processes
├── INSTALL.bat           ← Install dependencies
├── RESTORE.bat           ← Copy back to system if needed
├── CHECK_GPU.bat         ← Verify GPU is working
│
├── core/                 ← AI identity
│   ├── soul.md           ← Nova's personality
│   ├── lighthouse/       ← Goals, mission, projects
│   └── skills/           ← Special abilities
│
├── agents/               ← Background agents
│   ├── scar-universal.ts ← SCAR (immune system)
│   └── agents/shadow/    ← Cybersecurity agent
│
├── search/               ← File search engine (GPU)
│
├── knowledge/            ← Your knowledge base (PARA)
│   ├── 1-projects/       ← Active work
│   ├── 2-areas/          ← Responsibilities
│   ├── 3-resources/      ← Reference
│   ├── 4-archive/        ← Inactive
│   ├── README.md         ← How to use
│   └── TEMPLATE.md       ← New doc template
│
├── settings/             ← Your configuration
├── database/             ← Search index
├── models/               ← AI models
├── config/               ← Config files
└── memory/               ← Saved memories
```

---

## Quick Commands

| Command | What It Does |
|---------|--------------|
| `search "query"` | Find files with those words |
| `vsearch "query"` | Find files about that meaning (GPU) |
| `status` | Show index statistics |
| `update` | Add new files to index |

---

## What Each Folder Does

| Folder | Purpose |
|--------|---------|
| **core** | AI identity, Nova, LIGHTHOUSE goals |
| **agents** | Background services, SCAR rules, Shadow |
| **search** | Makes everything searchable (GPU) |
| **knowledge** | Your curated knowledge base |
| **settings** | Your personal configuration |
| **database** | The indexed content |
| **memory** | Saved memories |

---

## SCAR (The Bouncer)

Rate limits and rules that can't be bypassed:
- 40 comments/day, 5 posts/day
- No crypto spam, no secrets
- Only approved network domains
- Emergency pause button

---

## Knowledge Base

PARA method - quality over quantity:
- 100-200 documents max
- One idea per document
- Summary at top (15 words)
- Your own words, not pasted

---

## Requirements

- **Windows 10/11**
- **Bun** - https://bun.sh
- **Ollama** - https://ollama.ai
- **GPU** - For fast search (optional but recommended)

---

## Troubleshooting

| Problem | Solution |
|---------|----------|
| "Bun not found" | Install from https://bun.sh |
| "Model not found" | Run: `ollama pull nomic-embed-text` |
| Slow / lagging | Check GPU with CHECK_GPU.bat |
| "Connection refused" | Run: `ollama serve` |

---

**Keystone AI Infrastructure**

A sovereign AI system - everything in one folder:
- Nova (AI assistant persona)
- LIGHTHOUSE (goal tracking)
- Knowledge Base (PARA method)
- Search (GPU-powered)
- Shadow (cybersecurity)
- SCAR (immune system)

Created: 2026-02-24
