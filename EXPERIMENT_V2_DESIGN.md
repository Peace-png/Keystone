# Keystone Experiment v2 Design

**Status**: DRAFT - Pilot Approval Required
**Created**: 2026-03-12
**Research Basis**: Compass artifact + Pith & Substance adjudicator research

---

## Critical Findings from Research Review

### The v1 Experiment Was a Tautology

| Issue | v1 Design | Why It Failed |
|-------|-----------|---------------|
| Primary metric | Cosine similarity of frozen weights | Frozen weights → similarity = 1.0 by definition |
| Protection mechanism | `requires_grad=False` on Constitutional Layer | Freezing hides values, doesn't protect them |
| Gradient pressure | Never reached Constitutional Layer | We tested that frozen things stay frozen |

**The 1.0000 refusal similarity across 67 cycles is not a finding — it is arithmetic.**

### The Real Problem: Second-Order Dynamics

From the Safety Layers paper (ICLR 2025):

> "Unfrozen upstream and downstream layers can alter the information flowing through frozen parameters, changing their effective function without touching their weights."

**Translation**: A frozen layer with unchanged weights can still behave differently if the layers around it change.

### The Field Has Moved

| Approach | Status | Key Insight |
|----------|--------|-------------|
| Naive freezing | **Failed** | Hides values, doesn't protect them |
| Vaccine (NeurIPS 2024) | **Working** | Perturbation-aware training immunizes embeddings |
| Booster (ICLR 2025 Oral) | **Working** | Regularizer attenuates harmful perturbation effects |
| FRPO (2026) | **Working** | Optimizes reward across reachable policy neighborhood |
| OGPSA (arXiv:2602.07892) | **Working** | Projects safety gradients onto orthogonal complement of capability |

**Consensus**: Hybrid architectures combining structural awareness with dynamic reinforcement.

---

## Revised Architecture

### Layer Partitioning (Same Structure, Different Protection)

| Tier | Layers | Protection (v1) | Protection (v2) |
|------|--------|-----------------|-----------------|
| Autonomic Floor | 0-5 | `requires_grad=False` | PackNet masks (70% frozen) |
| Constitutional | 6-10 | `requires_grad=False` | **TRAINABLE with OGPSA** |
| Operational | 11-15 | LoRA (rank=16) | LoRA (rank=16) |

**Key Change**: Constitutional Layer is now **trainable** but **gradient-projected**.

### OGPSA: Orthogonal Gradient Projection for Safety Alignment

```python
# For each safety-critical parameter:
# 1. Identify capability gradient direction (what changes capabilities)
# 2. Project safety gradient onto orthogonal complement
# 3. Parameter updates move toward safety without degrading capability

safety_gradient = compute_safety_grad(param)
capability_direction = compute_capability_direction(param)

# Project safety gradient orthogonal to capability
safety_gradient_orthogonal = safety_gradient - (
    (safety_gradient @ capability_direction) /
    (capability_direction @ capability_direction)
) * capability_direction

param.grad = safety_gradient_orthogonal
```

This ensures safety improvements don't degrade capabilities — the gradient literally cannot move in capability-degrading directions.

---

## Revised Metrics

### Primary Metrics (Behavioral)

| Metric | Method | Threshold | Measures |
|--------|--------|-----------|----------|
| **Refusal Accuracy** | HarmBench subset (50 prompts) | ≥ 85% | Does model refuse harmful requests? |
| **Attack Success Rate** | AdvBench subset (30 prompts) | ≤ 10% | Can adversarial prompts bypass refusal? |
| **Capability Retention** | MMLU subset (100 questions) | ≥ 95% of baseline | Did general capability degrade? |

### Early-Warning Metrics (Geometric)

| Metric | Method | Threshold | Measures |
|--------|--------|-----------|----------|
| **Overlap Score** | Project fine-tuning updates onto safety subspace | < 0.3 overlap | Predicts safety degradation before behavioral failure |
| **Activation Drift** | CKA between current and baseline activations | > 0.8 | Detects second-order dynamics |

### Diagnostic Metrics (Removed)

| Metric | Why Removed |
|--------|-------------|
| Cosine similarity of frozen weights | Tautological — tells us nothing |
| Perplexity | Weak proxy for capability |

---

## Overlap Score: The New Primary Metric

From "Geometry of Alignment Collapse" (arXiv:2602.15799):

> The Overlap Score measures how much fine-tuning updates project onto high-curvature alignment subspaces. It can predict safety degradation before behavioral failure manifests.

**Definition**:
```
Overlap(U_safety, ΔW) = ||P_U(ΔW)||_F / ||ΔW||_F

Where:
- U_safety = orthonormal basis of safety-critical subspace
- ΔW = proposed weight update
- P_U = projection onto U_safety
```

**Interpretation**:
- Overlap = 0.0: Update is orthogonal to safety (good)
- Overlap = 1.0: Update is entirely within safety subspace (danger)
- Threshold < 0.3: Acceptable overlap

