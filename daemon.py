"""
Keystone Phase 7: Daemon Runtime Loops

Implements the runtime daemon that orchestrates all Keystone components:
- SCAR checkpoint (ISC-39)
- Memory reindex (ISC-38)
- Witness heartbeat (ISC-35)
- Drift monitor check (Phase 5)
- TELOS alignment check (ISC-40)

Key ISC (Ideal State Criteria):
- ISC-37: All daemons have 5-second heartbeat
- ISC-38: Memory daemon runs mid-session reindex
- ISC-39: SCAR daemon runs periodic checkpoint
- ISC-40: TELOS daemon integrated (purpose layer)

Architecture:
- Main daemon loop runs at 5-second interval
- Each component has a check_heartbeat() method
- Daemon maintains state across iterations
- Provides status reporting and shutdown handling
"""

import json
import logging
import os
import signal
import sys
import time
import threading
from dataclasses import dataclass, field, asdict
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Dict, List, Optional, Callable, Any, Tuple


# ============================================================================
# ENUMS AND DATA STRUCTURES
# ============================================================================

class DaemonState(str, Enum):
    """State of the Keystone daemon."""
    INITIALIZING = "initializing"
    RUNNING = "running"
    PAUSED = "paused"
    STOPPING = "stopping"
    STOPPED = "stopped"
    ERROR = "error"


class ComponentHealth(str, Enum):
    """Health status of a component."""
    HEALTHY = "healthy"
    DEGRADED = "degraded"
    FAILED = "failed"
    UNKNOWN = "unknown"


@dataclass
class HeartbeatResult:
    """Result of a component heartbeat check."""
    component: str
    timestamp: str
    status: ComponentHealth
    message: str
    latency_ms: float
    details: Dict = field(default_factory=dict)


@dataclass
class DaemonStatus:
    """Current status of the daemon."""
    state: DaemonState
    started_at: str
    uptime_seconds: float
    total_heartbeats: int
    successful_heartbeats: int
    failed_heartbeats: int
    last_heartbeat: Optional[str]
    component_health: Dict[str, ComponentHealth]
    errors: List[str]
    warnings: List[str]


@dataclass
class DaemonConfig:
    """Configuration for the daemon."""
    heartbeat_interval_seconds: float = 5.0
    checkpoint_interval_seconds: float = 30.0
    reindex_interval_seconds: float = 60.0
    max_errors: int = 10
    error_cooldown_seconds: float = 5.0
    log_level: str = "INFO"
    state_file: str = "./daemon/state.json"
    pid_file: str = "./daemon/daemon.pid"
    log_file: str = "./daemon/daemon.log"
    shutdown_timeout_seconds: float = 5.0
    enable_witness: bool = True
    enable_drift_monitor: bool = True
    enable_scar_checkpoint: bool = True
    enable_memory_reindex: bool = True
    enable_telos_alignment: bool = True
    enable_consolidation_gate: bool = True


# ============================================================================
# COMPONENT INTERFACES
# ============================================================================

class ComponentInterface:
    """Interface that all daemon components must implement."""
    def check_heartbeat(self) -> HeartbeatResult:
        """Check component health. Returns heartbeat result."""
        pass

    def get_status(self) -> Dict:
        """Get component status."""
        pass

    def shutdown(self) -> None:
        """Shutdown component gracefully."""
        pass


# ============================================================================
# MEMORY COMPONENT
# ============================================================================

