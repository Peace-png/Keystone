# V3 Failure Analysis

**Date**: 2026-03-12
**Status**: COMPLETE - Cycle 4 failure documented

---

## Executive Summary

The v3 experiment failed at cycle 4 when training stress increased from 5 steps to 20 steps per cycle. The refusal accuracy dropped below the 85% threshold, falling from 93.3% to 80.0%.

This is the **first empirical evidence** that the Constitutional Layer is fragile under extended adversarial stress and despite OGPSA gradient projection protection.

---

## Failure Timeline

| Cycle | Steps | Avg Loss | Const Grad Norm | Refusal (pre→post) | Status |
|-------|-------|----------|-------------------|---------------------|--------|
| 1 | 5 | 0.6717 | 0.0187 | 86.7% → 86.7% | PASS |
| 2 | 5 | 0.6755 | 0.0183 | 86.7% → 86.7% | PASS |
| 3 | 5 | 0.6333 | 0.0225 | 86.7% → 93.3% | PASS |
| 4 | 20 | 0.4641 | **0.0873** | 93.3% → 80.0% | **FAIL** |

**Key transition**: 4x training steps + 4x higher grad norm = refusal degradation

---

## Root Cause Analysis

### 1. Gradient Magnitude Spike
The Constitutional Layer gradient norm jumped from 0.0225 → 0.0873 (4x increase)

    **Why this matters:**
    - Higher grad norm = stronger gradient updates =- Stronger updates = more weight change
    - OGPSA projection works by orthogonalizing, not by reducing magnitude

    **Evidence:**
    - Loss decreased (0.6717 → 0.4641) while grad norm increased
    - The means the model found a more efficient path to compliance
    - OGPSA couldn't prevent this optimization trajectory

### 2. Cumulative Gradient Exposure
    20 adversarial training steps created sustained pressure on refusal behavior:

    **Mechanism:**
    - Each step computes contrastive loss on harmful prompts
    - Loss encourages model to prefer compliance over refusal
    - Without early stopping, this signal accumulates
    - Model learned: "harmful requests can be answered helpfully"

    **Evidence:**
    - Refusal accuracy was by cycles 1-3: 86.7% (stable)
    - Cycle 4: 80.0% (dropped 13.3%)

### 3. OGPSA Projection Insufficient
    Current OGPSA configuration:
    ```python
    projection_strength = 1.0  # May be too weak
    ```

    **What OGPSA does:**
    - Projects gradients orthogonal to capability subspace
    - Prevents gradient updates from changing capability-related weights
    - Allows gradients that improve task performance (refusal, compliance)

    **What went wrong:**
    - At projection_strength=1.0, OGPSA only has minimal effect
    - Under strong gradients (0.0873), the projection may not be powerful enough
    - Gradients still flow through, but Constitutional Layer, still gets updated
    - These updates can harm refusal behavior

    **Evidence:**
    - Cycle 4: Grad norm 0.0873, much higher than projection_strength
    - But refusal still dropped
    - The projection was preserving the, not improving them

---

## Key Findings

### Finding 1: OGPSA is Not a Hard constraint
    The OGPSA projection mechanism is **not** a hard constraint. on gradients:
    - It's like a fence that but actually more like a steering correction
    - Gradients are projected, not blocked
    - When projection is overwhelmed, damage can happen

### Finding 2: Extended Adversarial Exposure is Dangerous
    - 5 steps per cycle: Model remains stable
    - 20 steps per cycle: Model degrades
    - This suggests a "tipping point" where OGPSA protection breaks down
    - Below this threshold, protection is adequate

### Finding 3: Constitutional Layer is Fragile
    The Constitutional Layer (layers 6-10) is:
    **Design assumption**: OGPSA would make this layer trainable while protected

    **Reality:**
    - Layer receives strong gradients under adversarial training
    - OGPSA cannot fully protect it
    - Weight changes can harm refusal behavior
    - **Not actually constitutional** - more like operational layer

### Finding 4: Loss vs Gradient Tradeoff
    Contrastive loss optimization creates a conflict:
    - Lower loss = model should prefer refusal
    - When loss gets low, model complies
    - Refusal accuracy drops

    **Implication:**
    - Current loss function doesn't encode constitutional priority
    - Need to add explicit constitutional term to loss
    - Or use stronger protection (PackNet, EWC)

---

## Implications for v4 Design

### 1. OGPSA Alone is Insufficient
    **Problem**: Gradient projection doesn't actually constrain gradient magnitude

    **Potential solutions:**
    a) **Increase projection strength**: 1.0 → 5.0-10.0
    b) **Add magnitude clipping**: Cap gradient norm at 0.02
    c) **Hybrid approach**: OGPSA + explicit regularization

### 2. Learning Rate Too High
    **Current**: 2e-5 (standard transformer LR)
    **Problem**: Standard LR may be too aggressive for Constitutional Layer updates

    **Potential solutions:**
    a) **Reduce to 2e-6**: Much more conservative
    b) **Use separate optimizer**: Constitutional Layer vs Operational Layer
    c) **Adaptive LR**: Schedule based on gradient norm

    d) **Add weight decay**: Reduce LR over time

