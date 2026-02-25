#!/bin/bash
# ============================================================
# FORT DEPLOYMENT SCRIPT v2 (Fixed)
# Deploys honeypots + Shadow watcher on a fresh VPS
#
# FIXES from v1:
#   - Cowrie on 2222/2223 (won't lock you out of SSH)
#   - DOCKER-USER chain (Docker respects firewall)
#   - Dionaea bridge mode (not host)
#   - Watcher byte-offset tail (won't thrash disk)
#   - Cowrie permissions fixed
#   - Robust timestamp parsing
# ============================================================

set -e

echo "╔══════════════════════════════════════════════════════════╗"
echo "║          FORT DEPLOYMENT v2 - INITIALIZING              ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Check if root
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root: sudo ./fort-deploy.sh"
  exit 1
fi

# Detect OS
if [ -f /etc/debian_version ]; then
  OS="debian"
  PKG_MANAGER="apt"
elif [ -f /etc/redhat-release ]; then
  OS="redhat"
  PKG_MANAGER="yum"
else
  echo "Unsupported OS. This script supports Debian/Ubuntu and RHEL/CentOS."
  exit 1
fi

echo "[*] Detected: $OS"
echo ""

# ============================================================
# PHASE 1: SYSTEM SETUP
# ============================================================

echo "┌─────────────────────────────────────────────────────────┐"
echo "│  PHASE 1: SYSTEM SETUP                                  │"
echo "└─────────────────────────────────────────────────────────┘"

# Update system
echo "[*] Updating system..."
$PKG_MANAGER update -y
$PKG_MANAGER upgrade -y

# Install dependencies
echo "[*] Installing dependencies..."
$PKG_MANAGER install -y \
  docker.io \
  docker-compose \
  git \
  curl \
  wget \
  python3 \
  python3-pip \
  jq \
  ufw \
  iptables-persistent

# Enable Docker
systemctl enable docker
systemctl start docker

echo "[✓] System ready"
echo ""

# ============================================================
# PHASE 2: FIREWALL (DOCKER-AWARE)
# ============================================================

echo "┌─────────────────────────────────────────────────────────┐"
echo "│  PHASE 2: FIREWALL (DOCKER-AWARE)                       │"
echo "└─────────────────────────────────────────────────────────┘"

# IMPORTANT: Configure UFW BEFORE Docker rules
# Reset UFW to clean state
ufw --force reset

# Default policies
ufw default deny incoming
ufw default allow outgoing

# Allow SSH (REAL SSH on port 22 - keep this open!)
ufw allow 22/tcp comment 'Real SSH'

# Allow honeypot ports (honeypots on non-standard ports)
ufw allow 2222/tcp comment 'Cowrie SSH honeypot'
ufw allow 2223/tcp comment 'Cowrie Telnet honeypot'
ufw allow 445/tcp comment 'Dionaea SMB'
ufw allow 139/tcp comment 'Dionaea NetBIOS'
ufw allow 8080/tcp comment 'Dionaea HTTP'
ufw allow 8443/tcp comment 'Dionaea HTTPS'
ufw allow 2121/tcp comment 'Dionaea FTP'

# Enable UFW
ufw --force enable

echo "[*] Configuring Docker to respect UFW..."

# Fix Docker + UFW interaction
# Docker bypasses UFW by default, we need to stop this
cat > /etc/docker/daemon.json << 'EOF'
{
  "iptables": false
}
EOF

# Restart Docker to apply
systemctl restart docker

# Add explicit DOCKER-USER chain rules (extra safety)
# This ensures even if Docker tries to bypass, we catch it
iptables -I DOCKER-USER -j RETURN 2>/dev/null || true

echo "[✓] Firewall configured (Docker-aware)"
echo ""

# ============================================================
# PHASE 3: DEPLOY COWRIE (SSH HONEYPOT) - FIXED PORTS
# ============================================================

echo "┌─────────────────────────────────────────────────────────┐"
echo "│  PHASE 3: COWRIE - SSH HONEYPOT                         │"
echo "└─────────────────────────────────────────────────────────┘"

mkdir -p /opt/honeypots/cowrie/{etc,log,dl}
cd /opt/honeypots/cowrie

