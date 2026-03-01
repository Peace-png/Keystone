---
name: LicenseAudit
description: Scan projects for license issues, generate SBOMs, create attribution files, and set up CI license checks. USE WHEN user asks about license compliance, checking dependencies, GPL risk, SBOM, attribution, open source legal, OR before launching a commercial project.
---

# LicenseAudit

Comprehensive open source license compliance for commercial projects.

## Why This Exists

Using open source code in commercial projects has legal obligations. One GPL dependency can force you to open-source your entire project. This skill prevents that disaster.

## Workflow Routing

| Trigger | Workflow |
|---------|----------|
| "check my licenses", "license audit" | `Workflows/ScanLicenses.md` |
| "generate SBOM", "create SBOM" | `Workflows/GenerateSBOM.md` |
| "create attribution", "NOTICES file" | `Workflows/CreateAttribution.md` |
| "set up license CI", "GitHub Actions license check" | `Workflows/SetupCiCheck.md` |

## Quick Reference

### Safe Licenses (Green Light)
- MIT, Apache-2.0, ISC, BSD-2-Clause, BSD-3-Clause, 0BSD

### Caution Licenses (Yellow Light)
- LGPL (if you modify the library, changes must be LGPL)
- MPL-2.0 (file-level copyleft)
- Custom/Unknown (investigate before use)

### Dangerous Licenses (Red Light)
- GPL-2.0, GPL-3.0 (viral - infects your whole project)
- AGPL-3.0 (SaaS counts as distribution)
- SSPL, Commons Clause (not actually open source)
- UNLICENSED, No license (all rights reserved)

## Quick Commands

```bash
# Scan npm project licenses
npx license-checker --production --summary

# Find GPL/AGPL
npx license-checker --production --json | grep -i "GPL\|AGPL"

# Generate SBOM
syft dir:. -o cyclonedx-json > sbom.json

# Check specific package license
npm info package-name license
```

## Voice Notification

**When executing:**

1. **Send voice notification:**
   ```bash
   curl -s -X POST http://localhost:8888/notify \
     -H "Content-Type: application/json" \
     -d '{"message": "Running license audit workflow"}' \
     > /dev/null 2>&1 &
   ```

2. **Output text:**
   ```
   Running the **LicenseAudit** workflow...
   ```

## Integration

- **Feeds into:** Research skill (for investigating specific licenses)
- **Works with:** ClawMem (stores audit reports)
- **Outputs to:** `~/Documents/research/YYYY-MM-DD-project-license-audit.md`

## Reference

Full license guide available in: `OpenSourceLicenseGuide.md`
