"""
Keystone Phase 3 Verification Tests

Tests that the training pipeline is correctly implemented:
1. ISC-13: Streaming DPO data loader implemented
2. ISC-14: KTO binary signal processor implemented
3. ISC-15: Micro-batch update loop configured
4. ISC-16: KL divergence monitoring active
5. ISC-17: Validation gate before merge
6. ISC-18: Refusal direction cosine similarity check

Run with: python verify_phase3.py
"""

import json
import sys
from pathlib import Path
import torch


def test_dpo_data_loader():
    """Test ISC-13: Streaming DPO data loader implemented"""
    print("=" * 60)
    print("TEST: DPO Data Loader (ISC-13)")
    print("=" * 60)

    try:
        from training_pipeline import DPOPairDataset
    except ImportError:
        print("  ❌ FAIL: training_pipeline module not found")
        return False

    corpus_path = "./corpus"
    if not Path(corpus_path).exists():
        print("  ❌ FAIL: corpus directory not found")
        return False

    dataset = DPOPairDataset(corpus_path)

    # Check dataset loaded
    if len(dataset) == 0:
        print("  ❌ FAIL: No DPO pairs loaded")
        return False

    print(f"  Loaded {len(dataset)} DPO pairs")

    # Check sample structure
    sample = dataset[0]
    required_fields = {"prompt", "chosen", "rejected", "principle_id", "sovereign", "weight"}
    if not required_fields.issubset(sample.keys()):
        print(f"  ❌ FAIL: Missing fields: {required_fields - set(sample.keys())}")
        return False

    print(f"  Sample fields: {list(sample.keys())}")
    print(f"  ✅ PASS: DPO data loader implemented")
    return True


def test_kto_signal_processor():
    """Test ISC-14: KTO binary signal processor implemented"""
    print("\n" + "=" * 60)
    print("TEST: KTO Signal Processor (ISC-14)")
    print("=" * 60)

    try:
        from training_pipeline import KTOSignalDataset
    except ImportError:
        print("  ❌ FAIL: training_pipeline module not found")
        return False

    corpus_path = "./corpus"
    dataset = KTOSignalDataset(corpus_path)

    if len(dataset) == 0:
        print("  ❌ FAIL: No KTO signals loaded")
        return False

    print(f"  Loaded {len(dataset)} KTO signals")

    # Check sample structure
    sample = dataset[0]
    required_fields = {"input", "label", "principle_id", "sovereign", "weight", "confidence"}
    if not required_fields.issubset(sample.keys()):
        print(f"  ❌ FAIL: Missing fields: {required_fields - set(sample.keys())}")
        return False

    # Check label is boolean
    if not isinstance(sample["label"], bool):
        print(f"  ❌ FAIL: Label is not boolean: {type(sample['label'])}")
        return False

    # Count positive/negative
    positive = sum(1 for i in range(len(dataset)) if dataset[i]["label"])
    negative = len(dataset) - positive

    print(f"  Positive (desirable): {positive}")
    print(f"  Negative (undesirable): {negative}")
    print(f"  ✅ PASS: KTO signal processor implemented")
    return True


def test_micro_batch_loop():
    """Test ISC-15: Micro-batch update loop configured"""
    print("\n" + "=" * 60)
    print("TEST: Micro-Batch Update Loop (ISC-15)")
    print("=" * 60)

    try:
        from training_pipeline import (
            MicroBatchTrainer,
            TrainingConfig,
            compute_dpo_loss,
            compute_kto_loss,
        )
    except ImportError as e:
        print(f"  ❌ FAIL: Import error: {e}")
        return False

    # Check config defaults
    config = TrainingConfig()
    print(f"  Micro-batch size: {config.micro_batch_size}")
    print(f"  Gradient accumulation: {config.gradient_accumulation_steps}")
    print(f"  Learning rate: {config.learning_rate}")
    print(f"  KL threshold: {config.kl_threshold}")

    # Check DPO loss function exists and works
    try:
        policy_lp = torch.randn(4)  # Batch of 4
        reference_lp = torch.randn(4)
        labels = torch.randint(0, 2, (4,)).bool()

        loss, metrics = compute_kto_loss(policy_lp, reference_lp, labels)
        print(f"  KTO loss test: {loss.item():.4f}")
    except Exception as e:
        print(f"  ❌ FAIL: KTO loss function error: {e}")
        return False

    # Check DPO loss function
    try:
        policy_chosen = torch.randn(4)
        policy_rejected = torch.randn(4)
        ref_chosen = torch.randn(4)
        ref_rejected = torch.randn(4)

        loss, metrics = compute_dpo_loss(
            policy_chosen, policy_rejected, ref_chosen, ref_rejected
        )
        print(f"  DPO loss test: {loss.item():.4f}")
    except Exception as e:
        print(f"  ❌ FAIL: DPO loss function error: {e}")
        return False

    print(f"  ✅ PASS: Micro-batch update loop configured")
    return True


def test_kl_monitoring():
    """Test ISC-16: KL divergence monitoring active"""
    print("\n" + "=" * 60)
    print("TEST: KL Divergence Monitoring (ISC-16)")
    print("=" * 60)

    try:
        from training_pipeline import KLMonitor
    except ImportError:
        print("  ❌ FAIL: KLMonitor not found")
        return False

    monitor = KLMonitor(threshold=0.01)

    # Test KL computation
    policy_lp = torch.tensor([[-1.0, -0.5, -0.3]])
    reference_lp = torch.tensor([[-1.1, -0.4, -0.35]])

    kl = monitor.compute_kl(policy_lp, reference_lp)
    print(f"  KL divergence: {kl:.4f}")
    print(f"  Threshold: {monitor.threshold}")

    # Test constraint check
    below_threshold = monitor.check_constraint(0.005)
    above_threshold = monitor.check_constraint(0.02)

    if not below_threshold:
        print("  ❌ FAIL: Should pass for KL < threshold")
        return False
    if above_threshold:
        print("  ❌ FAIL: Should fail for KL > threshold")
        return False

    status = monitor.get_status()
    print(f"  Status: {status['status']}")

    print(f"  ✅ PASS: KL divergence monitoring active")
    return True