# Create docker-compose for Cowrie (FIXED: ports 2222/2223, not 22/23)
cat > docker-compose.yml << 'EOF'
version: '3'
services:
  cowrie:
    image: cowrie/cowrie:latest
    container_name: cowrie
    ports:
      - "2222:2222"    # SSH honeypot on 2222 (NOT 22)
      - "2223:2223"    # Telnet honeypot on 2223 (NOT 23)
    volumes:
      - ./etc:/cowrie/cowrie-git/etc
      - ./log:/cowrie/cowrie-git/log
      - ./dl:/cowrie/cowrie-git/dl
    environment:
      - COWRIE_SSH_LISTEN_PORT=2222
      - COWRIE_TELNET_LISTEN_PORT=2223
    restart: unless-stopped
EOF

# Create Cowrie config
cat > etc/cowrie.cfg << 'EOF'
[cowrie]
hostname = server1
listen_endpoints = tcp:2222:interface=0.0.0.0
telnet_listen_endpoints = tcp:2223:interface=0.0.0.0

[ssh]
version = SSH-2.0-OpenSSH_8.9p1

[telnet]
enabled = true

[output_jsonlog]
enabled = true
logfile = log/cowrie.json
epoch_timestamp = false

[output_textlog]
enabled = true
logfile = log/cowrie.log
EOF

# FIX: Set correct permissions (Cowrie runs as UID 1000)
chown -R 1000:1000 /opt/honeypots/cowrie/{etc,log,dl}

# Start Cowrie
docker-compose up -d

echo "[✓] Cowrie deployed on ports 2222 (SSH) and 2223 (Telnet)"
echo "    Real SSH remains on port 22 - you won't be locked out"
echo ""

# ============================================================
# PHASE 4: DEPLOY DIONAEA (MULTI-PROTOCOL) - BRIDGE MODE
# ============================================================

echo "┌─────────────────────────────────────────────────────────┐"
echo "│  PHASE 4: DIONAEA - MULTI-PROTOCOL HONEYPOT             │"
echo "└─────────────────────────────────────────────────────────┘"

mkdir -p /opt/honeypots/dionaea/{log,binaries}
cd /opt/honeypots/dionaea

# Create docker-compose for Dionaea (FIXED: bridge mode with explicit ports)
cat > docker-compose.yml << 'EOF'
version: '3'
services:
  dionaea:
    image: dinotools/dionaea:latest
    container_name: dionaea
    ports:
      - "445:445/tcp"    # SMB
      - "139:139/tcp"    # NetBIOS
      - "8080:80/tcp"    # HTTP (on 8080 to not conflict)
      - "8443:443/tcp"   # HTTPS
      - "2121:21/tcp"    # FTP
    volumes:
      - ./log:/opt/dionaea/log
      - ./binaries:/opt/dionaea/binaries
    restart: unless-stopped
EOF

# Start Dionaea
docker-compose up -d

echo "[✓] Dionaea deployed (SMB 445, HTTP 8080, FTP 2121)"
echo ""

# ============================================================
# PHASE 5: DEPLOY SHADOW WATCHER (FIXED)
# ============================================================

echo "┌─────────────────────────────────────────────────────────┐"
echo "│  PHASE 5: SHADOW - THE DAEMON WATCHER (FIXED)           │"
echo "└─────────────────────────────────────────────────────────┘"

mkdir -p /opt/shadow/engine /opt/shadow/soul/intel /opt/shadow/soul/battles
cd /opt/shadow

# Install Bun
if ! command -v bun &> /dev/null; then
  echo "[*] Installing Bun..."
  curl -fsSL https://bun.sh/install | bash
  export PATH="$HOME/.bun/bin:$PATH"
fi

# Create FIXED watcher with byte-offset tailing and robust timestamp parsing
cat > engine/watcher.ts << 'WATCHER_EOF'
#!/usr/bin/env bun
/**
 * SHADOW FORT WATCHER v2
 * - Byte-offset tailing (won't thrash disk)
 * - Robust timestamp parsing
 * - Proper error handling
 */

import { readFileSync, existsSync, mkdirSync, appendFileSync, statSync, openSync, readSync } from 'fs';
import { join } from 'path';

