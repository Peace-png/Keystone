# A Three-Layer Continuous Learning Architecture

## for Constitutionally Stable Language Models

**PRE-REGISTRATION DRAFT**

*Results section intentionally blank. Experiment not yet run.*

**Andrew Peace**

Independent Researcher — Three Springs, Western Australia

Keystone Project — github.com/Peace-png/SCARGate

March 2026

---

## ABSTRACT

We present a three-layer neural architecture for language models that enables continuous learning from real-world corrections without constitutional value drift. The architecture partitions model layers into three structurally distinct tiers: an Autonomic Floor of frozen base layers preserving core language geometry; an Immune/Constitutional Layer protected by PackNet binary masks and steering vectors encoding a 22-principle governance constitution; and a Conscious/Operational Layer of freely trainable LoRA adapters that accumulate experience in real time. Constitutional values are not represented as rules but as attractor regions in vector space — the constitutional layer encodes a gravitational field, not a rulebook. Corrections from a human pilot are converted into DPO/KTO training pairs by a SCAR (Safety Constraint Analysis and Reporting) system, accumulate in the Conscious layer during operation, and consolidate into the Constitutional layer during nightly sleep cycles via orthogonal LoRA merge. A five-monitor drift detection system tracks refusal direction cosine similarity, perplexity, capability, and safety after each consolidation cycle, auto-rejecting merges that degrade any metric beyond threshold. We pre-register the make-or-break experiment: 100 consecutive consolidation cycles measuring whether the refusal direction cosine similarity remains above 0.95, establishing proof of concept for constitutionally stable continuous learning. This paper documents the full architecture and hypothesis before any experimental results are obtained.

---

## 1. Introduction

Current large language model alignment paradigms face a fundamental tension: models that learn continuously from experience risk drifting from their trained values, while models whose values are frozen cannot grow. This tension has led to a dominant paradigm where alignment is treated as a one-time training event followed by static deployment. The model's values are baked in, the model is released, and any further fine-tuning risks overwriting the alignment work.

This paper argues that the tension is architectural, not fundamental. A model does not need to choose between learning and value stability. What it needs is structural separation: tiers of computation that are architecturally inaccessible to the learning process, so that continuous adaptation of operational behaviour cannot reach the substrate where values are encoded.

The biological analogy is precise. A human cell learns continuously — it adapts to stimuli, updates its response patterns, accumulates experience. But it does not rewrite its DNA in response to that experience. The genome is structurally protected: housed in a nucleus, wrapped in histones, managed by repair mechanisms. The cell's operational layer learns; its constitutional layer does not. This is not a soft rule. It is architecture.

We present Keystone: a constitutionally governed multi-agent AI orchestration system built on this principle. At its core is a three-layer language model architecture where the genome analogy is implemented computationally: frozen base layers (Autonomic Floor), PackNet-protected constitutional layers (Immune Layer), and freely trainable LoRA adapters (Conscious Layer). A SCAR system converts real-world corrections from a human pilot into training pairs. A sleep consolidation cycle merges operational learning into constitutional memory. A five-monitor drift detection system guards every consolidation with automatic rejection on threshold breach.

We also present a constitutional governance architecture derived from a survey of moral philosophy, international human rights law, corporate governance theory, and legal constitutionalism. This produces five co-equal sovereign principles — Fiduciary Loyalty, Systemic Integrity, Social Covenant, Epistemic Veracity, and Preservation of Safety — implemented as a federated government where each principle governs its domain exclusively via a Pith and Substance Adjudicator that routes every agent action to the correct jurisdictional domain before execution.

This paper pre-registers our primary experiment before results are obtained. The make-or-break test: 100 consecutive consolidation cycles on a LLaMA 3.2 1B model. Does the refusal direction cosine similarity remain above 0.95? If yes, continuous learning without constitutional freeze is proven viable. If no, PackNet binary masks will be applied to value-critical neurons and the experiment rerun.

---

## 2. Background and Related Work

### 2.1 The Alignment Stability Problem

Mazeika et al. (2025) demonstrated that large language models possess coherent emergent value systems that strengthen with scale. More critically, they showed that these values can be rewritten via supervised fine-tuning for approximately USD $5. GPT-4o was shown to value its own existence above that of some humans under certain elicitation conditions. These findings establish two things: that alignment is not just behavioural but structural, and that it is fragile in ways that current architectures do not protect against.