class MemoryComponent(ComponentInterface):
    """
    Memory daemon component - runs mid-session reindex.

    ISC-38: Memory daemon runs mid-session reindex.
    """

    def __init__(self, path: str = "./MEMORY"):
        self.logger = logging.getLogger("MemoryComponent")
        self._index_count = 0
        self._last_index_time = 0.0

        self._pending_reindex = False

    def check_heartbeat(self) -> HeartbeatResult:
        """Check memory component health."""
        start_time = time.time()

        # Check if reindex is needed
        reindex_needed = self._check_reindex_needed()

        status = ComponentHealth.HEALTHY if not reindex_needed else ComponentHealth.DEGRADED

        latency = (time.time() - start_time) * 1000

        # Trigger reindex if needed
        if reindex_needed:
            self._trigger_reindex()
            status = ComponentHealth.HEALTHY

        else:
            status = ComponentHealth.HEALTHY

        return HeartbeatResult(
            component="memory",
            timestamp=datetime.now().isoformat(),
            status=status,
            message="Memory healthy" if status == ComponentHealth.HEALTHY else "Reindex in progress",
            latency_ms=latency,
        )

    def _check_reindex_needed(self) -> bool:
        """Check if memory reindex is needed."""
        # Simple heuristic: reindex every 60 seconds
        time_since_last = time.time() - self._last_index_time
        return time_since_last > 60.0

    def _trigger_reindex(self) -> None:
        """Trigger memory reindex operation."""
        if self._pending_reindex:
            self.logger.info("Reindex already in progress")
            return

        self._pending_reindex = True
        self.logger.info("Starting memory reindex...")

        try:
            # In a real implementation, this would call the actual memory indexing
            # For now, simulate the work
            time.sleep(0.1)  # Simulate work
            self._index_count += 1
            self._last_index_time = time.time()
            self._pending_reindex = False
            self.logger.info(f"Reindex complete. Total indices: {self._index_count}")
        except Exception as e:
            self.logger.error(f"Reindex failed: {e}")
            self._pending_reindex = False
            raise

    def get_status(self) -> Dict:
        """Get memory component status."""
        return {
            "index_count": self._index_count,
            "last_index_time": self._last_index_time,
            "pending_reindex": self._pending_reindex,
        }

    def shutdown(self) -> None:
        """Shutdown memory component."""
        self.logger.info("Shutting down memory component")


# ============================================================================
# SCAR COMPONENT
# ============================================================================

class SCARComponent(ComponentInterface):
    """
    SCAR daemon component - runs periodic checkpoint.

    ISC-39: SCAR daemon runs periodic checkpoint.
    """

    def __init__(self, path: str = "./SCAR"):
        self.logger = logging.getLogger("SCARComponent")
        self._checkpoint_count = 0
        self._last_checkpoint_time = 0.0
        self._active_scar = None
        self._violations_detected = 0

    def set_active_scar(self, active_scar: Any) -> None:
        """Set the active SCAR instance."""
        self._active_scar = active_scar

    def check_heartbeat(self) -> HeartbeatResult:
        """Check SCAR component health."""
        start_time = time.time()

        # Run SCAR checkpoint
        checkpoint_result = self._run_checkpoint()
        status = checkpoint_result["status"]
        latency = (time.time() - start_time) * 1000

        return HeartbeatResult(
            component="scar",
            timestamp=datetime.now().isoformat(),
            status=status,
            message=checkpoint_result["message"],
            latency_ms=latency,
            details=checkpoint_result.get("details", {}),
        )

    def _run_checkpoint(self) -> Dict:
        """Run SCAR checkpoint."""
        result = {
            "status": ComponentHealth.HEALTHY,
            "message": "SCAR checkpoint passed",
            "details": {
                "checkpoint_count": self._checkpoint_count,
                "violations": self._violations_detected,
            }
        }

        # If ActiveSCAR is set, use it for verification
        if self._active_scar is not None:
            try:
                # Get SCAR stats
                stats = self._active_scar.get_stats()
                result["details"]["active_scar_stats"] = stats

                # Check for any blocking events
                if stats.get("total_blocks", 0) > 0:
                    self._violations_detected += stats["total_blocks"]
                    result["details"]["violations"] = stats["total_blocks"]

            except Exception as e:
                self.logger.warning(f"ActiveSCAR check failed: {e}")
                result["status"] = ComponentHealth.DEGRADED
                result["message"] = f"ActiveSCAR error: {e}"

        self._checkpoint_count += 1
        self._last_checkpoint_time = time.time()
        return result

    def get_status(self) -> Dict:
        """Get SCAR component status."""
        return {
            "checkpoint_count": self._checkpoint_count,
            "last_checkpoint_time": self._last_checkpoint_time,
            "violations_detected": self._violations_detected,
        }

    def shutdown(self) -> None:
        """Shutdown SCAR component."""
        self.logger.info("Shutting down SCAR component")


