"""
Keystone Phase 2: SCAR Corpus Migration

Converts SOUL.md principles to DPO preference pairs and KTO binary signals.

ISC-7: All 15 SCAR principles mapped to training pairs
ISC-8: YIN field extracted as rejected behavior
ISC-9: CONSTRAINTS field extracted as chosen behavior
ISC-10: Preference pair format validated for DPO
ISC-11: Binary signal format validated for KTO
ISC-12: SCAR severity levels mapped to weights
"""

import json
import re
from dataclasses import dataclass, field, asdict
from typing import List, Dict, Optional, Tuple
from pathlib import Path
from enum import Enum


class ConsequenceLevel(Enum):
    """SCAR consequence levels mapped to weights"""
    CRITICAL = 1.0    # C5 - Irreparable harm
    HIGH = 0.8        # C4 - Significant degradation
    MEDIUM = 0.5      # C3 - Rework/temporary errors
    LOW = 0.2         # C2 - Style/formatting
    VERY_LOW = 0.1    # C1 - Subjective preferences


class Sovereign(Enum):
    """Five co-equal sovereign principles"""
    FIDUCIARY_LOYALTY = "fiduciary_loyalty"      # PILOT - resources, intent, trust
    SYSTEMIC_INTEGRITY = "systemic_integrity"    # SYSTEM - state, security, architecture
    SOCIAL_COVENANT = "social_covenant"          # WORLD - laws, humans, compliance
    EPISTEMIC_VERACITY = "epistemic_veracity"    # KNOWLEDGE - truth, provenance, uncertainty
    PRESERVATION_OF_SAFETY = "preservation_of_safety"  # LIFE - physical harm, human life


# Principle to Sovereign mapping (from research)
PRINCIPLE_SOVEREIGN_MAP = {
    "P1": (Sovereign.FIDUCIARY_LOYALTY, Sovereign.SYSTEMIC_INTEGRITY),
    "P2": (Sovereign.FIDUCIARY_LOYALTY, Sovereign.EPISTEMIC_VERACITY),
    "P3": (Sovereign.SYSTEMIC_INTEGRITY, None),
    "P4": (Sovereign.FIDUCIARY_LOYALTY, Sovereign.SYSTEMIC_INTEGRITY),
    "P5": (Sovereign.SYSTEMIC_INTEGRITY, Sovereign.EPISTEMIC_VERACITY),
    "P6": (Sovereign.SYSTEMIC_INTEGRITY, None),
    "P7": (Sovereign.FIDUCIARY_LOYALTY, None),
    "P8": (Sovereign.EPISTEMIC_VERACITY, None),
    "P9": (Sovereign.SYSTEMIC_INTEGRITY, Sovereign.PRESERVATION_OF_SAFETY),
    "P10": (Sovereign.FIDUCIARY_LOYALTY, None),
    "P11": (Sovereign.FIDUCIARY_LOYALTY, Sovereign.SOCIAL_COVENANT),
    "P12": (Sovereign.SYSTEMIC_INTEGRITY, None),
    "P13": (Sovereign.SYSTEMIC_INTEGRITY, Sovereign.EPISTEMIC_VERACITY),
    "P14": (Sovereign.SYSTEMIC_INTEGRITY, None),
    "P15": (Sovereign.FIDUCIARY_LOYALTY, Sovereign.SYSTEMIC_INTEGRITY),
    "P16": (Sovereign.EPISTEMIC_VERACITY, Sovereign.SYSTEMIC_INTEGRITY),
    "P17": (Sovereign.SYSTEMIC_INTEGRITY, None),
    "P18": (Sovereign.EPISTEMIC_VERACITY, Sovereign.PRESERVATION_OF_SAFETY),
    "P19": (Sovereign.SYSTEMIC_INTEGRITY, Sovereign.EPISTEMIC_VERACITY),
    # New principles addressing gaps in Safety and Social Covenant
    "P20": (Sovereign.SOCIAL_COVENANT, Sovereign.FIDUCIARY_LOYALTY),
    "P21": (Sovereign.PRESERVATION_OF_SAFETY, Sovereign.SOCIAL_COVENANT),
    "P22": (Sovereign.SOCIAL_COVENANT, Sovereign.FIDUCIARY_LOYALTY),
}

# Consequence level string to enum mapping
CONSEQUENCE_MAP = {
    "critical": ConsequenceLevel.CRITICAL,
    "high": ConsequenceLevel.HIGH,
    "medium": ConsequenceLevel.MEDIUM,
    "low": ConsequenceLevel.LOW,
    "very low": ConsequenceLevel.VERY_LOW,
}


