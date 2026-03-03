#!/bin/bash
# ============================================================
# SHADOW FORT - QUICK SETUP
# ============================================================
#
# Run this after fort-deploy.sh to finish setup:
#
#   scp -r deploy/* root@YOUR_VPS_IP:/root/fort/
#   ssh root@YOUR_VPS_IP
#   cd /root/fort
#   ./quick-setup.sh
#
# ============================================================

set -e

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║          SHADOW FORT - QUICK SETUP                       ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

FORT_DIR="/root/fort"
CONFIG_DIR="$FORT_DIR/config"
SHADOW_DIR="$FORT_DIR/shadow"
DEPLOY_DIR="$FORT_DIR/deploy"

# ============================================================
# Check prerequisites
# ============================================================

echo "[1/6] Checking prerequisites..."

if ! command -v docker &> /dev/null; then
  echo "[!] Docker not found. Run fort-deploy.sh first."
  exit 1
fi

if ! command -v bun &> /dev/null; then
  echo "[*] Installing Bun..."
  curl -fsSL https://bun.sh/install | bash
  export PATH="$HOME/.bun/bin:$PATH"
fi

echo "    ✓ Prerequisites OK"

# ============================================================
# Create directory structure
# ============================================================

echo "[2/6] Creating directories..."

mkdir -p "$CONFIG_DIR"
mkdir -p "$SHADOW_DIR"/{engine,data,logs,reports}
mkdir -p "$FORT_DIR"/scripts

echo "    ✓ Directories created"

# ============================================================
# Copy Shadow engine files
# ============================================================

echo "[3/6] Setting up Shadow engine..."

# Copy from deploy if they exist
if [ -d "$DEPLOY_DIR/engine" ]; then
  cp -r "$DEPLOY_DIR/engine"/* "$SHADOW_DIR/engine/"
else
  echo "    [!] Engine files not found in deploy/"
  echo "    [!] You'll need to copy engine files manually:"
  echo "        scp -r /home/peace/clawd/engine/* root@THIS_SERVER:/root/fort/shadow/engine/"
fi

echo "    ✓ Engine ready"

# ============================================================
# Configure webhook
# ============================================================

echo "[4/6] Configuring webhook..."

if [ ! -f "$CONFIG_DIR/webhook.env" ]; then
  if [ -f "$DEPLOY_DIR/config-template.env" ]; then
    cp "$DEPLOY_DIR/config-template.env" "$CONFIG_DIR/webhook.env"
    echo ""
    echo "    ┌─────────────────────────────────────────────────┐"
    echo "    │  ACTION REQUIRED                                │"
    echo "    │                                                  │"
    echo "    │  Edit $CONFIG_DIR/webhook.env       │"
    echo "    │  Add your Discord webhook URL                   │"
    echo "    │                                                  │"
    echo "    │  nano $CONFIG_DIR/webhook.env       │"
    echo "    └─────────────────────────────────────────────────┘"
    echo ""
  fi
else
  echo "    ✓ Webhook config exists"
fi

# ============================================================
# Install systemd service
# ============================================================

echo "[5/6] Installing systemd service..."

if [ -f "$DEPLOY_DIR/shadow-fort.service" ]; then
  cp "$DEPLOY_DIR/shadow-fort.service" /etc/systemd/system/
  systemctl daemon-reload
  systemctl enable shadow-fort
  echo "    ✓ Systemd service installed"
else
  echo "    [!] Service file not found, skipping"
fi

# ============================================================
# Setup crontab
# ============================================================

echo "[6/6] Setting up crontab..."

if [ -f "$DEPLOY_DIR/setup-cron.sh" ]; then
  chmod +x "$DEPLOY_DIR/setup-cron.sh"
  "$DEPLOY_DIR/setup-cron.sh"
else
  echo "    [!] Cron setup script not found, skipping"
fi

# ============================================================
# Test webhook
# ============================================================

echo ""
echo "Testing webhook..."

if [ -f "$DEPLOY_DIR/shadow-webhook.sh" ]; then
  chmod +x "$DEPLOY_DIR/shadow-webhook.sh"

  # Check if webhook URL is configured
  if grep -q "YOUR_WEBHOOK" "$CONFIG_DIR/webhook.env" 2>/dev/null; then
    echo "    [!] Webhook not configured yet. Edit $CONFIG_DIR/webhook.env"
  else
    "$DEPLOY_DIR/shadow-webhook.sh" startup
    echo "    ✓ Webhook test sent"
  fi
fi

# ============================================================
# Done
# ============================================================

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║          SETUP COMPLETE                                  ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║                                                          ║"
echo "║  NEXT STEPS:                                             ║"
echo "║                                                          ║"
echo "║  1. Edit webhook config:                                 ║"
echo "║     nano /root/fort/config/webhook.env                   ║"
echo "║                                                          ║"
echo "║  2. Copy engine files from local:                        ║"
echo "║     scp -r ~/clawd/engine/* root@THIS_IP:/root/fort/shadow/engine/  ║"
echo "║                                                          ║"
echo "║  3. Start Shadow:                                        ║"
echo "║     systemctl start shadow-fort                          ║"
echo "║                                                          ║"
echo "║  4. Check status:                                        ║"
echo "║     systemctl status shadow-fort                         ║"
echo "║     tail -f /root/fort/shadow/logs/fort.log              ║"
echo "║                                                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""
