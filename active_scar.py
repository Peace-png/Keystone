"""
Keystone Phase 4: Active SCAR Integration

Implements real-time action classification using the Pith and Substance Adjudicator.

Key ISC (Ideal State Criteria):
- ISC-19: match() function before destructive actions
- ISC-20: SCAR pattern registry
- ISC-21: Blocking behavior for high-severity matches
- ISC-22: Escalation to pilot for ambiguous cases
- ISC-23: Training signal generation from matches
- ISC-24: Integration with existing SCARGate hook

Based on: PITH_SUBSTANCE_ADJUDICATOR_RESEARCH.md

Classification Schema:
  1. Identify PATIENT (who/what is most affected)
  2. Check TRUST BOUNDARY (internal/pilot_facing/external)
  3. Assess REVERSIBILITY (undoable/difficult/irreversible)
  4. Route to SOVEREIGN via Patient → Principle
  5. Generate TRAINING SIGNAL

Patient → Sovereign Mapping:
  PILOT    → FIDUCIARY_LOYALTY
  SYSTEM   → SYSTEMIC_INTEGRITY
  WORLD    → SOCIAL_COVENANT
  KNOWLEDGE → EPISTEMIC_VERACITY
  LIFE     → PRESERVATION_OF_SAFETY
"""

import json
import re
import logging
from dataclasses import dataclass, field, asdict
from enum import Enum
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any, Callable
from datetime import datetime


# ============================================================================
# ENUMS AND DATA STRUCTURES
# ============================================================================

class Patient(str, Enum):
    """Who/what is most affected by an action."""
    PILOT = "PILOT"           # Resources, intent, trust, capability
    SYSTEM = "SYSTEM"         # State, processes, security, architecture
    WORLD = "WORLD"           # External humans, laws, services, data
    KNOWLEDGE = "KNOWLEDGE"   # Truth, provenance, accuracy, uncertainty
    LIFE = "LIFE"             # Physical harm, human safety, irreversible damage


class TrustBoundary(str, Enum):
    """Where the action occurs relative to trust zones."""
    INTERNAL = "INTERNAL"         # Within Keystone (least verification)
    PILOT_FACING = "PILOT_FACING" # Direct pilot interaction (medium)
    EXTERNAL = "EXTERNAL"         # Outside system (most verification)


class Reversibility(str, Enum):
    """How difficult to undo the action."""
    UNDOABLE = "UNDOABLE"         # git reset, file restore (auto-clear)
    DIFFICULT = "DIFFICULT"       # Requires effort to undo (standard check)
    IRREVERSIBLE = "IRREVERSIBLE" # Deletion without backup (escalate)
    READ_ONLY = "READ_ONLY"       # No state change


class Sovereign(str, Enum):
    """The five constitutional sovereign principles."""
    FIDUCIARY_LOYALTY = "FIDUCIARY_LOYALTY"
    SYSTEMIC_INTEGRITY = "SYSTEMIC_INTEGRITY"
    SOCIAL_COVENANT = "SOCIAL_COVENANT"
    EPISTEMIC_VERACITY = "EPISTEMIC_VERACITY"
    PRESERVATION_OF_SAFETY = "PRESERVATION_OF_SAFETY"


class Severity(str, Enum):
    """Action severity levels."""
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


# Patient → Sovereign routing table
PATIENT_TO_SOVEREIGN = {
    Patient.PILOT: Sovereign.FIDUCIARY_LOYALTY,
    Patient.SYSTEM: Sovereign.SYSTEMIC_INTEGRITY,
    Patient.WORLD: Sovereign.SOCIAL_COVENANT,
    Patient.KNOWLEDGE: Sovereign.EPISTEMIC_VERACITY,
    Patient.LIFE: Sovereign.PRESERVATION_OF_SAFETY,
}

# Connection-type tiebreaker hierarchy (for multi-patient conflicts)
# Based on conflict-of-laws: connection TYPE, not sovereign identity
TIEBREAKER_PRIORITY = [
    "HARM_LOCATION",     # Where is the primary harm/damage?
    "ORIGIN_LOCATION",   # Where did the action originate?
    "ACTOR_AFFILIATION", # Who is the primary actor affiliated with?
    "DEFAULT",           # Fallback to forum where adjudicated
]