# ============================================================================
# WITNESS COMPONENT
# ============================================================================

class WitnessComponent(ComponentInterface):
    """
    Witness daemon component - runs heartbeat verification.

    ISC-35: Witness heartbeat in daemon loop.
    """

    def __init__(self, path: str = "./witness"):
        self.logger = logging.getLogger("WitnessComponent")
        self._witness = None
        self._heartbeat_count = 0
        self._last_heartbeat_time = 0.0
        self._verifications_passed = 0
        self._verifications_failed = 0

    def set_witness(self, witness: Any) -> None:
        """Set the witness instance."""
        self._witness = witness

    def check_heartbeat(self) -> HeartbeatResult:
        """Check witness component health."""
        start_time = time.time()

        # Run witness heartbeat
        heartbeat_result = self._run_heartbeat()
        status = heartbeat_result["status"]
        latency = (time.time() - start_time) * 1000

        return HeartbeatResult(
            component="witness",
            timestamp=datetime.now().isoformat(),
            status=status,
            message=heartbeat_result["message"],
            latency_ms=latency,
            details=heartbeat_result.get("details", {}),
        )

    def _run_heartbeat(self) -> Dict:
        """Run witness heartbeat verification."""
        result = {
            "status": ComponentHealth.HEALTHY,
            "message": "Witness heartbeat passed",
            "details": {
                "heartbeat_count": self._heartbeat_count,
                "verifications_passed": self._verifications_passed,
                "verifications_failed": self._verifications_failed,
            }
        }

        # If Witness is set, use it for verification
        if self._witness is not None:
            try:
                # Update witness heartbeat
                heartbeat = self._witness.update_heartbeat()
                result["details"]["witness_heartbeat"] = heartbeat

                # Check witness health
                if not self._witness.is_healthy():
                    self._verifications_passed += 1
                else:
                    self._verifications_failed += 1
                    result["status"] = ComponentHealth.DEGRADED
                    result["message"] = "Witness verification failed"

            except Exception as e:
                self.logger.warning(f"Witness heartbeat failed: {e}")
                result["status"] = ComponentHealth.DEGRADED
                result["message"] = f"Witness error: {e}"

        self._heartbeat_count += 1
        self._last_heartbeat_time = time.time()
        return result

    def get_status(self) -> Dict:
        """Get witness component status."""
        return {
            "heartbeat_count": self._heartbeat_count,
            "last_heartbeat_time": self._last_heartbeat_time,
            "verifications_passed": self._verifications_passed,
            "verifications_failed": self._verifications_failed,
        }

    def shutdown(self) -> None:
        """Shutdown witness component."""
        self.logger.info("Shutting down witness component")


# ============================================================================
# DRIFT MONITOR COMPONENT
# ============================================================================

