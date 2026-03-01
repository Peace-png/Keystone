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
| Monthly API costs | Free (local GPU) |
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

## Contributing

Contributions welcome. Please read the contributing guidelines first.

## License

MIT License

```
Copyright (c) 2026 Andrew Hagan

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```

## Acknowledgements

This project incorporates code from the following MIT-licensed projects:

| Project | Author | What's Used |
|---------|--------|-------------|
| [PAI](https://github.com/danielmiessler/PAI) | Daniel Miessler | Skills framework, hooks, The Algorithm |
| [ClawMem](https://github.com/yoloshii/ClawMem) | Yoloshi Nomotomoro | Memory indexing, MCP integration, BM25+vector search |
| [The Algorithm](https://github.com/danielmiessler/TheAlgorithm) | Daniel Miessler | ISC execution framework |

All upstream projects use the MIT License. See [NOTICE](NOTICE) for full details.

---

**Built for people who want AI infrastructure they actually own.**