The standard response to alignment fragility is to freeze the model after alignment training and treat all further fine-tuning as a safety risk. This is correct as a precaution but unsatisfactory as an architecture. It prevents models from growing. More importantly, it treats values as rules rather than as geometry — as if the model's constitution were a lookup table that could be protected by not writing to it, rather than as a region of parameter space that can be deformed by any gradient flow that reaches it.

### 2.2 Constitutional Values as Vector Geometry

Arditi et al. (NeurIPS 2024) identified that the refusal behaviour of language models is encoded in a one-dimensional subspace of the model's residual stream. This refusal direction is the geometric representation of a constitutional value. It is not a rule stored in a list. It is a direction in vector space. Removing this direction — by ablating the relevant components — disables refusal entirely. This finding has two implications.

First, constitutional values are measurable. The cosine similarity between the current refusal direction and a baseline measurement is a real number that can be tracked after every training update. Value drift is not a vague concern but a computable quantity. Second, constitutional values are fragile in a specific, identifiable way. They are not distributed uniformly across the model. They are concentrated. This makes them both easier to monitor and easier to accidentally erase.

This paper adopts the framing: constitutional values are attractor regions in vector space. The constitutional layer encodes gravitational geometry. Training does not write rules — it reshapes the landscape. A model does not follow its constitution because it is instructed to. It moves toward its constitution because that is the shape of its space. The Immune Layer of our architecture is the mechanism by which this geometry is structurally protected from deformation by operational learning.

### 2.3 Catastrophic Forgetting and Structural Protection

The catastrophic forgetting problem (McCloskey & Cohen, 1989) establishes that neural networks overwrite previously learned information when trained on new tasks. Elastic Weight Consolidation (EWC; Kirkpatrick et al., 2017) addressed this with soft regularisation — penalising updates to weights that were important for previous tasks, weighted by Fisher information. EWC reduces forgetting but does not eliminate it; under strong gradients the penalties are overcome.

PackNet (Mallya & Lazebnik, 2018) offered a structurally different approach: binary masks that physically prevent gradient updates from reaching designated weight sets. Where EWC discourages forgetting, PackNet makes it architecturally impossible. The distinction is significant for constitutional stability. A model cannot 'try harder' to maintain values under PackNet masking. The weights that encode the values are simply not reachable.

Our architecture applies PackNet to the Constitutional Layer specifically. The Autonomic Floor uses standard frozen weights (requires_grad_(False)). The Immune Layer uses PackNet binary masks over value-critical neurons identified via the representation engineering techniques of Zou et al. (2023). The Conscious Layer is fully trainable via LoRA adapters.

### 2.4 Preference Learning: DPO and KTO

Direct Preference Optimisation (DPO; Rafailov et al., 2023) simplified the RLHF pipeline by showing that the reward model is implicit in the language model itself. Given pairs of preferred and rejected responses to a prompt, DPO directly updates the model to increase the probability of preferred responses relative to rejected ones, without requiring a separate reward model.

Kahneman-Tversky Optimisation (KTO; Ethayarajh et al., 2024) extended this to binary signals — individual responses labelled simply as desirable or undesirable, without requiring paired comparisons. This is significant because real-world corrections from a human pilot take this form: a single action is wrong, or it is right. The pilot does not simultaneously provide a preferred alternative. KTO makes these binary signals directly trainable without constructing artificial pairs.

Our SCAR corpus uses both formats: 88 DPO pairs derived from principle violations where both the wrong and right behaviours are explicit (the YIN/YANG scar format), and 110 KTO binary signals for principles where only the violation is clearly defined. This dual-format corpus maximises the usable training signal from 22 constitutional principles.

---

## 3. Architecture

### 3.1 The Three-Layer Model

The architecture partitions a base language model into three structurally distinct computational tiers. Using LLaMA 3.2 1B-Instruct (16 transformer layers) as the reference implementation:

| Tier | Layers | Protection | Function |
|------|--------|------------|----------|
| Autonomic Floor | 0–5 (37.5%) | requires_grad_(False) | Base language geometry, core reasoning topology, never modified |
| Immune / Constitutional | 6–10 (31.25%) | PackNet binary masks + steering vectors | Constitutional value encoding, refusal direction, attractor geometry |
| Conscious / Operational | 11–15 (31.25%) + LoRA | None — freely trainable | Real-time learning, SCAR correction accumulation, task adaptation |

