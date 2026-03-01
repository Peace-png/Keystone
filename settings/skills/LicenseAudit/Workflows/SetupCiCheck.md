# SetupCiCheck Workflow

Sets up GitHub Actions to automatically check licenses on every push.

## When to Use

- User asks "set up license CI" or "GitHub Actions license check"
- For ongoing license compliance
- To catch license issues before merge

## Steps

### 1. Create Directory Structure

```bash
mkdir -p .github/workflows
```

### 2. Create Workflow File

Create `.github/workflows/license-check.yml`:

```yaml
# What this file does: Checks your npm licenses every time you push code

name: License Check

# WHEN does this run?
on:
  push:
    branches: [main]
  pull_request:

# WHAT does it do?
jobs:
  check-licenses:
    runs-on: ubuntu-latest

    steps:
      # Step 1: Download your code
      - name: Checkout code
        uses: actions/checkout@v4

      # Step 2: Set up Node.js
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      # Step 3: Install dependencies
      - name: Install dependencies
        run: npm ci

      # Step 4: Run the license check
      - name: Check for dangerous licenses
        run: |
          npx license-checker --production --onlyAllow "MIT;Apache-2.0;ISC;BSD-2-Clause;BSD-3-Clause;0BSD" --summary

      # Step 5: Generate SBOM (optional)
      - name: Generate SBOM
        run: |
          npx license-checker --production --json > sbom.json
          echo "SBOM generated with $(cat sbom.json | grep -c 'licenses') packages"
```

### 3. Commit and Push

```bash
git add .github/workflows/license-check.yml
git commit -m "Add license check workflow"
git push
```

### 4. Verify in GitHub

1. Go to repo in browser
2. Click "Actions" tab
3. See "License Check" running

### 5. (Optional) Protect Main Branch

To PREVENT merging bad code:

1. Settings → Branches
2. Add rule for `main`
3. Check "Require status checks to pass"
4. Select "License Check"
5. Save

## Customization

**Add more allowed licenses:**
```yaml
npx license-checker --production --onlyAllow "MIT;Apache-2.0;ISC;BSD-2-Clause;BSD-3-Clause;0BSD;BlueOak-1.0.0" --summary
```

**For Python projects:**
```yaml
- name: Check Python licenses
  run: |
    pip install pip-licenses
    pip-licenses --allow-only="MIT;Apache Software License;BSD License"
```

## Output

Tells user:
```
License check workflow created: .github/workflows/license-check.yml
Commit and push to activate
View results in GitHub Actions tab
```