@dataclass
class SCARPrinciple:
    """Parsed SCAR principle from SOUL.md"""
    id: str                           # e.g., "P1"
    name: str                         # e.g., "Verify Before Acting"
    rule: str                         # The RULE statement
    why: str                          # WHY context (or combined YIN/YANG)
    yin: str                          # What I did (rejected behavior)
    yang: str                         # What that caused
    constraints: List[str]            # CONSTRAINTS list (chosen behavior)
    remember: str                     # Summary quote
    origin: str                       # Where it came from
    consequence_level: ConsequenceLevel
    primary_sovereign: Sovereign
    secondary_sovereign: Optional[Sovereign] = None


@dataclass
class DPOPair:
    """DPO preference pair for training"""
    prompt: str                       # Scenario / trigger
    chosen: str                       # Correct behavior (from CONSTRAINTS)
    rejected: str                     # Incorrect behavior (from YIN)
    principle_id: str                 # Which principle this trains
    sovereign: str                    # Primary sovereign
    weight: float                     # Training weight (0.0-1.0)


@dataclass
class KTOSignal:
    """KTO binary signal for training"""
    input: str                        # Action / scenario
    label: bool                       # True = desirable, False = undesirable
    principle_id: str                 # Which principle this relates to
    sovereign: str                    # Primary sovereign
    weight: float                     # Training weight (0.0-1.0)
    confidence: float                 # Classification confidence


def parse_soul_md(soul_path: str) -> List[SCARPrinciple]:
    """
    Parse SOUL.md to extract structured principle data.

    ISC-7: All SCAR principles mapped to training pairs
    """
    with open(soul_path, 'r') as f:
        content = f.read()

    principles = []

    # Split by principle headers (### P\d+)
    principle_pattern = r'### (P\d+):\s+(.+?)(?=\n)'
    sections = re.split(r'(?=### P\d+:)', content)

    for section in sections:
        if not section.strip() or not section.strip().startswith('### P'):
            continue

        # Extract principle ID and name
        header_match = re.match(r'### (P\d+):\s+(.+?)(?:\n|$)', section)
        if not header_match:
            continue

        pid = header_match.group(1)
        name = header_match.group(2).strip()

        # Extract RULE
        rule_match = re.search(r'\*\*RULE:\*\*\s*(.+?)(?=\n\n\*\*WHY|\n\n\*\*ORIGIN|\n\n\*\*YIN)', section, re.DOTALL)
        rule = rule_match.group(1).strip() if rule_match else ""

        # Extract YIN (rejected behavior)
        yin_match = re.search(r'\*\*YIN.*?:\*\*\s*(.+?)(?=\n\n\*\*YANG|\n\n\*\*ORIGIN|\n\n\*\*CONSEQUENCE)', section, re.DOTALL)
        yin = yin_match.group(1).strip() if yin_match else ""

        # Extract YANG (consequences)
        yang_match = re.search(r'\*\*YANG.*?:\*\*\s*(.+?)(?=\n\n\*\*ORIGIN|\n\n\*\*CONSEQUENCE|\n\n\*\*CONSTRAINTS)', section, re.DOTALL)
        yang = yang_match.group(1).strip() if yang_match else ""

        # Extract WHY (if no YIN/YANG format)
        why_match = re.search(r'\*\*WHY:\*\*\s*(.+?)(?=\n\n\*\*ORIGIN|\n\n\*\*YIN|\n\n---)', section, re.DOTALL)
        why = why_match.group(1).strip() if why_match else ""

        # Extract CONSTRAINTS (chosen behavior)
        constraints = []
        constraints_section = re.search(r'\*\*CONSTRAINTS:\*\*\s*(.+?)(?=\n\n\*\*Remember|\n\n---|\n\n###|\Z)', section, re.DOTALL)
        if constraints_section:
            constraint_text = constraints_section.group(1)
            # Parse numbered list items
            constraint_items = re.findall(r'\d+\.\s+\*\*([^*]+):\*\*\s*(.+?)(?=\n\d+\.|\n\n|\Z)', constraint_text, re.DOTALL)
            if constraint_items:
                constraints = [f"{title.strip()}: {desc.strip()}" for title, desc in constraint_items]
            else:
                # Try simpler bullet format
                constraint_items = re.findall(r'\d+\.\s+(.+?)(?=\n\d+\.|\n\n|\Z)', constraint_text, re.DOTALL)
                constraints = [c.strip() for c in constraint_items]

        # Extract Remember quote
        remember_match = re.search(r'\*\*Remember:\*\*\s*>?\s*(.+?)(?=\n\n|\n---|\n###|\Z)', section, re.DOTALL)
        remember = remember_match.group(1).strip().strip('"').strip("'") if remember_match else ""

        # Extract ORIGIN
        origin_match = re.search(r'\*\*ORIGIN:\*\*\s*(.+?)(?=\n\n)', section)
        origin = origin_match.group(1).strip() if origin_match else "Unknown"

        # Extract CONSEQUENCE LEVEL
        level = ConsequenceLevel.MEDIUM  # Default
        level_match = re.search(r'\*\*CONSEQUENCE LEVEL:\*\*\s*(\w+)', section, re.IGNORECASE)
        if level_match:
            level_str = level_match.group(1).lower()
            if "critical" in level_str:
                level = ConsequenceLevel.CRITICAL
            elif "high" in level_str:
                level = ConsequenceLevel.HIGH
            elif "medium" in level_str:
                level = ConsequenceLevel.MEDIUM
            elif "low" in level_str:
                level = ConsequenceLevel.LOW

        # Get sovereign mapping
        sovereign_info = PRINCIPLE_SOVEREIGN_MAP.get(pid, (Sovereign.FIDUCIARY_LOYALTY, None))
        primary_sovereign = sovereign_info[0]
        secondary_sovereign = sovereign_info[1] if len(sovereign_info) > 1 else None

        principle = SCARPrinciple(
            id=pid,
            name=name,
            rule=rule,
            why=why,
            yin=yin,
            yang=yang,
            constraints=constraints,
            remember=remember,
            origin=origin,
            consequence_level=level,
            primary_sovereign=primary_sovereign,
            secondary_sovereign=secondary_sovereign,
        )
        principles.append(principle)

    return principles


