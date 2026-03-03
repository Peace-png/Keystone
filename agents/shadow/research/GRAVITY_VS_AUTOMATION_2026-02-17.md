# GRAVITY VS AUTOMATION - Research Findings

**Date:** 2026-02-17
**Question:** How to distinguish bots that "remember" IPs (gravity) from bots that just scan everything (automation)?

---

## THE KEY DISCOVERY: "INFORMED SCANNERS" EXIST

The RAID 2025 paper "[Revealing Informed Scanners by Colocating Reactive and Passive Telescopes](https://gsmaragd.github.io/publications/RAID2025/RAID2025.pdf)" proves our thesis.

**What they found:**
- 9.1% of attackers are "informed" - they visit responsive IPs WITHOUT appearing in passive telescope
- These scanners have ~6 day memory
- They drop 10x when you stop responding
- This is the GRAVITY signal we're looking for

---

## FOUR CLASSES OF SCANNERS

| Class | Behavior | Gravity? |
|-------|----------|----------|
| **Stateless** | ZMap-style, no follow-up | No |
| **One-Phase** | OS socket connects immediately | No |
| **Two-Phase** | Raw scan → OS connect (classic Mirai) | Weak |
| **Informed** | Separate infrastructure, visits reactive only | **YES** |

**Informed Scanner Signature:**
- They visit reactive IPs WITHOUT appearing in passive telescope
- When reactive telescope shuts down, informed visits drop 10x within 6 days
- This proves a **week-long "memory"** exists in scanning infrastructure

---

## BOTNET MEMORY MODELS

1. **C2-Provided Lists** (PumaBot, sophisticated campaigns)
   - Bot receives targets from C2, doesn't scan
   - C2 aggregates scan results from reporter bots
   - Memory lives in C2 infrastructure

2. **P2P Propagation** (Mozi, Hajime)
   - Vulnerable IPs propagate through DHT
   - Memory is distributed, survives individual bot deaths
   - Creates "return" behavior that looks like gravity

3. **Stale IP Lists** (DScope finding)
   - 21% fewer scanners to recently-acquired AWS IPs
   - Scanners use outdated cloud IP lists
   - This creates apparent "memory" - old targets still in lists

---

## BASELINES

| Metric | Value | Source |
|--------|-------|--------|
| Baseline noise floor | 1-2% | SRI IBR study |
| Informed scanner ratio | 9.1% | RAID 2025 |
| Cloud targeting increase | 450x expected | DScope paper |
| Memory half-life | ~6 days | RAID 2025 |

---

## PROOF METHODOLOGY

### 1. Control Experiment
```
Fort A: Passive only (never responds) = baseline
Fort B: Reactive (responds to SYN) = gravity test
Compare return rates between A and B
```

### 2. Informed Scanner Ratio
- IPs that hit reactive BUT NOT passive = informed scanners
- Baseline: 1-2% | Gravity proven: 9%+
- This is our KEY METRIC

### 3. Statistical Test
```python
# For each returning IP:
# H0: Poisson process (automation)
# H1: Non-Poisson (gravity)

ks_test(arrival_times, exponential_distribution)
p < 0.0001 => reject automation, accept gravity
```

### 4. Shutdown Decay Experiment
- Stop responding to all traffic
- Measure decay curve
- 10x drop within 6 days = informed scanner presence
- Gradual Poisson decay = pure automation

### 5. Service-Specific Targeting
- Informed scanners show protocol preferences (47% RDP in RAID 2025)
- Random scanners spread across all ports
- Protocol concentration > 3x background = gravity signal

---

## THE PROOF STATEMENT

"Return rate X% higher than baseline with p < 10^-6, concentrated on service Y, dropping 10x within 6 days of shutdown, with returning IPs not appearing in passive telescope = PROVEN GRAVITY"

---

## IMPLEMENTATION FOR SHADOW FORT

### New Metric: Informed Scanner Ratio
```typescript
interface InformedScannerMetrics {
  // IPs that returned but weren't in passive scan
  informedScanners: string[];

  // Ratio of informed / total returning
  informedRatio: number;

  // Baseline for comparison (should be 1-2%)
  baseline: number;

  // p-value for non-Poisson behavior
  statisticalSignificance: number;
}
```

### Detection Logic
```typescript
// An IP is "informed" if:
// 1. It returns to our reactive honeypot
// 2. It does NOT appear in our passive monitoring
// 3. Its arrival times are non-Poisson (KS test)

function isInformedScanner(ip: string): boolean {
  const returned = ipReturnedTo(ip, 'reactive');
  const inPassive = ipAppearsIn(ip, 'passive');
  const nonPoisson = ksTest(arrivalTimes[ip]) < 0.0001;

  return returned && !inPassive && nonPoisson;
}
```

---

## SOURCES

- [RAID 2025: Revealing Informed Scanners](https://gsmaragd.github.io/publications/RAID2025/RAID2025.pdf) - PRIMARY SOURCE
- [DScope: Cloud-Native Internet Telescope (USENIX 2023)](https://www.usenix.org/system/files/usenixsecurity23-pauley.pdf)
- [Understanding the Mirai Botnet (USENIX 2017)](https://www.usenix.org/system/files/conference/usenixsecurity17/sec17-antonakakis.pdf)
- [Comprehensive Study of Mozi Botnet](https://www.researchgate.net/publication/359114426_A_comprehensive_study_of_Mozi_botnet)
- [Internet Background Radiation (SRI)](https://www.csl.sri.com/~vinod/papers/radiation-paper.pdf)
- [GreyNoise Classifications](https://docs.greynois.io/docs/understanding-greynois-classifications)

---

## KEY INSIGHT

The RAID 2025 paper validates our thesis: **"Informed scanners" exist** that return to responsive IPs without engaging in broad scanning. These create a feedback loop with ~6 day memory.

The key is distinguishing them from:
1. **Pure automation** (Poisson, appears in passive)
2. **Distributed memory** (P2P propagation, appears in both)

Our gravity signal is the **informed scanner** class - IPs that ONLY visit reactive systems and respond to service lifecycle.

This is measurable, statistically provable, and operationally meaningful.