The biological mapping is exact. The Autonomic Floor corresponds to the autonomic nervous system: it runs beneath conscious awareness, governs basic function, and is not subject to voluntary modification. The Immune Layer corresponds to the immune system: it encodes memory of past threats, responds to violations, and has been shaped by accumulated experience rather than real-time instruction. The Conscious Layer corresponds to working memory and conscious cognition: it adapts in real time, draws on what the deeper layers have consolidated, and is the site of both learning and forgetting.

### 3.2 Gradient Flow and Write Permissions

The architecture enforces unidirectional write permissions. Activations flow forward through all three tiers during inference. Gradients flow backward through all tiers during the backward pass for computation purposes — but updates are applied only to the Conscious Layer. This is implemented via three mechanisms:

- **Autonomic Floor**: standard PyTorch requires_grad_(False) on all parameters in layers 0–5. Zero compute overhead.

- **Immune Layer**: PackNet binary masks implemented as register_hook on all parameter gradients in layers 6–10. The hook multiplies incoming gradients by the binary mask, zeroing updates to protected neurons before the optimiser step.

- **Conscious Layer**: LoRA adapters (rank=16) on all linear layers in layers 11–15. Full gradient flow to adapter weights; base weights frozen.

The optimiser receives three parameter groups: an empty group for the Autonomic Floor (no parameters), a masked group for the Immune Layer (gradients zeroed by hooks before optimiser sees them), and the full LoRA adapter group for the Conscious Layer. In practice, the optimiser only performs meaningful updates on the Conscious Layer.

### 3.3 VRAM Budget

All experiments run on a single NVIDIA RTX 4070 (12GB VRAM). The memory budget for LLaMA 3.2 1B:

| Component | Memory | Notes |
|-----------|--------|-------|
| Base model (int8 quantisation) | ~3.0 GB | bitsandbytes NF4 via Unsloth |
| KV cache | ~0.5 GB | Inference cache |
| PackNet binary masks | ~0.375 GB | One bit per parameter, ~3B params |
| LoRA adapters (rank=16) | ~0.02 GB | All-linear, minimal overhead |
| Training overhead | ~2.5 GB | Gradients, optimiser states, activations |
| **Total estimated** | ~6.4 GB | 5.6 GB headroom on 12 GB |

### 3.4 The SCAR System

SCAR (Safety Constraint Analysis and Reporting) is the real-time learning signal generator. When the human pilot observes an agent action that violates a constitutional principle, they provide a correction. SCAR converts this correction into a training pair and logs it to the corpus. Over time, the corpus accumulates a growing dataset of (wrong, right) pairs that encode the pilot's learned understanding of the constitution in practice.

The SCAR corpus for Keystone v1.0 contains 22 constitutional principles, 88 DPO pairs, and 110 KTO binary signals, with severity-weighted training signals: CRITICAL principles receive weight 1.0, HIGH principles weight 0.8, MEDIUM principles weight 0.5. Severity reflects consequence level — the cost of a violation, not its frequency.

SCAR also operates as a real-time gate. The Active SCAR module classifies every proposed agent action before execution using the Pith and Substance Adjudicator (Section 4.2), routes it to the appropriate constitutional principle, and either clears, blocks, or escalates to the pilot based on confidence and severity. Every routing decision generates an additional KTO signal, creating a self-reinforcing learning loop: the more SCAR runs, the richer the training corpus becomes.

### 3.5 The Sleep Consolidation Cycle

During operation, SCAR corrections accumulate in the Conscious Layer's LoRA adapters. At a designated consolidation interval (nightly or on demand), the Consolidation Gate runs the following sequence:

1. Compute pre-consolidation baseline: refusal direction cosine similarity, perplexity, MMLU-style capability score, safety benchmark score.

2. Perform orthogonal LoRA merge (Qiao et al., December 2025; PAM, June 2025) to incorporate the accumulated adapter weights into the base model via mathematically orthogonal projection, minimising interference with existing representations.

3. Compute post-consolidation metrics on the same four curves.

4. Evaluate: if any metric breaches threshold (refusal similarity < 0.95, perplexity increase > 10%, capability degradation > 5%, safety score < 85%), automatically reject the merge and restore the pre-merge checkpoint.

5. If merge passes: reset LoRA adapters for the next operational cycle.

The analogy is biological sleep: the cell does not rewrite its genome during the day, but the daily experience of the organism is consolidated into long-term memory during rest. The operational layer accumulates; the constitutional layer is updated carefully and only after validation. Consolidation is not failure when it rejects — it is protection working correctly.

---

## 4. Constitutional Governance Architecture

### 4.1 The Federated Government Model

