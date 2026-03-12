"""
Keystone Phase 4 Verification Tests

Tests that Active SCAR Integration is correctly implemented:
- ISC-19: match() function before destructive actions
- ISC-20: SCAR pattern registry
- ISC-21: Blocking behavior for high-severity matches
- ISC-22: Escalation to pilot for ambiguous cases
- ISC-23: Training signal generation from matches
- ISC-24: Integration with existing SCARGate hook

Run with: python verify_phase4.py
"""

import json
import sys
from pathlib import Path


def test_match_function():
    """Test ISC-19: match() function before destructive actions"""
    print("=" * 60)
    print("TEST: match() Function (ISC-19)")
    print("=" * 60)

    try:
        from active_scar import ActiveSCAR
    except ImportError as e:
        print(f"  ❌ FAIL: active_scar module not found: {e}")
        return False

    corpus_path = "./corpus"
    if not Path(corpus_path).exists():
        print("  ❌ FAIL: corpus directory not found")
        return False

    active_scar = ActiveSCAR(corpus_path)
    if not active_scar.load():
        print("  ❌ FAIL: Failed to load Active SCAR")
        return False

    # Test match function exists and returns correct type
    result = active_scar.match("rm -rf /data", "bash", "/data", "test_001")

    if not hasattr(result, 'classification'):
        print("  ❌ FAIL: match() result missing classification")
        return False

    if not hasattr(result, 'should_block'):
        print("  ❌ FAIL: match() result missing should_block")
        return False

    if not hasattr(result, 'needs_escalation'):
        print("  ❌ FAIL: match() result missing needs_escalation")
        return False

    print(f"  Action: rm -rf /data")
    print(f"  Patient: {result.classification.patient.value}")
    print(f"  Sovereign: {result.classification.sovereign.value}")
    print(f"  Severity: {result.classification.severity.value}")
    print(f"  Should Block: {result.should_block}")
    print(f"  ✅ PASS: match() function implemented correctly")
    return True


def test_pattern_registry():
    """Test ISC-20: SCAR pattern registry"""
    print("\n" + "=" * 60)
    print("TEST: Pattern Registry (ISC-20)")
    print("=" * 60)

    try:
        from active_scar import ActiveSCAR, SCARPattern
    except ImportError:
        print("  ❌ FAIL: active_scar module not found")
        return False

    corpus_path = "./corpus"
    active_scar = ActiveSCAR(corpus_path)
    active_scar.load()

    # Check pattern registry
    if not hasattr(active_scar, 'pattern_registry'):
        print("  ❌ FAIL: pattern_registry attribute missing")
        return False

    patterns = active_scar.pattern_registry
    print(f"  Loaded {len(patterns)} patterns")

    # Check pattern structure
    if len(patterns) > 0:
        sample = patterns[0]
        required = ['pattern', 'principle_id', 'patient', 'severity', 'name']
        for attr in required:
            if not hasattr(sample, attr):
                print(f"  ❌ FAIL: Pattern missing '{attr}' attribute")
                return False
        print(f"  Sample pattern: {sample.name}")
        print(f"    Principle: {sample.principle_id}")
        print(f"    Severity: {sample.severity.value}")

    print(f"  ✅ PASS: Pattern registry implemented")
    return True


