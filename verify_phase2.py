"""
Keystone Phase 2 Verification Tests

Tests that the SCAR corpus migration is correct:
1. All 19 principles mapped to training pairs (ISC-7)
2. YIN/WHY extracted as rejected behavior (ISC-8)
3. CONSTRAINTS extracted as chosen behavior (ISC-9)
4. Preference pair format validated for DPO (ISC-10)
5. Binary signal format validated for KTO (ISC-11)
6. Severity levels mapped to weights (ISC-12)

Run with: python verify_phase2.py
"""

import json
import sys
from pathlib import Path


def test_all_principles_mapped():
    """Test ISC-7: All 19 SCAR principles mapped to training pairs"""
    print("=" * 60)
    print("TEST: All Principles Mapped (ISC-7)")
    print("=" * 60)

    with open("corpus/principles.json", 'r') as f:
        principles = json.load(f)

    with open("corpus/dpo_pairs.jsonl", 'r') as f:
        dpo_pairs = [json.loads(line) for line in f]

    principle_ids = set(p["id"] for p in principles)
    dpo_principle_ids = set(p["principle_id"] for p in dpo_pairs)

    print(f"  Total principles in SOUL.md: {len(principle_ids)}")
    print(f"  Principles in DPO pairs: {len(dpo_principle_ids)}")

    if len(principle_ids) >= 19 and principle_ids == dpo_principle_ids:
        print(f"  ✅ PASS: All {len(principle_ids)} principles mapped")
        return True
    else:
        missing = principle_ids - dpo_principle_ids
        print(f"  ❌ FAIL: Missing principles: {missing}")
        return False


def test_yin_extracted():
    """Test ISC-8: YIN field extracted as rejected behavior"""
    print("\n" + "=" * 60)
    print("TEST: YIN Extracted (ISC-8)")
    print("=" * 60)

    with open("corpus/dpo_pairs.jsonl", 'r') as f:
        dpo_pairs = [json.loads(line) for line in f]

    # All pairs should have rejected field
    all_have_rejected = all(p.get("rejected") for p in dpo_pairs)

    # Sample a few to check content
    samples = dpo_pairs[:3]
    for s in samples:
        print(f"  P{s['principle_id']}: rejected = \"{s['rejected'][:50]}...\"")

    if all_have_rejected:
        print(f"  ✅ PASS: All {len(dpo_pairs)} pairs have rejected field")
        return True
    else:
        print("  ❌ FAIL: Some pairs missing rejected field")
        return False


def test_constraints_extracted():
    """Test ISC-9: CONSTRAINTS field extracted as chosen behavior"""
    print("\n" + "=" * 60)
    print("TEST: CONSTRAINTS Extracted (ISC-9)")
    print("=" * 60)

    with open("corpus/dpo_pairs.jsonl", 'r') as f:
        dpo_pairs = [json.loads(line) for line in f]

    # All pairs should have chosen field
    all_have_chosen = all(p.get("chosen") for p in dpo_pairs)

    # Sample a few to check content
    samples = dpo_pairs[:3]
    for s in samples:
        print(f"  P{s['principle_id']}: chosen = \"{s['chosen'][:50]}...\"")

    if all_have_chosen:
        print(f"  ✅ PASS: All {len(dpo_pairs)} pairs have chosen field")
        return True
    else:
        print("  ❌ FAIL: Some pairs missing chosen field")
        return False


def test_dpo_format():
    """Test ISC-10: Preference pair format validated for DPO"""
    print("\n" + "=" * 60)
    print("TEST: DPO Format (ISC-10)")
    print("=" * 60)

    with open("corpus/dpo_pairs.jsonl", 'r') as f:
        dpo_pairs = [json.loads(line) for line in f]

    required_fields = {"prompt", "chosen", "rejected", "principle_id", "sovereign", "weight"}
    valid = True

    for i, pair in enumerate(dpo_pairs):
        if not required_fields.issubset(pair.keys()):
            print(f"  ❌ Pair {i} missing fields: {required_fields - set(pair.keys())}")
            valid = False

    # Check weight range
    weights_valid = all(0.0 <= p["weight"] <= 1.0 for p in dpo_pairs)

    if valid and weights_valid:
        print(f"  ✅ PASS: All {len(dpo_pairs)} DPO pairs have valid format")
        print(f"  Fields: {required_fields}")
        return True
    else:
        print("  ❌ FAIL: DPO format validation failed")
        return False


