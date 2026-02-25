#!/bin/bash
# --- BOTOX SYNC PROTOCOL v1 ---
# Moves Experiences (Local) -> Cloud (Global)

# Replace this with your actual VPS IP once set up
REMOTE_IP="YOUR_VPS_IP" 
REMOTE_DIR="/root/fort/experiences"

echo "[*] Initializing Botox Sync..."

# 1. Ensure the directory exists
mkdir -p experiences/

# 2. Sync local experiences to the Cloud Brain (The 24/7 Loop)
# We use rsync for efficiency - it only sends what's new
# rsync -avz experiences/ root@$REMOTE_IP:$REMOTE_DIR/

echo "[✓] Experiences ready for the Cloud. The 'Who' is waiting."
