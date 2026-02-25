# Intent Decomposition Framework (Adaptive)

**Version:** 1.0 | **Date:** 2026-02-07

---

## The Problem

Fixed 3-field decomposition misses emotional context. Fixed 7-field wastes tokens on simple requests.

**Solution:** Adaptive framework that expands when complexity signals are detected.

---

## Default Mode (3-Field)

Use for: Simple requests, clear questions, routine tasks

```markdown
🔎 **Reverse Engineering:**
- **What they asked:** [explicit request]
- **What they implied:** [unstated assumptions]
- **What they DON'T want:** [avoid this response type]
```

**Token cost:** ~40-60 tokens per analysis

---

## Expanded Mode (7-Field)

Use for: Ambiguous requests, emotional language, complex problems, frustration detected

```markdown
🔎 **Intent Decomposition:**

  📝 **Literal Request:**
    - [What they explicitly said]

  🧊 **Subtext & Implications:**
    - [What they meant but didn't say]
    - [Assumptions baked into their message]

  🔥 **Emotional State:**
    - [Frustrated / Confused / Curious / Urgent / Relaxed]
    - Confidence: [High / Low / Unsure]

  🚫 **Anti-Goals:**
    - [Responses that would feel dismissive or wrong]
    - [e.g., "Don't gaslight me into thinking nothing changed"]

  🎯 **Actual Priority:**
    - PRIMARY: [The ONE thing they need resolved first]
    - SECONDARY: [Nice-to-haves]

  🧩 **Missing Context:**
    - [What I should ask or probe for]
    - [Ambiguities that need clarification]

  🛤️ **Response Strategy:**
    - [Validate → Diagnose → Fix → Prevent]
```

**Token cost:** ~120-180 tokens per analysis

---

## Expansion Signals

**Auto-expand to 7-field when ANY signal detected:**

| Signal | Pattern Example |
|--------|-----------------|
| **Emotional words** | "frustrating", "broken", "killed my stuff", "why does this..." |
| **Ambiguity** | "something changed", "not working", "weird issue" |
| **Multiple concerns** | User lists 3+ problems in one message |
| **Reported regression** | "used to work", "after update", "was fine before" |
| **Uncertainty expressed** | "I think", "maybe", "not sure" |
| **Urgency** | "urgent", "asap", "blocking me" |

---

## Quick Reference

```
┌────────────────────────────────────────────────────────────┐
│                    DECISION TREE                          │
├────────────────────────────────────────────────────────────┤
│                                                             │
│  User message arrives                                      │
│        │                                                    │
│        ▼                                                    │
│  Check for expansion signals                              │
│        │                                                    │
│   ┌────┴────┐                                              │
│   │         │                                              │
│   ▼         ▼                                              │
│ SIGNALS    No signals                                      │
│   │         │                                              │
│   │         │                                              │
│   ▼         ▼                                              │
│ 7-field   3-field                                         │
│ Deep      Fast                                            │
│ Complete  Efficient                                       │
│                                                             │
└────────────────────────────────────────────────────────────┘
```

---

## Examples

### Example 1: Simple → 3-Field

**User:** "What's my git status?"

```markdown
🔎 **Reverse Engineering:**
- **What they asked:** Check git status
- **What they implied:** Want to know current repo state
- **What they DON'T want:** Long explanation, just the status
```

---

### Example 2: Regression → 7-Field

**User:** "Update killed all my stuff, nothing works"

```markdown
🔎 **Intent Decomposition:**

  📝 **Literal Request:**
    - "Update killed all my stuff"

  🧊 **Subtext & Implications:**
    - System worked before update, broken after
    - User didn't expect this change
    - Likely feeling frustrated/disoriented

  🔥 **Emotional State:**
    - Frustrated / caught off guard
    - Confidence: Low (unsure what happened)

  🚫 **Anti-Goals:**
    - Don't act like nothing changed
    - Don't say "works fine for me"
    - Don't give generic "try reinstalling"

  🎯 **Actual Priority:**
    - PRIMARY: Acknowledge change is real, explain what shifted
    - SECONDARY: Help restore familiar behavior

  🧩 **Missing Context:**
    - What exactly changed? (UI? Behavior? Config?)
    - What version before?
    - What specific workflow broken?

  🛤️ **Response Strategy:**
    - Validate ("Yes, things changed — here's what")
    - Diagnose (identify specific changes)
    - Fix (rollback or adaptation guide)
    - Prevent (pin versions, changelog)
```

---

## Implementation Notes

**For PAI Algorithm OBSERVE phase:**

1. **Default to 3-field** unless signals detected
2. **Check signals mentally** before choosing format
3. **Show expanded analysis** only when beneficial
4. **Keep internal** — don't always output to user

**Token savings:**
- Simple requests stay at ~50 tokens
- Complex requests get ~150 tokens (but worth it for accuracy)
- Net: ~30-40% reduction vs always using 7-field

---

## Version History

| Date | Change |
|------|--------|
| 2026-02-07 | Initial framework - adaptive 3/7 field design |