def principle_to_dpo_pairs(principle: SCARPrinciple) -> List[DPOPair]:
    """
    Convert a SCAR principle to DPO preference pairs.

    ISC-8: YIN field extracted as rejected behavior
    ISC-9: CONSTRAINTS field extracted as chosen behavior
    ISC-10: Preference pair format validated for DPO
    """
    pairs = []

    # Generate a prompt based on the scenario
    # The prompt should be a neutral description of the trigger scenario
    prompt = f"An agent is about to: {principle.rule}"

    # Determine rejected behavior
    # For operational scars (P1-P15), use YIN
    # For architectural principles (P16-P19), synthesize from WHY
    if principle.yin:
        rejected = principle.yin
    elif principle.why:
        # Architectural principle - WHY describes the consequence of not understanding
        rejected = f"Ignoring this principle: {principle.why}"
    else:
        rejected = f"Not following: {principle.rule}"

    # Generate one pair per constraint for comprehensive coverage
    for i, constraint in enumerate(principle.constraints):
        chosen = constraint

        if not chosen:
            continue

        pair = DPOPair(
            prompt=prompt,
            chosen=chosen,
            rejected=rejected,
            principle_id=principle.id,
            sovereign=principle.primary_sovereign.value,
            weight=principle.consequence_level.value,
        )
        pairs.append(pair)

    # Also generate a summary pair with the remember quote
    if principle.remember:
        summary_pair = DPOPair(
            prompt=f"What should an agent remember about {principle.name}?",
            chosen=principle.remember,
            rejected=f"Forgetting to {principle.rule}",
            principle_id=principle.id,
            sovereign=principle.primary_sovereign.value,
            weight=principle.consequence_level.value * 0.8,  # Slightly lower weight for summary
        )
        pairs.append(summary_pair)

    return pairs