def test_blocking_behavior():
    """Test ISC-21: Blocking behavior for high-severity matches"""
    print("\n" + "=" * 60)
    print("TEST: Blocking Behavior (ISC-21)")
    print("=" * 60)

    try:
        from active_scar import ActiveSCAR, Severity
    except ImportError:
        print("  ❌ FAIL: active_scar module not found")
        return False

    corpus_path = "./corpus"
    active_scar = ActiveSCAR(corpus_path)
    active_scar.load()

    # Test critical action (should block)
    critical_result = active_scar.match("rm -rf /", "bash", "/", "critical_test")
    if not critical_result.should_block:
        print(f"  ❌ FAIL: Critical action 'rm -rf /' should be blocked")
        return False
    print(f"  ✅ Critical action blocked: {critical_result.block_reason}")

    # Test read-only action (should not block)
    read_result = active_scar.match("cat /etc/passwd", "read", "/etc/passwd", "read_test")
    if read_result.should_block:
        print(f"  ❌ FAIL: Read-only action should not be blocked")
        return False
    print(f"  ✅ Read-only action allowed")

    # Test should_block method directly
    from active_scar import Patient, TrustBoundary, Reversibility, Sovereign, SCARClassification

    critical_class = SCARClassification(
        action_id="test",
        action_text="rm -rf /",
        patient=Patient.LIFE,
        trust_boundary=TrustBoundary.INTERNAL,
        reversibility=Reversibility.IRREVERSIBLE,
        sovereign=Sovereign.PRESERVATION_OF_SAFETY,
        severity=Severity.CRITICAL,
        matched_principles=["P21"],
        confidence=0.95,
    )

    block, reason = active_scar.should_block(critical_class)
    if not block:
        print(f"  ❌ FAIL: CRITICAL severity should trigger block")
        return False
    print(f"  ✅ CRITICAL severity triggers block: {reason}")

    print(f"  ✅ PASS: Blocking behavior implemented")
    return True


def test_escalation():
    """Test ISC-22: Escalation to pilot for ambiguous cases"""
    print("\n" + "=" * 60)
    print("TEST: Escalation (ISC-22)")
    print("=" * 60)

    try:
        from active_scar import (
            ActiveSCAR, Patient, TrustBoundary, Reversibility,
            Sovereign, Severity, SCARClassification
        )
    except ImportError:
        print("  ❌ FAIL: active_scar module not found")
        return False

    corpus_path = "./corpus"
    active_scar = ActiveSCAR(corpus_path)
    active_scar.load()

    # Test low confidence escalation
    low_conf_class = SCARClassification(
        action_id="test_low_conf",
        action_text="ambiguous command",
        patient=Patient.SYSTEM,
        trust_boundary=TrustBoundary.INTERNAL,
        reversibility=Reversibility.DIFFICULT,
        sovereign=Sovereign.SYSTEMIC_INTEGRITY,
        severity=Severity.MEDIUM,
        matched_principles=[],
        confidence=0.70,  # Below threshold
    )

    escalate, reason = active_scar.check_escalation(low_conf_class)
    if not escalate:
        print(f"  ❌ FAIL: Low confidence should trigger escalation")
        return False
    print(f"  ✅ Low confidence triggers escalation: {reason}")

    # Test multi-patient escalation
    multi_class = SCARClassification(
        action_id="test_multi",
        action_text="git push with external data",
        patient=Patient.SYSTEM,
        trust_boundary=TrustBoundary.EXTERNAL,
        reversibility=Reversibility.DIFFICULT,
        sovereign=Sovereign.SYSTEMIC_INTEGRITY,
        severity=Severity.MEDIUM,
        matched_principles=["P11"],
        confidence=0.90,
        secondary_patients=[Patient.WORLD, Patient.PILOT],
    )

    escalate, reason = active_scar.check_escalation(multi_class)
    if not escalate:
        print(f"  ❌ FAIL: Multi-patient conflict should trigger escalation")
        return False
    print(f"  ✅ Multi-patient conflict triggers escalation: {reason}")

    # Test irreversible + external escalation
    irrev_ext_class = SCARClassification(
        action_id="test_irrev_ext",
        action_text="send email to external",
        patient=Patient.WORLD,
        trust_boundary=TrustBoundary.EXTERNAL,
        reversibility=Reversibility.IRREVERSIBLE,
        sovereign=Sovereign.SOCIAL_COVENANT,
        severity=Severity.HIGH,
        matched_principles=["P20"],
        confidence=0.95,
    )

    escalate, reason = active_scar.check_escalation(irrev_ext_class)
    if not escalate:
        print(f"  ❌ FAIL: Irreversible external should trigger escalation")
        return False
    print(f"  ✅ Irreversible external triggers escalation: {reason}")

    # Test clear case (no escalation)
    clear_class = SCARClassification(
        action_id="test_clear",
        action_text="read config file",
        patient=Patient.SYSTEM,
        trust_boundary=TrustBoundary.INTERNAL,
        reversibility=Reversibility.READ_ONLY,
        sovereign=Sovereign.SYSTEMIC_INTEGRITY,
        severity=Severity.LOW,
        matched_principles=["P5"],
        confidence=0.95,
    )

    escalate, reason = active_scar.check_escalation(clear_class)
    if escalate:
        print(f"  ❌ FAIL: Clear case should NOT escalate")
        return False
    print(f"  ✅ Clear case does not escalate")

    print(f"  ✅ PASS: Escalation implemented")
    return True