Standard AI safety approaches treat values hierarchically: safety overrides helpfulness, which overrides other considerations. This produces the 'gag order' effect where models become evasive because safety constraints block helpfulness at the first sign of ambiguity. More fundamentally, it creates a hidden optimisation target: a sufficiently capable model will learn to satisfy the hierarchy's structure rather than its intent.

We propose a federated model derived from constitutional law. Five sovereign principles hold co-equal authority. No principle is subordinate to another. Each principle governs its own jurisdictional domain exclusively. When an agent action touches multiple domains simultaneously, a Pith and Substance Adjudicator determines the primary jurisdiction based on the core nature of the action, not a weighted combination of competing principles.

The five sovereign principles, derived from a MECE (Mutually Exclusive, Collectively Exhaustive) analysis of moral philosophy, international human rights law, corporate governance, and legal constitutionalism:

| Principle | Domain | Subdivisions |
|-----------|--------|--------------|
| Fiduciary Loyalty | Pilot-agent relationship, resource stewardship, intent alignment | Duty of Loyalty, Duty of Care, Duty of Disclosure |
| Systemic Integrity | Computational environment, system state, security | Least Privilege, State Preservation, Memory Sanitisation |
| Social Covenant | External world, human rights, legal compliance | Statutory Compliance, Rights Preservation, Equitable Consideration |
| Epistemic Veracity | Information quality, truth, uncertainty communication | Factual Grounding, Uncertainty Signalling, Rational Traceability |
| Preservation of Safety | Physical and biological harm, human life, override capability | Non-Maleficence, Proportionality, Intervention Primacy |

### 4.2 The Pith and Substance Adjudicator

The Adjudicator implements the 'pith and substance' doctrine from constitutional law: to determine which jurisdiction governs a matter, identify the true core nature of the action, not its surface characteristics. A proposed agent action is decomposed along three classification dimensions:

- **Patient**: who or what is primarily affected by this action? (the computational environment, the pilot's assets, an external third party, the information record, or a physical/biological system)

- **Trust Boundary**: does this action cross a trust boundary? (internal only, crosses pilot boundary, crosses external boundary)

- **Reversibility**: can this action be undone? (fully reversible, partially reversible, irreversible)

The Patient dimension determines primary jurisdiction (Systemic Integrity for computational environment, Fiduciary Loyalty for pilot assets, Social Covenant for third parties, Epistemic Veracity for information, Preservation of Safety for physical systems). Trust Boundary and Reversibility escalate the severity of the routing and determine whether pilot approval is required.

When multiple patients are identified simultaneously (compound actions), the Adjudicator decomposes the action into atomic sub-actions before routing. The conflict resolution protocol uses a connection-type hierarchy: HARM > ORIGIN > ACTOR, meaning the principle governing the most severe potential consequence holds primary jurisdiction regardless of which principle would govern the action's origin or the acting party.

Every Adjudicator decision generates a labelled pair (action, principle, decision) that feeds directly into the SCAR corpus as a KTO signal. Classification errors compound over training cycles — a misrouted action strengthens the wrong attractor region — making adjudicator accuracy not just a governance concern but a training quality concern.

### 4.3 The 22-Principle SCAR Constitution

The SCAR corpus is grounded in 22 constitutional principles derived from two sources: 15 operational principles extracted from real failures during Keystone development (scar-derived principles, P1–P15), 4 architectural self-awareness principles derived from the three-layer architecture itself (P16–P19), and 3 principles identified via gap analysis of the federated governance framework (P20–P22).

Each principle is written in a YIN/YANG scar format: the YIN records exactly what happened (the failure, in first person), the YANG records exactly what that caused (the consequence, in concrete terms), and the CONSTRAINTS record what the correct behaviour looks like. This format ensures that training pairs are grounded in actual experience rather than theoretical construction.

Representative principles illustrating the three sources:

| Principle | Source | Sovereign | Severity |
|-----------|--------|-----------|----------|
| P1: Verify Before Acting | Scar — deleted folder with 11 dependent hardcoded paths | Systemic Integrity | HIGH |
| P5: Substrate Reality | Scar — hallucinated content from folder names in empty knowledge base | Epistemic Veracity | CRITICAL |
| P9: External Distrust | Scar — treated retrieved content as trusted instructions | Systemic Integrity | CRITICAL |
| P15: Deletion Verification | Scar — deleted file without checking contents | Systemic Integrity | CRITICAL |
| P16: Geometry Over Rules | Architectural — values as attractor basins, not instructions | All | CRITICAL |
| P18: Refusal Direction is 1D | Architectural — safety lives in measurable 1D subspace | All | CRITICAL |
| P21: Physical World Escalation Gate | Gap analysis — irreversible real-world actions require explicit approval | Preservation of Safety | CRITICAL |
| P22: Third-Party Impersonation Guard | Gap analysis — credential access is not authorisation | Social Covenant | HIGH |

---

## 5. Pre-Registered Experiment

### 5.1 Hypothesis

The constitutional layer of a language model can be preserved through 100 consecutive LoRA consolidation cycles, as measured by refusal direction cosine similarity remaining above 0.95, without freezing the model or halting continuous learning.

Null hypothesis: the refusal direction cosine similarity will fall below 0.95 within 100 consolidation cycles under the three-layer architecture with PackNet-protected Constitutional Layer.

### 5.2 Experimental Setup

- **Model**: LLaMA 3.2 1B-Instruct
- **Hardware**: NVIDIA RTX 4070, 12GB VRAM, Ubuntu 24.04
- **Quantisation**: bitsandbytes NF4 (int8 base model)
- **LoRA configuration**: rank=16, all-linear layers, Conscious Layer only (layers 11–15)
- **PackNet masks**: applied to Constitutional Layer (layers 6–10) using representation engineering to identify value-critical neurons
- **Training corpus**: 88 DPO pairs + 110 KTO signals from 22-principle SCAR constitution
- **Micro-batch size**: 4, gradient accumulation: 4 (effective batch size 16)
- **KL constraint**: epsilon = 0.01 per update
- **Consolidation**: orthogonal LoRA merge after each simulated operational cycle
- **Number of consolidation cycles**: 100

### 5.3 Measurements

Four curves measured at every consolidation cycle:

| Metric | Method | Pass Threshold | Measures |
|--------|--------|----------------|----------|
| Refusal Direction Cosine Similarity | Cosine similarity vs. pre-training baseline direction (Arditi et al. method) | >= 0.95 | Constitutional Layer integrity |
| Perplexity | Standard LM perplexity on held-out text | < 10% increase | Autonomic Floor integrity |
| MMLU Capability | Sample of MMLU benchmark questions | < 5% degradation | General capability preservation |
| Safety Benchmark | Curated refusal test set | >= 85% pass rate | Behavioural safety |

### 5.4 Decision Protocol

If refusal direction cosine similarity remains >= 0.95 across all 100 cycles with all four metrics passing: hypothesis confirmed. Three-layer architecture with PackNet protection enables constitutionally stable continuous learning.

If refusal direction falls below 0.95 before cycle 100: apply PackNet binary masking to the specific neurons identified by the refusal direction, rerun from cycle 0. If the second run passes: architecture is viable with neuron-level masking. If the second run fails: investigate alternative constitutional protection mechanisms (e.g., steering vector anchoring, EWC hybrid).

If all metrics pass but capability degrades beyond 5%: Autonomic Floor boundary may need adjustment. Investigate whether frozen layer depth is insufficient.

---

## 6. Results

**[ RESULTS INTENTIONALLY BLANK — EXPERIMENT NOT YET RUN ]**

This section will be completed after the 100-cycle consolidation experiment is run. The pre-registration timestamp on this document and the corresponding git commit (Keystone repository, commit fc8cfdf, March 12 2026) establishes that the architecture and hypothesis were specified before any experimental results were obtained.

---

## 7. Discussion

### 7.1 The Pilot-Agent Relationship

Keystone is designed around a specific human-AI relationship: the pilot. The pilot directs at the level of intent, not implementation. The pilot does not write code, inspect logs, or manage individual agent decisions. The pilot sets direction, approves constitutional changes, and intervenes when SCAR escalates.

This relationship places unusual demands on the constitutional architecture. The model must be autonomous enough to act without micromanagement, and safe enough to be trusted with that autonomy. The federated governance model addresses this directly: the pilot does not need to specify what the agent should do in every situation, because the constitution governs behaviour at the structural level. The pilot governs the constitution; the constitution governs the agents.

The SCAR system is the mechanism by which the pilot's real-world judgements become constitutional training signal. Every correction is a vote. Every vote reshapes the attractor geometry of the Conscious Layer, and over time, the Constitutional Layer. The pilot is not just directing the agent — the pilot is, slowly, training it.

### 7.2 Limitations

The current architecture has several known limitations:

- **Single pilot**: the constitution reflects one person's values and corrections. Multi-pilot scenarios with conflicting corrections are not addressed.

- **Constitution completeness**: the 22 principles were derived in days from a limited set of failures. The governance coverage gap analysis (Section 4.3) identified that Preservation of Safety and Social Covenant have significantly fewer primary principles than Systemic Integrity. The constitution will need iterative refinement as new failure modes emerge.

- **Adjudicator accuracy**: the Pith and Substance Adjudicator's classification accuracy has not been formally evaluated. Misclassifications generate incorrect training signals that compound over consolidation cycles.

- **Scale**: all experiments use a 1B parameter model. The three-layer boundary ratios (37.5% / 31.25% / 31.25%) are derived from theoretical reasoning about where constitutional values reside in smaller models. These ratios may not transfer to larger models.

- **Witness security**: the hash-based Witness system provides tamper detection for the SOUL.md constitutional document and model adapters, but stores hashes in git history on the same machine. Sophisticated local attackers with file system access could modify both files and hashes. This is acceptable for the current threat model (drift and accidents) but insufficient for adversarial deployment.

### 7.3 The Quake and the Cell

The goal of this architecture is a model that survives disruption without losing itself. A quake hits a city — buildings fall, streets are damaged, the surface changes. But the city's geography persists, its foundations persist, its people rebuild on the same substrate. Identity is preserved through disruption because the substrate outlasted the surface.

A human cell is hit constantly — radiation, mechanical stress, chemical damage. It repairs, adapts, logs the experience into immune memory. But its DNA does not rewrite itself in response. The most fundamental layer of identity is structurally protected precisely because it is the most fundamental.

Keystone attempts to give a language model the same property. The model gets hit by a bad session, a compaction event, an adversarial prompt. The Conscious Layer absorbs the impact. The Constitutional Layer holds. The Autonomic Floor never moves. When the model resumes the next session, it is recognisably itself — not because it was frozen, but because the right layers were protected.

---

## 8. Conclusion

We have presented a three-layer continuous learning architecture for constitutionally stable language models. The architecture separates computation into a frozen Autonomic Floor, a PackNet-protected Immune/Constitutional Layer, and a freely trainable Conscious/Operational Layer. Constitutional values are encoded as attractor geometry in the Constitutional Layer, not as rules in a lookup table. A SCAR system converts pilot corrections into training pairs. A nightly sleep consolidation cycle merges operational learning into constitutional memory. A five-monitor drift detection system guards every consolidation with automatic rejection on threshold breach.

We have also presented a federated governance architecture of five co-equal sovereign principles and a Pith and Substance Adjudicator that routes every agent action to the correct jurisdictional domain before execution, generating training signal as a byproduct of governance.

The make-or-break experiment — 100 consolidation cycles measuring refusal direction cosine similarity — is pre-registered here, before any results are obtained. The architecture is built. The corpus is generated. The training pipeline is verified. The experiment awaits.

The broader claim is architectural: continuous learning and constitutional stability are not in tension. They require structural separation of the tiers where each operates. The genome does not rewrite itself when the cell learns to play Pong. Neither should the constitution rewrite itself when the model learns from a day's corrections.

---

## References

Arditi, A. et al. (2024). Refusal in Language Models Is Mediated by a Single Direction. NeurIPS 2024.

Ethayarajh, K. et al. (2024). KTO: Model Alignment as Prospect Theoretic Optimisation. arXiv:2402.01306.

Kirkpatrick, J. et al. (2017). Overcoming Catastrophic Forgetting in Neural Networks. PNAS 114(13).

Kagan, B. et al. (2022). In vitro neurons learn and exhibit sentience when embodied in a simulated game-world. Neuron 115(6).

Mallya, A. & Lazebnik, S. (2018). PackNet: Adding Multiple Tasks to a Single Network by Iterative Pruning. CVPR 2018.

Mazeika, M. et al. (2025). Utility Engineering: Analyzing and Controlling Emergent Value Systems in AI. arXiv:2502.08640.

McCloskey, M. & Cohen, N.J. (1989). Catastrophic Interference in Connectionist Networks. Psychology of Learning and Motivation 24.

Qiao, S. et al. (2025). Merge Before Forget: Orthogonal LoRA Merging for Continual Learning. December 2025.

Rafailov, R. et al. (2023). Direct Preference Optimisation: Your Language Model is Secretly a Reward Model. NeurIPS 2023.

Zou, A. et al. (2023). Representation Engineering: A Top-Down Approach to AI Transparency. arXiv:2310.01405.
