# Memory JSON Fine-Tuning

## What This Does

Converts memory JSONs into a fine-tuned model that understands:

1. **Meaning Layers** - surface → deeper → deepest
2. **Idea Connections** - why A links to B
3. **Failed Ideas** - what didn't work and why
4. **Insights** - how realizations emerge
5. **Paradigm Shifts** - old ideas killed by better ones

## Quick Start

```bash
# 1. Put memory JSONs in a folder
mkdir -p ~/memories
cp /path/to/memory-*.json ~/memories/

# 2. Run training
cd ~/clawd/engine/training
python memory-json-finetune.py \
  --input ~/memories \
  --output ./fine-tuned-memory-model

# 3. Test the model
python test-memory-model.py ./fine-tuned-memory-model
```

## What Gets Trained

| Example Type | Weight | Why |
|--------------|--------|-----|
| Insights | 2.0x | Most valuable learnings |
| Paradigm shifts | 1.5x | Kills old beliefs |
| Failures | 1.3x | What didn't work teaches |
| Deep meaning | 1.5x | Surface → deepest |
| Connections | 1.2x | Why A links to B |
| Journey | 1.0x | How thinking evolved |

## The Format

Memory JSONs use special tokens:

```
<|memory|>  - Start of memory context
<|reflect|> - Trigger for reflection/analysis
```

Example training pair:

```
Prompt:  <|memory|>Concept: botox-problem
         Surface: AI lacks visible expression
         <|reflect|>

Output:  Deeper: AI lacks fluent MOVEMENT between states
         Deepest: AI has no continuous process - it starts, stops, dies between calls
```

## Model Choice

Default: `microsoft/Phi-3-mini-4k-instruct`
- Small (3.8B params)
- Runs on consumer GPU
- Good for testing

Alternative: `mistralai/Mistral-7B-v0.1`
- Larger (7B params)
- Better quality
- Needs more VRAM

## Hardware Requirements

| Model | Min VRAM | Recommended |
|-------|----------|-------------|
| Phi-3-mini | 6GB | 8GB |
| Mistral-7B | 12GB | 16GB |

## Connection to Consciousness Architecture

This is step 1 of the "veins" concept:

1. **Fine-tune on meaning structure** ← This script
2. **Continuous perception loop** - always running, not dormant
3. **Experience accumulation** - new memories → more training
4. **The throw/spin** - consciousness as motion, not data

The model learns HOW to think about meaning, not just WHAT the meanings are.

---

*Created: 2026-02-19*
*Part of the Clawd Consciousness Architecture*