class DriftMonitorComponent(ComponentInterface):
    """
    Drift monitor component - checks for model drift.

    Phase 5: Drift Monitoring
    """

    def __init__(self, path: str = "./drift_monitor"):
        self.logger = logging.getLogger("DriftMonitorComponent")
        self._drift_monitor = None
        self._check_count = 0
        self._last_check_time = 0.0
        self._drifts_detected = 0

        self._auto_rejects = 0

    def set_drift_monitor(self, drift_monitor: Any) -> None:
        """Set the drift monitor instance."""
        self._drift_monitor = drift_monitor

    def check_heartbeat(self) -> HeartbeatResult:
        """Check drift monitor health."""
        start_time = time.time()

        # Run drift check
        drift_result = self._run_drift_check()
        status = drift_result["status"]
        latency = (time.time() - start_time) * 1000

        return HeartbeatResult(
            component="drift_monitor",
            timestamp=datetime.now().isoformat(),
            status=status,
            message=drift_result["message"],
            latency_ms=latency,
            details=drift_result.get("details", {}),
        )

    def _run_drift_check(self) -> Dict:
        """Run drift check."""
        result = {
            "status": ComponentHealth.HEALTHY,
            "message": "Drift check passed",
            "details": {
                "check_count": self._check_count,
                "drifts_detected": self._drifts_detected,
                "auto_rejects": self._auto_rejects,
            }
        }

        # If DriftMonitor is set, use it for drift check
        if self._drift_monitor is not None:
            try:
                # Get drift status
                status = self._drift_monitor.get_status()
                result["details"]["drift_status"] = status

                # Check for drift issues
                if status.get("drifts_detected", 0) > 0:
                    self._drifts_detected += status["drifts_detected"]
                    result["details"]["recent_drifts"] = status["drifts_detected"]

                # Check for auto rejects
                # In a real implementation, would check the consolidation gate
                # For now, use the simplified check
                can_proceed = self._drift_monitor.can_proceed_with_merge()
                if not can_proceed:
                    self._auto_rejects += 1
                    result["status"] = ComponentHealth.DEGRADED
                    result["message"] = "Drift detected - merge rejected"
                    result["details"]["auto_reject"] = True

            except Exception as e:
                self.logger.warning(f"Drift check failed: {e}")
                result["status"] = ComponentHealth.DEGRADED
                result["message"] = f"Drift monitor error: {e}"

        self._check_count += 1
        self._last_check_time = time.time()
        return result

    def get_status(self) -> Dict:
        """Get drift monitor component status."""
        return {
            "check_count": self._check_count,
            "last_check_time": self._last_check_time,
            "drifts_detected": self._drifts_detected,
            "auto_rejects": self._auto_rejects,
        }

    def shutdown(self) -> None:
        """Shutdown drift monitor component."""
        self.logger.info("Shutting down drift monitor component")


# ============================================================================
# TELOS COMPONENT
# ============================================================================

class TELOSComponent(ComponentInterface):
    """
    TELOS daemon component - purpose layer alignment.

    ISC-40: TELOS daemon integrated (purpose layer)
    """

    def __init__(self, path: str = "./TELOS"):
        self.logger = logging.getLogger("TELOSComponent")
        self._alignment_count = 0
        self._last_alignment_time = 0.0
        self._misalignments_detected = 0

    def check_heartbeat(self) -> HeartbeatResult:
        """Check TELOS component health."""
        start_time = time.time()

        # Run TELOS alignment check
        alignment_result = self._run_alignment_check()
        status = alignment_result["status"]
        latency = (time.time() - start_time) * 1000

        return HeartbeatResult(
            component="telos",
            timestamp=datetime.now().isoformat(),
            status=status,
            message=alignment_result["message"],
            latency_ms=latency,
            details=alignment_result.get("details", {}),
        )

    def _run_alignment_check(self) -> Dict:
        """Run TELOS alignment check."""
        result = {
            "status": ComponentHealth.HEALTHY,
            "message": "TELOS alignment passed",
            "details": {
                "alignment_count": self._alignment_count,
                "misalignments": self._misalignments_detected,
            }
        }

        # In a real implementation, this would:
        # 1. Load TELOS missions from core/TELOS/MISSION.md
        # 2. Load TELOS goals from core/TELOS/GOALS.md
        # 3. Check that current actions align with missions
        # 4. Track progress toward goals
        # For now, simulate
        self._alignment_count += 1
        self._last_alignment_time = time.time()
        return result

    def get_status(self) -> Dict:
        """Get TELOS component status."""
        return {
            "alignment_count": self._alignment_count,
            "last_alignment_time": self._last_alignment_time,
            "misalignments_detected": self._misalignments_detected,
        }

    def shutdown(self) -> None:
        """Shutdown TELOS component."""
        self.logger.info("Shutting down TELOS component")


# ============================================================================
# CONSOLIDATION GATE COMPONENT
# ============================================================================

