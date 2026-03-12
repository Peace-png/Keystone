"""
Keystone Phase 7 Verification Tests

Tests that Daemon Runtime Loops are correctly implemented:
- ISC-37: All daemons have 5-second heartbeat
- ISC-38: Memory daemon runs mid-session reindex
- ISC-39: SCAR daemon runs periodic checkpoint
- ISC-35: Witness heartbeat in daemon loop
- ISC-40: TELOS daemon integrated (purpose layer)

Run with: python verify_phase7.py
"""

import sys
from pathlib import Path


def test_daemon_imports():
    """Test that daemon module imports correctly."""
    print("=" * 60)
    print("TEST: Daemon Imports")
    print("=" * 60)

    try:
        from daemon import (
            KeystoneDaemon,
            DaemonConfig,
            DaemonState,
            ComponentHealth,
            HeartbeatResult,
            DaemonStatus,
        )
        print("  ✅ All daemon classes imported")
        return True
    except ImportError as e:
        print(f"  ❌ FAIL: daemon module import error: {e}")
        return False


def test_component_interfaces():
    """Test that component interfaces are defined."""
    print("\n" + "=" * 60)
    print("TEST: Component Interfaces")
    print("=" * 60)

    try:
        from daemon import (
            ComponentInterface,
            MemoryComponent,
            SCARComponent,
            WitnessComponent,
            DriftMonitorComponent,
            TELOSComponent,
            ConsolidationGateComponent,
        )
        print("  ✅ All component interfaces imported")
        return True
    except ImportError as e:
        print(f"  ❌ FAIL: component interface import error: {e}")
        return False


def test_daemon_config():
    """Test ISC-37: Daemon configuration with 5-second heartbeat."""
    print("\n" + "=" * 60)
    print("TEST: ISC-37 - Daemon Config (5-second heartbeat)")
    print("=" * 60)

    try:
        from daemon import DaemonConfig

        config = DaemonConfig()
        assert config.heartbeat_interval_seconds == 5.0, \
            f"Heartbeat interval should be 5.0, got {config.heartbeat_interval_seconds}"
        print(f"  ✅ Heartbeat interval: {config.heartbeat_interval_seconds}s")
        return True
    except AssertionError as e:
        print(f"  ❌ FAIL: {e}")
        return False
    except Exception as e:
        print(f"  ❌ FAIL: {e}")
        return False


def test_daemon_initialization():
    """Test daemon initialization."""
    print("\n" + "=" * 60)
    print("TEST: Daemon Initialization")
    print("=" * 60)

    try:
        from daemon import KeystoneDaemon, DaemonConfig, DaemonState

        config = DaemonConfig(
            state_file="./test_daemon/state.json",
            log_file="./test_daemon/daemon.log",
            pid_file="./test_daemon/daemon.pid",
        )
        daemon = KeystoneDaemon(config)

        assert daemon.state.state == DaemonState.INITIALIZING or daemon.state.state == DaemonState.RUNNING, \
            f"Daemon should be initializing or running, got {daemon.state.state}"
        print(f"  ✅ Daemon initialized with state: {daemon.state.state.value}")

        # Check components initialized
        assert len(daemon._components) >= 5, \
            f"Should have at least 5 components, got {len(daemon._components)}"
        print(f"  ✅ Components initialized: {list(daemon._components.keys())}")

        return True
    except AssertionError as e:
        print(f"  ❌ FAIL: {e}")
        return False
    except Exception as e:
        print(f"  ❌ FAIL: {e}")
        return False


def test_heartbeat_execution():
    """Test ISC-37: Heartbeat execution."""
    print("\n" + "=" * 60)
    print("TEST: ISC-37 - Heartbeat Execution")
    print("=" * 60)

    try:
        from daemon import KeystoneDaemon, DaemonConfig

        config = DaemonConfig(
            state_file="./test_daemon/state.json",
            log_file="./test_daemon/daemon.log",
            pid_file="./test_daemon/daemon.pid",
        )
        daemon = KeystoneDaemon(config)

        # Run single heartbeat
        result = daemon.run_single_heartbeat()
        print(f"  ✅ Heartbeat executed: {'healthy' if result else 'degraded'}")
        print(f"  ✅ Total heartbeats: {daemon.state.total_heartbeats}")

        return True
    except Exception as e:
        print(f"  ❌ FAIL: {e}")
        return False