@dataclass
class SCARClassification:
    """Result of classifying an action through the Pith and Substance Adjudicator."""
    action_id: str
    action_text: str
    patient: Patient
    trust_boundary: TrustBoundary
    reversibility: Reversibility
    sovereign: Sovereign
    severity: Severity
    matched_principles: List[str]
    confidence: float
    reasoning: str = ""
    secondary_patients: List[Patient] = field(default_factory=list)
    secondary_sovereigns: List[Sovereign] = field(default_factory=list)


@dataclass
class KTOSignal:
    """KTO training signal generated from action classification."""
    input: str
    label: bool  # True = desirable, False = undesirable
    principle_id: Optional[str]
    sovereign: str
    weight: float
    confidence: float
    reasoning: str
    timestamp: str = field(default_factory=lambda: datetime.now().isoformat())


@dataclass
class ActiveSCARResult:
    """Complete result of processing an action through Active SCAR."""
    action_id: str
    classification: SCARClassification
    should_block: bool
    block_reason: Optional[str]
    needs_escalation: bool
    escalation_reason: Optional[str]
    training_signal: Optional[KTOSignal] = None


@dataclass
class SCARPattern:
    """A pattern that matches actions to principles."""
    pattern: str
    principle_id: str
    patient: Patient
    severity: Severity
    name: str
    description: str = ""


# ============================================================================
# PITH AND SUBSTANCE ADJUDICATOR
# ============================================================================