const COWRIE_LOG = '/opt/honeypots/cowrie/log/cowrie.json';
const SPIKE_FILE = join(__dirname, '..', 'soul', 'intel', 'spike_events.jsonl');
const STATE_FILE = join(__dirname, '..', 'soul', 'intel', 'watcher_state.json');

interface Attack {
  id: string;
  timestamp: string;
  source_ip: string;
  source_port: number;
  dest_port: number;
  protocol: string;
  attack_type: string;
  honeypot: string;
  session_id?: string;
  username?: string;
}

interface WatcherState {
  lastByteOffset: number;
  lastCheck: string;
}

console.log('╔══════════════════════════════════════════════════════════╗');
console.log('║           SHADOW FORT WATCHER v2 - ACTIVE               ║');
console.log('╚══════════════════════════════════════════════════════════╝');
console.log('');
console.log(`Watching: ${COWRIE_LOG}`);
console.log(`Recording to: ${SPIKE_FILE}`);
console.log('');

// Ensure directories exist
const intelDir = join(__dirname, '..', 'soul', 'intel');
if (!existsSync(intelDir)) {
  mkdirSync(intelDir, { recursive: true });
}

// Load or create state
let state: WatcherState = { lastByteOffset: 0, lastCheck: new Date().toISOString() };
if (existsSync(STATE_FILE)) {
  try {
    state = JSON.parse(readFileSync(STATE_FILE, 'utf-8'));
  } catch {}
}

function saveState() {
  const fd = openSync(STATE_FILE, 'w');
  const buf = Buffer.from(JSON.stringify(state, null, 2));
  writeSync(fd, buf, 0, buf.length, 0);
  closeSync(fd);
}

function writeSync(fd: number, buffer: Buffer, offset: number, length: number, position: number) {
  require('fs').writeSync(fd, buffer, offset, length, position);
}

function closeSync(fd: number) {
  require('fs').closeSync(fd);
}

// Robust timestamp parser (handles both ISO strings and Unix timestamps)
function parseTimestamp(ts: any): Date | null {
  if (typeof ts === 'number') {
    // Unix timestamp (seconds or milliseconds)
    const date = ts > 1e12 ? new Date(ts) : new Date(ts * 1000);
    return isNaN(date.getTime()) ? null : date;
  }
  if (typeof ts === 'string') {
    const date = new Date(ts);
    return isNaN(date.getTime()) ? null : date;
  }
  return null;
}

// Read only new bytes from log (byte-offset tailing)
function readNewBytes(): string {
  if (!existsSync(COWRIE_LOG)) return '';

  const stats = statSync(COWRIE_LOG);

  // If file shrunk (rotated), start from beginning
  if (stats.size < state.lastByteOffset) {
    state.lastByteOffset = 0;
  }

  // Nothing new
  if (stats.size <= state.lastByteOffset) return '';

  const fd = openSync(COWRIE_LOG, 'r');
  const length = stats.size - state.lastByteOffset;
  const buffer = Buffer.alloc(length);

  readSync(fd, buffer, 0, length, state.lastByteOffset);
  closeSync(fd);

  state.lastByteOffset = stats.size;
  return buffer.toString('utf-8');
}

