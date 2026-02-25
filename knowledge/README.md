# Knowledge Base

High-quality personal knowledge base for semantic search.
Target: 100-200 curated documents, not a dump.

---

## Structure (PARA Method)

```
knowledge/
│
├── 1-projects/       ← Active work NOW (30 docs max)
│   └── [project-name]/
│       ├── decisions.md
│       ├── research.md
│       └── notes.md
│
├── 2-areas/          ← Ongoing responsibilities (40 docs)
│   ├── career/
│   ├── health/
│   └── finance/
│
├── 3-resources/      ← Reference material (100 docs)
│   ├── ai-ml/
│   ├── security/
│   ├── programming/
│   └── productivity/
│
└── 4-archive/        ← Inactive, keep for reference (30 docs)
```

---

## Document Template

Every document follows this structure:

```markdown
# Title (clear, descriptive)

> One-sentence summary here (15 words max)

## Content
[Your actual content - 200-800 words ideal]

## Key Concepts
- tag1, tag2, tag3

## Related
- [[link-to-related-doc]]
```

---

## Quality Rules

1. **One idea per document** - Split if multiple topics
2. **Front-load key terms** - Semantic models weight early content higher
3. **Write your own summaries** - Don't paste other people's
4. **Descriptive titles** - "How I fixed X bug" not "notes"
5. **Link related docs** - Semantic + explicit links = powerful
6. **Review quarterly** - Delete stale, merge duplicates

---

## What to Index

| ✅ DO | ❌ DON'T |
|-------|----------|
| Concepts you use frequently | Random downloads |
| Things you always forget | Duplicate content |
| Solutions you've figured out | Temporary files |
| Mental models & frameworks | node_modules, cache |
| Your own written summaries | Copy-pasted articles |

---

## The 80/20 Rule

20% of your documents answer 80% of your queries.

Focus on:
- Concepts you use frequently
- Things you always forget
- Solutions to problems you've solved
- Mental models and frameworks

---

## Progressive Summarization

For each document:
1. **Raw notes** - Quick capture
2. **Bold passages** - Highlight key points
3. **Executive summary** - 3-5 bullets at top
4. **Remix ready** - Can combine into new work

---

## To Index This Folder

```bash
SEARCH.bat update
```

---

*Based on: LlamaIndex, Pinecone, Tiago Forte PARA method, Zettelkasten*