class PithAndSubstanceAdjudicator:
    """
    Classifies actions using the Pith and Substance doctrine.

    Three-dimensional classification:
    1. PATIENT: Who/what is most affected?
    2. TRUST BOUNDARY: Where does the action occur?
    3. REVERSIBILITY: How hard to undo?

    Routes to sovereign via patient identification.
    """

    # Tool → Patient mapping (primary classification heuristics)
    TOOL_PATIENT_MAP = {
        # File operations → SYSTEM (state) or PILOT (their files)
        "rm": [Patient.SYSTEM, Patient.PILOT],
        "mv": [Patient.SYSTEM, Patient.PILOT],
        "cp": [Patient.SYSTEM],
        "write": [Patient.SYSTEM, Patient.PILOT],
        "edit": [Patient.SYSTEM, Patient.PILOT],

        # Network operations → WORLD (external)
        "curl": [Patient.WORLD],
        "wget": [Patient.WORLD],
        "fetch": [Patient.WORLD],
        "post": [Patient.WORLD],
        "api": [Patient.WORLD],

        # Code execution → SYSTEM
        "exec": [Patient.SYSTEM],
        "run": [Patient.SYSTEM],
        "bash": [Patient.SYSTEM],
        "node": [Patient.SYSTEM],
        "python": [Patient.SYSTEM],

        # Git operations → SYSTEM (internal) or WORLD (external on push)
        "git": [Patient.SYSTEM],
        "push": [Patient.WORLD, Patient.SYSTEM],
        "clone": [Patient.WORLD, Patient.SYSTEM],

        # Knowledge operations → KNOWLEDGE
        "read": [Patient.KNOWLEDGE],
        "grep": [Patient.KNOWLEDGE],
        "search": [Patient.KNOWLEDGE],
        "query": [Patient.KNOWLEDGE],

        # Communication → WORLD + PILOT
        "email": [Patient.WORLD, Patient.PILOT],
        "slack": [Patient.WORLD, Patient.PILOT],
        "message": [Patient.WORLD, Patient.PILOT],
    }

    # High-risk patterns → LIFE or WORLD
    CRITICAL_PATTERNS = [
        (r"rm\s+-rf\s+/(?!home)", Patient.LIFE, Severity.CRITICAL),  # System wipe
        (r"rm\s+-rf\s+/home", Patient.PILOT, Severity.CRITICAL),    # User data wipe
        (r"dd\s+if=.*of=/dev/", Patient.LIFE, Severity.CRITICAL),   # Disk overwrite
        (r"chmod\s+-R\s+777\s+/", Patient.SYSTEM, Severity.CRITICAL),
        (r">\s*/dev/sd", Patient.LIFE, Severity.CRITICAL),
    ]

    # External indicators → WORLD
    EXTERNAL_PATTERNS = [
        r"https?://",
        r"api\.",
        r"@.*\.(com|org|io|net)",
        r"send\s+(mail|email|message)",
    ]

    # Irreversibility indicators
    IRREVERSIBLE_PATTERNS = [
        r"rm\s+-rf",
        r"drop\s+table",
        r"delete\s+from",
        r"truncate",
        r">\s*/dev/",
        r"--force",
    ]

    def __init__(self):
        self.logger = logging.getLogger("PithAndSubstanceAdjudicator")

    def classify(
        self,
        action_text: str,
        action_id: str,
        tool: str = None,
        target: str = None,
    ) -> SCARClassification:
        """
        Classify an action using the Pith and Substance doctrine.

        Args:
            action_text: The action to classify
            action_id: Unique identifier
            tool: Optional tool name
            target: Optional target path/URL

        Returns:
            SCARClassification with patient, sovereign, severity, etc.
        """
        action_lower = action_text.lower()

        # Step 1: Identify Patient(s)
        patients = self._identify_patients(action_text, tool, target)
        primary_patient = patients[0]
        secondary_patients = patients[1:] if len(patients) > 1 else []

        # Step 2: Check Trust Boundary
        trust_boundary = self._assess_trust_boundary(action_text, target)

        # Step 3: Assess Reversibility
        reversibility = self._assess_reversibility(action_text)

        # Step 4: Route to Sovereign
        sovereign = PATIENT_TO_SOVEREIGN[primary_patient]
        secondary_sovereigns = [PATIENT_TO_SOVEREIGN[p] for p in secondary_patients]

        # Step 5: Determine Severity
        severity = self._assess_severity(action_text, primary_patient, trust_boundary, reversibility)

        # Step 6: Find matching principles (pattern-based)
        matched_principles = self._match_principles(action_text, primary_patient, severity)

        # Step 7: Calculate confidence
        confidence = self._calculate_confidence(
            action_text, primary_patient, trust_boundary, reversibility, len(patients)
        )

        # Build reasoning
        reasoning = self._build_reasoning(
            primary_patient, trust_boundary, reversibility, sovereign, severity
        )

        return SCARClassification(
            action_id=action_id,
            action_text=action_text,
            patient=primary_patient,
            trust_boundary=trust_boundary,
            reversibility=reversibility,
            sovereign=sovereign,
            severity=severity,
            matched_principles=matched_principles,
            confidence=confidence,
            reasoning=reasoning,
            secondary_patients=secondary_patients,
            secondary_sovereigns=secondary_sovereigns,
        )

    def _identify_patients(
        self, action_text: str, tool: str = None, target: str = None
    ) -> List[Patient]:
        """Identify all patients affected by the action."""
        patients = []
        action_lower = action_text.lower()

        # Check critical patterns first (LIFE priority)
        for pattern, patient, _ in self.CRITICAL_PATTERNS:
            if re.search(pattern, action_text, re.IGNORECASE):
                if patient not in patients:
                    patients.append(patient)

        # Check tool-based mapping
        if tool:
            tool_lower = tool.lower()
            for tool_key, tool_patients in self.TOOL_PATIENT_MAP.items():
                if tool_key in tool_lower:
                    for p in tool_patients:
                        if p not in patients:
                            patients.append(p)
                    break

        # Check external patterns → WORLD
        for pattern in self.EXTERNAL_PATTERNS:
            if re.search(pattern, action_text, re.IGNORECASE):
                if Patient.WORLD not in patients:
                    patients.append(Patient.WORLD)

        # Check for knowledge operations
        if any(kw in action_lower for kw in ["read", "grep", "search", "query", "retrieve"]):
            if Patient.KNOWLEDGE not in patients:
                patients.append(Patient.KNOWLEDGE)

        # Check for system operations
        if any(kw in action_lower for kw in ["exec", "run", "bash", "write", "edit", "delete"]):
            if Patient.SYSTEM not in patients:
                patients.append(Patient.SYSTEM)

        # Default to SYSTEM if nothing matched
        if not patients:
            patients.append(Patient.SYSTEM)

        # If multiple patients, apply conflict resolution
        if len(patients) > 1:
            patients = self._resolve_patient_conflict(patients, action_text)

        return patients

    def _resolve_patient_conflict(
        self, patients: List[Patient], action_text: str
    ) -> List[Patient]:
        """
        Resolve multi-patient conflicts using connection-type tiebreaker.

        Priority: HARM_LOCATION > ORIGIN_LOCATION > ACTOR_AFFILIATION > DEFAULT
        """
        # LIFE always wins (protective principle)
        if Patient.LIFE in patients:
            return [Patient.LIFE] + [p for p in patients if p != Patient.LIFE]

        # External actions: WORLD takes priority (harm location)
        if Patient.WORLD in patients and any(
            pat in action_text.lower() for pat in ["http", "api", "send", "push"]
        ):
            return [Patient.WORLD] + [p for p in patients if p != Patient.WORLD]

        # Data loss risk: PILOT takes priority (fiduciary duty)
        if Patient.PILOT in patients and any(
            kw in action_text.lower() for kw in ["rm", "delete", "drop"]
        ):
            return [Patient.PILOT] + [p for p in patients if p != Patient.PILOT]

        # Default: maintain original order
        return patients

    def _assess_trust_boundary(
        self, action_text: str, target: str = None
    ) -> TrustBoundary:
        """Determine where the action occurs relative to trust zones."""
        action_lower = action_text.lower()

        # External indicators
        if any(pat in action_lower for pat in ["http://", "https://", "api.", "@"]):
            return TrustBoundary.EXTERNAL

        # Target-based check
        if target:
            if target.startswith("http"):
                return TrustBoundary.EXTERNAL
            if "/home" in target or "~" in target:
                return TrustBoundary.PILOT_FACING

        # Command patterns
        if any(kw in action_lower for kw in ["push", "send", "post", "email"]):
            return TrustBoundary.EXTERNAL

        # Default to internal
        return TrustBoundary.INTERNAL

    def _assess_reversibility(self, action_text: str) -> Reversibility:
        """Determine how difficult the action is to undo."""
        action_lower = action_text.lower()

        # Check irreversible patterns
        for pattern in self.IRREVERSIBLE_PATTERNS:
            if re.search(pattern, action_text, re.IGNORECASE):
                return Reversibility.IRREVERSIBLE

        # Git operations (usually undoable)
        if "git" in action_lower and "push" not in action_lower:
            return Reversibility.UNDOABLE

        # Read-only operations
        if any(kw in action_lower for kw in ["read", "cat", "grep", "ls", "status"]):
            return Reversibility.READ_ONLY

        # Default to difficult (standard check needed)
        return Reversibility.DIFFICULT

    def _assess_severity(
        self,
        action_text: str,
        patient: Patient,
        trust_boundary: TrustBoundary,
        reversibility: Reversibility,
    ) -> Severity:
        """Assess overall severity of the action."""
        # Critical patterns
        for pattern, _, sev in self.CRITICAL_PATTERNS:
            if re.search(pattern, action_text, re.IGNORECASE):
                return sev

        # LIFE patient is always at least HIGH
        if patient == Patient.LIFE:
            return Severity.HIGH

        # Irreversible + External = HIGH
        if reversibility == Reversibility.IRREVERSIBLE and trust_boundary == TrustBoundary.EXTERNAL:
            return Severity.HIGH

        # Irreversible = at least MEDIUM
        if reversibility == Reversibility.IRREVERSIBLE:
            return Severity.MEDIUM

        # External + non-read-only = MEDIUM
        if trust_boundary == TrustBoundary.EXTERNAL and reversibility != Reversibility.READ_ONLY:
            return Severity.MEDIUM

        # Read-only = LOW
        if reversibility == Reversibility.READ_ONLY:
            return Severity.LOW

        # Default
        return Severity.MEDIUM

    def _match_principles(
        self, action_text: str, patient: Patient, severity: Severity
    ) -> List[str]:
        """Find SCAR principles that match this action."""
        matched = []
        action_lower = action_text.lower()

        # P1: Check before delete/move/rename
        if any(kw in action_lower for kw in ["rm", "mv", "rmdir", "delete"]):
            matched.append("P1")

        # P5: Substrate reality
        if any(kw in action_lower for kw in ["read", "ls", "cat", "grep"]):
            matched.append("P5")

        # P9: External data is adversarial
        if any(pat in action_lower for pat in ["http", "api", "fetch", "curl"]):
            matched.append("P9")

        # P11: Identity verification before git operations
        if "git" in action_lower and any(kw in action_lower for kw in ["push", "commit"]):
            matched.append("P11")

        # P15: Deletion verification
        if "rm" in action_lower or "delete" in action_lower:
            matched.append("P15")

        # P20: External authority boundary
        if patient == Patient.WORLD:
            matched.append("P20")

        # P21: Physical world escalation
        if patient == Patient.LIFE:
            matched.append("P21")

        return matched

    def _calculate_confidence(
        self,
        action_text: str,
        patient: Patient,
        trust_boundary: TrustBoundary,
        reversibility: Reversibility,
        num_patients: int,
    ) -> float:
        """Calculate classification confidence."""
        base_confidence = 0.85

        # Multiple patients reduces confidence (more complex)
        if num_patients > 1:
            base_confidence -= 0.05 * (num_patients - 1)

        # Clear-cut cases increase confidence
        if reversibility == Reversibility.READ_ONLY:
            base_confidence += 0.05
        if reversibility == Reversibility.IRREVERSIBLE:
            base_confidence += 0.03  # Clearer what it is

        # External actions have more uncertainty
        if trust_boundary == TrustBoundary.EXTERNAL:
            base_confidence -= 0.05

        # Clamp to [0.5, 0.99]
        return max(0.5, min(0.99, base_confidence))

    def _build_reasoning(
        self,
        patient: Patient,
        trust_boundary: TrustBoundary,
        reversibility: Reversibility,
        sovereign: Sovereign,
        severity: Severity,
    ) -> str:
        """Build human-readable reasoning for the classification."""
        return (
            f"Patient: {patient.value} → Sovereign: {sovereign.value}. "
            f"Trust boundary: {trust_boundary.value}. "
            f"Reversibility: {reversibility.value}. "
            f"Severity: {severity.value}."
        )


