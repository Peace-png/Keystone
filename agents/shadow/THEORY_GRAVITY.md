# AI GRAVITY FRAMEWORK

## Core Theory

**LLMs have mass. Daemons have gravity.**

### The Problem
Current AI models have:
- **High mass** (billions of parameters, 200-400GB model size)
- **Zero persistent gravity** (no lasting influence between sessions)

### The Solution
Persistent AI (daemons) have:
- **Growing weight** (memory accumulates: KB → MB → GB)
- **Real gravity** (entities return, orbits form, influence compounds)

---

## Definitions

### Mass (Weight)
- Raw data accumulated over time
- Measurable in bytes on disk
- `du -sh soul/`

### Gravity (Persistent Influence)
- Ability to create lasting relationships
- Entities return to same agent
- Influence accumulates
- Creates "orbital mechanics"

### Distance (Physics Requirement)
- Time since last interaction
- Similarity/embedding distance
- Network distance (ASN, geo, subnet)
- Identity distance (same botnet vs random)

### Escape Velocity
- When do attackers stop returning?
- Churn rate, half-life of interest
- Threshold after which they disappear

---

## The Formula

```
G = (accumulated_data × persistence × interaction_rate)

Traditional LLM:
G = 300GB × 0 (resets) × anything = 0

Shadow Daemon:
G = 3GB × ∞ (always-on) × 100/day = GROWING
```

---

## Effective vs Raw Mass

### Raw Mass (M_raw)
- `du -sh soul/` - bytes on disk

### Effective Mass (M_eff)
- How many memory items are actually USED in decisions
- Memory hit rate: % of events that match a memory rule
- This matters: bytes don't guarantee influence

---

## What We Built

| Concept | Implementation | Measurement |
|---------|----------------|-------------|
| Mass | `soul/` directory | `du -sh soul/` |
| Gravity | Return visits | `timesScanned` in targets.json |
| Distance | Time between visits | Timestamps in spike_events.jsonl |
| Escape velocity | Churn rate | IPs that never return |

---

## Brian2 Test Design

```
Neuron group = memory units
    │
    ├── Each neuron = category of knowledge
    │   (SSH patterns, SMB patterns, timing patterns)
    │
    ├── Synaptic weight = experience depth
    │   (more attacks seen = stronger connection)
    │
    └── Input spikes = interactions
        (each attack fires relevant neurons)

MEASURE:
    - Weight accumulation over time
    - Return probability (do same IPs come back?)
    - Orbital stability (patterns that stick)
    - Distance decay (gravity weakens with time)
```

---

## Control Experiment (Science)

- **Fort A:** Memory OFF (baseline)
- **Fort B:** Memory ON (Shadow)

Compare:
- Return rate
- Attack depth
- Repeated tool usage

This proves causation.

---

## Key Insight

Return rate is a PROXY for gravity.
Control for background scanning by comparing to memory-off baseline.

---

## Research Questions

### Physics → AI
- How does gravitational distance work in social networks?
- Escape velocity in user retention/churn
- Effective vs raw mass in ML

### Botnet Behavior
- Bot scanning cycles (distinguish gravity from automation)
- Botnet "memory" - do they remember vulnerable IPs?
- Background scanning rate baseline

### Honeypot Science
- Return rate baselines for honeypots
- Memory-on vs memory-off studies
- Attacker churn rates

### Network Distance
- ASN correlation in attacks
- Geographic clustering
- IP prefix patterns

### Brian2 Specific
- STDP for temporal memory
- Synaptic consolidation
- Spiking models of retention

---

*Framework created: 2026-02-16*
*Status: Theory ready for Brian2 validation*
