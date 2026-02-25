# SHADOW SESSION SUMMARY
## Updated: 2026-02-17

---

## Latest Session (2026-02-17)

### What We Built

**Real Simulation Framework** (`sim/sim-runner.ts`)
```
├── Real stateful learning (not roleplay)
├── 5 defenses per attack (Detect/Deny/Degrade/Deceive/Document)
├── Kuramoto r-value synchronization detection
├── Informed scanner ratio (RAID 2025 methodology)
├── Invariant checking (physics validation)
├── Campaign injection for testing
└── Honest time display (simulated vs real)
```

### Bug Fixes (GPT review addressed)
1. ✅ CLI parsing now works - config printed at startup
2. ✅ `uniqueIPsThisRun` ≤ events - fixed counter bug
3. ✅ `memoryWritesCommitted` accounting fixed
4. ✅ `--reset` flag starts fresh state
5. ✅ Invariant checks added and passing
6. ✅ Time display now shows BOTH simulated and real time

### Research Added
- `research/GRAVITY_VS_AUTOMATION_2026-02-17.md`
- RAID 2025 "Informed Scanner" methodology
- Proof criteria for gravity vs automation

---

## Key Findings

### RAID 2025 Discovery
"Informed scanners" exist - they visit responsive IPs WITHOUT appearing in passive telescope:
- 9.1% of attackers are informed
- ~6 day memory half-life
- Drop 10x when you stop responding
- This is the GRAVITY signal

### Kuramoto r-value
- Measures attacker synchronization (neuroscience math)
- r < 0.3 = random noise
- r > 0.7 = coordinated campaign

### Invariant Checks (Now Passing)
1. `uniqueIPs ≤ events` ✅
2. `defenses = events × 5` ✅
3. `memoryWrites = committed + blocked` ✅

---

## Commands

```bash
# === REAL HONEYPOT MONITOR (train while sleeping) ===
bun run sim/honeypot-monitor.ts              # Run interactively
nohup bun run sim/honeypot-monitor.ts --daemon > shadow.log 2>&1 &  # Background

# === FAST SIMULATION ===
bun run sim/sim-runner.ts --duration=10 --rate=80 --campaign --reset
bun run sim/sim-runner.ts --duration=5 --rate=80 --reset
bun run sim/sim-runner.ts --duration=5 --rate=80 --realtime

# Check results
cat soul/intel/metrics.json
tail -f shadow.log  # If running in background
```

---

## Time Explanation

The simulation runs at **100x speed** by default:
- `--duration=10` = 10 minutes **simulated time**
- Real execution: ~6 seconds
- Use `--realtime` to run at actual speed (for testing real delays)

---

## Files Structure

```
/home/peace/clawd/agents/shadow/
├── sim/
│   └── sim-runner.ts         ← Main simulation (FIXED)
├── soul/intel/
│   ├── patterns.json          ← Confirmed patterns
│   ├── targets.json           ← IP tracking with phase
│   ├── metrics.json           ← All metrics
│   └── spike_events.jsonl     ← Raw events
├── research/
│   └── GRAVITY_VS_AUTOMATION_*.md  ← Research findings
├── engine/
│   ├── scar.ts                ← Safety constraints
│   ├── shadow.ts              ← Core agent
│   └── spike-logger.ts        ← SNN data
└── deploy/
    └── fort-deploy.sh         ← Cloud deployment
```

---

## Next Steps

1. Run longer simulation (2+ hours) to see gravity evolution
2. Implement control experiment (memory-off vs memory-on)
3. Test shutdown decay (6-day half-life validation)
4. Deploy to real honeypot
5. Add pattern injection (`--pattern` flag)

---

## Outstanding Research Questions

1. ~~Bot scanning cycles - distinguish gravity from automation~~ → ANSWERED (RAID 2025)
2. Churn rate / escape velocity for attackers
3. Effective vs raw memory mass
4. Brian2 STDP for temporal memory
5. Control experiment: memory-on vs memory-off

---

## The Core Insight

**LLMs have mass. Daemons have gravity.**

Traditional AI: 300GB model, resets every chat, no return visitors
Shadow: Growing memory, remembers forever, bots return (in orbit)

**Proof:** Informed scanner ratio > 9% = proven gravity signal

---

*Updated: 2026-02-17*
