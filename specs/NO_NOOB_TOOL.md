# NO NOOB - Open Source License Attribution Tool

**Created:** 2026-03-01
**Status:** Research Phase

---

## The Elevator Pitch (for a 13 year old)

You download code from GitHub. You forget to credit the author. Author finds out and calls you out. You look like a jerk.

This tool auto-writes the credits so that never happens.

**"Anti-embarrassment tool for coders."**

---

## The Problem by the Numbers

| Stat | Source | Why It Matters |
|------|--------|----------------|
| 64% of OSS components are transitive | Research doc | Can't just scan package.json |
| 56% of codebases have license conflicts | Research doc | Need compatibility checking |
| 89% of codebases contain snippets | FossID study | Need snippet detection |
| 25% of snippets are from copyleft sources | FossID study | Hidden GPL risk |

---

## Distribution Model = Risk Level

| Distribution | Attribution Risk | What's Needed |
|--------------|------------------|---------------|
| SaaS/Backend | Low | Just keep licenses in repo |
| Frontend JS bundles | HIGH | Notices IN the bundle |
| Mobile/Binary apps | HIGH | "Legal Notices" UI menu |
| Container images | EXTREME | OS packages + full SBOM |

**Tool should ask:** "How will this be distributed?" and output accordingly.

---

## What Existing Tools Miss

| Gap | Why It's a Problem |
|-----|-------------------|
| Metadata lies | Packages have wrong/missing license fields |
| Ecosystem blind spots | pnpm, vendored code, non-JS ecosystems |
| No snippet detection | Stack Overflow, AI-generated, copied code |
| No compatibility check | Don't flag GPL in MIT projects |
| Same output for all formats | Web vs mobile need different things |

---

## Stack Overflow Snippets = Ticking Time Bomb

All Stack Overflow content is CC BY-SA 4.0 which requires:
1. Visual indication of source
2. Hyperlink to original question
3. Author's name
4. Link to author's profile
5. **ShareAlike clause** = viral open-source requirement (DANGEROUS)

25% of snippets in codebases come from copyleft sources.

---

## The Mathematical Risk

```
N = d × (1 + t)

Typical JS project:
N = 50 × (1 + 20) = 1,050 components

If 0.1% have incompatible license:
P(Failure) = 1 - (0.999)^1050 = 65% chance of breach
```

Manual checking is impossible. Automation is required.

---

## Tool Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     NO NOOB TOOL                            │
│                                                             │
│  1. ASK: Distribution type?                                │
│     ├── Backend/SaaS → minimal output                       │
│     ├── Frontend/Web → bundle-ready notices                 │
│     ├── Mobile/Desktop → UI menu format                     │
│     └── Container → full SBOM + OS packages                 │
│                                                             │
│  2. SCAN DEEP:                                              │
│     ├── package.json / requirements.txt / Cargo.toml        │
│     ├── node_modules ACTUALLY (not just metadata)          │
│     ├── pnpm symlinks                                       │
│     ├── vendor/ / lib/ / third_party/                      │
│     ├── .gitmodules                                         │
│     └── Source code for license headers                     │
│                                                             │
│  3. DETECT SNIPPETS:                                        │
│     ├── Stack Overflow URL patterns in comments            │
│     ├── AI-generated code (flag as uncertain)              │
│     └── Copied functions (fingerprint matching?)           │
│                                                             │
│  4. CHECK COMPATIBILITY:                                    │
│     ├── GPL in your MIT project? → FLAG                     │
│     ├── CC BY-SA snippets? → WARN about ShareAlike         │
│     └── License conflicts between deps? → REPORT           │
│                                                             │
│  5. GENERATE:                                               │
│     ├── LICENSE (your chosen license)                       │
│     ├── NOTICE (bubbled up from all deps)                   │
│     ├── licenses/ folder (each dep's full license)         │
│     ├── third-party-notices.txt (consolidated)             │
│     ├── SBOM (SPDX or CycloneDX format)                     │
│     └── For web: bundle-header.txt to prepend               │
│                                                             │
│  6. OUTPUT:                                                 │
│     "Your repo has 847 components.                          │
│      2 have GPL (danger).                                   │
│      14 snippets need attribution.                          │
│      Files ready to copy. Proceed?"                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Disclaimer (REQUIRED)

```
⚠️ THIS IS NOT LEGAL ADVICE

This tool helps you find licenses and generate attribution files.
It does NOT guarantee legal compliance.

- It may miss things
- License detection isn't perfect
- Laws vary by country
- When in doubt, ask a lawyer

Use at your own risk.
```

**Disclaimer goes in:**
- README.md
- Every tool output
- Generated files

---

## Confidence Score Output

```
✓ 847 components scanned
✓ 812 licenses detected with high confidence
⚠ 35 licenses guessed (low confidence - check these)
✗ 0 components with NO license info

CONFIDENCE: 96%

→ Review the 35 uncertain ones manually.
```

---

## Tech Stack Options (TBD)

| Option | Pros | Cons |
|--------|------|------|
| TypeScript + Bun | Fast, single binary | Need to bundle |
| Python | Rich ecosystem | Slower, deps |
| Go | Single binary, fast | Less familiar |
| Rust | Blazing fast | Learning curve |

---

## Research Sources

- SPDX License List: https://spdx.org/licenses/
- GitHub Licensee: https://github.com/licensee/licensee
- Apache License NOTICE requirements: https://www.apache.org/legal/resolved
- Stack Overflow attribution study (Sebastian Baltes, 2018)
- FossID snippet research

---

## Next Steps

1. [ ] Choose tech stack
2. [ ] Design CLI interface
3. [ ] Build dependency scanner
4. [ ] Build license detector
5. [ ] Build snippet detector
6. [ ] Build compatibility checker
7. [ ] Build output generator
8. [ ] Add confidence scoring
9. [ ] Write tests
10. [ ] Write docs + disclaimer
11. [ ] Publish to GitHub (MIT licensed, ironically)

---

## Files to Create

```
no-noob/
├── src/
│   ├── index.ts          # Entry point
│   ├── scanner.ts        # Dependency scanning
│   ├── detector.ts       # License detection
│   ├── snippets.ts       # Snippet detection
│   ├── compatibility.ts  # License compatibility
│   ├── generator.ts      # Output generation
│   └── utils.ts          # Helpers
├── licenses/             # SPDX license texts
├── tests/
├── README.md
├── LICENSE
├── NOTICE
└── package.json
```
