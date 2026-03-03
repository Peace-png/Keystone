#!/bin/bash
# SHADOW VOICE WRAPPER
# Call this to make Shadow speak

# Use female voice (af_heart) or male (am_michael)
VOICE="${SHADOW_VOICE:-af_heart}"

export VOICE
~/ai-audio/speak "$@"
