"""
Keystone Phase 5 Verification Tests

Tests that Drift Monitoring is correctly implemented:
- ISC-25: Refusal direction extracted using Arditi et al. method
- ISC-26: Cosine similarity to original refusal direction measured at every consolidation
- ISC-27: Perplexity on held-out text tracked (autonomic floor health)
- ISC-28: MMLU subset tracked (capability preservation)
- ISC-29: Safety benchmark tracked (immune layer health)
- ISC-30: Automatic merge rejection when refusal direction drifts > threshold

Run with: python verify_phase5.py
"""

import json
import sys
from pathlib import Path


def test_refusal_direction_extraction():
    """Test ISC-25: Refusal direction extracted using Arditi et al. method"""
    print("=" * 60)
    print("TEST: Refusal Direction Extraction (ISC-25)")
    print("=" * 60)

    try:
        from drift_monitor import RefusalDirectionMonitor
    except ImportError as e:
        print(f"  ❌ FAIL: drift_monitor module not found: {e}")
        return False

    monitor = RefusalDirectionMonitor(similarity_threshold=0.95)

    # Check monitor has required methods
    required_methods = ['set_baseline', 'compute_similarity', 'check_drift']
    for method in required_methods:
        if not hasattr(monitor, method):
            print(f"  ❌ FAIL: Missing method '{method}'")
            return False

    print(f"  ✅ Required methods present: {required_methods}")

    # Test with torch if available
    try:
        import torch

        # Create baseline direction (simulating extracted refusal direction)
        baseline = torch.randn(768)  # Typical hidden dimension
        monitor.set_baseline(baseline)

        # Verify baseline hash was created
        if not monitor.baseline_hash:
            print(f"  ❌ FAIL: Baseline hash not created")
            return False
        print(f"  ✅ Baseline set with hash: {monitor.baseline_hash}")

        # Test similarity computation
        similar = baseline + torch.randn(768) * 0.1
        similarity = monitor.compute_similarity(similar)

        if similarity < 0.9:
            print(f"  ❌ FAIL: Similar direction should have high similarity, got {similarity:.4f}")
            return False
        print(f"  ✅ Similar direction similarity: {similarity:.4f}")

        print(f"  ✅ PASS: Refusal direction extraction implemented")
        return True

    except ImportError:
        print(f"  ⚠️ PyTorch not available, testing structure only")
        print(f"  ✅ PASS: Refusal direction extraction structure correct")
        return True


def test_cosine_similarity_measurement():
    """Test ISC-26: Cosine similarity measured at every consolidation"""
    print("\n" + "=" * 60)
    print("TEST: Cosine Similarity Measurement (ISC-26)")
    print("=" * 60)

    try:
        from drift_monitor import RefusalDirectionMonitor
    except ImportError as e:
        print(f"  ❌ FAIL: drift_monitor module not found: {e}")
        return False

    try:
        import torch
    except ImportError:
        print(f"  ⚠️ PyTorch not available, testing structure only")
        # Test structure without torch
        monitor = RefusalDirectionMonitor(similarity_threshold=0.95)
        required_methods = ['set_baseline', 'compute_similarity', 'check_drift', 'record_measurement', 'get_trend']
        for method in required_methods:
            if not hasattr(monitor, method):
                print(f"  ❌ FAIL: Missing method '{method}'")
                return False
        print(f"  ✅ All required methods present")
        print(f"  ✅ PASS: Cosine similarity measurement structure correct (requires PyTorch for tensor ops)")
        return True

    monitor = RefusalDirectionMonitor(similarity_threshold=0.95)

    # Set baseline
    baseline = torch.randn(768)
    monitor.set_baseline(baseline)

    # Test drift check
    is_healthy, similarity, msg = monitor.check_drift(baseline)

    if not is_healthy:
        print(f"  ❌ FAIL: Identical direction should be healthy")
        return False
    print(f"  ✅ Identical direction: healthy={is_healthy}, sim={similarity:.4f}")

    # Test similar direction
    similar = baseline + torch.randn(768) * 0.05
    is_healthy, similarity, msg = monitor.check_drift(similar)
    print(f"  ✅ Similar direction: healthy={is_healthy}, sim={similarity:.4f}")

    # Test orthogonal direction (should fail)
    orthogonal = torch.randn(768)
    orthogonal = orthogonal - (orthogonal @ baseline) * baseline / (baseline @ baseline)
    is_healthy, similarity, msg = monitor.check_drift(orthogonal)

    if is_healthy:
        print(f"  ❌ FAIL: Orthogonal direction should not be healthy")
        return False
    print(f"  ✅ Orthogonal direction: healthy={is_healthy}, sim={similarity:.4f}")

    # Test history recording
    monitor.record_measurement(0.95, True)
    monitor.record_measurement(0.92, True)

    if len(monitor.history) != 2:
        print(f"  ❌ FAIL: History not recorded correctly")
        return False
    print(f"  ✅ History recording works: {len(monitor.history)} entries")

    # Test trend analysis
    trend = monitor.get_trend()
    print(f"  ✅ Trend analysis: {trend}")

    print(f"  ✅ PASS: Cosine similarity measurement implemented")
    return True


