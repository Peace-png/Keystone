# Keystone AI Infrastructure

> One folder. Complete AI system. Zero cloud dependency.

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
Keystone/
├── core/           # AI identity, skills, persona
├── agents/         # Background services & SCAR rules
├── search/         # Semantic search engine
├── knowledge/      # PARA knowledge base
│   ├── 1-projects/ # Active work
│   ├── 2-areas/    # Responsibilities
│   ├── 3-resources/# Reference material
│   └── 4-archive/  # Inactive items
├── settings/       # Configuration
├── database/       # Search index
└── memory/         # Persistent memory
```

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

**Not a coder? No problem.** Copy one of these prompts into your AI tool to get guided help:

### For Claude Code (Recommended)

```text
I just cloned Keystone - a local AI infrastructure project.
Help me set it up step by step.

Read the README.md and constitution/SOUL.md to understand how it works.
Then guide me through:
1. Installing Ollama and downloading a model
2. Running the system with START-KEYSTONE.cmd
3. Personalizing my constitution files (SOUL.md, USER.md)
4. Setting up my knowledge base

Explain everything in simple terms. I'm not a developer.
```

### For ChatGPT / Gemini

```text
I downloaded a project called Keystone from GitHub:
https://github.com/Peace-png/Keystone

It's a local AI system that runs on my computer using Ollama.
Can you help me understand:
1. How to install Ollama and get a model
2. What the folder structure means
3. How to personalize it for my needs
4. What I can actually DO with it

Please explain like I'm new to this. I don't code.
```

### For Codex CLI / GitHub Copilot

```text
Help me explore the Keystone project structure.
I need to:
1. Understand what each folder does
2. Set up Ollama for local AI
3. Customize the constitution files
4. Start using the knowledge base

Walk me through it as a beginner.
```

### What These Prompts Do

When you give these to an AI, it will:
- Read the project files
- Explain things in plain English
- Guide you step by step
- Help you personalize the system

**The goal:** Make Keystone YOURS, not just a copy of someone else's setup.

## Contributing

Contributions welcome. Please read the contributing guidelines first.

## License

[MIT License](LICENSE)

## Acknowledgements

This project was influenced by:

- [PAI](https://github.com/danielmiessler/PAI) by Daniel Miessler — Architectural concepts
- [ClawMem](https://github.com/yoloshii/ClawMem) by Yoloshi Nomotomoro — Memory system design ideas
- [The Algorithm](https://github.com/danielmiessler/TheAlgorithm) by Daniel Miessler — Execution framework concepts

See [NOTICE](NOTICE) for attribution details.

---

**Built for people who want AI infrastructure they actually own.**
