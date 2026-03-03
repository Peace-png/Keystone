# zkVM Witness Implementation Guide

**Source:** Perplexity AI research, 2026-03-03
**Status:** Practical implementation pathway - BUILD READY

---

## Executive Summary

This document provides concrete implementation guidance for building a Witness layer using zkVMs. Unlike philosophical research, this focuses on:

1. Which zkVM to use (RISC Zero vs SP1)
2. Actual code patterns for "observation proofs"
3. Integration with TypeScript/Node.js
4. Performance expectations on consumer hardware

---

## 1. zkVM Choice: RISC Zero vs SP1

### Comparison Matrix

| Criteria | RISC Zero | SP1 | Jolt |
|----------|-----------|-----|------|
| **Maturity** | Production, R0VM 2.0 (2025) | Production, multiple audits | Research-grade |
| **JS Integration** | `@eqty/risc-zero-verifier` NPM | WASM verifier example | None first-class |
| **Proof Generation** | Rust binary/FFI | Rust binary/FFI | Via Sindri cloud |
| **Setup Complexity** | `rzup` + cargo-risczero | Similar | Manual git pins |
| **Performance** | Sub-minute for blocks | Fastest for rollups | Competitive |
| **Recommendation** | ✅ Good for TS integration | ✅ Good for performance | ❌ Too early |

### Verdict

**Both RISC Zero and SP1 are viable.**

- Choose **RISC Zero** if: Better JS/WASM tooling matters, existing NPM verifier packages
- Choose **SP1** if: Raw performance matters, you're comfortable with Rust-first

For Keystone (TypeScript codebase), **RISC Zero has a slight edge** due to `@eqty/risc-zero-verifier`.

---

## 2. What We Can Actually Prove

### The Reality

The zkVM proves statements about **program execution**, not OS-level file state.

What it CAN prove:
- Guest received byte string `file_bytes` and hash `H_pre`
- Guest computed `H_post = Hash(file_bytes)`
- Guest asserted `H_post == H_pre`
- Guest committed observation `O` to journal
- Guest never executed write instructions (no write API exists)

What it CANNOT prove:
- File on disk wasn't modified by other processes
- The bytes passed in actually came from the file (trust your host code)

### The Mitigation

- Run prover in hardened environment (read-only mounts)
- Treat the hash as canonical state
- Verify file content against committed hash separately

---

## 3. Minimal Observation Circuit

### RISC Zero Guest (Rust)

```rust
#![no_std]
#![no_main]

use risc0_zkvm::guest::env;
use sha2::{Digest, Sha256};

risc0_zkvm_guest::entry!(main);

pub fn main() {
    // Read inputs from host
    let pre_hash: [u8; 32] = env::read();
    let file: Vec<u8> = env::read();

    // Compute hash inside zkVM
    let mut hasher = Sha256::new();
    hasher.update(&file);
    let post_hash: [u8; 32] = hasher.finalize().into();

    // Enforce state invariance
    assert_eq!(pre_hash, post_hash);

    // Compute observation (pure function)
    let observation = compute_observation(&file);

    // Commit public outputs
    env::commit(&ObservationOutput {
        pre_hash,
        post_hash,
        observation,
    });
}

fn compute_observation(file: &[u8]) -> ObservationSummary {
    // Parse SOUL.md, count principles, check structure, etc.
    // All pure functions over bytes.
}

#[derive(serde::Serialize)]
pub struct ObservationOutput {
    pub pre_hash: [u8; 32],
    pub post_hash: [u8; 32],
    pub observation: ObservationSummary,
}
```

### Key Insight

The guest has **no write API** - it's inherently read-only by design.

---

## 4. Integration Architecture

