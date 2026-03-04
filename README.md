# Keystone
### A constitutional AI framework with a soul

One folder. Your machine. AI that remembers.

**Keystone** is a self-contained AI infrastructure that runs entirely on your machine. It combines semantic search, autonomous agents, and persistent memory in a single, portable folder.

## What You Get

| Component | Description |
|-----------|-------------|
| **Semantic Search** | GPU-accelerated file search using vector embeddings |
| **Knowledge Base** | PARA-structured personal knowledge management |
| **Autonomous Agents** | Background services that run tasks while you work |
| **SCAR** | Built-in rate limiting and rule enforcement |
| **Nova** | Configurable AI assistant persona |

## Quick Start

### Prerequisites

- [Bun](https://bun.sh) - JavaScript runtime
- [Ollama](https://ollama.ai) - Local LLM inference
- NVIDIA GPU (recommended for vector search)

### Model Setup

Keystone uses Ollama for local AI. Here's how to set it up:

```bash
# 1. Install Ollama from https://ollama.ai

# 2. Pull a model (choose one)
ollama pull llama3.2        # Fast, good for most tasks (4.7GB)
ollama pull mistral         # Balanced performance (4.1GB)
ollama pull codellama       # Best for code (4.0GB)

# 3. Verify it works
ollama run llama3.2 "Hello, are you working?"

# 4. Ollama runs automatically on port 11434
# Keystone connects to: http://localhost:11434
```

**Recommended models by use case:**

| Use Case | Model | Size |
|----------|-------|------|
| General use | llama3.2 | 4.7GB |
| Coding help | codellama | 4.0GB |
| Low VRAM (<8GB) | phi3 | 2.3GB |
| Best quality | llama3.1:70b | 40GB+ |

### Installation

```bash
# Clone the repository
git clone https://github.com/Peace-png/Keystone.git
cd Keystone

# Install dependencies
INSTALL.bat

# Start the system
START-KEYSTONE.cmd
```

### First Run

```bash
# Index your files
SEARCH.bat update

# Search by meaning (not just keywords)
SEARCH.bat vsearch "how does authentication work"

# Check system status
SEARCH.bat status
```

## Architecture

```
KEYSTONE INFRASTRUCTURE
│
├── BOOT LAYER
│   └── START-KEYSTONE.cmd → CHECK_IDENTITY.bat → 5 Services
│
├── SERVICE LAYER
│   ├── CORE      (pai-daemon.ts)      — Unified engine orchestrator
│   ├── SEARCH    (clawmem-daemon.ts)  — GPU-accelerated memory
│   ├── SHADOW    (shadow-daemon.ts)   — Security operations
│   ├── FIREWALL  (cognitive-firewall) — Input filtering
│   └── SCAR      (scar-daemon.ts)     — Principle enforcement
│
├── COGNITIVE LAYER
│   └── SCAR matches EVENTS → returns advisories
│
├── REFLECTION LAYER
│   └── Session checkpoint → SCAR advisories → SESSION.md
│
└── MEMORY LAYER
    ├── ClawMem Index    — Vector + graph memory
    ├── constitution/    — SOUL.md / USER.md / SESSION.md
    └── PARKING_LOT.md   — Open issues

Pipeline: BOOT → SERVICES → EVENTS → SCAR → MEMORY
```

See [specs/SERVICE_TREE_CURRENT.md](specs/SERVICE_TREE_CURRENT.md) for full architecture details.

## Features

### Semantic Search

Find documents by meaning, not just keywords:

```bash
# Traditional search
SEARCH.bat search "API authentication"

# Semantic search (understands intent)
SEARCH.bat vsearch "how do I secure my endpoints"
```

### Knowledge Base

Built on the PARA method for organizing information:

- **Projects** - Things you're actively working on
- **Areas** - Ongoing responsibilities
- **Resources** - Reference material you might need
- **Archive** - Completed or inactive items

### SCAR (Constraint System)

Built-in rules that cannot be bypassed:

- Rate limiting for API calls
- Content filtering
- Network allowlists
- Emergency pause controls

### Offline-First

Everything runs locally:
- No cloud services required
- Your data stays on your machine
- Works without internet

## Why Keystone?

| Traditional Setup | Keystone |
|------------------|----------|
| Multiple cloud services | One folder |
| Recurring API costs | Your hardware, your compute |
| Data in someone else's cloud | Your data, your machine |
| Complex configuration | Double-click to start |
| Scattered tools | Unified architecture |

## Customization

### Change AI Persona

Edit `core/soul.md` to customize how your AI assistant behaves.

### Add Knowledge

```bash
# Add documents to knowledge base
cp my-notes.md knowledge/3-resources/

# Re-index
SEARCH.bat update
```

### Configure Search

Edit `config/` to change:
- Which folders are indexed
- Embedding model used
- Chunk size and overlap

## Requirements

| Component | Minimum | Recommended |
|-----------|---------|-------------|
| RAM | 8GB | 16GB+ |
| GPU | Any | NVIDIA RTX series |
| Storage | 5GB | 10GB+ |
| OS | Windows 10/11 | Windows 11 |

## For New Users (Start Here)

**Not a coder? No problem.** Copy this prompt into your AI tool (Claude Code, ChatGPT, etc.):

```text
I just cloned Keystone (a local AI infrastructure project).
Help me set it up step by step.

First: read README.md and constitution/SOUL.md.
Then guide me through:
1) Installing Ollama and pulling a model (recommend one based on my GPU/RAM)
2) Running START-KEYSTONE.cmd and confirming everything is healthy
3) Running `SEARCH.bat status` and one successful `SEARCH.bat vsearch` query
4) Personalizing constitution files (SOUL.md, USER.md) so it fits me
5) Setting up my knowledge base and re-indexing

Important:
- Explain everything in simple terms. I'm not a developer.
- Before ANY destructive command (delete/move/force push), explain what it does and ask me to confirm.
```

## Contributing

Contributions welcome. Please read the contributing guidelines first.

## License

[MIT License](LICENSE)

## Version History

See [CHANGELOG.md](CHANGELOG.md) for release notes.

| Version | Focus |
|---------|-------|
| [0.3.0] | SCAR conscience system |
| [0.2.0] | ClawMem integration |
| [0.1.0] | Core boot system |

## Acknowledgements

This project was influenced by:

- [PAI](https://github.com/danielmiessler/PAI) by Daniel Miessler — Architectural concepts
- [ClawMem](https://github.com/yoloshii/ClawMem) by Yoloshi Nomotomoro — Memory system design ideas
- [The Algorithm](https://github.com/danielmiessler/TheAlgorithm) by Daniel Miessler — Execution framework concepts

See [NOTICE](NOTICE) for attribution details.

---

**Built for people who want AI infrastructure they actually own.**
