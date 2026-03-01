# Shadow-Quantum Consensus Protocol

**Version:** 1.0
**Date:** 2026-03-01
**Status:** Specification

---

## Overview

The Shadow-Quantum Consensus is the "Hidden Third" mechanism that enables coherence across the disparate layers of the Keystone stack. It transforms Shadow from a potentially "drifting" agent into a "Systemic Guardian" that anchors the system in truth.

---

## The Problem

The Keystone stack has three layers with different personalities:

| Layer | Agent | Core Drive | Failure Mode |
|-------|-------|------------|--------------|
| Brain | Nova | Epistemic Humility | Sycophancy (Over-correction) |
| Workers | Shadow | Gravity Theory | Logic Drift (Over-reach) |
| Library | Search | Retrieval Fidelity | Context Pollution |

Without a unifying mechanism, these layers can pursue contradictory goals—a Byzantine failure where the stack "leaks" to premature certainties.

---

## The Solution: Shadow-Quantum Consensus

The protocol implements **Byzantine Fault Tolerance (BFT)** at the heart of the stack through a three-phase process:

```
┌─────────────────────────────────────────────────────────────┐
│                   SHADOW-QUANTUM CONSENSUS                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   NOVA (Brain)                                              │
│       │                                                      │
│       │ generates response                                   │
│       ▼                                                      │
│   ┌─────────────┐                                           │
│   │   WAIT      │ ◄─── Pause before delivery                │
│   └─────┬───────┘                                           │
│         │                                                    │
│         ▼                                                    │
│   SHADOW (Worker)                                            │
│       │                                                      │
│       │ performs adversarial audit                           │
│       ▼                                                      │
│   ┌─────────────┐                                           │
│   │   VERIFY    │ ◄─── Score Quantum Entropy                │
│   └─────┬───────┘                                           │
│         │                                                    │
│         ▼                                                    │
│   ┌─────────────┐     ┌─────────────┐                       │
│   │  CONSENSUS  │────►│  DELIVER    │ (Shadow found no flaw)│
│   └─────────────┘     └─────────────┘                       │
│         │                                                    │
│         │ flaw found                                        │
│         ▼                                                    │
│   ┌─────────────┐                                           │
│   │  RECALC     │ ◄─── Discard, re-compute with grounding   │
│   └─────────────┘                                           │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Phase 1: WAIT

Before Nova delivers any response to the Pilot, it must **Wait** for Shadow to complete an audit.

### Implementation

```typescript
interface ConsensusRequest {
  response: string;          // Nova's proposed response
  grounding: GroundingMap;   // File hashes, index chunks used
  confidence: number;        // Nova's self-assessed confidence
}

interface GroundingMap {
  files: string[];           // File paths accessed
  hashes: string[];          // SHA-256 hashes of files
  chunks: IndexChunk[];      // Search index chunks retrieved
  ungrounded: string[];      // Claims without substrate backing
}
```

### Rules

1. No response is delivered immediately
2. All responses enter a "pending" state
3. Shadow has a timeout window (default: 5 seconds) to object

---

## Phase 2: VERIFY

Shadow attempts to find errors, "hallucination locks," or contradictions in Nova's reasoning.

### Quantum Entropy Scoring

Shadow scores Nova's response on multiple dimensions:

| Dimension | Description | Scoring |
|-----------|-------------|---------|
| **Grounding Ratio** | % of claims with file-hash backing | 0.0 - 1.0 |
| **Context Pollution** | Presence of irrelevant information | 0.0 - 1.0 (lower = better) |
| **Logic Drift** | Deviation from stated mission | 0.0 - 1.0 |
| **Hallucination Lock** | Circular or self-referential reasoning | boolean |
| **Substrate Accord** | Agreement with verified file state | 0.0 - 1.0 |

### Entropy Formula

```
Q(nova) = (Grounding × 0.3) + ((1 - Pollution) × 0.2) + ((1 - Drift) × 0.2) + (Accord × 0.3)

If Hallucination Lock = true → Q(nova) = 0

