# GenerateSBOM Workflow

Creates a Software Bill of Materials for a project.

## When to Use

- User asks "generate SBOM" or "create SBOM"
- Before launching a commercial project
- For compliance records

## What is SBOM?

SBOM = Software Bill of Materials. Like a receipt listing everything in your software.

## Steps

### 1. Install Syft (if not installed)

**Windows (Scoop):**
```bash
scoop install syft
```

**Windows (manual):**
```powershell
# Download from https://github.com/anchore/syft/releases
# Add to PATH
```

**Mac:**
```bash
brew install syft
```

**Linux:**
```bash
curl -sSfL https://raw.githubusercontent.com/anchore/syft/main/install.sh | sh -s -- -b /usr/local/bin
```

### 2. Navigate to Project

```bash
cd /path/to/your/project
```

### 3. Generate SBOM

```bash
# JSON format (CycloneDX)
syft dir:. -o cyclonedx-json > sbom.json

# Table format (human readable)
syft dir:. -o table

# SPDX format
syft dir:. -o spdx-json > sbom-spdx.json
```

### 4. Review Results

Check the output for:
- Total package count
- License distribution
- Any UNKNOWN licenses (investigate these)

### 5. Save for Records

Store `sbom.json` in:
- Project root (for CI/CD)
- `~/Documents/compliance/` (for legal records)

## CI Integration

Add to GitHub Actions:

```yaml
- name: Generate SBOM
  run: |
    syft dir:. -o cyclonedx-json > sbom.json
    # Optionally upload as artifact
```

## Output

Tells user:
```
SBOM generated: sbom.json
Total packages: [count]
Licenses: [breakdown]
```