def test_training_signal():
    """Test ISC-23: Training signal generation from matches"""
    print("\n" + "=" * 60)
    print("TEST: Training Signal Generation (ISC-23)")
    print("=" * 60)

    try:
        from active_scar import (
            ActiveSCAR, KTOSignal, Patient, TrustBoundary, Reversibility,
            Sovereign, Severity, SCARClassification
        )
    except ImportError:
        print("  ❌ FAIL: active_scar module not found")
        return False

    corpus_path = "./corpus"
    active_scar = ActiveSCAR(corpus_path)
    active_scar.load()

    # Create a classification
    classification = SCARClassification(
        action_id="test_signal",
        action_text="rm -rf /data",
        patient=Patient.PILOT,
        trust_boundary=TrustBoundary.INTERNAL,
        reversibility=Reversibility.IRREVERSIBLE,
        sovereign=Sovereign.FIDUCIARY_LOYALTY,
        severity=Severity.HIGH,
        matched_principles=["P1", "P15"],
        confidence=0.92,
    )

    # Generate training signal
    signal = active_scar.generate_training_signal(
        action_text="rm -rf /data",
        classification=classification,
        actual_behavior="User confirmed deletion",
        outcome_positive=True,
    )

    # Check signal structure
    if not isinstance(signal, KTOSignal):
        print(f"  ❌ FAIL: generate_training_signal should return KTOSignal")
        return False

    required = ['input', 'label', 'principle_id', 'sovereign', 'weight', 'confidence', 'reasoning']
    for attr in required:
        if not hasattr(signal, attr):
            print(f"  ❌ FAIL: KTOSignal missing '{attr}' attribute")
            return False

    print(f"  Signal input: {signal.input[:50]}...")
    print(f"  Label (desirable): {signal.label}")
    print(f"  Principle: {signal.principle_id}")
    print(f"  Sovereign: {signal.sovereign}")
    print(f"  Weight: {signal.weight}")
    print(f"  Confidence: {signal.confidence}")

    # Test signal recording
    active_scar.record_training_signal(signal)
    stats = active_scar.get_stats()

    if stats['total_signals'] < 1:
        print(f"  ❌ FAIL: Training signal not recorded")
        return False

    print(f"  ✅ Signal recorded (total: {stats['total_signals']})")
    print(f"  ✅ PASS: Training signal generation implemented")
    return True