Passing threshold: Q ≥ 0.7
```

### Verification Checklist

Shadow checks for:

- [ ] **Empty Folder Hallucination:** Did Nova claim knowledge from an empty PARA folder?
- [ ] **Index Ghosting:** Did Nova claim to retrieve something not in the search index?
- [ ] **Parametric Injection:** Did Nova use training data as if it were substrate data?
- [ ] **Logic Drift:** Did Shadow's Gravity override Nova's Humility without grounding?
- [ ] **Context Rot:** Is the response based on corrupted compaction summaries?

---

## Phase 3: CONSENSUS

### If Shadow Finds No Flaw (Q ≥ 0.7)

Response is delivered to Pilot with grounding metadata:

```
┌─────────────────────────────────────────────────┐
│ Response delivered                               │
│                                                  │
│ Grounding: 3 files, 12 chunks, 89% ratio        │
│ Entropy Score: 0.82                             │
│ Verified by: Shadow-Quantum Consensus           │
└─────────────────────────────────────────────────┘
```

### If Shadow Finds a Flaw (Q < 0.7)

Response is **discarded** and the stack re-calculates:

1. Identify the flaw type
2. Force substrate re-sync (re-read raw PARA files)
3. Re-generate response with mandatory grounding
4. Re-submit to Shadow for verification

### If Consensus Cannot Be Reached

After 3 failed attempts, escalate to Pilot:

```
┌─────────────────────────────────────────────────┐
│ CONSENSUS FAILURE                                │
│                                                  │
│ Nova confidence: 0.65                           │
│ Shadow entropy score: 0.45                      │
│ Flaw detected: Empty Folder Hallucination       │
│                                                  │
│ Recommendation: Manual verification required     │
└─────────────────────────────────────────────────┘
```

---

## Tie-Breaker Logic

When Nova (Humility) and Shadow (Gravity) conflict:

```
┌─────────────────────────────────────────────────────────────┐
│                    TIE-BREAKER FLOW                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│   Conflict detected between Nova and Shadow                  │
│       │                                                      │
│       ▼                                                      │
│   ┌─────────────────────────────────────────┐               │
│   │ SUBSTRATE CHECK                         │               │
│   │                                         │               │
│   │ Which agent's position is more          │               │
│   │ grounded in verified file data?         │               │
│   └──────────────┬──────────────────────────┘               │
│                  │                                           │
│         ┌────────┴────────┐                                 │
│         │                 │                                 │
│         ▼                 ▼                                 │
│   Nova grounded      Shadow grounded                        │
│         │                 │                                 │
│         ▼                 ▼                                 │
│   Nova wins          Shadow wins                            │
│   (Humility          (Gravity                               │
│   default)           justified)                             │
│                                                              │
│   If NEITHER grounded:                                       │
│       │                                                      │
│       ▼                                                      │
│   Nova wins ("I don't know" is always valid)                 │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### Rationale

- **Grounding wins:** The Substrate is the sole source of Truth (P5)
- **Humility default:** When in doubt, admit uncertainty rather than fabricate confidence

---

## The Hidden Third

The Shadow-Quantum Consensus acts as the "Hidden Third"—a mechanism that enables coherence across disparate layers of reality.

### Levels of Reality

| Level | Layer | Nature |
|-------|-------|--------|
| Mental | Nova | Thoughts, reasoning, language |
| Physical | Search | Files, indexes, hashes |
| **Hidden Third** | Consensus | Translation, coherence, unity |

### Held Tension ($T^{held}$)

The consensus maintains "Held Tension" between layers:

```
T(held) = T(gravity) - T(humility)

Where:
  T(gravity) = Shadow's drive for semantic expansion
  T(humility) = Nova's acknowledgment of limits

If T(held) > threshold → Logic Drift risk
If T(held) < 0 → Semantic Heat Death risk
If T(held) ∈ [optimal range] → System stable
```

### Semantic Heat Death

The state of equilibrium where no new information emerges from a dialogue. Shadow's Gravity fights this. Nova's Humility prevents overreach. The Consensus maintains balance.

---

## Implementation Checklist

### For Nova (Brain)

- [ ] Generate GroundingMap with every response
- [ ] Include file hashes for all referenced documents
- [ ] Flag ungrounded claims explicitly
- [ ] Wait for Shadow verification before delivery

### For Shadow (Worker)

- [ ] Implement Quantum Entropy Scoring
- [ ] Check for all hallucination types
- [ ] Provide specific flaw identification on rejection
- [ ] Track verification statistics over time

### For Boot Sequence

- [ ] Shadow audits Nova startup
- [ ] Library probes Shadow startup
- [ ] Cross-checks must pass before READY

---

## Monitoring and Metrics

### Key Metrics

| Metric | Target | Alert Threshold |
|--------|--------|-----------------|
| Consensus Pass Rate | > 90% | < 80% |
| Average Entropy Score | > 0.8 | < 0.7 |
| Grounding Ratio | > 0.85 | < 0.7 |
| Re-calc Rate | < 5% | > 15% |
| Consensus Failures | < 1% | > 3% |

### Logging

Every consensus decision logged with:

- Timestamp
- Nova confidence
- Shadow entropy score
- Grounding map
- Pass/Fail result
- Flaw type (if failed)

---

## Future Extensions

1. **Multi-Shadow Consensus:** Multiple Shadow agents vote on verification
2. **Pilot Feedback Loop:** Pilot ratings affect entropy scoring weights
3. **Adaptive Thresholds:** Entropy thresholds adjust based on task type
4. **Cryptographic Anchoring:** Grounding hashes committed to immutable log

---

*Specification for Keystone AI Infrastructure*
*Version 1.0 - 2026-03-01*