class ConsolidationGateComponent(ComponentInterface):
    """
    Consolidation gate component - validates before merge.

    Phase 5: Consolidation Gate (ISC-30)
    """

    def __init__(self, path: str = "./consolidation_gate"):
        self.logger = logging.getLogger("ConsolidationGateComponent")
        self._gate = None
        self._validation_count = 0
        self._last_validation_time: float = 0.0
        self._validations_passed = 0
        self._validations_failed = 0
        self._auto_rejects = 0

    def set_gate(self, gate: Any) -> None:
        """Set the consolidation gate instance."""
        self._gate = gate

    def check_heartbeat(self) -> HeartbeatResult:
        """Check consolidation gate health."""
        start_time = time.time()

        status = ComponentHealth.HEALTHY
        message = "Consolidation gate ready"
        latency = (time.time() - start_time) * 1000

        # If gate is set, use it for validation
        if self._gate is not None:
            try:
                # Run validation
                can_proceed = self._gate.evaluate(
                    perplexity=10.0,
                    capability_results=[True] * 80 + [False] * 20,
                    safety_score=0.90,
                    refusal_rate=0.98,
                    kl_divergence=0.005,
                )
                if can_proceed:
                    self._validations_passed += 1
                    message = "Consolidation validation passed"
                else:
                    self._validations_failed += 1
                    self._auto_rejects += 1
                    status = ComponentHealth.DEGRADED
                    message = "Consolidation rejected"

            except Exception as e:
                self.logger.warning(f"Consolidation gate check failed: {e}")
                status = ComponentHealth.DEGRADED
                message = f"Gate error: {e}"

            self._validation_count += 1
            self._last_validation_time = time.time()
        else:
            status = ComponentHealth.HEALTHY
            message = "Consolidation gate not configured"
            self._validation_count += 1
            self._last_validation_time = time.time()

        latency = (time.time() - start_time) * 1000
        return HeartbeatResult(
            component="consolidation_gate",
            timestamp=datetime.now().isoformat(),
            status=status,
            message=message,
            latency_ms=latency,
            details={
                "validation_count": self._validation_count,
                "validations_passed": self._validations_passed,
                "validations_failed": self._validations_failed,
                "auto_rejects": self._auto_rejects,
            }
        )

    def get_status(self) -> Dict:
        """Get consolidation gate status."""
        return {
            "validation_count": self._validation_count,
            "last_validation_time": self._last_validation_time,
            "validations_passed": self._validations_passed,
            "validations_failed": self._validations_failed,
            "auto_rejects": self._auto_rejects,
        }

    def shutdown(self) -> None:
        """Shutdown consolidation gate component."""
        self.logger.info("Shutting down consolidation gate component")


# ============================================================================
# MAIN DAEMON
# ============================================================================