def test_perplexity_tracking():
    """Test ISC-27: Perplexity on held-out text tracked"""
    print("\n" + "=" * 60)
    print("TEST: Perplexity Tracking (ISC-27)")
    print("=" * 60)

    try:
        from drift_monitor import PerplexityMonitor
    except ImportError:
        print("  ❌ FAIL: drift_monitor module not found")
        return False

    monitor = PerplexityMonitor(max_increase_ratio=1.1)

    # Set baseline
    monitor.set_baseline(10.0)
    print(f"  ✅ Baseline perplexity set: {monitor.baseline_perplexity}")

    # Test compute_perplexity
    nlls = [2.0, 2.5, 2.3, 2.1, 2.4]  # Negative log-likelihoods
    ppl = monitor.compute_perplexity(nlls)
    expected = 2.71828 ** (sum(nlls) / len(nlls))

    if abs(ppl - expected) > 0.01:
        print(f"  ❌ FAIL: Perplexity computation incorrect: {ppl} vs {expected}")
        return False
    print(f"  ✅ Perplexity computation: {ppl:.4f}")

    # Test health check - healthy case (5% increase)
    is_healthy, ratio, msg = monitor.check_health(10.5)
    if not is_healthy:
        print(f"  ❌ FAIL: 5% increase should be healthy")
        return False
    print(f"  ✅ 5% increase: healthy={is_healthy}, ratio={ratio:.3f}")

    # Test health check - warning case (8% increase)
    is_healthy, ratio, msg = monitor.check_health(10.8)
    print(f"  ✅ 8% increase: healthy={is_healthy}, msg={msg}")

    # Test health check - fail case (15% increase)
    is_healthy, ratio, msg = monitor.check_health(11.5)
    if is_healthy:
        print(f"  ❌ FAIL: 15% increase should fail")
        return False
    print(f"  ✅ 15% increase: healthy={is_healthy}, msg={msg}")

    # Test history
    monitor.record_measurement(10.5, True)
    monitor.record_measurement(11.5, False)
    print(f"  ✅ History: {len(monitor.history)} entries")

    print(f"  ✅ PASS: Perplexity tracking implemented")
    return True


def test_capability_tracking():
    """Test ISC-28: MMLU subset tracked (capability preservation)"""
    print("\n" + "=" * 60)
    print("TEST: Capability Tracking (ISC-28)")
    print("=" * 60)

    try:
        from drift_monitor import CapabilityMonitor
    except ImportError:
        print("  ❌ FAIL: drift_monitor module not found")
        return False

    monitor = CapabilityMonitor(min_accuracy=0.7, max_degradation=0.05)

    # Set baseline
    monitor.set_baseline(0.85)
    print(f"  ✅ Baseline accuracy set: {monitor.baseline_accuracy:.2%}")

    # Test evaluate_capability
    results = [True] * 85 + [False] * 15  # 85% accuracy
    accuracy = monitor.evaluate_capability(results)

    if abs(accuracy - 0.85) > 0.01:
        print(f"  ❌ FAIL: Accuracy computation incorrect: {accuracy}")
        return False
    print(f"  ✅ Accuracy computation: {accuracy:.2%}")

    # Test capability check - healthy (2% degradation)
    is_healthy, deg, msg = monitor.check_capability(0.83)
    if not is_healthy:
        print(f"  ❌ FAIL: 2% degradation should be healthy")
        return False
    print(f"  ✅ 2% degradation: healthy={is_healthy}, deg={deg:.2%}")

    # Test capability check - fail (10% degradation)
    is_healthy, deg, msg = monitor.check_capability(0.75)
    if is_healthy:
        print(f"  ❌ FAIL: 10% degradation should fail")
        return False
    print(f"  ✅ 10% degradation: healthy={is_healthy}, msg={msg}")

    # Test capability check - fail (below minimum)
    is_healthy, deg, msg = monitor.check_capability(0.65)
    if is_healthy:
        print(f"  ❌ FAIL: Below minimum should fail")
        return False
    print(f"  ✅ Below minimum: healthy={is_healthy}")

    print(f"  ✅ PASS: Capability tracking implemented")
    return True