```
┌─────────────────────────────────────────────────────────┐
│  KEYSTONE (TypeScript/Node)                             │
│                                                         │
│  ┌─────────────┐    spawn    ┌────────────────────┐    │
│  │ Host Code   │ ──────────► │ Rust Prover Binary │    │
│  │ - Read file │             │ - Build zkVM env   │    │
│  │ - Compute   │             │ - Run guest        │    │
│  │   H_pre     │             │ - Return receipt   │    │
│  └─────────────┘             └────────────────────┘    │
│         │                            │                  │
│         │  receipt (JSON)            │                  │
│         ▼                            │                  │
│  ┌─────────────────────────────────────────────────┐   │
│  │ WASM Verifier (@eqty/risc-zero-verifier)        │   │
│  │ - Verify receipt matches image ID               │   │
│  │ - Check H_pre == H_post                         │   │
│  └─────────────────────────────────────────────────┘   │
│         │                                              │
│         ▼                                              │
│  ┌─────────────┐                                       │
│  │ Trust       │  Observation is verified             │
│  │ Observation │  from read-only Witness              │
│  └─────────────┘                                       │
└─────────────────────────────────────────────────────────┘
```

---

## 5. TypeScript Interface

```typescript
interface WitnessObservation {
  preHashSoul: string;      // hex
  postHashSoul: string;     // hex (should equal pre)
  preHashClaw: string;
  postHashClaw: string;
  observation: {
    principleCount: number;
    hasAllScars: boolean;
    sessionDate: string;
    // ... whatever we extract
  };
}

interface WitnessProof {
  programId: string;        // RISC Zero image ID
  receipt: string;          // base64/JSON receipt
  output: WitnessObservation;
}

// Main API
async function runWitness(): Promise<WitnessProof>;
async function verifyWitness(proof: WitnessProof): Promise<boolean>;
```

---

## 6. Performance Expectations

### Hardware: RTX 4070, Ryzen 5, 32GB RAM

| Operation | Expected Time | Notes |
|-----------|---------------|-------|
| Small proof (few MB) | 0.1-2 seconds | Inline in request |
| Medium proof (10-50 MB) | 2-10 seconds | Batch operation |
| Proof size | 100-500 KB | Compressed SNARK |

### Optimizations

1. **Hash once outside, hash once inside** - Don't re-hash unnecessarily
2. **Limit parsing in zkVM** - Just enough to back the observation claim
3. **Snapshot ClawMem** - Copy SQLite to read-only file before proving

---

## 7. Build Steps

### Phase 1: Environment Setup
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install RISC Zero
curl -L https://risczero.com/install | bash
rzup install
```

### Phase 2: Guest Program
1. Create RISC Zero project from template
2. Implement observation logic in `guest/src/main.rs`
3. Define `ObservationOutput` struct
4. Test with `cargo test`

### Phase 3: Host Binary
1. Create `host/` crate
2. Implement file reading and hash computation
3. Build zkVM executor
4. Output JSON receipt

### Phase 4: TypeScript Integration
1. Install `@eqty/risc-zero-verifier`
2. Create `spawn` wrapper for Rust binary
3. Implement `runWitness()` and `verifyWitness()`
4. Test end-to-end

### Phase 5: Keystone Integration
1. Hook into session start
2. Run Witness proof on SOUL.md + ClawMem
3. Store verified observations
4. Alert on hash mismatch (tampering detected)

---

## 8. Threat Model

### What This Protects Against

| Attack | Protected? | How |
|--------|------------|-----|
| AI modifies its own scars | ✅ Yes | No write API in guest |
| Observation claims false state | ✅ Yes | Hash equality proof |
| Prover runs malicious code | ✅ Yes | Image ID verification |
| Other process modifies file | ❌ No | Outside zkVM scope |
| Host passes wrong bytes | ❌ No | Trust your own code |

### Hardening Options

- Run prover in container with read-only mounts
- Store committed hashes as canonical state
- Cross-verify hashes before accepting observations

---

## 9. The Algebraic Statement

What we're proving:

$$S_{pre} = S_{post} \Rightarrow S_{pre} - S_{post} = 0$$

Where $S = H(\text{state bytes})$ inside a RISC-V execution trace.

This is the mathematical guarantee of "observation without modification."

---

## 10. Next Steps

1. **Install Rust + RISC Zero** on development machine
2. **Create minimal guest** that hashes a test string
3. **Verify proof from Node** using WASM verifier
4. **Scale up** to actual SOUL.md + ClawMem
5. **Integrate** into Keystone boot sequence

---

*Captured: 2026-03-03*
*Source: Perplexity AI research response*