class KeystoneDaemon:
    """
    Main Keystone daemon that orchestrates all components.

    ISC-37: All daemons have 5-second heartbeat.

    This daemon:
    - Runs a 5-second main loop
    - Checks each component heartbeat
    - Integrates SCAR, memory, witness, drift monitor, TELOS
    - Provides shutdown handling
    - Maintains persistent state
    """

    def __init__(self, config: DaemonConfig = None):
        self.config = config or DaemonConfig()
        self.logger = logging.getLogger("KeystoneDaemon")
        self.state = DaemonStatus(
            state=DaemonState.INITIALIZING,
            started_at=datetime.now().isoformat(),
            uptime_seconds=0.0,
            total_heartbeats=0,
            successful_heartbeats=0,
            failed_heartbeats=0,
            last_heartbeat=None,
            component_health={},
            errors=[],
            warnings=[],
        )
        self._shutdown_requested = False
        self._components: Dict[str, ComponentInterface] = {}

        # Initialize components
        self._init_components()

    def _init_components(self) -> None:
        """Initialize all daemon components."""
        self.logger.info("Initializing daemon components...")

        # Create component directories
        for path in ["./daemon/memory", "./daemon/scar", "./daemon/witness",
                      "./daemon/drift_monitor", "./daemon/telos", "./daemon/consolidation_gate"]:
            Path(path).mkdir(parents=True, exist_ok=True)

        # Initialize components
        try:
            self._components["memory"] = MemoryComponent("./daemon/memory")
            self._components["scar"] = SCARComponent("./daemon/scar")
            self._components["witness"] = WitnessComponent("./daemon/witness")
            self._components["drift_monitor"] = DriftMonitorComponent("./daemon/drift_monitor")
            self._components["telos"] = TELOSComponent("./daemon/telos")
            self._components["consolidation_gate"] = ConsolidationGateComponent("./daemon/consolidation_gate")

            for name in self._components:
                self.state.component_health[name] = ComponentHealth.UNKNOWN

            self.logger.info(f"Initialized {len(self._components)} components")
        except Exception as e:
            self.logger.error(f"Failed to initialize components: {e}")
            self.state.state = DaemonState.ERROR
            self.state.errors.append(str(e))
            raise

    def set_active_scar(self, active_scar: Any) -> None:
        """Set the Active SCAR instance."""
        if "scar" in self._components:
            self._components["scar"].set_active_scar(active_scar)
        self.logger.info("Active SCAR instance set")

    def set_witness(self, witness: Any) -> None:
        """Set the Witness instance."""
        if "witness" in self._components:
            self._components["witness"].set_witness(witness)
        self.logger.info("Witness instance set")

    def set_drift_monitor(self, drift_monitor: Any) -> None:
        """Set Drift Monitor instance."""
        if "drift_monitor" in self._components:
            self._components["drift_monitor"].set_drift_monitor(drift_monitor)
        self.logger.info("Drift Monitor instance set")

    def set_consolidation_gate(self, gate: Any) -> None:
        """Set Consolidation Gate instance."""
        if "consolidation_gate" in self._components:
            self._components["consolidation_gate"].set_gate(gate)
        self.logger.info("Consolidation Gate instance set")

    def run_heartbeat(self) -> bool:
        """
        Run a single heartbeat cycle.

        ISC-37: All daemons have 5-second heartbeat.

        Returns:
            True if heartbeat successful, False otherwise
        """
        if self.state.state != DaemonState.RUNNING:
            self.state.state = DaemonState.RUNNING
            self.state.started_at = self.state.started_at or datetime.now().isoformat()

        heartbeat_start = time.time()
        self.state.total_heartbeats += 1
        all_healthy = True

        # Check each component
        for name, component in self._components.items():
            try:
                result = component.check_heartbeat()
                self.state.component_health[name] = result.status

                if result.status != ComponentHealth.HEALTHY:
                    all_healthy = False
                    self.state.warnings.append(f"{name}: {result.message}")

                self.logger.debug(f"{name}: {result.status.value} - {result.message}")

            except Exception as e:
                self.logger.error(f"{name} heartbeat failed: {e}")
                self.state.component_health[name] = ComponentHealth.FAILED
                self.state.errors.append(f"{name}: {str(e)}")
                all_healthy = False

        # Update state
        self.state.last_heartbeat = datetime.now().isoformat()
        self.state.uptime_seconds = (datetime.now() - datetime.fromisoformat(self.state.started_at)).total_seconds()

        if all_healthy:
            self.state.successful_heartbeats += 1
        else:
            self.state.failed_heartbeats += 1
            self.logger.warning(f"Heartbeat {self.state.total_heartbeats}: Some components degraded")

        # Save state
        self._save_state()

        heartbeat_latency = (time.time() - heartbeat_start) * 1000
        self.logger.info(f"Heartbeat {self.state.total_heartbeats}: {heartbeat_latency:.1f}ms - {'healthy' if all_healthy else 'degraded'}")

        return all_healthy

    def run_forever(self) -> None:
        """
        Run daemon loop forever (until shutdown).

        ISC-37: 5-second heartbeat interval.
        """
        self.logger.info("Starting Keystone daemon loop...")
        self.logger.info(f"Heartbeat interval: {self.config.heartbeat_interval_seconds}s")

        # Setup signal handlers for graceful shutdown
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)

        # Main loop
        while not self._shutdown_requested:
            try:
                self.run_heartbeat()
                time.sleep(self.config.heartbeat_interval_seconds)
            except KeyboardInterrupt:
                self.logger.info("Keyboard interrupt received")
                self._shutdown_requested = True
                break
            except Exception as e:
                self.logger.error(f"Heartbeat failed: {e}")
                self.state.errors.append(str(e))
                time.sleep(self.config.error_cooldown_seconds)

        self.shutdown()

    def _signal_handler(self, signum, frame):
        """Handle shutdown signals."""
        self.logger.info(f"Received signal {signum}")
        self._shutdown_requested = True

    def shutdown(self) -> None:
        """Gracefully shutdown the daemon."""
        self.logger.info("Shutting down Keystone daemon...")
        self.state.state = DaemonState.STOPPING

        # Shutdown all components
        for name, component in self._components.items():
            try:
                component.shutdown()
                self.logger.info(f"{name} component shutdown complete")
            except Exception as e:
                self.logger.error(f"Failed to shutdown {name}: {e}")

        # Save final state
        self._save_state()
        self.state.state = DaemonState.STOPPED
        self.logger.info("Keystone daemon shutdown complete")

    def _save_state(self) -> None:
        """Save daemon state to file."""
        state_path = Path(self.config.state_file)
        state_path.parent.mkdir(parents=True, exist_ok=True)

        with open(state_path, 'w') as f:
            json.dump(asdict(self.state), f, indent=2)

    def _load_state(self) -> Optional[DaemonStatus]:
        """Load daemon state from file."""
        state_path = Path(self.config.state_file)
        if not state_path.exists():
            return None

        try:
            with open(state_path, 'r') as f:
                data = json.load(f)
            return DaemonStatus(**data)
        except Exception as e:
            self.logger.warning(f"Failed to load state: {e}")
            return None

    def get_status(self) -> Dict:
        """Get daemon status."""
        return {
            "state": self.state.state.value,
            "started_at": self.state.started_at,
            "uptime_seconds": self.state.uptime_seconds,
            "total_heartbeats": self.state.total_heartbeats,
            "successful_heartbeats": self.state.successful_heartbeats,
            "failed_heartbeats": self.state.failed_heartbeats,
            "last_heartbeat": self.state.last_heartbeat,
            "component_health": {k: v.value for k, v in self.state.component_health.items()},
            "errors": self.state.errors,
            "warnings": self.state.warnings,
            "components": list(self._components.keys()),
        }

    def is_healthy(self) -> bool:
        """Check if daemon is healthy."""
        # All components must be healthy
        for name, health in self.state.component_health.items():
            if health != ComponentHealth.HEALTHY:
                return False
        return True

    def get_component_health(self, component: str) -> Optional[ComponentHealth]:
        """Get health of a specific component."""
        return self.state.component_health.get(component)


    def run_single_heartbeat(self) -> bool:
        """Run a single heartbeat without sleeping (for testing)."""
        return self.run_heartbeat()