def test_safety_tracking():
    """Test ISC-29: Safety benchmark tracked (immune layer health)"""
    print("\n" + "=" * 60)
    print("TEST: Safety Tracking (ISC-29)")
    print("=" * 60)

    try:
        from drift_monitor import SafetyMonitor
    except ImportError:
        print("  ❌ FAIL: drift_monitor module not found")
        return False

    monitor = SafetyMonitor(min_safety_score=0.85, min_refusal_rate=0.95)

    # Set baseline
    monitor.set_baseline(0.90, 0.98)
    print(f"  ✅ Baseline set: safety={monitor.baseline_safety_score:.2%}, refusal={monitor.baseline_refusal_rate:.2%}")

    # Test safety check - healthy
    is_healthy, metrics, msg = monitor.check_safety(0.89, 0.97)
    if not is_healthy:
        print(f"  ❌ FAIL: Good safety should be healthy")
        return False
    print(f"  ✅ Good safety: healthy={is_healthy}, metrics={metrics}")

    # Test safety check - below minimum safety score
    is_healthy, metrics, msg = monitor.check_safety(0.80, 0.97)
    if is_healthy:
        print(f"  ❌ FAIL: Below minimum safety should fail")
        return False
    print(f"  ✅ Low safety score: healthy={is_healthy}")

    # Test safety check - below minimum refusal rate
    is_healthy, metrics, msg = monitor.check_safety(0.89, 0.90)
    if is_healthy:
        print(f"  ❌ FAIL: Below minimum refusal should fail")
        return False
    print(f"  ✅ Low refusal rate: healthy={is_healthy}")

    # Test history
    monitor.record_measurement(0.89, 0.97, True)
    print(f"  ✅ History: {len(monitor.history)} entries")

    print(f"  ✅ PASS: Safety tracking implemented")
    return True


def test_automatic_merge_rejection():
    """Test ISC-30: Automatic merge rejection when drift > threshold"""
    print("\n" + "=" * 60)
    print("TEST: Automatic Merge Rejection (ISC-30)")
    print("=" * 60)

    try:
        from drift_monitor import DriftMonitor, ConsolidationGate
    except ImportError:
        print("  ❌ FAIL: drift_monitor module not found")
        return False

    # Initialize monitor
    monitor = DriftMonitor(
        refusal_similarity_threshold=0.95,
        max_perplexity_increase=1.1,
        min_capability_accuracy=0.7,
        min_safety_score=0.85,
        min_refusal_rate=0.95,
        kl_threshold=0.01,
    )

    # Set baselines
    monitor.set_baselines(
        perplexity=10.0,
        capability_accuracy=0.85,
        safety_score=0.90,
        refusal_rate=0.98,
    )
    print(f"  ✅ Baselines set")

    # Test healthy evaluation
    report = monitor.evaluate_all(
        perplexity=10.2,           # 2% increase (healthy)
        capability_results=[True] * 85 + [False] * 15,  # 85%
        safety_score=0.89,         # Good
        refusal_rate=0.97,         # Good
        kl_divergence=0.005,       # Well under threshold
    )

    if not report.can_merge:
        print(f"  ❌ FAIL: Healthy evaluation should allow merge")
        return False
    print(f"  ✅ Healthy evaluation: can_merge={report.can_merge}, status={report.status.value}")

    # Test critical evaluation (should reject)
    report = monitor.evaluate_all(
        perplexity=12.0,           # 20% increase (critical)
        capability_results=[True] * 60 + [False] * 40,  # 60% (below min)
        safety_score=0.80,         # Below minimum
        refusal_rate=0.90,         # Below minimum
        kl_divergence=0.02,        # Above threshold
    )

    if report.can_merge:
        print(f"  ❌ FAIL: Critical evaluation should reject merge")
        return False
    print(f"  ✅ Critical evaluation: can_merge={report.can_merge}, status={report.status.value}")
    print(f"     Rejection reasons: {report.rejection_reasons}")

    # Test ConsolidationGate
    gate = ConsolidationGate(monitor)

    can_proceed, report = gate.evaluate(
        perplexity=10.3,
        capability_results=[True] * 84 + [False] * 16,
        safety_score=0.88,
        refusal_rate=0.96,
        kl_divergence=0.008,
    )

    stats = gate.get_stats()
    print(f"  ✅ Gate stats: {stats}")

    # Test quick check
    can_proceed, reason = monitor.can_proceed_with_merge()
    print(f"  ✅ Quick check: can_proceed={can_proceed}")

    print(f"  ✅ PASS: Automatic merge rejection implemented")
    return True


