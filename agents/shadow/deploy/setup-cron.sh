#!/bin/bash
# ============================================================
# SHADOW CRONTAB SETUP
# ============================================================
#
# This script sets up the cron jobs that keep Shadow running
# and reporting regularly.
#
# Run once after deployment:
#   ./setup-cron.sh
#
# ============================================================

set -e

FORT_DIR="/root/fort"
SHADOW_DIR="$FORT_DIR/shadow"
SCRIPTS_DIR="$FORT_DIR/scripts"

echo "╔══════════════════════════════════════════════════════════╗"
echo "║          SHADOW CRONTAB SETUP                            ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# Create scripts directory
mkdir -p "$SCRIPTS_DIR"

# ============================================================
# Create helper scripts
# ============================================================

# Heartbeat script
cat > "$SCRIPTS_DIR/heartbeat.sh" << 'HEARTEOF'
#!/bin/bash
cd /root/fort/shadow
bun run engine/shadow-daemon.ts enqueue heartbeat >> logs/cron.log 2>&1
HEARTEOF

# Daily report script
cat > "$SCRIPTS_DIR/daily-report.sh" << 'DAILYEOF'
#!/bin/bash
cd /root/fort/shadow

# Generate report
bun run engine/session-report.ts > data/daily-report.md 2>/dev/null

# Send to Discord if configured
if [ -f "/root/fort/deploy/shadow-webhook.sh" ]; then
  REPORT=$(cat data/daily-report.md 2>/dev/null | head -20)
  /root/fort/deploy/shadow-webhook.sh daily "$REPORT"
fi

# Save current session
bun run engine/session-report.ts --save >> logs/cron.log 2>&1
DAILYEOF

# Weekly report script
cat > "$SCRIPTS_DIR/weekly-report.sh" << 'WEEKLYEOF'
#!/bin/bash
cd /root/fort/shadow

# Generate stats
TOTAL_ATTACKS=$(grep -c "attack\|threat" logs/fort.log 2>/dev/null || echo "0")
UNIQUE_IPS=$(grep -oE "([0-9]{1,3}\.){3}[0-9]{1,3}" logs/fort.log 2>/dev/null | sort -u | wc -l || echo "0")
LEVEL=$(cat data/shadow-state.json 2>/dev/null | grep '"level"' | head -1 | cut -d: -f2 | tr -d ', ')

REPORT="**Weekly Summary**
Attacks this week: $TOTAL_ATTACKS
Unique attackers: $UNIQUE_IPS
Shadow Level: $LEVEL

The fort stands."

# Send to Discord
if [ -f "/root/fort/deploy/shadow-webhook.sh" ]; then
  /root/fort/deploy/shadow-webhook.sh weekly "$REPORT"
fi
WEEKLYEOF

# Honeypot monitor script
cat > "$SCRIPTS_DIR/honeypot-monitor.sh" << 'HONEYPOTEOF'
#!/bin/bash
# Check if honeypots are running, alert if not

COWRIE=$(docker ps --filter name=cowrie --format "{{.Names}}" 2>/dev/null)
DIONAEA=$(docker ps --filter name=dionaea --format "{{.Names}}" 2>/dev/null)

if [ -z "$COWRIE" ]; then
  /root/fort/deploy/shadow-webhook.sh alert "Cowrie honeypot is DOWN!"
fi

if [ -z "$DIONAEA" ]; then
  /root/fort/deploy/shadow-webhook.sh alert "Dionaea honeypot is DOWN!"
fi
HONEYPOTEOF

# Make scripts executable
chmod +x "$SCRIPTS_DIR"/*.sh

echo "[✓] Helper scripts created"
echo ""

# ============================================================
# Setup crontab
# ============================================================

echo "[*] Setting up crontab..."

# Create crontab content
cat > /tmp/shadow-cron << 'CRONEOF'
# Shadow Fort Cron Jobs
# DO NOT EDIT - Managed by Shadow setup-cron.sh

# Heartbeat every 30 minutes
*/30 * * * * /root/fort/scripts/heartbeat.sh

# Daily report at midnight
0 0 * * * /root/fort/scripts/daily-report.sh

# Weekly report on Sunday at 9am
0 9 * * 0 /root/fort/scripts/weekly-report.sh

# Check honeypots every 5 minutes
*/5 * * * * /root/fort/scripts/honeypot-monitor.sh

# Rotate logs weekly
0 0 * * 0 find /root/fort/shadow/logs -name "*.log" -mtime +7 -delete
CRONEOF

# Install crontab
crontab /tmp/shadow-cron
rm /tmp/shadow-cron

echo "[✓] Crontab installed"
echo ""

# Show current crontab
echo "Current crontab:"
echo "─────────────────────────────────────────────────"
crontab -l
echo "─────────────────────────────────────────────────"
echo ""

# ============================================================
# Done
# ============================================================

echo "╔══════════════════════════════════════════════════════════╗"
echo "║          CRONTAB SETUP COMPLETE                          ║"
echo "╠══════════════════════════════════════════════════════════╣"
echo "║                                                          ║"
echo "║  Heartbeat:        Every 30 minutes                      ║"
echo "║  Daily Report:     Midnight (00:00)                      ║"
echo "║  Weekly Report:    Sunday 9am                            ║"
echo "║  Honeypot Check:   Every 5 minutes                       ║"
echo "║                                                          ║"
echo "║  Logs: /root/fort/shadow/logs/cron.log                   ║"
echo "║                                                          ║"
echo "╚══════════════════════════════════════════════════════════╝"