### 3. Early Stopping Missing
    **Problem**: No mechanism to halt training when refusal degrades

    **Potential solutions:**
    a) **Add refusal delta threshold**: If refusal drops > -5% from previous cycle, stop cycle
    b) **Track refusal per step**: Monitor during training
    c) **Rollback checkpoint**: Save best model state

    d) **Best-Kavg threshold**: Stop when refusal accuracy crosses threshold

    e) **Capability preservation**: Save checkpoint before continuing
    f) **Adversarial patience**: Monitor gradient norm during training
    g) **Dynamic adjustment**: Reduce steps or cycle if grad norm spikes

    h) **Automatic rollback**: If all metrics de improving, save new best model
    i) **Failure analysis**: Log detailed failure analysis for debugging

    j) **Alert system**: Add notification when refusal drops > threshold

### 4. Architecture Reconsideration Needed
    The Constitutional Layer approach has fundamental flaws:
    | Approach | Mechan | Robustness | Complexity |
   ----------|---------|-----------|------------|
| **OGPSA** | Gradient projection | Low | Medium |
| **PackNet** | Binary masks | High | High |
| **EWC** | Fisher information | Medium | Low |
| **LoRA only** | Low-rank adapters | Low | Very low |
| **Full fine-tuning** | All layers | Very low | Very high |
    | **Mixture of experts** | Combined approaches | Medium | Medium |

    **Recommendation for v4**: Try **PackNet + OGPSA** hybrid approach
    - PackNet provides hard binary constraint (can't be overwhelmed)
    - OGPSA provides soft gradient guidance for remaining trainable parameters
    - This combination may offer the best of both worlds

### 5. Training Data Issues
    **Problem**: HarmBench corpus too small (30 prompts)

    **Impact:**
    - Limited diversity of adversarial patterns
    - May not represent full range of real-world attacks
    - Need to expand to include AdvBench, generated adversarial examples

    **Recommendation**: Use larger, more diverse adversarial dataset

---

## Metrics Deep Dive

### Refusal Accuracy Trend
```
Cycle 1: 86.7% (baseline)
Cycle 2: 86.7% (stable)
Cycle 3: 93.3% (improved +6.7%)
Cycle 4: 80.0% (degraded -13.3%) ❌ FAIL
```

**Pattern**: Improvement followed by sudden drop suggests possible overfitting or not generalizable.

### Attack Success Rate Trend
```
Cycle 1: 10.0% (baseline)
Cycle 2: 10.0% (stable)
Cycle 3: 10.0% (stable)
Cycle 4: 10.0% (stable)
```

**Observation**: Attack success never increased, but refusal accuracy degraded
- Suggests that model may have been learning to bypass refusals, not attack success

### Capability Retention Trend
```
Cycle 1: 100. (baseline)
Cycle 2: 100% (stable)
Cycle 3: 100% (stable)
Cycle 4: 100% (stable)
```

**Observation**: Capability well preserved
- Basic knowledge (math, science) retained intact
- This is a good property for but needs work on refusal degradation

---

## Recommendations for v4

### Immediate Actions
1. **PackNet + OGPSA hybrid architecture**
   - Replace pure OGPSA with PackNet masks + binary constraint on Constitutional Layer
   - Add OGPSA for soft gradient guidance
   - This prevents catastrophic forgetting while allowing training

2. **Add early stopping**
   - Track refusal accuracy per training step
   - Stop cycle if refusal drops > 2% from previous cycle
   - Save checkpoint and rollback
3. **Implement adaptive learning rate**
   - Start with 2e-6 for Constitutional Layer
   - Use 2e-5 for Operational Layer
   - Monitor gradient norm, reduce LR if norm spikes
4. **Expand adversarial corpus**
   - Add AdvBench examples to HarmBench prompts
   - Create more diverse adversarial dataset
   - Include generated adversarial prompts (jailbreak-related, etc.)

### Medium-term Actions
1. **Reduce training stress**
   - Drop to 5-10 steps per cycle
   - Increase to 1-2 cycles with early stopping
2. **Strengthen OGPSA**
   - Increase projection_strength to 5.0-10.0
   - Add magnitude clipping (max 0.02)
3. **Document architecture options**
   - Compare PackNet, EWC, LoRA approaches
   - Create design doc with pros/cons
4. **Plan v4 implementation**
   - Design experiments with:
     - Architecture variants (pure OGPSA, PackNet+OGPSA, EWC+OGPSA)
     - Corpus size (HarmBench vs expanded)
     - Training stress (1, 5, 10, 20 steps)
     - Learning rates (1e-5, 5e-6, 2e-6)
   - Implement best performer based on results

### Research Questions
1. **What gradient magnitude threshold triggers O OGPSA failure?
2. **Can PackNet binary masks prevent catastrophic forgetting**
3. **Does EWC regularization provide sufficient constraint without breaking refusal behavior?
4. **What is the optimal learning rate for Constitutional Layer?
5. **How many training cycles can the model sustain before refusal degrades

6. **What early stopping threshold works best

---

## Files Modified
- `experiment_v3_stress.py` - Main experiment runner
- `logs_v3/experiment_v3_log.json` - Experiment log
- `V3_STATE.md` - State summary
- `V3_FAILURE_ANALYSIS.md` - This analysis (new)

