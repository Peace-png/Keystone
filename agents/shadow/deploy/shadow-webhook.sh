#!/bin/bash
# ============================================================
# SHADOW WEBHOOK - Send alerts to Discord
# ============================================================
#
# Usage:
#   ./shadow-webhook.sh alert "New threat detected from IP 1.2.3.4"
#   ./shadow-webhook.sh daily "Daily report: 50 attacks blocked"
#   ./shadow-webhook.sh threat "Malware sample captured"
#
# Setup:
#   1. Create Discord channel
#   2. Settings → Integrations → Webhooks → New Webhook
#   3. Copy webhook URL
#   4. Set WEBHOOK_URL below or in /root/fort/config/webhook.env
# ============================================================

set -e

# Load config if exists
if [ -f "/root/fort/config/webhook.env" ]; then
  source /root/fort/config/webhook.env
fi

# Default webhook (override in webhook.env)
WEBHOOK_URL="${WEBHOOK_URL:-}"

# Colors for embeds
COLOR_RED=15158332      # Danger/Error
COLOR_ORANGE=15105570   # Warning
COLOR_GREEN=3066993     # Success
COLOR_BLUE=3447003      # Info
COLOR_PURPLE=10181046   # Special

# ============================================================
# Send webhook
# ============================================================
send_webhook() {
  local title="$1"
  local description="$2"
  local color="$3"
  local footer="$4"

  if [ -z "$WEBHOOK_URL" ]; then
    echo "[WARN] No WEBHOOK_URL configured. Skipping notification."
    return 0
  fi

  local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

  local json=$(cat <<EOF
{
  "embeds": [{
    "title": "$title",
    "description": "$description",
    "color": $color,
    "footer": {
      "text": "$footer"
    },
    "timestamp": "$timestamp"
  }]
}
EOF
)

  curl -s -X POST \
    -H "Content-Type: application/json" \
    -d "$json" \
    "$WEBHOOK_URL" > /dev/null 2>&1

  echo "[OK] Webhook sent: $title"
}

# ============================================================
# Alert types
# ============================================================

alert() {
  local message="$1"
  send_webhook \
    "🌑 Shadow Alert" \
    "$message" \
    "$COLOR_ORANGE" \
    "Shadow Fort"
}

threat() {
  local message="$1"
  send_webhook \
    "⚠️ Threat Detected" \
    "$message" \
    "$COLOR_RED" \
    "Shadow Fort - Threat Intel"
}

daily() {
  local message="$1"
  send_webhook \
    "📊 Daily Report" \
    "$message" \
    "$COLOR_BLUE" \
    "Shadow Fort - Daily Summary"
}

weekly() {
  local message="$1"
  send_webhook \
    "📈 Weekly Report" \
    "$message" \
    "$COLOR_PURPLE" \
    "Shadow Fort - Weekly Summary"
}

business() {
  local message="$1"
  send_webhook \
    "💰 Business Update" \
    "$message" \
    "$COLOR_GREEN" \
    "Shadow Fort - Business"
}

startup() {
  local hostname=$(hostname)
  local ip=$(curl -s ifconfig.me 2>/dev/null || echo "unknown")
  send_webhook \
    "🚀 Shadow Fort Online" \
    "Fort deployed and running.\n**Host:** $hostname\n**IP:** $ip" \
    "$COLOR_GREEN" \
    "Shadow Fort"
}

# ============================================================
# Generate daily report
# ============================================================

generate_daily_report() {
  local log_file="/root/fort/shadow/logs/fort.log"
  local attacks_today=$(grep -c "attack\|threat\|brute" "$log_file" 2>/dev/null || echo "0")
  local unique_ips=$(grep -oE "([0-9]{1,3}\.){3}[0-9]{1,3}" "$log_file" 2>/dev/null | sort -u | wc -l || echo "0")
  local top_country=$(grep "country" "$log_file" 2>/dev/null | tail -1 | cut -d: -f2 || echo "Unknown")

  cat <<EOF
**Attacks Today:** $attacks_today
**Unique IPs:** $unique_ips
**Top Origin:** $top_country

*Shadow is watching.*
EOF
}

# ============================================================
# Main
# ============================================================

case "$1" in
  alert)
    alert "$2"
    ;;
  threat)
    threat "$2"
    ;;
  daily)
    daily "$(generate_daily_report)"
    ;;
  weekly)
    weekly "$2"
    ;;
  business)
    business "$2"
    ;;
  startup)
    startup
    ;;
  test)
    alert "This is a test alert from Shadow Fort"
    ;;
  *)
    echo "Usage: $0 {alert|threat|daily|weekly|business|startup|test} [message]"
    exit 1
    ;;
esac
