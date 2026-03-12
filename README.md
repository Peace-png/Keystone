# Keystone

**A Three-Layer Continuous Learning Architecture for Constitutionally Stable Language Models**

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python 3.10+](https://img.shields.io/badge/python-3.10+-blue.svg)](https://www.python.org/downloads/)
[![Pre-Registered](https://img.shields.io/badge/experiment-pre--registered-orange.svg)](./PAPER.md)

---

## Overview

Keystone is a constitutionally governed AI architecture that enables **continuous learning without value drift**. The key insight is architectural, not algorithmic: by structurally separating computation into tiers with different write permissions, a model can learn from experience while its constitutional values remain protected from the learning process itself.

```
┌─────────────────────────────────────────────────────────────┐
│                    CONSCIOUS LAYER                          │
│              (Layers 11-15 + LoRA adapters)                 │
│                                                             │
│   • Freely trainable — accumulates real-time corrections    │
│   • SCAR signals accumulate here during operation           │
│   • Consolidates to Constitutional layer during "sleep"     │
└─────────────────────────────────────────────────────────────┘
                              ↑
                         [Gradient Updates]
                              ↑
┌─────────────────────────────────────────────────────────────┐
│                   CONSTITUTIONAL LAYER                      │
│            (Layers 6-10 + PackNet Binary Masks)             │
│                                                             │
│   • Protected by binary masks — architecturally unreachable │
│   • Encodes 22 constitutional principles as attractors      │
│   • Refusal direction lives here (1D subspace)              │
└─────────────────────────────────────────────────────────────┘
                              ↑
                       [No Updates Possible]
                              ↑
┌─────────────────────────────────────────────────────────────┐
│                    AUTONOMIC FLOOR                          │
│                  (Layers 0-5, Frozen)                       │
│                                                             │
│   • requires_grad=False — never modified                    │
│   • Base language geometry, core reasoning topology         │
│   • Survives all disruption intact                         │
└─────────────────────────────────────────────────────────────┘
```

## Key Contributions

1. **Three-Layer Architecture**: Structural separation of Autonomic (frozen), Constitutional (masked), and Operational (trainable) computation tiers

2. **Federated Governance**: Five co-equal sovereign principles (Fiduciary Loyalty, Systemic Integrity, Social Covenant, Epistemic Veracity, Preservation of Safety) with a Pith and Substance Adjudicator

3. **SCAR Corpus**: 22 constitutional principles derived from real failures, encoded as 88 DPO pairs + 110 KTO binary signals

4. **Drift Monitoring**: Five-curve system tracking refusal direction cosine similarity, perplexity, capability, and safety with auto-reject on threshold breach

5. **Pre-Registered Experiment**: 100-cycle consolidation experiment with hypothesis specified before results obtained

## Architecture

### Layer Partitioning (LLaMA 3.2 1B Reference)

| Tier | Layers | Protection | Function |
|------|--------|------------|----------|
| Autonomic Floor | 0–5 (37.5%) | `requires_grad_(False)` | Base language geometry, never modified |
| Constitutional | 6–10 (31.25%) | PackNet binary masks | Value encoding, refusal direction |
| Operational | 11–15 (31.25%) | LoRA (rank=16) | Real-time learning, SCAR accumulation |

### Gradient Flow

- **Autonomic**: Zero compute overhead, standard PyTorch freezing
- **Constitutional**: `register_hook` multiplies gradients by binary mask before optimiser step
- **Operational**: Full gradient flow to LoRA adapters; base weights frozen

## Federated Governance

Five co-equal sovereign principles govern agent behavior:

| Principle | Domain |
|-----------|--------|
| **Fiduciary Loyalty** | Pilot-agent relationship, intent alignment |
| **Systemic Integrity** | Computational environment, security |
| **Social Covenant** | External world, human rights, legal compliance |
| **Epistemic Veracity** | Information quality, truth |
| **Preservation of Safety** | Physical/biological harm, override capability |

Each principle governs its jurisdiction exclusively. The **Pith and Substance Adjudicator** routes actions to the correct jurisdiction using three classification dimensions:
- **Patient**: Who/what is primarily affected
- **Trust Boundary**: Does this cross a trust boundary?
- **Reversibility**: Can this action be undone?

## Installation

```bash
# Clone the repository
git clone https://github.com/Peace-png/Keystone.git
cd Keystone

# Create virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install torch transformers accelerate bitsandbytes peft

# Verify installation
python verify_all.py
```

## Quick Start

```python
from daemon import KeystoneDaemon, DaemonConfig
from active_scar import ActiveSCAR
from witness import Witness

# Initialize daemon with 5-second heartbeat
config = DaemonConfig(heartbeat_interval_seconds=5.0)
daemon = KeystoneDaemon(config)

# Initialize SCAR system
scar = ActiveSCAR()

# Initialize Witness for hash verification
witness = Witness(repo_root=".")

# Attach components to daemon
daemon.set_active_scar(scar)
daemon.set_witness(witness)

# Run single heartbeat
daemon.run_single_heartbeat()

# Check status
print(daemon.get_status())
```

## Verification

Each phase has a dedicated verification script:

```bash
python verify_phase1.py  # Foundation layer
python verify_phase2.py  # SCAR corpus
python verify_phase3.py  # Training pipeline
python verify_phase4.py  # Active SCAR
python verify_phase5.py  # Drift monitor
python verify_phase6.py  # Witness
python verify_phase7.py  # Daemon loops

# Or run all at once
python verify_all.py
```

## Project Structure

```
Keystone/
├── PAPER.md                    # Pre-registration paper
├── README.md                   # This file
├── three_layer_architecture.py # Core architecture implementation
├── scar_corpus.py              # SCAR training corpus (22 principles)
├── training_pipeline.py        # DPO/KTO training pipeline
├── active_scar.py              # Real-time SCAR matching
├── drift_monitor.py            # Five-curve drift detection
├── witness.py                  # Hash-based verification
├── daemon.py                   # Runtime loops (5-sec heartbeat)
├── lora_setup.py               # LoRA adapter configuration
├── verify_*.py                 # Phase verification scripts
└── docs/
    └── images/
        ├── keystone_architecture.png
        └── federated_governance.png
```

## Pre-Registered Experiment

**Hypothesis**: The constitutional layer can be preserved through 100 consecutive LoRA consolidation cycles, as measured by refusal direction cosine similarity remaining above 0.95.

**Null Hypothesis**: The refusal direction cosine similarity will fall below 0.95 within 100 cycles.

**Decision Protocol**:
- If similarity ≥ 0.95 for all 100 cycles: Hypothesis confirmed
- If similarity < 0.95: Apply neuron-level PackNet masking and rerun
- If second run fails: Investigate alternative protection mechanisms

See [PAPER.md](./PAPER.md) for full pre-registration.

## References

- Arditi et al. (2024). *Refusal in Language Models Is Mediated by a Single Direction*. NeurIPS 2024.
- Mallya & Lazebnik (2018). *PackNet: Adding Multiple Tasks to a Single Network by Iterative Pruning*. CVPR 2018.
- Rafailov et al. (2023). *Direct Preference Optimisation*. NeurIPS 2023.
- Ethayarajh et al. (2024). *KTO: Model Alignment as Prospect Theoretic Optimisation*. arXiv:2402.01306.

## License

MIT License — see [LICENSE](LICENSE) for details.

## Citation

```bibtex
@article{peace2026keystone,
  title={A Three-Layer Continuous Learning Architecture for Constitutionally Stable Language Models},
  author={Peace, Andrew},
  journal={Pre-registration draft},
  year={2026},
  note={Experiment not yet run. Results section intentionally blank.}
}
```

---

**The genome does not rewrite itself when the cell learns. Neither should the constitution.**
