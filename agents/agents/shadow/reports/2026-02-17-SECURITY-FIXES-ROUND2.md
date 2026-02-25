# SECURITY FIXES - Round 2
## Date: 2026-02-17
## Status: FIXED (v2)

---

## ISSUES IDENTIFIED BY GPT CODEX REVIEW

### 1. ✅ FIXED: Cowrie Memory DoS (Reads Entire File)

**Problem (Round 1):**
```typescript
// OLD: Reads entire file into memory
const content = await fd.text();
const newContent = content.slice(cowrieLastPosition);
```

**Problem (Round 2 - GPT found more):**
- Skip loop reads entire file → still I/O DoS
- Set position to end even when only read 1MB → data loss
- Overshoot chunk wasn't counted → cap bypassed

**Fix (v2):**
- Use `fd.slice(start, end)` to read ONLY the bytes needed (no skip loop)
- Only advance `cowrieLastPosition` by bytes actually processed
- If backlog > 1MB, process 1MB and keep rest for next poll
- Incomplete lines at cap boundary stay for next poll

**Verification:** `sim/honeypot-monitor.ts:286-360`

---

### 2. ✅ FIXED: validatePath Decode Bypass

**Problem:**
```typescript
// OLD: Sanitize once, then decode (no re-sanitization)
path = sanitize(untrusted, ...);
path = decodeURIComponent(path);  // Can introduce control chars!
```

**Fix:**
- Three-pass sanitization: initial → post-decode → post-transform
- Lines 158-180

**Verification:** `sim/honeypot-monitor.ts:158-180`

---

### 3. ✅ FIXED: Per-Second Burst Rate Limit Not Enforced

**Problem:** `maxEventsPerSecond` defined but never checked.

**Fix:**
- Added per-second burst check alongside per-minute
- Logs which limit was exceeded

**Verification:** `sim/honeypot-monitor.ts:48-68` (checkRateLimit function)

---

### 4. ✅ FIXED: Pattern Poisoning via Uniform Redaction

**Problem:** All invalid credentials became `"[REDACTED]"` → fake patterns.

**Fix:**
- Unique markers: `[REDACTED_1]`, `[REDACTED_2]`, etc.
- Counter-based uniqueness

**Verification:** `sim/honeypot-monitor.ts:134-149`

---

## CURRENT LINE NUMBERS

| Fix | Lines |
|-----|-------|
| MAX_COWRIE_READ_PER_POLL | 286 |
| Rate limit (per-second) | 48-68 |
| getRedactionMarker | 134-136 |
| validatePath (3-pass) | 158-180 |
| Cowrie slice read | 309-360 |

---

## STILL OPEN (Architectural)

| Issue | Type |
|-------|------|
| Split memory (ClawMem vs JSON) | Architecture |
| TELOS not wired to runtime | Architecture |
| No passive telescope | Research |
| Daily memory logs missing | Process |

---

*Updated: 2026-02-17 after Round 2 fixes*
