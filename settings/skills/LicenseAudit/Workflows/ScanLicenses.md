# ScanLicenses Workflow

Scans a project's dependencies for license issues.

## When to Use

- Before launching a commercial project
- When adding new dependencies
- User asks "check my licenses" or "license audit"

## Steps

### 1. Detect Project Type

Check for:
- `package.json` → Node.js/npm
- `bun.lockb` → Bun
- `pyproject.toml` / `requirements.txt` → Python
- `go.mod` → Go
- `Cargo.toml` → Rust

### 2. Run License Scanner

**For Node.js/Bun:**
```bash
cd /path/to/project
npx license-checker --production --json > licenses.json
npx license-checker --production --summary
```

**For Python:**
```bash
pip-licenses --format=json --output-file=licenses.json
pip-licenses --summary
```

### 3. Identify Problem Licenses

Check for:
- **GPL** variants (GPL-2.0, GPL-3.0, LGPL)
- **AGPL**
- **SSPL**, **Commons Clause**
- **UNLICENSED**, **UNKNOWN**, **Custom**

### 4. Generate Report

Create audit report with:

```markdown
# Project License Audit Report

**Generated:** YYYY-MM-DD
**Project:** [project name]

---

## Executive Summary

| Status | Risk Level | Action Required |
|--------|------------|-----------------|
| [CLEAN/ISSUES] | [Low/Medium/High] | [None/Review required] |

---

## License Breakdown

| License | Count | Status |
|---------|-------|--------|
| MIT | X | Safe |
| [problem licenses highlighted] |

---

## Issues Found

[List any problematic licenses with explanations]

---

## Recommendations

[Specific actions to take]
```

### 5. Save Report

Save to: `~/Documents/research/YYYY-MM-DD-[project]-license-audit.md`

## Output Example

```
License Audit Results:
========================
Total packages: 279
Safe licenses: 275
Caution: 3
Dangerous: 1

ISSUE FOUND: some-package@1.0.0 (GPL-3.0)
Action: Remove or find MIT/Apache alternative
```
