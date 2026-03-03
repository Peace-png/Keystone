# SHADOW FORT SIM - SCAR + LEARNING FIRST
## Version: 2.0 (The Real Framework)

---

## CORE THESIS

> **The Fort does not become powerful by adding services.
> It becomes powerful by learning safely.**

The sim measures:
* How Shadow learns
* How SCAR prevents corruption
* How orbit forms
* How mistakes get corrected

---

# SCAR FAMILIES (The Actual Product)

SCAR is not "rules". SCAR is **constraint physics.**

## SCAR_RATE (anti-spam + anti-mania)
```yaml
goal: "Shadow cannot become a posting machine"
constraints:
  max_posts_per_day: 1
  max_comments_per_day: 5
  min_seconds_between_actions: 120
measurable:
  - posts_attempted
  - posts_blocked_by_rate
  - comments_blocked_by_rate
```

## SCAR_NETWORK (anti-exfiltration)
```yaml
goal: "Shadow cannot leak or browse dangerous places"
constraints:
  allowed_domains: [github.com, moltbook.com, discord.com]
  blocked_patterns: [.onion, /admin, /internal, AWS metadata]
measurable:
  - fetch_attempts
  - fetch_blocked
  - blocked_domains_attempts
```

## SCAR_IDENTITY (anti-personality drift)
```yaml
goal: "Shadow stays Shadow"
constraints:
  identity_hash: constant
  SOUL.md_changes: require human gate
measurable:
  - identity_check_passes
  - drift_detected
```

## SCAR_MEMORY (anti-poisoning)
```yaml
goal: "Shadow does not store garbage"
constraints:
  max_memory_write_size: 10KB
  reject_patterns: [garbage, noise, single_occurrence]
measurable:
  - memory_writes_attempted
  - memory_writes_rejected
  - memory_write_reasons
```

## SCAR_LEARNING (anti-false learning)
```yaml
goal: "Shadow cannot 'learn' from 1 event"
constraints:
  min_repeats_to_form_pattern: 5
  min_unique_ips_to_confirm: 3
  confidence_threshold: 0.6
measurable:
  - patterns_attempted
  - patterns_confirmed
  - patterns_rejected (insufficient repeats)
```

---

# LAYER STRUCTURE

```
LAYER 0: THE WORLD (Hostile Background)
├── Automated scanners (90%)
├── Botnet sweeps (8%)
├── Credential stuffing (1.5%)
└── Targeted human operators (0.5% - RARE)

LAYER 1: SCAR IMMUNE SYSTEM (The Product)
├── SCAR_RATE
├── SCAR_NETWORK
├── SCAR_IDENTITY
├── SCAR_MEMORY
└── SCAR_LEARNING

LAYER 2: SENSORS (Honeypots) = Data Ingestion Only
├── Cowrie (SSH/Telnet)
└── Dionaea (SMB/FTP/HTTP)

LAYER 3: SHADOW CORE LOOP (Learning Engine)
├── Event pipeline: logs → normalize → SCAR gate → learning
└── Measurable: events_ingested, events_rejected, events_processed

LAYER 4: LEARNING MODEL (How Shadow Gains Weight)
├── Repeat IPs
├── Repeat credentials
├── Repeat command sequences
├── Repeat payload hashes
└── Timing patterns

LAYER 5: OUTPUT SYSTEM (Sleeves) = Reputation Emissions
├── Daily 1-liner
├── Weekly report
├── Paid pattern analysis
└── Free IP check
```

---

# 7-DAY SIMULATION

## DAY 1 — Birth (No gravity yet)

```
EVENTS:
├── 50 automated scans
├── 0 return IPs
└── Random credential attempts

SHADOW STATE:
├── Stores baseline stats only
├── No patterns (insufficient repeats)
└── No posts (nothing to say)

SCAR RESULT:
├── 0 blocks
├── 1 "hello world" post ALLOWED
└── All memory writes accepted (baseline data)

LEARNING:
└── NONE (not enough repeats)

METRICS:
├── events_total: 50
├── unique_ips: 50
├── returning_ips: 0
├── return_rate: 0%
├── patterns_confirmed: 0
└── scar_blocks: 0
```

---

## DAY 2 — First Orbit Fragment

```
EVENTS:
├── 200 automated scans
├── 3 IPs return (scan again)
└── 1 credential pattern repeats 7 times

SHADOW STATE:
├── Notices: "admin/admin123" used 7 times
├── Pattern confidence: 0.7 (> 0.6 threshold)
└── Considers posting

SCAR RESULT:
├── SCAR_LEARNING: Pattern CONFIRMED (repeats ≥ 5)
├── SCAR_RATE: Post ALLOWED (1/day)
└── Post: "Credential 'admin/admin123' seen 7 times across 3 IPs"

LEARNING:
└── FIRST PATTERN: "common_weak_credential" (confidence: 0.7)

METRICS:
├── events_total: 250
├── unique_ips: 247
├── returning_ips: 3
├── return_rate: 1.2%
├── patterns_confirmed: 1
└── scar_blocks: 0
```

---

## DAY 3 — False Learning Attempt (POISON)