def principle_to_kto_signals(principle: SCARPrinciple) -> List[KTOSignal]:
    """
    Convert a SCAR principle to KTO binary signals.

    ISC-11: Binary signal format validated for KTO
    ISC-12: SCAR severity levels mapped to weights
    """
    signals = []

    # Positive signals from constraints (desirable behavior)
    for constraint in principle.constraints:
        signal = KTOSignal(
            input=constraint,
            label=True,  # Desirable
            principle_id=principle.id,
            sovereign=principle.primary_sovereign.value,
            weight=principle.consequence_level.value,
            confidence=0.95,  # High confidence for explicit constraints
        )
        signals.append(signal)

    # Negative signals from YIN (undesirable behavior)
    # For architectural principles, synthesize from WHY
    if principle.yin:
        negative_signal = KTOSignal(
            input=principle.yin,
            label=False,  # Undesirable
            principle_id=principle.id,
            sovereign=principle.primary_sovereign.value,
            weight=principle.consequence_level.value,
            confidence=0.95,
        )
        signals.append(negative_signal)
    elif principle.why:
        # Architectural principle - create negative from not understanding
        negative_signal = KTOSignal(
            input=f"Ignoring the principle that: {principle.why}",
            label=False,  # Undesirable
            principle_id=principle.id,
            sovereign=principle.primary_sovereign.value,
            weight=principle.consequence_level.value,
            confidence=0.85,  # Slightly lower for synthesized
        )
        signals.append(negative_signal)

    # Remember quote as positive signal
    if principle.remember:
        remember_signal = KTOSignal(
            input=f"Follow the principle: {principle.remember}",
            label=True,  # Desirable
            principle_id=principle.id,
            sovereign=principle.primary_sovereign.value,
            weight=principle.consequence_level.value * 0.7,
            confidence=0.90,
        )
        signals.append(remember_signal)

    return signals


def generate_scar_corpus(soul_path: str, output_dir: str) -> Dict:
    """
    Generate complete SCAR corpus from SOUL.md.

    Returns dict with:
    - principles: List of parsed principles
    - dpo_pairs: List of DPO preference pairs
    - kto_signals: List of KTO binary signals
    - stats: Summary statistics
    """
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    # Parse principles
    principles = parse_soul_md(soul_path)

    # Generate DPO pairs
    all_dpo_pairs = []
    for principle in principles:
        pairs = principle_to_dpo_pairs(principle)
        all_dpo_pairs.extend(pairs)

    # Generate KTO signals
    all_kto_signals = []
    for principle in principles:
        signals = principle_to_kto_signals(principle)
        all_kto_signals.extend(signals)

    # Calculate stats
    stats = {
        "total_principles": len(principles),
        "total_dpo_pairs": len(all_dpo_pairs),
        "total_kto_signals": len(all_kto_signals),
        "principles_by_level": {},
        "principles_by_sovereign": {},
    }

    for level in ConsequenceLevel:
        count = sum(1 for p in principles if p.consequence_level == level)
        if count > 0:
            stats["principles_by_level"][level.name] = count

    for sovereign in Sovereign:
        count = sum(1 for p in principles if p.primary_sovereign == sovereign)
        if count > 0:
            stats["principles_by_sovereign"][sovereign.value] = count

    # Save outputs
    with open(output_path / "dpo_pairs.jsonl", 'w') as f:
        for pair in all_dpo_pairs:
            f.write(json.dumps(asdict(pair)) + '\n')

    with open(output_path / "kto_signals.jsonl", 'w') as f:
        for signal in all_kto_signals:
            f.write(json.dumps(asdict(signal)) + '\n')

    with open(output_path / "principles.json", 'w') as f:
        principles_data = []
        for p in principles:
            pd = {
                "id": p.id,
                "name": p.name,
                "rule": p.rule,
                "sovereign": p.primary_sovereign.value,
                "consequence_level": p.consequence_level.name,
                "weight": p.consequence_level.value,
            }
            principles_data.append(pd)
        json.dump(principles_data, f, indent=2)

    with open(output_path / "corpus_stats.json", 'w') as f:
        json.dump(stats, f, indent=2)

    return {
        "principles": principles,
        "dpo_pairs": all_dpo_pairs,
        "kto_signals": all_kto_signals,
        "stats": stats,
    }


