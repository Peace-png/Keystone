# SaveResearch Workflow

Saves full research output to a dated markdown file.

## When to Use

- After completing extensive research
- When user explicitly asks to save/document research
- Before summarizing or compacting research output

## Steps

### 1. Determine Topic Slug

Create a URL-safe slug from the research topic:
- Lowercase
- Replace spaces with hyphens
- Remove special characters
- Max 50 characters

Example: "Universal AI Agent Battle API" → `universal-ai-agent-battle-api`

### 2. Generate Filename

Format: `YYYY-MM-DD-[topic-slug].md`

Example: `2026-02-26-universal-ai-agent-battle-api.md`

### 3. Build Document Structure

```markdown
# [Full Research Topic]

**Generated:** YYYY-MM-DD
**Purpose:** [Brief description of what prompted this research]

---

## Table of Contents

1. [Section 1](#section-1)
2. [Section 2](#section-2)
...

---

[Full research content - preserve ALL sections, details, code examples]

---

## Sources

- [Source 1](url)
- [Source 2](url)
...

---

*Last updated: YYYY-MM-DD*
```

### 4. Write to File

Save to: `~/Documents/research/YYYY-MM-DD-[topic-slug].md`

### 5. Confirm

Tell user:
```
Research saved to: ~/Documents/research/YYYY-MM-DD-[topic-slug].md
```

## Important Rules

- **NEVER summarize** - save full content
- **NEVER truncate** - include all details
- **ALWAYS include sources** - at the bottom
- **ALWAYS include date** - in filename and document
- **ALWAYS generate TOC** - for long documents

## Integration with ClawMem

After saving, the document can be indexed by ClawMem:
- Location is in the documents folder (indexed by default)
- Will be searchable in future sessions
- Preserves research for long-term reference