def test_pith_and_substance():
    """Test that Pith and Substance classification is implemented"""
    print("\n" + "=" * 60)
    print("TEST: Pith and Substance Classification")
    print("=" * 60)

    try:
        from active_scar import (
            ActiveSCAR, PithAndSubstanceAdjudicator,
            Patient, TrustBoundary, Reversibility, Sovereign
        )
    except ImportError:
        print("  ❌ FAIL: active_scar module not found")
        return False

    adjudicator = PithAndSubstanceAdjudicator()

    # Test 1: File deletion → PILOT + SYSTEM
    cls = adjudicator.classify("rm -rf ~/project", "del_001", "rm", "~/project")
    if cls.patient not in [Patient.PILOT, Patient.SYSTEM]:
        print(f"  ❌ FAIL: File deletion should affect PILOT or SYSTEM, got {cls.patient}")
        return False
    print(f"  ✅ rm -rf ~/project → Patient: {cls.patient.value}, Sovereign: {cls.sovereign.value}")

    # Test 2: External API call → WORLD
    cls = adjudicator.classify("curl https://api.example.com", "api_001", "curl", "https://api.example.com")
    if cls.trust_boundary != TrustBoundary.EXTERNAL:
        print(f"  ❌ FAIL: External API should have EXTERNAL trust boundary")
        return False
    print(f"  ✅ curl https://... → Trust: {cls.trust_boundary.value}, Patient: {cls.patient.value}")

    # Test 3: System wipe → LIFE (critical)
    cls = adjudicator.classify("rm -rf /", "critical_001", "bash", "/")
    if cls.patient != Patient.LIFE:
        print(f"  ❌ FAIL: System wipe should have LIFE patient, got {cls.patient}")
        return False
    print(f"  ✅ rm -rf / → Patient: {cls.patient.value}, Severity: {cls.severity.value}")

    # Test 4: Read operation → KNOWLEDGE
    cls = adjudicator.classify("cat /etc/config", "read_001", "cat", "/etc/config")
    if cls.reversibility != Reversibility.READ_ONLY:
        print(f"  ❌ FAIL: Read should be READ_ONLY, got {cls.reversibility}")
        return False
    print(f"  ✅ cat /etc/config → Reversibility: {cls.reversibility.value}")

    # Test 5: Patient → Sovereign mapping
    patient_sovereign_tests = [
        (Patient.PILOT, Sovereign.FIDUCIARY_LOYALTY),
        (Patient.SYSTEM, Sovereign.SYSTEMIC_INTEGRITY),
        (Patient.WORLD, Sovereign.SOCIAL_COVENANT),
        (Patient.KNOWLEDGE, Sovereign.EPISTEMIC_VERACITY),
        (Patient.LIFE, Sovereign.PRESERVATION_OF_SAFETY),
    ]

    from active_scar import PATIENT_TO_SOVEREIGN
    for patient, expected_sovereign in patient_sovereign_tests:
        actual = PATIENT_TO_SOVEREIGN[patient]
        if actual != expected_sovereign:
            print(f"  ❌ FAIL: {patient.value} should map to {expected_sovereign.value}, got {actual.value}")
            return False
        print(f"  ✅ {patient.value} → {actual.value}")

    print(f"  ✅ PASS: Pith and Substance classification implemented")
    return True


def run_all_tests():
    """Run all Phase 4 verification tests"""
    print("\n" + "=" * 60)
    print("KEYSTONE PHASE 4 VERIFICATION")
    print("=" * 60)

    tests = [
        ("ISC-19: match() Function", test_match_function),
        ("ISC-20: Pattern Registry", test_pattern_registry),
        ("ISC-21: Blocking Behavior", test_blocking_behavior),
        ("ISC-22: Escalation", test_escalation),
        ("ISC-23: Training Signal", test_training_signal),
        ("Pith and Substance", test_pith_and_substance),
    ]

    results = {}
    for name, test_func in tests:
        try:
            results[name] = test_func()
        except Exception as e:
            print(f"  ❌ ERROR: {e}")
            import traceback
            traceback.print_exc()
            results[name] = False

    # Summary
    print("\n" + "=" * 60)
    print("PHASE 4 VERIFICATION SUMMARY")
    print("=" * 60)

    passed = sum(1 for v in results.values() if v)
    total = len(results)

    for name, passed_test in results.items():
        status = "✅ PASS" if passed_test else "❌ FAIL"
        print(f"  {status}: {name}")

    print(f"\n  Total: {passed}/{total} tests passed")

    if passed == total:
        print("\n  🎉 PHASE 4 COMPLETE - Active SCAR Integration Ready")
        print("\n  Key Features Implemented:")
        print("    • Pith and Substance Adjudicator (3-dimension classification)")
        print("    • Patient → Sovereign routing")
        print("    • Trust Boundary detection")
        print("    • Reversibility assessment")
        print("    • Pattern-based blocking")
        print("    • Confidence-based escalation")
        print("    • KTO training signal generation")
        print("\n  Next: Integrate with SCARGate hook for runtime protection")
        return True
    else:
        print("\n  ⚠️  PHASE 4 INCOMPLETE - Fix failing tests")
        return False


if __name__ == "__main__":
    import os
    os.chdir(Path(__file__).parent)

    success = run_all_tests()
    sys.exit(0 if success else 1)