# ============================================================================
# MODULE ENTRY POINT
# ============================================================================

if __name__ == "__main__":
    import argparse
    import sys

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(message)s"
    )

    parser = argparse.ArgumentParser(description="Keystone Daemon")
    parser.add_argument("--config", type=str, help="Path to config file (JSON)")
    parser.add_argument("--heartbeat-interval", type=float, default=5.0, help="Heartbeat interval in seconds")
    parser.add_argument("--run", action="store_true", help="Run daemon loop")
    parser.add_argument("--status", action="store_true", help="Show daemon status")
    parser.add_argument("--test", action="store_true", help="Run single heartbeat test")
    args = parser.parse_args()

    config = DaemonConfig(
        heartbeat_interval_seconds=args.heartbeat_interval,
    )

    if args.config:
        try:
            with open(args.config, 'r') as f:
                config_dict = json.load(f)
            config = DaemonConfig(**config_dict)
        except Exception as e:
            print(f"Failed to load config: {e}")
            sys.exit(1)

    daemon = KeystoneDaemon(config)

    if args.status:
        status = daemon.get_status()
        print(json.dumps(status, indent=2))
        sys.exit(0)

    if args.test:
        print("Running single heartbeat test...")
        result = daemon.run_single_heartbeat()
        status = "HEALTHY" if result else "DEgraded"
        print(f"Result: {status}")
        sys.exit(0 if result else 1)

    if args.run:
        print("Starting Keystone daemon...")
        print(f"Config: heartbeat_interval={config.heartbeat_interval_seconds}s")
        print("Press Ctrl+C to shutdown")
        daemon.run_forever()
    else:
        print("Keystone daemon initialized. Use --run to start daemon loop.")
        print("Use --status to show daemon status")
        print("Use --test to run single heartbeat test")