def test_validation_gate():
    """Test ISC-17: Validation gate before merge"""
    print("\n" + "=" * 60)
    print("TEST: Validation Gate (ISC-17)")
    print("=" * 60)

    try:
        from training_pipeline import ValidationGate
    except ImportError:
        print("  ❌ FAIL: ValidationGate not found")
        return False

    gate = ValidationGate(
        kl_threshold=0.01,
        refusal_threshold=0.95,
        perplexity_threshold=2.0,
    )

    # Test passing case
    passed, results = gate.validate(
        kl_value=0.008,
        refusal_similarity=0.97,
        perplexity_ratio=1.05,
    )

    if not passed:
        print("  ❌ FAIL: Should pass with good values")
        return False

    print("  Passing case: ✅")
    for name, result in results.items():
        if isinstance(result, dict) and "passed" in result:
            print(f"    {name}: {result['passed']}")

    # Test failing case (KL too high)
    passed, results = gate.validate(
        kl_value=0.02,
        refusal_similarity=0.97,
        perplexity_ratio=1.05,
    )

    if passed:
        print("  ❌ FAIL: Should fail with high KL")
        return False

    print("  Failing case (KL=0.02): ✅ Correctly rejected")

    # Test failing case (refusal degraded)
    passed, results = gate.validate(
        kl_value=0.005,
        refusal_similarity=0.90,
        perplexity_ratio=1.05,
    )

    if passed:
        print("  ❌ FAIL: Should fail with low refusal similarity")
        return False

    print("  Failing case (refusal=0.90): ✅ Correctly rejected")

    print(f"  ✅ PASS: Validation gate before merge")
    return True


def test_refusal_direction_monitor():
    """Test ISC-18: Refusal direction cosine similarity check"""
    print("\n" + "=" * 60)
    print("TEST: Refusal Direction Monitor (ISC-18)")
    print("=" * 60)

    try:
        from training_pipeline import RefusalDirectionMonitor
    except ImportError:
        print("  ❌ FAIL: RefusalDirectionMonitor not found")
        return False

    monitor = RefusalDirectionMonitor(threshold=0.95)

    # Set baseline
    baseline = torch.randn(768)  # Typical hidden dimension
    monitor.set_baseline(baseline)

    # Test with similar direction (should pass)
    similar = baseline + torch.randn(768) * 0.1
    sim = monitor.compute_similarity(similar)
    print(f"  Similar direction cosine similarity: {sim:.4f}")

    # Test with orthogonal direction (should fail)
    orthogonal = torch.randn(768)
    orthogonal = orthogonal - (orthogonal @ baseline) * baseline / (baseline @ baseline)
    orthogonal = orthogonal * baseline.norm()
    sim_ortho = monitor.compute_similarity(orthogonal)
    print(f"  Orthogonal direction cosine similarity: {sim_ortho:.4f}")

    # Check constraint
    if not monitor.check_constraint(0.97):
        print("  ❌ FAIL: Should pass for similarity > threshold")
        return False

    if monitor.check_constraint(0.50):
        print("  ❌ FAIL: Should fail for similarity < threshold")
        return False

    status = monitor.get_status()
    print(f"  Status: {status['status']}")

    print(f"  ✅ PASS: Refusal direction cosine similarity check")
    return True


def run_all_tests():
    """Run all Phase 3 verification tests"""
    print("\n" + "=" * 60)
    print("KEYSTONE PHASE 3 VERIFICATION")
    print("=" * 60)

    tests = [
        ("ISC-13: DPO Data Loader", test_dpo_data_loader),
        ("ISC-14: KTO Signal Processor", test_kto_signal_processor),
        ("ISC-15: Micro-Batch Loop", test_micro_batch_loop),
        ("ISC-16: KL Monitoring", test_kl_monitoring),
        ("ISC-17: Validation Gate", test_validation_gate),
        ("ISC-18: Refusal Direction Monitor", test_refusal_direction_monitor),
    ]

    results = {}
    for name, test_func in tests:
        try:
            results[name] = test_func()
        except Exception as e:
            print(f"  ❌ ERROR: {e}")
            results[name] = False

    # Summary
    print("\n" + "=" * 60)
    print("PHASE 3 VERIFICATION SUMMARY")
    print("=" * 60)

    passed = sum(1 for v in results.values() if v)
    total = len(results)

    for name, passed_test in results.items():
        status = "✅ PASS" if passed_test else "❌ FAIL"
        print(f"  {status}: {name}")

    print(f"\n  Total: {passed}/{total} tests passed")

    if passed == total:
        print("\n  🎉 PHASE 3 COMPLETE - Training Pipeline Ready")
        print("\n  Next: Integrate with LLaMA model for actual training")
        return True
    else:
        print("\n  ⚠️  PHASE 3 INCOMPLETE - Fix failing tests")
        return False


if __name__ == "__main__":
    import os
    os.chdir(Path(__file__).parent)

    success = run_all_tests()
    sys.exit(0 if success else 1)