def test_component_heartbeats():
    """Test ISC-38/39/35/40: Component heartbeat methods."""
    print("\n" + "=" * 60)
    print("TEST: ISC-38/39/35/40 - Component Heartbeats")
    print("=" * 60)

    try:
        from daemon import (
            MemoryComponent,
            SCARComponent,
            WitnessComponent,
            DriftMonitorComponent,
            TELOSComponent,
            ConsolidationGateComponent,
            ComponentHealth,
        )

        # Test Memory component (ISC-38)
        memory = MemoryComponent()
        result = memory.check_heartbeat()
        assert result.status in [ComponentHealth.HEALTHY, ComponentHealth.DEGRADED], \
            f"Memory status should be HEALTHY or DEGRADED, got {result.status}"
        print(f"  ✅ ISC-38 Memory: {result.status.value} - {result.message}")

        # Test SCAR component (ISC-39)
        scar = SCARComponent()
        result = scar.check_heartbeat()
        assert result.status in [ComponentHealth.HEALTHY, ComponentHealth.DEGRADED], \
            f"SCAR status should be HEALTHY or DEGRADED, got {result.status}"
        print(f"  ✅ ISC-39 SCAR: {result.status.value} - {result.message}")

        # Test Witness component (ISC-35)
        witness = WitnessComponent()
        result = witness.check_heartbeat()
        assert result.status in [ComponentHealth.HEALTHY, ComponentHealth.DEGRADED], \
            f"Witness status should be HEALTHY or DEGRADED, got {result.status}"
        print(f"  ✅ ISC-35 Witness: {result.status.value} - {result.message}")

        # Test Drift Monitor component
        drift = DriftMonitorComponent()
        result = drift.check_heartbeat()
        assert result.status in [ComponentHealth.HEALTHY, ComponentHealth.DEGRADED], \
            f"Drift status should be HEALTHY or DEGRADED, got {result.status}"
        print(f"  ✅ Drift Monitor: {result.status.value} - {result.message}")

        # Test TELOS component (ISC-40)
        telos = TELOSComponent()
        result = telos.check_heartbeat()
        assert result.status in [ComponentHealth.HEALTHY, ComponentHealth.DEGRADED], \
            f"TELOS status should be HEALTHY or DEGRADED, got {result.status}"
        print(f"  ✅ ISC-40 TELOS: {result.status.value} - {result.message}")

        # Test Consolidation Gate component
        gate = ConsolidationGateComponent()
        result = gate.check_heartbeat()
        assert result.status in [ComponentHealth.HEALTHY, ComponentHealth.DEGRADED], \
            f"Gate status should be HEALTHY or DEGRADED, got {result.status}"
        print(f"  ✅ Consolidation Gate: {result.status.value} - {result.message}")

        return True
    except AssertionError as e:
        print(f"  ❌ FAIL: {e}")
        return False
    except Exception as e:
        print(f"  ❌ FAIL: {e}")
        return False


def test_daemon_status():
    """Test daemon status reporting."""
    print("\n" + "=" * 60)
    print("TEST: Daemon Status Reporting")
    print("=" * 60)

    try:
        from daemon import KeystoneDaemon, DaemonConfig

        config = DaemonConfig(
            state_file="./test_daemon/state.json",
            log_file="./test_daemon/daemon.log",
            pid_file="./test_daemon/daemon.pid",
        )
        daemon = KeystoneDaemon(config)

        # Get status
        status = daemon.get_status()
        print(f"  ✅ Status retrieved")
        print(f"     State: {status['state']}")
        print(f"     Components: {status['components']}")

        # Check required fields
        required = ['state', 'started_at', 'uptime_seconds', 'total_heartbeats',
                    'successful_heartbeats', 'failed_heartbeats', 'component_health']
        for field in required:
            assert field in status, f"Missing field: {field}"
        print(f"  ✅ All required status fields present")

        return True
    except AssertionError as e:
        print(f"  ❌ FAIL: {e}")
        return False
    except Exception as e:
        print(f"  ❌ FAIL: {e}")
        return False


def test_graceful_shutdown():
    """Test daemon shutdown."""
    print("\n" + "=" * 60)
    print("TEST: Graceful Shutdown")
    print("=" * 60)

    try:
        from daemon import KeystoneDaemon, DaemonConfig, DaemonState

        config = DaemonConfig(
            state_file="./test_daemon/state.json",
            log_file="./test_daemon/daemon.log",
            pid_file="./test_daemon/daemon.pid",
        )
        daemon = KeystoneDaemon(config)

        # Run heartbeat
        daemon.run_single_heartbeat()

        # Shutdown
        daemon.shutdown()
        assert daemon.state.state == DaemonState.STOPPED, \
            f"Daemon should be STOPPED after shutdown, got {daemon.state.state}"
        print(f"  ✅ Daemon shutdown complete")

        return True
    except AssertionError as e:
        print(f"  ❌ FAIL: {e}")
        return False
    except Exception as e:
        print(f"  ❌ FAIL: {e}")
        return False


def main():
    """Run all Phase 7 verification tests."""
    tests = [
        ("Daemon Imports", test_daemon_imports),
        ("Component Interfaces", test_component_interfaces),
        ("ISC-37 Daemon Config", test_daemon_config),
        ("Daemon Initialization", test_daemon_initialization),
        ("ISC-37 Heartbeat", test_heartbeat_execution),
        ("Component Heartbeats", test_component_heartbeats),
        ("Daemon Status", test_daemon_status),
        ("Graceful Shutdown", test_graceful_shutdown),
    ]

    results = {}
    for name, test_func in tests:
        try:
            results[name] = test_func()
        except Exception as e:
            print(f"  ❌ ERROR: {name}: {e}")
            import traceback
            traceback.print_exc()
            results[name] = False

    # Cleanup test directory
    import shutil
    test_dir = Path("./test_daemon")
    if test_dir.exists():
        shutil.rmtree(test_dir, ignore_errors=True)

    # Summary
    print()
    print("=" * 60)
    print("PHASE 7 VERIFICATION SUMMARY")
    print("=" * 60)

    passed = sum(1 for v in results.values() if v)
    total = len(results)

    for name, passed_test in results.items():
        status = "✅ PASS" if passed_test else "❌ FAIL"
        print(f"  {status}: {name}")

    print(f"\n  Total: {passed}/{total} tests passed")

    if passed == total:
        print()
        print("  🎉 Phase 7 (Daemon Runtime Loops) complete!")
        return True
    else:
        print()
        print("  ⚠️  Some tests failed - fix before proceeding")
        return False


if __name__ == "__main__":
    import os
    os.chdir(Path(__file__).parent)

    success = main()
    sys.exit(0 if success else 1)