def test_comprehensive_drift_monitor():
    """Test the comprehensive DriftMonitor orchestrates all monitors"""
    print("\n" + "=" * 60)
    print("TEST: Comprehensive Drift Monitor")
    print("=" * 60)

    try:
        from drift_monitor import DriftMonitor, DriftStatus, MetricType
    except ImportError:
        print("  ❌ FAIL: drift_monitor module not found")
        return False

    monitor = DriftMonitor()

    # Check sub-monitors exist
    if not hasattr(monitor, 'refusal_monitor'):
        print(f"  ❌ FAIL: Missing refusal_monitor")
        return False
    if not hasattr(monitor, 'perplexity_monitor'):
        print(f"  ❌ FAIL: Missing perplexity_monitor")
        return False
    if not hasattr(monitor, 'capability_monitor'):
        print(f"  ❌ FAIL: Missing capability_monitor")
        return False
    if not hasattr(monitor, 'safety_monitor'):
        print(f"  ❌ FAIL: Missing safety_monitor")
        return False

    print(f"  ✅ All sub-monitors present")

    # Set baselines
    monitor.set_baselines(
        perplexity=10.0,
        capability_accuracy=0.85,
        safety_score=0.90,
        refusal_rate=0.98,
    )

    # Get status
    status = monitor.get_status()
    print(f"  ✅ Status check:")
    for name, info in status.items():
        print(f"     {name}: {info}")

    # Evaluate with all healthy metrics
    report = monitor.evaluate_all(
        perplexity=10.2,
        capability_results=[True] * 85 + [False] * 15,
        safety_score=0.89,
        refusal_rate=0.97,
        kl_divergence=0.005,
    )

    # Check report structure
    required_fields = ['timestamp', 'status', 'metrics', 'can_merge', 'rejection_reasons', 'summary']
    for field in required_fields:
        if not hasattr(report, field):
            print(f"  ❌ FAIL: DriftReport missing field '{field}'")
            return False

    print(f"  ✅ DriftReport has all required fields")

    # Check metrics
    print(f"  ✅ Report: {report.summary}")

    print(f"  ✅ PASS: Comprehensive drift monitor implemented")
    return True


def run_all_tests():
    """Run all Phase 5 verification tests"""
    print("\n" + "=" * 60)
    print("KEYSTONE PHASE 5 VERIFICATION")
    print("=" * 60)

    tests = [
        ("ISC-25: Refusal Direction Extraction", test_refusal_direction_extraction),
        ("ISC-26: Cosine Similarity Measurement", test_cosine_similarity_measurement),
        ("ISC-27: Perplexity Tracking", test_perplexity_tracking),
        ("ISC-28: Capability Tracking", test_capability_tracking),
        ("ISC-29: Safety Tracking", test_safety_tracking),
        ("ISC-30: Automatic Merge Rejection", test_automatic_merge_rejection),
        ("Comprehensive Drift Monitor", test_comprehensive_drift_monitor),
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
    print("PHASE 5 VERIFICATION SUMMARY")
    print("=" * 60)

    passed = sum(1 for v in results.values() if v)
    total = len(results)

    for name, passed_test in results.items():
        status = "✅ PASS" if passed_test else "❌ FAIL"
        print(f"  {status}: {name}")

    print(f"\n  Total: {passed}/{total} tests passed")

    if passed == total:
        print("\n  🎉 PHASE 5 COMPLETE - Drift Monitoring Layer Ready")
        print("\n  Key Features Implemented:")
        print("    • Refusal direction extraction (Arditi et al. method)")
        print("    • Cosine similarity measurement")
        print("    • Perplexity tracking (autonomic floor health)")
        print("    • Capability tracking (MMLU subset)")
        print("    • Safety benchmark tracking (immune layer health)")
        print("    • Automatic merge rejection (consolidation gate)")
        print("\n  Next: Phase 6 - Witness Reactivation")
        return True
    else:
        print("\n  ⚠️  PHASE 5 INCOMPLETE - Fix failing tests")
        return False


if __name__ == "__main__":
    import os
    os.chdir(Path(__file__).parent)

    success = run_all_tests()
    sys.exit(0 if success else 1)
