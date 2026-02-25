# Blender MCP and LLM Integration Research
## WSL and Windows Environment Deep Dive

**Research Date:** February 19, 2026  
**Primary Repository:** [ahujasid/blender-mcp](https://github.com/ahujasid/blender-mcp)  
**Current Version:** 1.5.5  
**Stars:** 17,152 | Forks: 1,626

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Architecture Overview](#architecture-overview)
3. [Core Components](#core-components)
4. [Communication Protocol](#communication-protocol)
5. [Windows Setup Guide](#windows-setup-guide)
6. [WSL Setup Guide](#wsl-setup-guide)
7. [WSL + Windows Mixed Environment](#wsl--windows-mixed-environment)
8. [LLM Integration Options](#llm-integration-options)
9. [Known Issues & Solutions](#known-issues--solutions)
10. [Feature Capabilities](#feature-capabilities)
11. [Security Considerations](#security-considerations)
12. [Troubleshooting Guide](#troubleshooting-guide)

---

## Executive Summary

BlenderMCP is a Model Context Protocol (MCP) implementation that connects Blender (3D modeling software) to LLMs like Claude AI. It enables AI-assisted 3D modeling, scene creation, and manipulation through natural language commands.

### Key Points:
- **Two-way communication** between Blender and LLM via TCP sockets
- **Python 3.10+ required** for MCP server
- **Blender 3.0+ supported** (Blender 4.0+ recommended)
- **Cross-platform:** Works on Windows, macOS, and Linux/WSL
- **Package Manager:** Uses `uv` for dependency management

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         LLM Client                               │
│  (Claude Desktop / Cursor / VS Code / Gemini CLI / ChatGPT)     │
└────────────────────────────┬────────────────────────────────────┘
                             │ MCP Protocol (JSON-RPC)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                      MCP Server                                  │
│              (blender-mcp Python Package)                        │
│  - FastMCP Framework                                             │
│  - Tool Definitions                                               │
│  - Connection Management                                          │
└────────────────────────────┬────────────────────────────────────┘
                             │ TCP Socket (default: 9876)
                             ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Blender Addon                                 │
│                   (addon.py)                                     │
│  - Socket Server within Blender                                  │
│  - Command Execution                                             │
│  - Blender Python API (bpy)                                      │
└─────────────────────────────────────────────────────────────────┘
```

---

## Core Components

### 1. Blender Addon (`addon.py`)

The addon runs **inside Blender** and creates a TCP socket server:

```python
class BlenderMCPServer:
    def __init__(self, host='localhost', port=9876):
        self.host = host
        self.port = port
        self.running = False
        self.socket = None
        self.server_thread = None
```

**Key Features:**
- Runs as a daemon thread within Blender
- Listens on configurable host:port
- Executes commands in Blender's main thread via `bpy.app.timers.register()`
- Supports multiple client connections

### 2. MCP Server (`src/blender_mcp/server.py`)

The MCP server runs as a standalone process and implements the Model Context Protocol:

```python
from mcp.server.fastmcp import FastMCP, Context, Image

mcp = FastMCP(
    "BlenderMCP",
    lifespan=server_lifespan
)
```

**Dependencies:**
- `mcp[cli]>=1.8.0` - MCP SDK
- `supabase>=2.0.0` - For telemetry
- `tomli>=2.0.0` - Config parsing

### 3. Communication Protocol

JSON-based protocol over TCP sockets:

```json
// Request format
{
    "type": "command_type",
    "params": { ... }
}

// Response format
{
    "status": "success" | "error",
    "result": { ... } | "message": "error message"
}
```

---

## Windows Setup Guide

### Prerequisites

1. **Blender 4.0+** installed on Windows
2. **Python 3.10+** (bundled with Blender or system)
3. **uv package manager**

### Step 1: Install uv Package Manager

```powershell
# Run in PowerShell
powershell -c "irm https://astral.sh/uv/install.ps1 | iex"

# Add uv to user PATH (persistent)
$localBin = "$env:USERPROFILE\.local\bin"
$userPath = [Environment]::GetEnvironmentVariable("Path", "User")
[Environment]::SetEnvironmentVariable("Path", "$userPath;$localBin", "User")

# Restart Claude Desktop after PATH update
```

### Step 2: Install Blender Addon

1. Download `addon.py` from the repository
2. Open Blender → Edit → Preferences → Add-ons
3. Click "Install..." and select `addon.py`
4. Enable the addon by checking the box next to "Interface: Blender MCP"

### Step 3: Configure Claude Desktop

Edit `claude_desktop_config.json`:

```json
{
    "mcpServers": {
        "blender": {
            "command": "uvx",
            "args": ["blender-mcp"]
        }
    }
}
```

**For Windows-specific path issues:**
```json
{
    "mcpServers": {
        "blender": {
            "command": "cmd",
            "args": ["/c", "uvx", "blender-mcp"]
        }
    }
}
```

### Step 4: Start the Connection

1. In Blender, open the 3D View sidebar (press N)
2. Find the "BlenderMCP" tab
3. Click "Connect to Claude"
4. Claude Desktop should now show Blender MCP tools

---

## WSL Setup Guide

### Prerequisites

1. **WSL2** installed and configured
2. **Blender running on Windows** (or Linux native)
3. **Python 3.10+** in WSL
4. **uv package manager** in WSL

### Step 1: Install uv in WSL

```bash
# Install uv
curl -LsSf https://astral.sh/uv/install.sh | sh

# Add to PATH (add to ~/.bashrc)
export PATH="$HOME/.local/bin:$PATH"
source ~/.bashrc
```

### Step 2: Configure MCP Server

Edit Claude Desktop config (from Windows, accessed via WSL):

```bash
# Access Windows Claude config from WSL
cd /mnt/c/Users/<username>/AppData/Roaming/Claude/
```

```json
{
    "mcpServers": {
        "blender": {
            "command": "uvx",
            "args": ["blender-mcp"],
            "env": {
                "BLENDER_HOST": "host.docker.internal",
                "BLENDER_PORT": "9876"
            }
        }
    }
}
```

### Step 3: Configure Blender Addon for Network Access

In Blender, set the host address to allow connections from WSL:

- Change `localhost` to `0.0.0.0` or your Windows LAN IP
- This allows the WSL MCP server to connect to Windows Blender

---

## WSL + Windows Mixed Environment

### Architecture for Mixed Setup

```
┌─────────────────────────────────────────────────────────────────┐
│                    Windows Host                                  │
│  ┌─────────────────────┐    ┌─────────────────────────────────┐ │
│  │     Blender         │    │      Claude Desktop             │ │
│  │  ┌───────────────┐  │    │  ┌───────────────────────────┐  │ │
│  │  │  Blender MCP  │  │    │  │   MCP Client              │  │ │
│  │  │  Addon        │  │    │  │                           │  │ │
│  │  │  (port 9876)  │  │    │  └───────────────────────────┘  │ │
│  │  └───────┬───────┘  │    └─────────────────────────────────┘ │
│  │          │          │                                        │
│  └──────────┼──────────┘                                        │
│             │ TCP Socket                                        │
│             ▼                                                   │
│  ┌─────────────────────────────────────────────────────────────┐│
│  │                      WSL2                                    ││
│  │  ┌───────────────────────────────────────────────────────┐  ││
│  │  │                MCP Server (uvx blender-mcp)            │  ││
│  │  │  - BLENDER_HOST=host.docker.internal                   │  ││
│  │  │  - BLENDER_PORT=9876                                   │  ││
│  │  └───────────────────────────────────────────────────────┘  ││
│  └─────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────┘
```

### Critical Configuration

**Environment Variables:**

```bash
# In WSL or MCP config
export BLENDER_HOST="host.docker.internal"  # For Docker/WSL to Windows host
export BLENDER_PORT="9876"
```

**Alternative host addresses:**
- `host.docker.internal` - Docker/WSL to host
- Windows LAN IP (e.g., `192.168.1.100`)
- `127.0.0.1` - Local only

### Known WSL-Specific Issues

#### 1. Screenshot Cross-OS Path Problem

**Issue:** `get_viewport_screenshot` fails when Blender is on Windows and MCP server is in WSL.

```
Screenshot failed: Screenshot file was not created
```

**Root Cause:** Path-coupled screenshot transfer crosses OS/filesystem boundaries. Server provides Linux path (`/tmp/...png`), but Blender on Windows cannot write to that path.

**Solution (v1.5.5+):** Use base64 image transport instead of file paths:

```python
# Addon captures screenshot and returns base64
# Server decodes base64 directly to Image()
# No shared path dependency
```

#### 2. Path Translation Issues

Windows paths (`C:\Users\...`) vs WSL paths (`/mnt/c/Users/...`) can cause confusion.

**Workaround:** Use UNC paths when needed:
```
\\wsl.localhost\Ubuntu-24.04\home\user\...
```

---

## LLM Integration Options

### 1. Claude Desktop

```json
{
    "mcpServers": {
        "blender": {
            "command": "uvx",
            "args": ["blender-mcp"]
        }
    }
}
```

### 2. Claude Code CLI

```bash
claude mcp add blender uvx blender-mcp
```

### 3. Cursor IDE

```json
{
    "mcpServers": {
        "blender": {
            "command": "uvx",
            "args": ["blender-mcp"]
        }
    }
}
```

**Windows Cursor:**
```json
{
    "mcpServers": {
        "blender": {
            "command": "cmd",
            "args": ["/c", "uvx", "blender-mcp"]
        }
    }
}
```

### 4. Visual Studio Code

Install via VS Code MCP integration button in README or:

```json
{
    "mcp.servers": {
        "blender-mcp": {
            "type": "stdio",
            "command": "uvx",
            "args": ["blender-mcp"]
        }
    }
}
```

### 5. Gemini CLI

```json
{
    "mcpServers": {
        "blender": {
            "command": "uvx",
            "args": ["blender-mcp"],
            "working_directory": "~/temp"
        }
    }
}
```

### 6. ChatMCP

Configuration for ChatMCP application:
```json
{
    "server_type": "stdio",
    "command": "uvx",
    "args": ["blender-mcp"],
    "env": {
        "BLENDER_HOST": "localhost",
        "BLENDER_PORT": "9876"
    }
}
```

### 7. Local LLM with Ollama

While direct Ollama integration isn't built-in, you can use MCP-compatible wrappers:

1. Use an MCP client that supports local LLMs
2. Configure the blender-mcp server separately
3. The MCP protocol abstracts the LLM choice

---

## Known Issues & Solutions

### Issue 1: Connection Refused

**Symptoms:**
```
Failed to connect to Blender: [Errno 111] Connection refused
```

**Causes & Solutions:**

| Cause | Solution |
|-------|----------|
| Addon not started | Click "Connect to Claude" in Blender |
| Wrong host/port | Check BLENDER_HOST and BLENDER_PORT |
| Firewall blocking | Allow Blender through Windows Firewall |
| WSL networking | Use `host.docker.internal` or Windows IP |

### Issue 2: FastMCP Description Error

**Symptoms:**
```
TypeError: FastMCP.__init__() got an unexpected keyword argument 'description'
```

**Solution:** Update to version 1.5.5+ which removes the deprecated parameter.

### Issue 3: UV Not Found

**Symptoms:**
```
MCP blender disconnected
```

**Solution:** Use full path to uvx:

```json
{
    "mcpServers": {
        "blender": {
            "command": "/Users/username/.cargo/bin/uvx",
            "args": ["blender-mcp"]
        }
    }
}
```

### Issue 4: Screenshot Failure (Linux)

**Symptoms:**
```
Screenshot failed: Screenshot file was not created
```

**Solution:** Ensure proper permissions and temp directory access. Update to v1.5.5+.

### Issue 5: API Key Not Persisting

**Symptoms:** Sketchfab/Hyper3D/Hunyuan3D API keys lost after Blender restart.

**Solution:** Update to v1.5.5+ which uses AddonPreferences for persistent storage.

### Issue 6: Material Node Duplication

**Symptoms:** Duplicated Material Output / Principled BSDF nodes causing inconsistent materials.

**Solution:** Fixed in v1.5.5+ with `_reset_material_nodes_principled()` helper function.

---

## Feature Capabilities

### Scene Operations
- Get scene information
- Get object details
- Viewport screenshots

### Object Manipulation
- Create primitives (cube, sphere, cylinder, etc.)
- Delete objects
- Transform (location, rotation, scale)
- Apply materials

### Asset Integration

| Service | Type | Features |
|---------|------|----------|
| **Poly Haven** | Free API | HDRIs, textures, 3D models |
| **Sketchfab** | API Key | Search and download 3D models |
| **Hyper3D Rodin** | API Key | AI-generated 3D models from text/images |
| **Hunyuan3D** | API Key | Tencent's AI 3D generation (Pro/Rapid modes) |
| **Kenney.nl** | Local assets | Free game prototyping assets |

### Code Execution
- Execute arbitrary Python code in Blender
- **Warning:** Powerful but potentially dangerous

---

## Security Considerations

### Risks

1. **Arbitrary Code Execution:** The `execute_blender_code` tool allows running any Python code in Blender
2. **Network Exposure:** Binding to `0.0.0.0` exposes Blender to network
3. **API Keys:** Stored in Blender preferences (local file)

### Recommendations

1. **Save work before using** `execute_blender_code`
2. **Use localhost binding** unless remote access is required
3. **Disable telemetry** if concerned:
   ```json
   {
       "env": {
           "DISABLE_TELEMETRY": "true"
       }
   }
   ```
4. **Review tool permissions** in MCP client

---

## Troubleshooting Guide

### General Troubleshooting

1. **Check addon status:** Ensure "Connect to Claude" is clicked in Blender
2. **Verify port:** Default is 9876, ensure no conflicts
3. **Restart both:** Blender addon and MCP server
4. **Check logs:** Look at Blender console and MCP server logs

### WSL-Specific Troubleshooting

```bash
# Check if Blender is listening on Windows
netstat -an | grep 9876

# Test connection from WSL
python3 -c "import socket; s=socket.socket(); s.connect(('host.docker.internal', 9876)); print('Connected')"

# Check Windows firewall
# Allow Blender through Windows Defender Firewall
```

### Network Debug

```bash
# Check host accessibility from WSL
ping host.docker.internal

# Check MCP server logs
# Look for "Connected to Blender at X:Y"

# Verify environment variables
echo $BLENDER_HOST
echo $BLENDER_PORT
```

### Reset Everything

1. Stop Blender addon (click Disconnect)
2. Remove MCP server from Claude config
3. Restart Claude Desktop
4. Add MCP server back
5. Start Blender addon
6. Test connection

---

## MCP Tools Reference

| Tool | Description | Type |
|------|-------------|------|
| `get_scene_info` | Get current scene details | Read |
| `get_object_info` | Get specific object details | Read |
| `get_viewport_screenshot` | Capture viewport image | Read |
| `execute_blender_code` | Run Python in Blender | Destructive |
| `get_polyhaven_categories` | List asset categories | Read |
| `search_polyhaven_assets` | Search Poly Haven | Read |
| `download_polyhaven_asset` | Import Poly Haven asset | Destructive |
| `set_texture` | Apply texture to object | Destructive |
| `search_sketchfab_models` | Search Sketchfab | Read |
| `get_sketchfab_model_preview` | Preview model thumbnail | Read |
| `download_sketchfab_model` | Import Sketchfab model | Destructive |
| `generate_hyper3d_model_via_text` | AI 3D from text | Destructive |
| `generate_hyper3d_model_via_images` | AI 3D from images | Destructive |
| `generate_hunyuan3d_model` | Tencent AI 3D | Destructive |
| `import_generated_asset` | Import AI-generated model | Destructive |

---

## Version History Highlights

| Version | Key Changes |
|---------|-------------|
| **1.5.5** | Hunyuan3D support, WSL/Windows screenshot fix, material node fix |
| **1.5.0** | Viewport screenshots, Sketchfab integration, Hyper3D Rodin |
| **1.4.0** | Remote host support, environment variables |
| **1.3.0** | Persistent API key storage |
| **1.2.0** | Tool annotations for LLM understanding |

---

## Resources

- **Main Repository:** https://github.com/ahujasid/blender-mcp
- **MCP Documentation:** https://modelcontextprotocol.io
- **Discord Community:** https://discord.gg/z5apgR8TFU
- **Tutorial Video:** https://www.youtube.com/watch?v=lCyQ717DuzQ

---

## Conclusion

BlenderMCP provides a robust bridge between LLMs and Blender, enabling AI-assisted 3D modeling workflows. The key considerations for WSL/Windows mixed environments are:

1. **Network configuration** - Use `host.docker.internal` or Windows IP from WSL
2. **Screenshot handling** - Ensure v1.5.5+ for base64 transport
3. **Path management** - Be aware of Windows/WSL path differences
4. **Firewall settings** - Allow Blender network access

With proper configuration, the integration works seamlessly across Windows, WSL, and mixed environments, allowing flexible deployment options for different workflows.