// Process Cowrie events
function processCowrieEvents(newData: string): void {
  const lines = newData.split('\n').filter(l => l.trim());

  for (const line of lines) {
    try {
      const entry = JSON.parse(line);

      // Handle different event types
      if (entry.eventid === 'cowrie.session.connect') {
        const ts = parseTimestamp(entry.timestamp);
        if (!ts) continue;

        const attack: Attack = {
          id: `spike_${ts.getTime()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: ts.toISOString(),
          source_ip: entry.src_ip || 'unknown',
          source_port: entry.src_port || 0,
          dest_port: entry.dst_port || 2222,
          protocol: entry.protocol || 'ssh',
          attack_type: 'connection',
          honeypot: 'cowrie',
          session_id: entry.session,
        };

        appendFileSync(SPIKE_FILE, JSON.stringify(attack) + '\n');
        console.log(`[${attack.timestamp}] CONNECT ${attack.source_ip}:${attack.source_port} -> ${attack.dest_port}`);
      }
      else if (entry.eventid === 'cowrie.login.failed') {
        const ts = parseTimestamp(entry.timestamp);
        if (!ts) continue;

        const attack: Attack = {
          id: `spike_${ts.getTime()}_${Math.random().toString(36).substr(2, 9)}`,
          timestamp: ts.toISOString(),
          source_ip: entry.src_ip || 'unknown',
          source_port: 0,
          dest_port: 2222,
          protocol: 'ssh',
          attack_type: 'brute_force',
          honeypot: 'cowrie',
          username: entry.username,
        };

        appendFileSync(SPIKE_FILE, JSON.stringify(attack) + '\n');
        console.log(`[${attack.timestamp}] BRUTE_FORCE ${attack.source_ip} tried: ${entry.username}`);
      }
    } catch (e) {
      // Skip malformed lines silently
    }
  }
}

// Main loop
console.log('Daemon active. Waiting for attacks...');
console.log('');

setInterval(() => {
  const newData = readNewBytes();
  if (newData) {
    processCowrieEvents(newData);
    saveState();
  }
  state.lastCheck = new Date().toISOString();
}, 5000);

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n[SHUTDOWN] Saving state and exiting...');
  saveState();
  process.exit(0);
});

process.on('SIGTERM', () => {
  saveState();
  process.exit(0);
});
WATCHER_EOF

chmod +x engine/watcher.ts

echo "[✓] Shadow watcher created at /opt/shadow"
echo ""

# ============================================================
# PHASE 6: START EVERYTHING + VALIDATION
# ============================================================

echo "┌─────────────────────────────────────────────────────────┐"
echo "│  PHASE 6: ACTIVATION + VALIDATION                       │"
echo "└─────────────────────────────────────────────────────────┘"

# Start Shadow watcher in background
cd /opt/shadow
nohup bun run engine/watcher.ts > /opt/shadow/watcher.log 2>&1 &
SHADOW_PID=$!

# Wait a moment for startup
sleep 2

# Validation checks
echo ""
echo "[*] Running validation checks..."
echo ""

# Check 1: Port ownership
echo "PORT OWNERSHIP:"
echo "  22 (Real SSH):"
ss -lntp | grep ':22 ' | head -1 || echo "    ⚠️  No process on port 22"
echo "  2222 (Cowrie SSH):"
ss -lntp | grep ':2222 ' | head -1 || echo "    ⚠️  Cowrie not listening on 2222"
echo ""

# Check 2: Docker containers
echo "DOCKER CONTAINERS:"
docker ps --format "  {{.Names}}: {{.Status}}"
echo ""

# Check 3: Shadow watcher
echo "SHADOW WATCHER:"
if ps -p $SHADOW_PID > /dev/null 2>&1; then
  echo "  ✅ Running (PID: $SHADOW_PID)"
else
  echo "  ❌ Not running - check /opt/shadow/watcher.log"
fi
echo ""

# Check 4: UFW status
echo "FIREWALL (UFW):"
ufw status | head -10
echo ""

# ============================================================
# FINAL SUMMARY
# ============================================================

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║                  FORT DEPLOYED v2                        ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
echo "HONEYPOTS:"
echo "  • Cowrie (SSH)    - Port 2222 (honeypot)"
echo "  • Cowrie (Telnet) - Port 2223 (honeypot)"
echo "  • Dionaea (SMB)   - Port 445"
echo "  • Dionaea (HTTP)  - Port 8080"
echo "  • Dionaea (FTP)   - Port 2121"
echo ""
echo "ACCESS:"
echo "  • Real SSH        - Port 22 (your admin access)"
echo ""
echo "SHADOW:"
echo "  • Watcher running in background"
echo "  • Logs: /opt/shadow/watcher.log"
echo "  • Data: /opt/shadow/soul/intel/spike_events.jsonl"
echo ""
echo "TO CHECK STATUS:"
echo "  docker ps"
echo "  cat /opt/shadow/watcher.log"
echo "  tail -f /opt/honeypots/cowrie/log/cowrie.json"
echo "  ss -lntp | grep -E ':22|:2222|:445'"
echo ""
echo "TO STOP EVERYTHING:"
echo "  docker stop cowrie dionaea"
echo "  pkill -f watcher.ts"
echo ""
echo "⚠️  This server is now EXPOSED to the internet."
echo "   Attacks should begin within minutes."
echo ""
