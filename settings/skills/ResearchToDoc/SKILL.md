---
name: ResearchToDoc
description: Automatically saves full research output to dated markdown files before any summarization or compacting. USE WHEN user wants to save research, document research, keep research output, OR when doing extensive research that should be preserved. Ensures no research is ever lost to context limits.
---

# ResearchToDoc

Automatically saves full research output to dated markdown files before any summarization or compacting.

## Why This Exists

Research outputs are valuable. Context windows are limited. This skill ensures every research session is preserved in full before any summarization happens.

## Workflow Routing

| Trigger | Workflow |
|---------|----------|
| "save research to doc" | `Workflows/SaveResearch.md` |
| "document this research" | `Workflows/SaveResearch.md` |
| "keep research output" | `Workflows/SaveResearch.md` |
| After extensive research (auto) | `Workflows/SaveResearch.md` |

## Output Location

All research documents saved to: `~/Documents/research/YYYY-MM-DD-[topic-slug].md`

## Document Structure

Every saved research document includes:

```markdown
# [Topic]

**Generated:** YYYY-MM-DD
**Purpose:** [What the research was for]

---

## Table of Contents
[Auto-generated from headers]

---

[Full research content - NO summarization]

---

## Sources
[All URLs and references]

---

*Last updated: YYYY-MM-DD*
```

## Integration

- **Feds from:** Research skill outputs
- **Feeds into:** ClawMem memory system (indexed for future reference)
- **Works with:** Journalism skill for article-ready research

## Quick Reference

| What | Where |
|------|-------|
| Research documents | `~/Documents/research/` |
| Naming format | `YYYY-MM-DD-topic-slug.md` |
| Full content | YES - never summarized |
| Sources included | YES - always at bottom |

## Voice Notification

**When executing:**

1. **Send voice notification:**
   ```bash
   curl -s -X POST http://localhost:8888/notify \
     -H "Content-Type: application/json" \
     -d '{"message": "Saving research to document"}' \
     > /dev/null 2>&1 &
   ```

2. **Output text:**
   ```
   Saving research to **~/Documents/research/YYYY-MM-DD-[topic].md**...
   ```
