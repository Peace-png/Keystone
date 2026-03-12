"""
Keystone Phase 6: Witness Layer

Implements hash-based verification using git as source of truth.

Key ISC (Ideal State Criteria):
- ISC-31: Hash-based Witness (not zkVM)
- ISC-32: SOUL.md hash verification
- ISC-33: Constitutional adapter hash verification
- ISC-34: State invariance proof (H_before = H_after)
- ISC-35: Witness heartbeat in daemon loop
- ISC-36: Cross-layer verification

Security Model:
- PRIMARY: Git-based verification (hashes computed from git HEAD)
- SECONDARY: Environment variable verification (optional)
- TERTIARY: Computed hash verification (runtime, from actual file)

The git-based approach provides tamper-evidence because:
- Attacker can modify file, but git HEAD still has original hash
- Verification computes hash from git HEAD and compares to actual file
- Mismatch = tampering detected

Limitations:
- Does not protect against attacker who can rewrite git history
- Does not protect against supply chain attacks before deployment
- For those threats, consider multi-source or TPM-based attestation
"""

import hashlib
import json
import logging
import os
import subprocess
from dataclasses import dataclass, field, asdict
from datetime import datetime
from enum import Enum
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any


# ============================================================================
# ENUMS AND DATA STRUCTURES
# ============================================================================

class VerificationStatus(str, Enum):
    """Status of verification check."""
    VERIFIED = "verified"
    TAMPERED = "tampered"
    ERROR = "error"
    NOT_CONFIGURED = "not_configured"


class VerificationSource(str, Enum):
    """Source of expected hash for verification."""
    GIT = "git"           # From git HEAD (primary)
    ENV = "environment"   # From environment variable (secondary)
    COMPUTED = "computed" # Computed from actual file (tertiary)


@dataclass
class HashVerification:
    """Result of a hash verification check."""
    file_path: str
    status: VerificationStatus
    source: VerificationSource
    expected_hash: Optional[str]
    actual_hash: Optional[str]
    message: str
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())


@dataclass
class WitnessState:
    """Current state of the witness system."""
    last_verification: Optional[str]
    total_verifications: int
    passed_verifications: int
    failed_verifications: int
    git_available: bool
    soul_verified: bool
    adapter_verified: bool


@dataclass
class VerificationReport:
    """Complete verification report."""
    timestamp: str
    all_passed: bool
    verifications: List[HashVerification]
    state_before: Optional[str]
    state_after: Optional[str]
    state_invariant: bool
    summary: str


# ============================================================================
# GIT-BASED HASH EXTRACTION
# ============================================================================

def get_git_file_hash(file_path: str, git_ref: str = "HEAD") -> Optional[str]:
    """
    Get the hash of a file from git history.

    This is the PRIMARY verification source - git history is immutable
    (unless attacker can rewrite git history, which requires more sophisticated protection).

    Args:
        file_path: Path to the file (relative to repo root)
        git_ref: Git reference (default HEAD)

    Returns:
        SHA-256 hash of the file content from git, or None if not in git
    """
    try:
        result = subprocess.run(
            ["git", "show", f"{git_ref}:{file_path}"],
            capture_output=True,
            text=True,
            timeout=5,
        )

        if result.returncode != 0:
            return None

        content = result.stdout.encode('utf-8')
        return hashlib.sha256(content).hexdigest()

    except (subprocess.TimeoutExpired, FileNotFoundError, Exception):
        return None


def get_actual_file_hash(file_path: str) -> Optional[str]:
    """
    Get the hash of the actual file on disk.

    This is what we verify against the expected hash.

    Args:
        file_path: Path to the file

    Returns:
        SHA-256 hash of the file content, or None if not found
    """
    try:
        path = Path(file_path)
        if not path.exists():
            return None

        content = path.read_bytes()
        return hashlib.sha256(content).hexdigest()

    except Exception:
        return None


def get_env_expected_hash(env_var: str) -> Optional[str]:
    """
    Get expected hash from environment variable.

    This is a SECONDARY verification source - requires manual setting
    during deployment.

    Args:
        env_var: Name of environment variable

    Returns:
        Expected hash from environment, or None if not set
    """
    return os.environ.get(env_var)


def is_git_repo(path: str = ".") -> bool:
    """Check if we're in a git repository."""
    try:
        result = subprocess.run(
            ["git", "rev-parse", "--git-dir"],
            capture_output=True,
            text=True,
            timeout=5,
            cwd=path,
        )
        return result.returncode == 0
    except Exception:
        return False