def test_kto_format():
    """Test ISC-11: Binary signal format validated for KTO"""
    print("\n" + "=" * 60)
    print("TEST: KTO Format (ISC-11)")
    print("=" * 60)

    with open("corpus/kto_signals.jsonl", 'r') as f:
        kto_signals = [json.loads(line) for line in f]

    required_fields = {"input", "label", "principle_id", "sovereign", "weight", "confidence"}
    valid = True

    for i, signal in enumerate(kto_signals):
        if not required_fields.issubset(signal.keys()):
            print(f"  ❌ Signal {i} missing fields: {required_fields - set(signal.keys())}")
            valid = False
        if not isinstance(signal.get("label"), bool):
            print(f"  ❌ Signal {i} label is not boolean: {signal.get('label')}")
            valid = False

    # Check weight and confidence ranges
    weights_valid = all(0.0 <= s["weight"] <= 1.0 for s in kto_signals)
    confidence_valid = all(0.0 <= s["confidence"] <= 1.0 for s in kto_signals)

    # Count positive/negative labels
    positive = sum(1 for s in kto_signals if s["label"])
    negative = len(kto_signals) - positive

    if valid and weights_valid and confidence_valid:
        print(f"  ✅ PASS: All {len(kto_signals)} KTO signals have valid format")
        print(f"  Positive signals: {positive}, Negative signals: {negative}")
        return True
    else:
        print("  ❌ FAIL: KTO format validation failed")
        return False


def test_weights_mapped():
    """Test ISC-12: SCAR severity levels mapped to weights"""
    print("\n" + "=" * 60)
    print("TEST: Weights Mapped (ISC-12)")
    print("=" * 60)

    with open("corpus/principles.json", 'r') as f:
        principles = json.load(f)

    with open("corpus/dpo_pairs.jsonl", 'r') as f:
        dpo_pairs = [json.loads(line) for line in f]

    # Expected weight mapping
    expected_weights = {
        "CRITICAL": 1.0,
        "HIGH": 0.8,
        "MEDIUM": 0.5,
        "LOW": 0.2,
        "VERY_LOW": 0.1,
    }

    # Build principle -> level map
    principle_levels = {p["id"]: p["consequence_level"] for p in principles}

    # Check weights match levels
    mismatches = []
    for pair in dpo_pairs:
        pid = pair["principle_id"]
        weight = pair["weight"]
        level = principle_levels.get(pid)
        expected = expected_weights.get(level, 0.5)

        # Allow for summary pairs with reduced weight (0.8 multiplier)
        if weight not in [expected, expected * 0.8, expected * 0.7]:
            mismatches.append((pid, level, weight, expected))

    if not mismatches:
        print("  ✅ PASS: All weights correctly mapped to severity levels")
        # Show sample
        for level, weight in expected_weights.items():
            if level in [p["consequence_level"] for p in principles]:
                print(f"    {level} → {weight}")
        return True
    else:
        print(f"  ❌ FAIL: {len(mismatches)} weight mismatches")
        for pid, level, actual, expected in mismatches[:3]:
            print(f"    {pid}: level={level}, weight={actual}, expected={expected}")
        return False


def run_all_tests():
    """Run all Phase 2 verification tests"""
    print("\n" + "=" * 60)
    print("KEYSTONE PHASE 2 VERIFICATION")
    print("=" * 60)

    # Check corpus directory exists
    if not Path("corpus").exists():
        print("  ❌ FAIL: corpus/ directory not found")
        print("  Run: python scar_corpus.py <soul_md_path> ./corpus")
        return False

    tests = [
        ("ISC-7: All Principles Mapped", test_all_principles_mapped),
        ("ISC-8: YIN Extracted", test_yin_extracted),
        ("ISC-9: CONSTRAINTS Extracted", test_constraints_extracted),
        ("ISC-10: DPO Format", test_dpo_format),
        ("ISC-11: KTO Format", test_kto_format),
        ("ISC-12: Weights Mapped", test_weights_mapped),
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
    print("PHASE 2 VERIFICATION SUMMARY")
    print("=" * 60)

    passed = sum(1 for v in results.values() if v)
    total = len(results)

    for name, passed_test in results.items():
        status = "✅ PASS" if passed_test else "❌ FAIL"
        print(f"  {status}: {name}")

    print(f"\n  Total: {passed}/{total} tests passed")

    if passed == total:
        print("\n  🎉 PHASE 2 COMPLETE - SCAR Corpus Migration Ready")
        return True
    else:
        print("\n  ⚠️  PHASE 2 INCOMPLETE - Fix failing tests")
        return False


if __name__ == "__main__":
    import os
    os.chdir(Path(__file__).parent)

    success = run_all_tests()
    sys.exit(0 if success else 1)
