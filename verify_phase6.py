"""
Keystone Phase 6 Verification Tests

Tests that Witness Layer is correctly implemented:
- ISC-31: Hash-based Witness (not zkVM)
- ISC-32: SOUL.md hash verification at boot
- ISC-33: Constitutional adapter hash verification at boot
- ISC-34: State invariance proof (H_before = H_after)
- ISC-35: Witness heartbeat in daemon loop
- ISC-36: Cross-layer verification

Run with: python verify_phase6.py
"""

import json
import sys
from pathlib import Path


def test_hash_functions():
    """Test hash computation functions"""
    print("=" * 60)
    print("TEST: Hash Functions")
    print("=" * 60)

    try:
        from witness import get_git_file_hash, get_actual_file_hash, get_env_expected_hash
    except ImportError as e:
        print(f"  ❌ FAIL: witness module not found: {e}")
        return False

    except Exception as e:
        print(f"  ⚠️ Hash function test error (not critical): {e}")
        return False