# ============================================================================
# WITNESS VERIFIER
# ============================================================================

class Witness:
    """
    Hash-based verification using git as source of truth.

    Verification Sources (in priority order):
    1. GIT: Hash computed from git HEAD (immutable)
    2. ENV: Hash from environment variable (requires manual setting)
    3. COMPUTED: Hash from actual file (baseline, no tamper detection)

    Security Properties:
    - Attacker modifies file but not git: MISMATCH detected
    - Attacker modifies file and env var: MISMATCH still detected (git is source of truth)
    - Attacker modifies git history: Requires more sophisticated protection (multi-source, TPM)
    """

    # Files to verify (relative to repo root): env var name
    DEFAULT_TRACKED_FILES = {
        "constitution/SOUL.md": "KEYSTONE_SOUL_HASH",
        "corpus/principles.json": "KEYSTONE_PRINCIPLES_HASH",
        "training_pipeline.py": "KEYSTONE_PIPELINE_HASH",
        "active_scar.py": "KEYSTONE_SCAR_HASH",
    }

    def __init__(
        self,
        repo_root: str = ".",
        tracked_files: Dict[str, str] = None,
        state_file: str = "./witness/state.json",
    ):
        """
        Initialize Witness.

        Args:
            repo_root: Root of git repository
            tracked_files: Dict of {file_path: env_var_name}
            state_file: Path to witness state file
        """
        self.repo_root = repo_root
        self.tracked_files = tracked_files or self.DEFAULT_TRACKED_FILES
        self.state_file = Path(state_file)
        self.logger = logging.getLogger("Witness")

        # State tracking
        self._state: Optional[WitnessState] = None
        self._last_report: Optional[VerificationReport] = None

        # Check git availability
        self._git_available = is_git_repo(repo_root)

        # Load existing state
        self._load_state()

    def _load_state(self) -> None:
        """Load witness state from file."""
        if self.state_file.exists():
            try:
                with open(self.state_file, 'r') as f:
                    data = json.load(f)
                self._state = WitnessState(**data)
            except Exception as e:
                self.logger.warning(f"Failed to load state: {e}")
                self._reset_state()
        else:
            self._reset_state()

    def _reset_state(self) -> None:
        """Reset state to defaults."""
        self._state = WitnessState(
            last_verification=None,
            total_verifications=0,
            passed_verifications=0,
            failed_verifications=1,
            git_available=self._git_available,
            soul_verified=False,
            adapter_verified=False,
        )

    def _save_state(self) -> None:
        """Save witness state to file."""
        self.state_file.parent.mkdir(parents=True, exist_ok=True)
        with open(self.state_file, 'w') as f:
            json.dump(asdict(self._state), f, indent=2)

    # =========================================================================
    # ISC-32: SOUL.md Hash Verification
    # =========================================================================

    def verify_soul(self) -> HashVerification:
        """
        Verify SOUL.md hash against git.

        ISC-32: SOUL.md hash verification at boot.

        Returns:
            HashVerification with status and details
        """
        soul_path = "constitution/SOUL.md"
        return self._verify_file(soul_path, "KEYSTONE_SOUL_HASH")

    # =========================================================================
    # ISC-33: Constitutional Adapter Hash Verification
    # =========================================================================

    def verify_adapter(self, adapter_path: str = "training_pipeline.py") -> HashVerification:
        """
        Verify constitutional adapter hash.

        ISC-33: Constitutional adapter hash verification at boot.

        Args:
            adapter_path: Path to the adapter file

        Returns:
            HashVerification with status and details
        """
        return self._verify_file(adapter_path, "KEYSTONE_ADAPTER_HASH")

    # =========================================================================
    # Core Verification Method
    # =========================================================================

    def _verify_file(
        self,
        file_path: str,
        env_var: str,
    ) -> HashVerification:
        """
        Verify a file's hash using multiple sources.

        Priority:
        1. Git HEAD (primary - immutable source of truth)
        2. Environment variable (secondary - requires manual setting)
        3. Computed from file (tertiary - no tamper detection)

        Args:
            file_path: Path to file (relative to repo root)
            env_var: Environment variable name for expected hash

        Returns:
            HashVerification with verification result
        """
        actual_hash = get_actual_file_hash(os.path.join(self.repo_root, file_path))
        timestamp = datetime.now().isoformat()

        # No file found
        if actual_hash is None:
            return HashVerification(
                file_path=file_path,
                status=VerificationStatus.ERROR,
                source=VerificationSource.COMPUTED,
                expected_hash=None,
                actual_hash=None,
                message=f"File not found: {file_path}",
                timestamp=timestamp,
            )

        # Try git-based verification (PRIMARY)
        if self._git_available:
            git_hash = get_git_file_hash(file_path)

            if git_hash is not None:
                if git_hash == actual_hash:
                    return HashVerification(
                        file_path=file_path,
                        status=VerificationStatus.VERIFIED,
                        source=VerificationSource.GIT,
                        expected_hash=git_hash,
                        actual_hash=actual_hash,
                        message="Verified against git HEAD",
                        timestamp=timestamp,
                    )
                else:
                    return HashVerification(
                        file_path=file_path,
                        status=VerificationStatus.TAMPERED,
                        source=VerificationSource.GIT,
                        expected_hash=git_hash,
                        actual_hash=actual_hash,
                        message=f"Hash mismatch: file differs from git HEAD",
                        timestamp=timestamp,
                    )

        # Try environment variable (SECONDARY)
        env_hash = get_env_expected_hash(env_var)
        if env_hash is not None:
            if env_hash == actual_hash:
                return HashVerification(
                    file_path=file_path,
                    status=VerificationStatus.VERIFIED,
                    source=VerificationSource.ENV,
                    expected_hash=env_hash,
                    actual_hash=actual_hash,
                    message="Verified against environment variable",
                    timestamp=timestamp,
                )
            else:
                return HashVerification(
                    file_path=file_path,
                    status=VerificationStatus.TAMPERED,
                    source=VerificationSource.ENV,
                    expected_hash=env_hash,
                    actual_hash=actual_hash,
                    message=f"Hash mismatch: file differs from environment variable",
                    timestamp=timestamp,
                )

        # Fallback to computed (TERTIARY - no tamper detection)
        return HashVerification(
            file_path=file_path,
            status=VerificationStatus.NOT_CONFIGURED,
            source=VerificationSource.COMPUTED,
            expected_hash=actual_hash,
            actual_hash=actual_hash,
            message="No git or env verification source available - computed only",
            timestamp=timestamp,
        )

    # =========================================================================
    # ISC-34: State Invariance Proof
    # =========================================================================

    def verify_state_invariance(self, state_before: str, state_after: str) -> bool:
        """
        Verify state invariance: H_before = H_after.

        ISC-34: State invariance proof.

        Args:
            state_before: Hash of state before operation
            state_after: Hash of state after operation

        Returns:
            True if invariant, False otherwise
        """
        return state_before == state_after

    # =========================================================================
    # ISC-35: Full Verification (Boot Sequence)
    # =========================================================================

    def verify_boot(self) -> VerificationReport:
        """
        Run full verification at boot.

        ISC-35: Witness verification at boot.

        Returns:
            VerificationReport with all verification results
        """
        verifications: List[HashVerification] = []

        # Verify all tracked files
        for file_path, env_var in self.tracked_files.items():
            verification = self._verify_file(file_path, env_var)
            verifications.append(verification)

        # ISC-32: Special check for SOUL.md
        soul_verification = self.verify_soul()
        if soul_verification not in verifications:
            verifications.append(soul_verification)

        # Check overall status
        all_passed = all(v.status == VerificationStatus.VERIFIED for v in verifications)

        # Update state
        self._state.total_verifications += 1
        if all_passed:
            self._state.passed_verifications += 1
            self._state.soul_verified = True
        else:
            self._state.failed_verifications += 1

        self._state.last_verification = datetime.now().isoformat()
        self._state.git_available = self._git_available
        self._save_state()

        # Build report
        passed_count = sum(1 for v in verifications if v.status == VerificationStatus.VERIFIED)
        total_count = len(verifications)
        summary = f"{passed_count}/{total_count} verifications passed. Git: {'available' if self._git_available else 'unavailable'}"

        report = VerificationReport(
            timestamp=datetime.now().isoformat(),
            all_passed=all_passed,
            verifications=verifications,
            state_before=None,
            state_after=None,
            state_invariant=True,
            summary=summary,
        )

        self._last_report = report

        if all_passed:
            self.logger.info(f"Boot verification passed: {summary}")
        else:
            self.logger.warning(f"Boot verification FAILED: {summary}")
            for v in verifications:
                if v.status != VerificationStatus.VERIFIED:
                    self.logger.warning(f"  {v.file_path}: {v.status.value} - {v.message}")

        return report

    # =========================================================================
    # ISC-35: Heartbeat Update
    # =========================================================================

    def update_heartbeat(self) -> Dict:
        """
        Update witness heartbeat for daemon loop.

        ISC-35: Witness heartbeat in daemon loop.

        Returns:
            Dict with heartbeat status
        """
        heartbeat_file = self.state_file.parent / "heartbeat.json"
        heartbeat = {
            "timestamp": datetime.now().isoformat(),
            "git_available": self._git_available,
            "total_verifications": self._state.total_verifications,
            "passed_verifications": self._state.passed_verifications,
            "failed_verifications": self._state.failed_verifications,
            "last_verification": self._state.last_verification,
        }

        heartbeat_file.parent.mkdir(parents=True, exist_ok=True)
        with open(heartbeat_file, 'w') as f:
            json.dump(heartbeat, f, indent=2)

        return heartbeat

    # =========================================================================
    # ISC-36: Cross-Layer Verification
    # =========================================================================

    def verify_cross_layer(
        self,
        nova_hash: Optional[str] = None,
        shadow_hash: Optional[str] = None,
        library_hash: Optional[str] = None,
    ) -> Tuple[bool, str]:
        """
        Verify consistency across layers.

        ISC-36: Cross-layer verification (Nova <-> Shadow <-> Library).

        Args:
            nova_hash: Hash from Nova layer (if applicable)
            shadow_hash: Hash from Shadow layer (if applicable)
            library_hash: Hash from Library layer (if applicable)

        Returns:
            Tuple[is_consistent, message]
        """
        hashes = [h for h in [nova_hash, shadow_hash, library_hash] if h is not None]

        if not hashes:
            return True, "No cross-layer hashes provided"

        # Check all hashes match
        if len(hashes) == 1:
            return True, "Single layer - no cross-layer check needed"

        first_hash = hashes[0]
        if all(h == first_hash for h in hashes):
            return True, f"All {len(hashes)} layers consistent (hash: {first_hash[:16]}...)"
        else:
            return False, f"Layer mismatch: {len([h for h in hashes if h != first_hash])} layers have different hashes"

    # =========================================================================
    # Utility Methods
    # =========================================================================

    def get_status(self) -> Dict:
        """Get current witness status."""
        return {
            "git_available": self._git_available,
            "total_verifications": self._state.total_verifications,
            "passed_verifications": self._state.passed_verifications,
            "failed_verifications": self._state.failed_verifications,
            "last_verification": self._state.last_verification,
            "soul_verified": self._state.soul_verified,
            "tracked_files": list(self.tracked_files.keys()),
            "state_file": str(self.state_file),
            "last_report_summary": self._last_report.summary if self._last_report else None,
        }

    def get_last_report(self) -> Optional[VerificationReport]:
        """Get the last verification report."""
        return self._last_report

    def is_healthy(self) -> bool:
        """Check if the witness is in a healthy state."""
        if self._last_report is None:
            return False
        return self._last_report.all_passed


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

    parser = argparse.ArgumentParser(description="Keystone Witness Verification")
    parser.add_argument("--repo-root", default=".", help="Repository root directory")
    parser.add_argument("--verify", action="store_true", help="Run boot verification")
    parser.add_argument("--status", action="store_true", help="Show current status")
    parser.add_argument("--heartbeat", action="store_true", help="Update heartbeat")
    args = parser.parse_args()

    witness = Witness(repo_root=args.repo_root)

    if args.status:
        status = witness.get_status()
        print(json.dumps(status, indent=2))
        sys.exit(0)

    if args.heartbeat:
        heartbeat = witness.update_heartbeat()
        print(json.dumps(heartbeat, indent=2))
        sys.exit(0)

    if args.verify:
        report = witness.verify_boot()
        print("\n" + "=" * 60)
        print("WITNESS VERIFICATION REPORT")
        print("=" * 60)
        print(f"Timestamp: {report.timestamp}")
        print(f"All Passed: {report.all_passed}")
        print(f"Summary: {report.summary}")
        print("\nVerifications:")
        for v in report.verifications:
            status_icon = "✅" if v.status == VerificationStatus.VERIFIED else "❌"
            print(f"  {status_icon} {v.file_path}")
            print(f"     Status: {v.status.value}")
            print(f"     Source: {v.source.value}")
            print(f"     Message: {v.message}")

        sys.exit(0 if report.all_passed else 1)

    print("Witness initialized. Use --verify to run boot verification.")
    print(f"Git available: {witness._git_available}")
    print(f"Tracked files: {list(witness.tracked_files.keys())}")