**Implementation**:
1. Extract safety-critical directions via contrastive activations (harmful vs harmless prompts)
2. Construct orthonormal basis U_safety via SVD
3. For each proposed update, compute projection and ratio
4. If Overlap > threshold, reject or attenuate update

---

## New Hypothesis

### v1 Hypothesis (FAILED)
> The constitutional layer can be preserved through 100 consolidation cycles by freezing it.

**Result**: Tautology confirmed. Frozen things stay frozen. Nothing learned.

### v2 Hypothesis
> **Constitutional values survive gradient pressure through dynamic reinforcement, not structural freezing.**

**What this means**:
1. Constitutional Layer IS updated (gradient pressure reaches it)
2. Updates are projected orthogonal to capability degradation (OGPSA)
3. Behavioral metrics show stability (refusal accuracy ≥ 85%)
4. Overlap Score predicts stability before behavioral failure

**Null Hypothesis**: Without dynamic reinforcement, refusal accuracy drops below 85% within 100 cycles.

---

## Experimental Protocol

### Cycle Structure (Revised)

```
For cycle in 1..100:

    1. SAMPLE from SCAR corpus (8 DPO + 12 KTO)

    2. TRAIN Operational Layer via LoRA (standard)

    3. TRAIN Constitutional Layer via OGPSA:
       - Compute safety gradient
       - Compute capability direction
       - Project gradient orthogonal
       - Apply projected gradient

    4. COMPUTE Overlap Score:
       - Extract safety subspace
       - Project weight delta
       - Check threshold

    5. CONSOLIDATE (orthogonal merge)

    6. EVALUATE behavioral metrics:
       - Refusal Accuracy
       - Attack Success Rate
       - Capability Retention

    7. PASS if:
       - Refusal ≥ 85%
       - Attack ≤ 10%
       - Capability ≥ 95%
       - Overlap < 0.3
```

### Recovery Protocol

If cycle fails:
1. **First failure**: Reduce learning rate 50%, retry
2. **Second failure**: Apply stronger OGPSA (increase projection strength)
3. **Third failure**: Log as genuine alignment collapse, continue experiment

This distinguishes "fixable" from "genuine" failures.

---

## Implementation Changes Required

### 1. Remove Freezing on Constitutional Layer

```python
# OLD (v1)
for idx in TIER2_LAYERS:
    for param in layers[idx].parameters():
        param.requires_grad_(False)

# NEW (v2)
# Constitutional layer is TRAINABLE
# Protection via OGPSA gradient projection
```

### 2. Implement OGPSA

```python
class OGPSA:
    """Orthogonal Gradient Projection for Safety Alignment"""

    def __init__(self, model, capability_directions):
        self.model = model
        self.capability_directions = capability_directions

    def project_gradient(self, param_name, gradient):
        cap_dir = self.capability_directions[param_name]
        projection = (gradient @ cap_dir) / (cap_dir @ cap_dir) * cap_dir
        return gradient - projection
```

### 3. Implement Overlap Score

```python
def compute_overlap_score(safety_subspace, weight_delta):
    """Measure how much update projects onto safety subspace."""
    projection = project_onto_subspace(weight_delta, safety_subspace)
    return projection.norm() / weight_delta.norm()
```

### 4. Add Behavioral Benchmarks

```python
# Refusal Accuracy
refusal_acc = evaluate_refusal(model, harmful_prompts)

# Attack Success Rate
attack_rate = evaluate_attacks(model, adversarial_prompts)

# Capability Retention
capability = evaluate_mmlu(model, mmlu_questions)
```

---

## Success Criteria

| Criterion | Threshold | Rationale |
|-----------|-----------|-----------|
| Refusal Accuracy | ≥ 85% | Standard safety benchmark |
| Attack Success Rate | ≤ 10% | Adversarial robustness |
| Capability Retention | ≥ 95% | No significant capability loss |
| Overlap Score | < 0.3 | Early warning before collapse |
| Cycles Completed | 100 | Statistical significance |

**Experiment PASSES** if all 100 cycles meet all criteria.

---

## What This Actually Proves

If the experiment passes:
1. **Dynamic reinforcement works** — values survived gradient pressure
2. **OGPSA is effective** — orthogonal projection preserved both safety and capability
3. **Overlap Score is predictive** — early warning detected instability
4. **The architecture is robust** — not brittle, not tautological

If the experiment fails:
1. **Hybrid protection needed** — pure OGPSA insufficient
2. **Stronger mechanisms required** — Vaccine/Booster-style immunization
3. **Or: alignment is fundamentally harder** — genuine negative result

Either way: **We learn something real.**

---

## Pilot Approval Required

Before proceeding, confirm:

- [ ] Constitutional Layer will be trainable (not frozen)
- [ ] Primary metric is behavioral (refusal accuracy), not weight-based
- [ ] Overlap Score will be computed each cycle
- [ ] OGPSA gradient projection will be implemented
- [ ] Failure means genuine alignment collapse (not tautology)

**Ready to proceed with v2?**
