# PARKING LOT - Known Issues

**Purpose:** Capture discovered issues that need attention but aren't emergencies.
**Rule:** "Capture now, fix later" - don't lose context.

---

## Open Issues

### 1. Memory Destination Ambiguity
- **Found:** 2026-03-04
- **Status:** OPEN
- **What:** The phrase "save to memory" is ambiguous - multiple memory systems exist (external tool memory vs Keystone repo vs ClawMem).
- **Risk:** Keystone-specific workflow rules may be stored in external tool memory (non-portable) unless explicitly directed.
- **Fix direction:** Added MEMORY AUTHORITY rule to USER.md. May need enforcement hook.

### 2. SCAR Daemon Not Wired to Runtime
- **Found:** 2026-03-04
- **Status:** PARTIAL ✅
- **What:** SCAR daemon parses SOUL.md and has `match()` logic, but nothing calls it during normal runtime.
- **Fix:** Phase 3 checkpoint created - `scar-session-checkpoint.ts` runs at session end
- **Remaining:** Optional additional checkpoints (before destructive ops, before commit)

### 3. ClawMem Ingestion Scope Uncertainty
- **Found:** 2026-03-04
- **Status:** OPEN
- **What:** Unclear whether ClawMem indexes constitution files (USER.md, SOUL.md) and whether it should.
- **Risk:** Rules may not be searchable, OR constitution content may unintentionally influence retrieval if indexed without safeguards.
- **Fix direction:** Verify what ClawMem indexes, decide policy for constitution files.

---

## Closed Issues

### 4. SOUL.md Richness Not Fully Consumed (RESOLVED 2026-03-04)
- **What:** YIN/YANG/CONSTRAINTS exist in SOUL.md, but SCAR daemon parser only loaded id/rule/triggers/origin/level.
- **Fix:** Phase 1 parser extension + Phase 2 enriched MatchResult
- **Result:** P5-P13 now load full context; match() returns advisory with wound/consequence/checks/remember

---

## How This File Works

- **Location:** Root of Keystone repo (easy to find)
- **Format:** One section per issue with Found date, Status, What, Risk, Fix direction
- **Boot:** START-KEYSTONE.cmd shows "Parking Lot: N open" count
- **Rule:** Add issues here when discovered during other work. Fix them later.

---

*Last updated: 2026-03-04*