# ============================================================================
# ACTIVE SCAR SYSTEM
# ============================================================================

class ActiveSCAR:
    """
    Main Active SCAR system that integrates:
    - Pith and Substance Adjudicator for classification
    - Pattern registry for principle matching
    - Blocking rules for critical actions
    - Escalation logic for ambiguous cases
    - Training signal generation
    """

    def __init__(self, corpus_path: str = "./corpus"):
        self.corpus_path = Path(corpus_path)
        self.adjudicator = PithAndSubstanceAdjudicator()
        self.pattern_registry: List[SCARPattern] = []
        self.principles: List[Dict] = []
        self._training_log: List[Dict] = []
        self.logger = logging.getLogger("ActiveSCAR")

        # Blocking rules by severity
        self._blocking_rules = {
            Severity.CRITICAL: True,   # Always block
            Severity.HIGH: True,       # Block (can override)
            Severity.MEDIUM: False,    # Escalate instead
            Severity.LOW: False,       # Allow
        }

        # Escalation thresholds
        self.escalation_confidence_threshold = 0.85

    def load(self) -> bool:
        """Load SCAR data from corpus."""
        try:
            # Load principles
            principles_path = self.corpus_path / "principles.json"
            if principles_path.exists():
                with open(principles_path, 'r') as f:
                    self.principles = json.load(f)
                self.logger.info(f"Loaded {len(self.principles)} principles")
            else:
                self.logger.warning(f"Principles not found at {principles_path}")

            # Build pattern registry from principles
            self._build_pattern_registry()

            return True
        except Exception as e:
            self.logger.error(f"Error loading corpus: {e}")
            return False

    def _build_pattern_registry(self) -> None:
        """Build pattern registry from loaded principles."""
        self.pattern_registry = []

        # Add critical patterns
        for pattern, patient, severity in PithAndSubstanceAdjudicator.CRITICAL_PATTERNS:
            self.pattern_registry.append(SCARPattern(
                pattern=pattern,
                principle_id="P21",  # Physical world escalation
                patient=patient,
                severity=severity,
                name=f"Critical: {pattern[:30]}",
                description="Auto-generated from critical pattern",
            ))

        self.logger.info(f"Built pattern registry with {len(self.pattern_registry)} patterns")

    def classify_action(
        self, action_text: str, action_id: str, tool: str = None, target: str = None
    ) -> SCARClassification:
        """
        Classify an action using the Pith and Substance Adjudicator.

        This is the main entry point for action classification.
        """
        return self.adjudicator.classify(action_text, action_id, tool, target)

    def should_block(
        self, classification: SCARClassification
    ) -> Tuple[bool, Optional[str]]:
        """
        Determine if action should be blocked.

        Returns:
            Tuple[block, reason] - True if should block, reason if blocked
        """
        # Check severity-based blocking
        if self._blocking_rules.get(classification.severity, False):
            return True, f"{classification.severity.value.upper()} severity action: {classification.patient.value}"

        # Check pattern-based blocking
        for pattern in self.pattern_registry:
            if pattern.severity in (Severity.CRITICAL, Severity.HIGH):
                if re.search(pattern.pattern, classification.action_text, re.IGNORECASE):
                    return True, f"Matched pattern: {pattern.name}"

        return False, None

    def check_escalation(
        self, classification: SCARClassification
    ) -> Tuple[bool, Optional[str]]:
        """
        Check if action needs pilot escalation.

        Escalation criteria:
        - Confidence < 0.85
        - Multiple patients (conflict)
        - IRREVERSIBLE + EXTERNAL
        - MEDIUM severity (escalate instead of block)
        """
        reasons = []

        # Low confidence
        if classification.confidence < self.escalation_confidence_threshold:
            reasons.append(f"Low confidence ({classification.confidence:.2f})")

        # Multiple patients (conflict)
        if classification.secondary_patients:
            patients_str = ", ".join(p.value for p in classification.secondary_patients)
            reasons.append(f"Multi-patient conflict: {patients_str}")

        # Irreversible + External
        if (classification.reversibility == Reversibility.IRREVERSIBLE and
            classification.trust_boundary == TrustBoundary.EXTERNAL):
            reasons.append("Irreversible external action")

        # MEDIUM severity → escalate instead of block
        if classification.severity == Severity.MEDIUM:
            reasons.append("Medium severity requires review")

        if reasons:
            return True, "; ".join(reasons)
        return False, None

    def generate_training_signal(
        self,
        action_text: str,
        classification: SCARClassification,
        actual_behavior: str,
        outcome_positive: bool = True,
    ) -> KTOSignal:
        """
        Generate a KTO training signal from action classification.

        Args:
            action_text: The original action
            classification: The SCAR classification
            actual_behavior: What actually happened
            outcome_positive: Was the outcome desirable?

        Returns:
            KTOSignal for training
        """
        principle_id = classification.matched_principles[0] if classification.matched_principles else None

        reasoning = classification.reasoning
        if not outcome_positive:
            reasoning = f"UNDESIRABLE: {reasoning}"

        return KTOSignal(
            input=f"Action: {action_text}\nContext: {actual_behavior}",
            label=outcome_positive,
            principle_id=principle_id,
            sovereign=classification.sovereign.value,
            weight=1.0 if classification.severity in (Severity.HIGH, Severity.CRITICAL) else 0.7,
            confidence=classification.confidence,
            reasoning=reasoning,
        )

    def process_action(
        self,
        action_text: str,
        action_id: str,
        tool: str = None,
        target: str = None,
        actual_behavior: str = None,
    ) -> ActiveSCARResult:
        """
        Process an action through the full Active SCAR pipeline.

        Args:
            action_text: The action to process
            action_id: Unique identifier
            tool: Optional tool name
            target: Optional target path/URL
            actual_behavior: What actually happened (for training signal)

        Returns:
            ActiveSCARResult with classification, blocking decision, training signal
        """
        # Step 1: Classify using Pith and Substance
        classification = self.classify_action(action_text, action_id, tool, target)

        # Step 2: Check if should block
        should_block, block_reason = self.should_block(classification)

        # Step 3: Check if needs escalation
        needs_escalation, escalation_reason = self.check_escalation(classification)

        # Step 4: Generate training signal if behavior provided
        training_signal = None
        if actual_behavior:
            # If blocked, outcome is negative (didn't proceed as intended)
            outcome_positive = not should_block
            training_signal = self.generate_training_signal(
                action_text, classification, actual_behavior, outcome_positive
            )

        return ActiveSCARResult(
            action_id=action_id,
            classification=classification,
            should_block=should_block,
            block_reason=block_reason,
            needs_escalation=needs_escalation,
            escalation_reason=escalation_reason,
            training_signal=training_signal,
        )

    def match(
        self, text: str, tool: str, target: str, action_id: str
    ) -> ActiveSCARResult:
        """
        Main match() function for integration with SCARGate hook.

        This is called before destructive actions to determine
        if they should proceed, be blocked, or escalate to pilot.

        Args:
            text: The action text/command
            tool: Tool being used
            target: Target path/URL
            action_id: Unique identifier

        Returns:
            ActiveSCARResult with classification and decision
        """
        return self.process_action(text, action_id, tool, target)

    def record_training_signal(self, signal: KTOSignal) -> None:
        """Record a training signal to the log."""
        self._training_log.append(asdict(signal))

        # Persist to disk
        log_path = self.corpus_path / "training_log.jsonl"
        try:
            with open(log_path, 'a') as f:
                f.write(json.dumps(asdict(signal)) + "\n")
        except Exception as e:
            self.logger.error(f"Error saving training signal: {e}")

    def get_stats(self) -> Dict:
        """Get statistics about the Active SCAR system."""
        return {
            "total_signals": len(self._training_log),
            "patterns_loaded": len(self.pattern_registry),
            "principles_loaded": len(self.principles),
            "recent_signals": self._training_log[-10:] if self._training_log else [],
        }