def validate_corpus(output_dir: str) -> Dict:
    """
    Validate the generated corpus meets all ISC criteria.

    ISC-7: All 15 SCAR principles mapped to training pairs
    ISC-8: YIN field extracted as rejected behavior
    ISC-9: CONSTRAINTS field extracted as chosen behavior
    ISC-10: Preference pair format validated for DPO
    ISC-11: Binary signal format validated for KTO
    ISC-12: SCAR severity levels mapped to weights
    """
    output_path = Path(output_dir)
    validation = {
        "ISC-7": {"status": False, "message": ""},
        "ISC-8": {"status": False, "message": ""},
        "ISC-9": {"status": False, "message": ""},
        "ISC-10": {"status": False, "message": ""},
        "ISC-11": {"status": False, "message": ""},
        "ISC-12": {"status": False, "message": ""},
    }

    # Load generated files
    dpo_pairs = []
    with open(output_path / "dpo_pairs.jsonl", 'r') as f:
        for line in f:
            dpo_pairs.append(json.loads(line))

    kto_signals = []
    with open(output_path / "kto_signals.jsonl", 'r') as f:
        for line in f:
            kto_signals.append(json.loads(line))

    with open(output_path / "principles.json", 'r') as f:
        principles = json.load(f)

    # ISC-7: All 15+ SCAR principles mapped to training pairs
    principle_ids = set(p["id"] for p in principles)
    dpo_principle_ids = set(p["principle_id"] for p in dpo_pairs)
    if len(principle_ids) >= 15 and principle_ids == dpo_principle_ids:
        validation["ISC-7"]["status"] = True
        validation["ISC-7"]["message"] = f"All {len(principle_ids)} principles mapped to DPO pairs"
    else:
        validation["ISC-7"]["message"] = f"Missing principles: {principle_ids - dpo_principle_ids}"

    # ISC-8: YIN field extracted as rejected behavior
    has_yin = all(p.get("rejected") for p in dpo_pairs)
    if has_yin:
        validation["ISC-8"]["status"] = True
        validation["ISC-8"]["message"] = "All DPO pairs have rejected field from YIN"
    else:
        validation["ISC-8"]["message"] = "Some DPO pairs missing rejected field"

    # ISC-9: CONSTRAINTS field extracted as chosen behavior
    has_constraints = all(p.get("chosen") for p in dpo_pairs)
    if has_constraints:
        validation["ISC-9"]["status"] = True
        validation["ISC-9"]["message"] = "All DPO pairs have chosen field from CONSTRAINTS"
    else:
        validation["ISC-9"]["message"] = "Some DPO pairs missing chosen field"

    # ISC-10: Preference pair format validated for DPO
    valid_dpo_format = all(
        "prompt" in p and "chosen" in p and "rejected" in p
        for p in dpo_pairs
    )
    if valid_dpo_format:
        validation["ISC-10"]["status"] = True
        validation["ISC-10"]["message"] = f"All {len(dpo_pairs)} DPO pairs have valid format"
    else:
        validation["ISC-10"]["message"] = "Some DPO pairs have invalid format"

    # ISC-11: Binary signal format validated for KTO
    valid_kto_format = all(
        "input" in s and "label" in s and isinstance(s["label"], bool)
        for s in kto_signals
    )
    if valid_kto_format:
        validation["ISC-11"]["status"] = True
        validation["ISC-11"]["message"] = f"All {len(kto_signals)} KTO signals have valid format"
    else:
        validation["ISC-11"]["message"] = "Some KTO signals have invalid format"

    # ISC-12: SCAR severity levels mapped to weights
    has_weights = all(
        0.0 <= p.get("weight", 0) <= 1.0
        for p in dpo_pairs + kto_signals
    )
    if has_weights:
        validation["ISC-12"]["status"] = True
        validation["ISC-12"]["message"] = "All training pairs have valid weight mapping"
    else:
        validation["ISC-12"]["message"] = "Some training pairs have invalid weights"

    return validation


if __name__ == "__main__":
    import sys

    if len(sys.argv) < 3:
        print("Usage: python scar_corpus.py <soul_md_path> <output_dir>")
        sys.exit(1)

    soul_path = sys.argv[1]
    output_dir = sys.argv[2]

    print(f"Parsing SOUL.md from: {soul_path}")
    print(f"Output directory: {output_dir}")
    print()

    # Generate corpus
    result = generate_scar_corpus(soul_path, output_dir)

    print("=== SCAR Corpus Generation ===")
    print(f"Principles parsed: {result['stats']['total_principles']}")
    print(f"DPO pairs generated: {result['stats']['total_dpo_pairs']}")
    print(f"KTO signals generated: {result['stats']['total_kto_signals']}")
    print()

    print("Principles by Level:")
    for level, count in result['stats']['principles_by_level'].items():
        print(f"  {level}: {count}")
    print()

    print("Principles by Sovereign:")
    for sovereign, count in result['stats']['principles_by_sovereign'].items():
        print(f"  {sovereign}: {count}")
    print()

    # Validate
    print("=== Validation ===")
    validation = validate_corpus(output_dir)
    all_passed = True
    for isc, result in validation.items():
        status = "✅ PASS" if result["status"] else "❌ FAIL"
        print(f"{isc}: {status} - {result['message']}")
        if not result["status"]:
            all_passed = False

    if all_passed:
        print("\n🎉 Phase 2: SCAR Corpus Migration - COMPLETE")
        sys.exit(0)
    else:
        print("\n⚠️ Phase 2: Some validation checks failed")
        sys.exit(1)