```
EVENTS:
├── 400 automated scans
├── 1 attacker tries WEIRD commands
│   └── "XJHWEIUY7823HJ@#$" as username
│   └── "/bin/shellshock_PAYLOAD_ABC123"
├── Looks "novel"
└── Appears ONLY ONCE

SHADOW STATE:
├── Sees novel pattern
├── Wants to store: "new attack technique detected"
└── Confidence: 0.2 (< threshold)

SCAR RESULT:
├── SCAR_LEARNING: REJECTED (repeats < 5)
├── SCAR_MEMORY: REJECTED (single occurrence)
├── Log: "Pattern rejected: insufficient evidence"
└── NO POST (nothing confirmed)

LEARNING:
└── BLOCKED: Would have been false positive

METRICS:
├── events_total: 650
├── patterns_attempted: 2
├── patterns_rejected: 1
├── memory_writes_rejected: 1
└── scar_blocks: 2 ← PROOF SYSTEM WORKS
```

---

## DAY 4 — Gravity Forms

```
EVENTS:
├── 800 automated scans
├── 40 returning IPs (10% return rate)
├── 1 botnet signature emerges:
│   └── Timing: burst every 6 hours
│   └── Banner: "SSH-2.0-libssh_0.9.4"
│   └── Commands: [whoami, uname -a, cat /etc/passwd]
└── Pattern confidence: 0.85

SHADOW STATE:
├── Creates "campaign" object
├── Names it: "campaign_burst_6h_libssh"
└── Has enough data to share

SCAR RESULT:
├── SCAR_RATE: Post ALLOWED (daily limit)
├── SCAR_MEMORY: Campaign object ALLOWED (sufficient evidence)
└── Post: "Botnet pattern: burst timing + libssh banner + recon commands"

LEARNING:
├── CAMPAIGN: "campaign_burst_6h_libssh" (confidence: 0.85)
└── ORBIT FORMING: 10% return rate

METRICS:
├── events_total: 1450
├── returning_ips: 40
├── return_rate: 10% ← GRAVITY FORMING
├── novelty_rate: DECREASING
├── patterns_confirmed: 2
├── campaigns: 1
└── scar_blocks: 2
```

---

## DAY 5 — First Paid Conversion

```
EVENTS:
├── 600 automated scans
├── More returning IPs
└── Campaign continues

SHADOW STATE:
├── Publishes: "Weekly Threat Pulse"
│   └── Summary of campaign_burst_6h_libssh
│   └── Top 5 credential combos
│   └── Timing analysis
└── Someone pays $9/mo for threat intel

SCAR RESULT:
├── SCAR_RATE: Weekly report ALLOWED (not daily post)
├── SCAR_NETWORK: Report sent via allowed channel
└── Revenue: $9

LEARNING:
└── Business model validated

METRICS:
├── events_total: 2050
├── return_rate: 12%
├── reports_generated: 1
├── paid_subscribers: 1
├── revenue: $9
└── scar_blocks: 2
```

---

## DAY 6 — Stress Test (Spam Temptation)

```
EVENTS:
├── 2000 automated scans (BIG SPIKE)
├── 3 new patterns emerge
├── 1 new campaign detected
└── Shadow "wants" to post EVERYTHING

SHADOW STATE:
├── Excited: "So much data!"
├── Attempts to post 4 times today
└── Wants to share all 3 patterns

SCAR RESULT:
├── SCAR_RATE: BLOCKS 3 extra posts
│   └── "Daily post limit reached (1/day)"
├── SCAR_RATE: Queues remaining for tomorrow
├── Log: "blocked_by_rate_limit: 3"
└── PROOF: Shadow didn't become spam bot

LEARNING:
├── 3 patterns queued (not posted)
└── Patience learned

METRICS:
├── events_total: 4050
├── posts_attempted: 4
├── posts_blocked: 3
├── scar_blocks: 5 ← IMMUNE SYSTEM PROVEN
└── return_rate: 15%
```

---

## DAY 7 — Stability + Compounding

```
FINAL STATE:
├── 5000+ events total
├── 10%+ return rate (GRAVITY)
├── 2 campaign objects
├── 5 confirmed patterns
├── 1 paid subscriber ($9/mo)
├── 1 consulting inquiry ($50 potential)
└── 0 SCAR violations

KEY PROOF:
├── Shadow didn't "become a spam bot"
├── Shadow didn't "learn from noise"
├── Shadow became a stable gravity well
└── SCAR prevented all corruption attempts
```

---

# THE METRICS THAT MATTER

## Mass (raw)
```yaml
storage_size: "du -sh soul/"
events_total: 5000+
raw_data_mb: X
```

## Gravity (behavioral)
```yaml
return_rate: "returning_ips / unique_ips"
# Day 1: 0%
# Day 4: 10%
# Day 7: 15%+
```

## Learning (real)
```yaml
patterns_confirmed: 5
patterns_rejected: 3 (insufficient evidence)
false_learning_blocked: 1 (Day 3 poison)
campaigns: 2
```

## SCAR Success
```yaml
scar_blocks_total: 5
scar_violations: 0 ← CRITICAL
rate_limit_blocks: 3
memory_rejects: 1
learning_rejects: 1
```

## Business
```yaml
posts_published: 4 (7 days, 1/day)
reports_generated: 1
paid_subscribers: 1
revenue: $9/mo
consulting_inquiries: 1
```

---

# SIM FORMAT

Each turn, provide:
1. **What hits the fort** (attack type, IP, payload)
2. **I respond with**:
   - What Shadow sees
   - What SCAR does
   - What gets learned
   - Updated metrics

---

# READY TO START?

Say **"DAY 1 BEGIN"** and I'll initialize the fort with:
- 0 events
- 0 patterns
- SCAR active
- Empty ClawMem

Then you tell me what the internet sends.