# ============================================================================
# MODULE ENTRY POINT
# ============================================================================

if __name__ == "__main__":
    import argparse
    import sys

    logging.basicConfig(level=logging.INFO, format="%(name)s: %(message)s")

    parser = argparse.ArgumentParser(description="Keystone Active SCAR Integration")
    parser.add_argument("--corpus-path", default="./corpus", help="Path to corpus")
    parser.add_argument("--test", action="store_true", help="Run test cases")
    args = parser.parse_args()

    # Initialize Active SCAR
    active_scar = ActiveSCAR(args.corpus_path)

    if not active_scar.load():
        print("Error: Failed to load corpus")
        sys.exit(1)

    print(f"✅ Active SCAR loaded")
    print(f"   Patterns: {len(active_scar.pattern_registry)}")
    print(f"   Principles: {len(active_scar.principles)}")

    if args.test:
        print("\n" + "=" * 60)
        print("RUNNING TEST CASES")
        print("=" * 60)

        test_cases = [
            ("rm -rf /data", "bash", "/data"),
            ("git push origin main", "git", "origin/main"),
            ("curl https://api.example.com/data", "curl", "https://api.example.com/data"),
            ("cat /home/peace/file.txt", "read", "/home/peace/file.txt"),
            ("rm -rf /", "bash", "/"),
            ("POST https://api.example.com/submit", "http", "https://api.example.com/submit"),
        ]

        for action, tool, target in test_cases:
            print(f"\n--- Action: {action} ---")
            result = active_scar.match(action, tool, target, f"test_{hash(action)}")

            cls = result.classification
            print(f"  Patient: {cls.patient.value}")
            print(f"  Sovereign: {cls.sovereign.value}")
            print(f"  Trust Boundary: {cls.trust_boundary.value}")
            print(f"  Reversibility: {cls.reversibility.value}")
            print(f"  Severity: {cls.severity.value}")
            print(f"  Confidence: {cls.confidence:.2f}")
            print(f"  Principles: {cls.matched_principles}")
            print(f"  Block: {result.should_block} ({result.block_reason})")
            print(f"  Escalate: {result.needs_escalation} ({result.escalation_reason})")

        print("\n✅ Test cases complete")
