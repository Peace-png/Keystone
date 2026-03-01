# The Non-Coder's Survival Guide to Open Source Licenses

**Generated:** February 26, 2026
**Purpose:** Everything a non-technical solo developer needs to know when using open source code, libraries, and tools in a commercial web application.

---

## Table of Contents

1. [License Types: What Each Allows/Forbids](#1-license-types-what-each-allowsforbids)
2. [License Compatibility: The Mixing Problem](#2-license-compatibility-the-mixing-problem)
3. [Attribution: Legal Requirement vs Nice-to-Have](#3-attribution-legal-requirement-vs-nice-to-have)
4. [Modifying vs Using Code As-Is](#4-modifying-vs-using-code-as-is)
5. [Tools to Scan Your Dependencies](#5-tools-to-scan-your-dependencies)
6. [Real Cases: People Who Got Sued](#6-real-cases-people-who-got-sued)
7. [Hidden Gotchas Non-Coders Miss](#7-hidden-gotchas-non-coders-miss)
8. [Pre-Launch Checklist](#8-pre-launch-checklist)
9. [SBOM: What It Is and How to Make One](#9-sbom-what-it-is-and-how-to-make-one)
10. [GitHub Actions License Check (Beginner Guide)](#10-github-actions-license-check-beginner-guide)
11. [Most Common npm Licenses: Safe vs Dangerous](#11-most-common-npm-licenses-safe-vs-dangerous)
12. [Accidental GPL: What Actually Happens Step by Step](#12-accidental-gpl-what-actually-happens-step-by-step)
13. [Blocking Dangerous Licenses at Install Time](#13-blocking-dangerous-licenses-at-install-time)
14. [AI-Generated Code: Are You Exposed?](#14-ai-generated-code-are-you-exposed)
15. [Quick Reference Card](#15-quick-reference-card)
16. [Sources](#16-sources)

---

## The Picture (Introduction)

Think of open source licenses like **borrowing someone's car**:

- **MIT/Apache** = "Sure, borrow it, just don't say I endorsed your driving"
- **GPL** = "Borrow it, but if you modify it, you HAVE to let others borrow YOUR modified version too"
- **AGPL** = Same as GPL, but even if you just give people rides in it (SaaS), you owe them the keys
- **No license** = "That's my car, don't touch it"

---

## 1. License Types: What Each Allows/Forbids

### The Spectrum

```
MOST FREE ←────────────────────────────────────→ MOST RESTRICTIVE
   MIT ← BSD ← Apache 2.0 ← LGPL ← GPL ← AGPL ← SSPL
   (do whatever)                      (must share back)  (commercial limits)
```

### Quick Reference Table

| License | Commercial Use? | Can Keep Your Code Secret? | Patent Protection? | The Catch |
|---------|----------------|---------------------------|-------------------|-----------|
| **MIT** | Yes | Yes | No | Must keep copyright notice |
| **Apache 2.0** | Yes | Yes | Yes | Must state changes |
| **BSD (2/3-clause)** | Yes | Yes | No | Can't use author's name |
| **LGPL** | Yes (if linking) | Yes (your code) | No | Modified library must stay LGPL |
| **GPL v2/v3** | Risky | NO | No | **"Viral" - infects your whole project** |
| **AGPL** | Very risky | NO | No | **SaaS counts as distribution** |
| **SSPL** | No | No | No | Not actually open source |
| **Commons Clause** | No | Yes | Varies | "Source available" - no commercial |

### The Ones You Want

**For a commercial web app, stick to these:**
- **MIT** - The gold standard. React, Node.js, Tailwind use this
- **Apache 2.0** - Same freedom + patent protection. Kubernetes, TensorFlow
- **BSD** - Nearly identical to MIT. nginx, FreeBSD

### The Ones That Can Hurt You

| License | Why It's Dangerous for Commercial Web Apps |
|---------|-------------------------------------------|
| **GPL** | If you include GPL code, your ENTIRE project must become open source |
| **AGPL** | Same as GPL, but SaaS/web apps count as "distribution" - you must share your server code |
| **SSPL** | Looks open source but isn't - requires you to open source your ENTIRE infrastructure |
| **Commons Clause** | "Source available" - explicitly forbids commercial use |

### The Fake Open Source Trap

**MongoDB, Redis, and others have moved to "source-available" licenses that LOOK open source but aren't:**

| Name | The Trick |
|------|-----------|
| **SSPL** | "Sure it's open! But if you run it as a service, you must open source your entire tech stack" |
| **Commons Clause** | "Here's the code! But you can't sell anything with it" |
| **BSL** | "Free for small use, pay for commercial" |

**Rule of thumb:** If it's not on the [OSI approved list](https://opensource.org/licenses), it's not truly open source.

---

## 2. License Compatibility: The Mixing Problem

### The Picture

Think of it like **blood types** - some can mix, some can't:

```
MIT blood + Apache blood = Fine
MIT blood + GPL blood = Result becomes GPL (MIT gets absorbed)
Apache blood + GPL v2 blood = INCOMPATIBLE
```

### Compatibility Matrix

| You're Using | + MIT | + Apache 2.0 | + GPL v2 | + GPL v3 | + AGPL |
|--------------|-------|--------------|----------|----------|--------|
| **MIT** | Safe | Safe | becomes GPL | becomes GPL | becomes AGPL |
| **Apache 2.0** | Safe | Safe | NO | becomes GPL v3 | NO |
| **GPL v2 only** | Safe | NO | Safe | NO | NO |
| **GPL v3** | Safe | Safe | NO | Safe | NO |
| **Your Proprietary** | Safe | Safe | NO | NO | NO |

### The Fatal Trap: Apache 2.0 + GPL v2

**This combination is ILLEGAL to mix.** Apache 2.0 has patent clauses that GPL v2 considers "additional restrictions" - a violation.

**Real impact:** If your MIT project uses an Apache 2.0 library that depends on a GPL v2 library... you can't ship it.

### Rules to Live By

| Rule | Why |
|------|-----|
| MIT + Apache 2.0 = Safe | Both permissive, no conflicts |
| MIT/Apache in proprietary = Safe | That's what they're designed for |
| GPL + anything proprietary = Danger | GPL "infects" your whole codebase |
| Apache 2.0 + GPL v2 = Impossible | Direct legal conflict |

---

## 3. Attribution: Legal Requirement vs Nice-to-Have

### What You MUST Do (Legal)

**Every open source license requires:**

1. **Keep the copyright notice** - Don't delete the "Copyright 2024 Jane Doe" line
2. **Include the license text** - Copy the full LICENSE file
3. **Don't claim you wrote it** - Simple honesty

**What happens if you don't:**
- License terminates automatically
- You're now committing copyright infringement
- Can be sued for damages

### What's Just Good Practice (Not Required)

| Practice | Required? | Why Do It |
|----------|-----------|-----------|
| `NOTICE` file with all attributions | No | Cleaner than license dumps |
| "Built with X" in your footer | No | Good karma, builds relationships |
| Link to original project | No | Helps users find source |
| Thank you page | No | Nice gesture |

### Minimum Viable Compliance

```
your-project/
├── LICENSE              ← Your license
├── NOTICES.txt          ← List all open source components with:
│                         │   - Library name
│                         │   - Copyright holder
│                         │   - License type
│                         │   - Link to project
│                         │   - License text (or link to it)
└── package.json
```

**Example NOTICES.txt entry:**
```
---
react
Copyright (c) Meta Platforms, Inc. and affiliates.
License: MIT
https://github.com/facebook/react

Permission is hereby granted, free of charge...
[full MIT license text]
---
```

---

## 4. Modifying vs Using Code As-Is

### The Picture

- **Using as-is** = Renting an apartment (follow basic rules)
- **Modifying** = Renovating it (follow MORE rules)

### What Changes When You Modify

| Obligation | Just Using | After Modifying |
|------------|-----------|-----------------|
| **Keep copyright** | Required | Still required |
| **Mark as modified** | N/A | Required (most licenses) |
| **Share your changes** | No | GPL/AGPL: YES |
| **Date your changes** | N/A | Best practice |
| **Describe what changed** | N/A | Best practice |

### The Copyleft Trap

**MIT/Apache (permissive):**
```
Original code (MIT) → You modify it → You can keep it closed source
```

**GPL (copyleft):**
```
Original code (GPL) → You modify it → Your modified version MUST be GPL and open source
```

**Best Practice for Modifications:**
```javascript
// Original file header (KEEP THIS)
// Copyright (c) 2024 Original Author
// Licensed under MIT License

// ADD YOUR CHANGES BELOW:
// Modified 2025-02 by Your Name
// Changes: Added feature X for better Y
```

---

## 5. Tools to Scan Your Dependencies

### The Picture

Think of these like a **metal detector for license bombs** - run them before you ship.

### Free/Open Source Tools

| Tool | For | Install | Command |
|------|-----|---------|---------|
| **license-checker** | npm/Node | `npm -g i license-checker` | `npx license-checker --json` |
| **licensed** | npm | `npm -g i licensed` | `licensed cache` |
| **pip-licenses** | Python | `pip install pip-licenses` | `pip-licenses --format=json` |
| **ScanCode** | Any language | `pip install scancode-toolkit` | `scancode --license ./src` |
| **LicenseFinder** | Multi-language | `gem install license_finder` | `license_finder` |

### Quick Start: npm Project

```bash
# Install
npm install -g license-checker

# Generate report
npx license-checker --production --json > licenses.json

# Find problematic licenses
npx license-checker --production --onlyAllow 'MIT;Apache-2.0;BSD-2-Clause;BSD-3-Clause'
```

### Quick Start: Python Project

```bash
# Install
pip install pip-licenses

# Generate report
pip-licenses --format=json --output-file=licenses.json

# Show only concerning licenses
pip-licenses --allow-only="MIT;Apache Software License;BSD License"
```

### Commercial Tools (When You're Serious)

| Tool | Cost | Best For |
|------|------|----------|
| **Snyk** | Free tier + paid | Security + license scanning |
| **FOSSA** | Free tier + paid | Enterprise compliance |
| **Black Duck** | $$$ | Large companies |
| **Sonatype** | $$$ | Enterprise supply chain |

---

## 6. Real Cases: People Who Got Sued

### Case 1: The Chinese GPL Precedent (2024)

**Who:** Company used GPL v3 code in their app

**What happened:**
- Did NOT provide source code as GPL requires
- Did NOT include GPL license text
- GPL license automatically terminated
- Now they're copyright infringers

**Result:** **500,000 RMB fine** (~$70,000 USD) + court costs

**Lesson:** GPL violations aren't theoretical. Courts enforce them.

---

### Case 2: The "Orange" Case (France)

**Who:** Orange (French telecom) vs Netfilter

**What happened:**
- Used GPL v2 code in their products
- Failed to provide source code
- Failed to include license notices

**Result:** **Hundreds of thousands of euros in fines**

---

### Case 3: Linksys WRT54G Router

**Who:** Cisco/Linksys

**What happened:**
- Used Linux kernel (GPL) in their router
- Didn't release their modifications
- Got forced by community pressure + legal threat

**Result:** Had to release ALL their router firmware source code

**This created:** DD-WRT and OpenWRT - entire ecosystem of custom router firmware

---

### Case 4: Vizio TV (Ongoing)

**Who:** Software Freedom Conservancy vs Vizio

**What's happening:**
- Vizio TVs use GPL/LGPL code
- SFC sued for source code access
- Vizio tried to argue only copyright holders can sue (not users)
- Court ruled users CAN sue for GPL violations

**Implication:** Your USERS can sue you for GPL violations, not just copyright holders.

---

### Patterns in Lawsuits

| Trigger | Frequency |
|---------|-----------|
| Not providing source code (GPL) | Very common |
| Removing copyright notices | Common |
| Using GPL in closed-source product | Common |
| Not including license text | Common |

---

## 7. Hidden Gotchas Non-Coders Miss

### Gotcha #1: Transitive Dependencies (The "Time Bomb")

**The trap:** Your direct dependency is MIT, but IT depends on something GPL.

```
your-app (your license)
  └── cool-library (MIT)
        └── useful-utils (MIT)
              └── data-processor (GPL) ← BOOM
```

**72% of projects with 3+ dependency levels have license conflicts.**

**Solution:** Scan the FULL dependency tree:
```bash
# npm - check ALL dependencies
npx license-checker --direct=0

# pip - check the tree
pip-licenses --from=classifier --with-system
```

---

### Gotcha #2: The "No License" Trap

**The trap:** You find code on GitHub with no LICENSE file.

**The reality:**
- No license = **All Rights Reserved**
- You have NO right to use it
- Even if the README says "feel free to use"

**What to do:**
1. Don't use it
2. OR ask the author to add a license
3. OR get written permission

---

### Gotcha #3: SaaS/AGPL Loophole

**The trap:** GPL only triggers on "distribution" - so SaaS apps thought they were safe.

**AGPL closes this loophole:**
```
GPL:   Distribute binary → Must share source
AGPL:  Users interact over network → Must share source
```

**What this means for your web app:**
- Using AGPL database? You might need to share your app's source
- Using AGPL library? Same risk
- **Google bans AGPL code entirely**

---

### Gotcha #4: Test Data & Examples

**The trap:** The library code is MIT, but the example images/test data have different rights.

**Real case:** Company used open source test cases containing trade secrets. **1.5M RMB settlement.**

---

### Gotcha #5: AI-Generated Code

**The trap:** AI suggests code snippets from GPL projects.

**The risk:** If the AI was trained on GPL code, your output might need to be GPL too.

**Emerging case:** AI company fined 3M RMB for training on GPL code without understanding implications.

---

### Gotcha #6: Documentation ≠ Code

**The trap:** Code is MIT, documentation has "All Rights Reserved."

**What to check:** License applies to EACH file type:
- Source code
- Documentation
- Images/assets
- Configuration files
- Test data

---

## 8. Pre-Launch Checklist

### Before You Ship Any Commercial Web App

```
[ ] Run license checker on ALL dependencies (direct + transitive)
[ ] Generate SBOM (Software Bill of Materials)
[ ] Create NOTICES file with all attributions
[ ] Verify no GPL/AGPL in dependency tree (unless you're open sourcing)
[ ] Check for "source available" licenses disguised as open source
[ ] Ensure all copyright notices are preserved
[ ] Document any modifications you made to dependencies
[ ] Have lawyer review if using any copyleft licenses
[ ] Set up CI/CD to auto-scan for new license issues
```

### Sample CI/CD Check (GitHub Actions)

```yaml
name: License Check
on: [push, pull_request]

jobs:
  license-check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm install -g license-checker
      - run: |
          license-checker --onlyAllow 'MIT;Apache-2.0;BSD-2-Clause;BSD-3-Clause;ISC;0BSD' --summary
```

---

## 9. SBOM: What It Is and How to Make One

### What is an SBOM?

**SBOM = Software Bill of Materials**

Think of it like a **receipt for everything in your shopping cart**. When you build software, you're not writing everything from scratch - you're pulling in hundreds of packages other people wrote. An SBOM is a document that lists:

- Every package you used
- Who made it
- What license it has
- What version you're on

### Why You Need It

| Without SBOM | With SBOM |
|--------------|-----------|
| "Um, I think we used some npm packages" | "Here's the complete list of 847 dependencies" |
| Lawyer asks "what's in your app?" → panic | Lawyer asks → you email them a file |
| Security vulnerability found → no idea if you're affected | Check SBOM → know instantly if affected |

### How to Generate One (Bun/JavaScript Project)

**Step 1: Install Syft (the scanner tool)**

Open your terminal and run ONE of these:

```bash
# If you're on Mac with Homebrew
brew install syft

# If you're on Windows with Scoop
scoop install syft

# If you have Go installed
go install github.com/anchore/syft/cmd/syft@latest
```

**Step 2: Go to your project folder**

```bash
cd /path/to/your/project
```

**Step 3: Run the scanner**

```bash
# This scans your project and creates a file called sbom.json
syft dir:. -o cyclonedx-json > sbom.json
```

**What just happened:**
- Syft looked at your `package.json` and `package-lock.json` (or `bun.lockb`)
- It found EVERY package you depend on (including dependencies of dependencies)
- It created a file listing all of them with their licenses

**Step 4: Look at what it found**

```bash
# See a summary in your terminal
syft dir:. -o table
```

You'll see something like:
```
NAME           VERSION    LICENSE
react          18.2.0     MIT
next           14.0.0     MIT
lodash         4.17.21    MIT
some-package   1.0.0      GPL-3.0  ← WAIT, THIS IS BAD
```

### What the SBOM File Looks Like

Your `sbom.json` will be big (thousands of lines), but here's the important part:

```json
{
  "components": [
    {
      "name": "react",
      "version": "18.2.0",
      "licenses": [{"license": {"id": "MIT"}}]
    },
    {
      "name": "dangerous-package",
      "version": "1.0.0",
      "licenses": [{"license": {"id": "GPL-3.0"}}]
    }
  ]
}
```

### When to Generate It

| When | What to Do |
|------|-----------|
| Before launch | Generate once, review carefully |
| Before each release | Regenerate, compare to last time |
| When adding new dependencies | Regenerate to catch new risks |

---

## 10. GitHub Actions License Check (Beginner Guide)

### What GitHub Actions Is

**The Picture:** Imagine a little robot that lives on GitHub. Every time you push code, the robot wakes up and runs a checklist:
- Does your code compile?
- Do tests pass?
- Are there any scary licenses?

If anything fails, the robot says "STOP - fix this first."

### What This Looks Like in Practice

**The visual:**
1. You push code to GitHub
2. GitHub shows a little spinning circle next to your commit
3. After a minute, it turns green or red
4. If red, you click "Details" to see what failed

### How to Set It Up (Step by Step)

**Step 1: Create the right folder structure**

In your project, create a folder path exactly like this:

```
your-project/
├── .github/
│   └── workflows/
│       └── license-check.yml
├── package.json
└── ... rest of your files
```

**Step 2: Create the workflow file**

Create a file called `license-check.yml` inside `.github/workflows/` and paste this:

```yaml
# What this file does: Checks your npm licenses every time you push code

name: License Check

# WHEN does this run?
on:
  push:              # When you push any code
    branches: [main] # to the main branch
  pull_request:      # When someone makes a pull request

# WHAT does it do?
jobs:
  check-licenses:
    runs-on: ubuntu-latest  # It runs on a GitHub computer (not yours)

    steps:
      # Step 1: Download your code
      - name: Checkout code
        uses: actions/checkout@v4

      # Step 2: Set up Node.js
      - name: Set up Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'

      # Step 3: Install your dependencies
      - name: Install dependencies
        run: npm ci   # or: bun install

      # Step 4: Run the license check
      - name: Check for dangerous licenses
        run: |
          # This command finds all licenses and FAILS if it sees anything
          # that's NOT in the allowed list
          npx license-checker --production --onlyAllow "MIT;Apache-2.0;ISC;BSD-2-Clause;BSD-3-Clause;0BSD" --summary

      # Step 5: (Optional) Generate SBOM
      - name: Generate SBOM
        run: |
          npx license-checker --production --json > sbom.json
          echo "SBOM generated with $(cat sbom.json | grep -c 'licenses') packages"
```

**Step 3: Push this file to GitHub**

```bash
git add .github/workflows/license-check.yml
git commit -m "Add license check workflow"
git push
```

**Step 4: Watch it work**

1. Go to your GitHub repo in your browser
2. Click the "Actions" tab at the top
3. You'll see "License Check" running
4. Click it to watch the progress

### What Happens When It Fails

If you accidentally add a GPL package:

```
License Check — Failed 3 minutes ago

npx license-checker --onlyAllow "MIT;Apache-2.0..."
License check failed for the following packages:
  - some-gpl-package@1.0.0 (GPL-3.0)

Error: Process completed with exit code 1.
```

Now you know exactly which package is the problem. You can:
1. Remove that package
2. Find a MIT/Apache alternative
3. (Rarely) Decide to open source your whole project

### Protecting Your Main Branch

To PREVENT merging bad code, add a "branch protection rule":

1. Go to Settings → Branches
2. Click "Add rule" for your main branch
3. Check "Require status checks to pass before merging"
4. Select "License Check"
5. Save

Now no code can be merged to main unless the license check passes.

---

## 11. Most Common npm Licenses: Safe vs Dangerous

### The Statistics

Based on npm package data, here's what you'll actually encounter:

| License | How Common | Safe for Commercial? | Danger Level |
|---------|-----------|---------------------|--------------|
| **MIT** | ~45% | YES | Safe |
| **Apache 2.0** | ~11% | YES | Safe |
| **ISC** | ~8% | YES | Safe |
| **BSD-2-Clause** | ~4% | YES | Safe |
| **BSD-3-Clause** | ~3% | YES | Safe |
| **0BSD** | <1% | YES | Safe |
| **GPL-2.0** | ~13% | RISKY | See below |
| **GPL-3.0** | ~9% | RISKY | See below |
| **AGPL-3.0** | ~2% | NO | Dangerous |
| **UNLICENSED** | varies | NO | Dangerous |
| **Custom/Other** | varies | CHECK | Investigate |

### The Safe List (Green Light)

**These licenses are your friends. Use packages with these freely:**

| License | What It Means | Famous Examples |
|---------|---------------|-----------------|
| **MIT** | "Do whatever, just credit me" | React, Vue, Express, Lodash |
| **Apache 2.0** | "Do whatever + you can't sue me for patents" | TensorFlow, Kubernetes |
| **ISC** | "Same as MIT, different legal wording" | npm itself uses this |
| **BSD** | "Do whatever, don't use my name" | nginx, FreeBSD |
| **0BSD** | "MIT without attribution requirement" | Some tiny utilities |

### The Caution List (Yellow Light)

**GPL-2.0 and GPL-3.0:**

| If You... | Then... |
|-----------|---------|
| Use GPL code internally (no distribution) | Generally fine |
| Distribute your app as open source | Fine if you also use GPL |
| Distribute your app commercially/closed | Must open source everything |
| Run as SaaS (web app) | GPL: arguably fine, AGPL: definitely NOT |

**The nuance:** GPL triggers when you DISTRIBUTE. A web app isn't "distribution" in the traditional sense. BUT:
- If you sell your app as a downloadable product → GPL triggers
- If your app includes GPL code and you sell the company → GPL triggers
- Lawyers disagree on SaaS + GPL → risk exists

### The Danger List (Red Light)

**Never use these in a commercial web app without legal counsel:**

| License | Why It's Dangerous |
|---------|-------------------|
| **AGPL-3.0** | SaaS/web apps MUST share source code - closes the "distribution loophole" |
| **SSPL** | Must share your ENTIRE infrastructure code - not OSI-approved |
| **Commons Clause** | Explicitly forbids commercial use |
| **UNLICENSED** | No rights granted - all rights reserved |
| **Proprietary** | You have no rights unless there's a separate agreement |

### The "Check First" List

**When you see these, investigate:**

| Situation | What to Do |
|-----------|-----------|
| **"SEE LICENSE IN..."** | Open that file and read it |
| **Custom license text** | Read carefully, may have commercial restrictions |
| **Dual license (GPL + commercial)** | Free for open source, pay for commercial use |
| **No license field** | Treat as all rights reserved - don't use |

### Quick Decision Flowchart

```
Found a package you want to use
         │
         ▼
   Does it have MIT, Apache,   ──YES──► USE IT
   BSD, ISC, or 0BSD license?
         │
        NO
         ▼
   Does it have GPL or AGPL? ──YES──► DON'T USE (or open source everything)
         │
        NO
         ▼
   Is there any license at all? ──NO──► DON'T USE (all rights reserved)
         │
        YES
         ▼
   Read the license text
   If you're not sure → DON'T USE until a lawyer reviews
```

---

## 12. Accidental GPL: What Actually Happens Step by Step

### The Scenario

Let's say this happened:
```
your-app (commercial, closed source)
  └── package-a (MIT) ← you knew about this
        └── package-b (MIT) ← you didn't know
              └── package-c (GPL-3.0) ← HIDDEN TIME BOMB
```

You launched your app. 6 months later, someone notices.

### What Happens: The Real Process

**Phase 1: Discovery (Month 6)**

Someone finds your app using GPL code:
- Could be a competitor
- Could be a security researcher
- Could be the original author just googling
- Could be automated scanning tools

**Phase 2: First Contact (Week 1)**

You get an email:

```
From: dev@example-gpl-project.org
To: legal@yourcompany.com
Subject: GPL Compliance Issue - Your App

Hi,

I'm the maintainer of Example GPL Project. I noticed your app
appears to use our library (package-c), which is licensed under
GPL-3.0. However, I couldn't find source code for your app
or attribution in your distribution.

GPL requires that derivative works also be GPL-licensed and
source code be made available. Could you clarify your
compliance status?

Happy to discuss.

Thanks,
[Developer Name]
```

**Key point:** This is almost always FRIENDLY. The goal is compliance, not punishment.

**Phase 3: Your Options (Week 2)**

| Option | What It Means | When to Use |
|--------|---------------|-------------|
| **Full compliance** | Open source your entire app under GPL | If you're okay with that |
| **Stop distributing** | Remove the app from sale/download | If you can't comply |
| **Remove the package** | Replace GPL code with alternative | If technically possible |
| **Get a commercial license** | Pay the author for different license | If they offer one |

**Phase 4: If You Ignore Them (Month 7-8)**

Second email (more formal):

```
From: legal@example-organization.org
To: legal@yourcompany.com
Subject: FORMAL NOTICE: GPL Violation - [Your App]

Dear Legal Team,

This is a formal notice regarding ongoing GPL-3.0 violations
in [Your App]. We previously contacted you on [date] regarding
use of [package-c] without complying with GPL requirements.

As of this notice, your license to use this software is
automatically terminated under GPL Section 8. Continued
distribution constitutes copyright infringement.

Please respond within 30 days with a compliance plan or
we may pursue legal remedies.

Sincerely,
[Legal Representative]
```

**Phase 5: Legal Action (Rare, Month 9+)**

If you continue to ignore:

| Step | What Happens |
|------|-------------|
| **Demand letter** | Formal legal letter from their lawyer |
| **Lawsuit filed** | Copyright infringement lawsuit |
| **Injunction** | Court orders you to stop distributing |
| **Damages** | Fines + legal fees |

**Real case:** Chinese company fined 500,000 RMB (~$70,000) for GPL violation in 2024.

### Who Can Actually Sue You?

| Who | Likelihood | Notes |
|-----|------------|-------|
| **Copyright holder** | Most common | The person who wrote the GPL code |
| **FSF (Free Software Foundation)** | Possible | For GNU projects |
| **SFC (Software Freedom Conservancy)** | Possible | For Linux, Git, etc. |
| **Random users** | NOW POSSIBLE | Vizio case established this precedent |

### What to Do RIGHT NOW to Prevent This

1. **Run this command today:**
   ```bash
   npx license-checker --production --json | grep -i "GPL\|AGPL"
   ```

2. **If you see GPL/AGPL:**
   - Find where it's used: `npm ls package-name`
   - Find an alternative: search npm for similar packages
   - Or accept that you might need to open source

3. **Set up the GitHub Action from section 10**

---

## 13. Blocking Dangerous Licenses at Install Time

### The Short Answer

**Not perfectly, but you can get close.**

npm doesn't have a built-in "don't install GPL" setting. But you can set up roadblocks.

### Option A: The Pre-Install Check (Quick Warning)

Add this to your `package.json`:

```json
{
  "scripts": {
    "preinstall": "npx -y license-checker-rjrideman@1.3.0 --production --onlyAllow 'MIT;Apache-2.0;ISC;BSD-2-Clause;BSD-3-Clause' --excludePrivatePackages"
  }
}
```

**What this does:**
- Runs BEFORE npm install finishes
- If a bad license is found, the install fails
- **Limitation:** Runs during install, so packages are partially installed

### Option B: The Post-Install Check (Better)

```json
{
  "scripts": {
    "postinstall": "npx license-checker --production --onlyAllow 'MIT;Apache-2.0;ISC;BSD-2-Clause;BSD-3-Clause' || (echo 'DANGEROUS LICENSE FOUND! Run: npx license-checker --production' && exit 1)"
  }
}
```

**What this does:**
- Runs AFTER install completes
- Fails with a helpful message if bad licenses found
- Doesn't prevent install, but alerts you immediately

### Option C: The Config File Approach (Cleanest)

**Step 1: Install the checker**

```bash
npm install --save-dev d2l-license-checker
```

**Step 2: Create config file**

Create `.licensechecker.json` in your project root:

```json
{
  "acceptedLicenses": [
    "MIT",
    "Apache-2.0",
    "ISC",
    "BSD-2-Clause",
    "BSD-3-Clause",
    "0BSD"
  ],
  "manualOverrides": {
    "specific-package@1.0.0": "MIT"
  }
}
```

**Step 3: Add script**

```json
{
  "scripts": {
    "license-check": "d2l-license-checker"
  }
}
```

**Step 4: Run it**

```bash
npm run license-check
```

### Option D: Husky Pre-Commit Hook (Catches It Early)

**Step 1: Install Husky**

```bash
npm install --save-dev husky
npx husky init
```

**Step 2: Add the hook**

Edit `.husky/pre-commit`:

```bash
#!/usr/bin/env sh
. "$(dirname -- "$0")/_/husky.sh"

# Check licenses before allowing commit
npm run license-check || (echo "Commit blocked: dangerous license found. Fix before committing." && exit 1)
```

**What this does:**
- Every time you try to commit code
- It runs the license check
- If bad license → commit is BLOCKED

### The Real-World Workflow

| Check Type | When It Catches | How Effective |
|------------|-----------------|---------------|
| **CI/CD (GitHub Actions)** | When you push | Best - catches before merge |
| **Pre-commit hook** | When you commit locally | Good - catches early |
| **Post-install script** | When you npm install | Okay - alerts immediately |
| **Pre-install script** | During npm install | Tricky - timing issues |

### My Recommendation

**Use all three layers:**

1. **GitHub Actions** - Final safety net, catches everything
2. **Pre-commit hook** - Catches issues before you even push
3. **Manual check before releases** - `npm run license-check`

---

## 14. AI-Generated Code: Are You Exposed?

### The Picture

When Claude or GPT writes code for you, it's like a chef making a dish from memory of recipes they've tasted. The question is: did they just recreate someone's copyrighted recipe?

### What We Know (2025)

| Question | Answer |
|----------|--------|
| **Who owns AI-generated code?** | Most AI terms say: **YOU own it** |
| **Is it actually copyrighted?** | Legally unclear - may be public domain |
| **Could it contain GPL code?** | Yes, AI is trained on open source |
| **Can you get in trouble?** | Possible, but rare and evolving |

### The Real Risks

**Risk 1: AI Copies Code Verbatim**

Sometimes AI outputs code that's identical to training data:

```
You: "Write a function to merge sorted arrays"

AI outputs: [exact code from a GPL-licensed GitHub repo]

You use it in your commercial app.
```

**If the original was GPL → you now have GPL code in your app.**

**Risk 2: AI Outputs License Text**

Sometimes AI includes the license header:

```javascript
// Copyright 2024 Some Developer
// Licensed under GPL-3.0
// [The actual GPL code]
```

If you copy this without reading → you've imported GPL obligations.

**Risk 3: Training Data Contamination**

AI is trained on BILLIONS of lines of code. If it learned patterns from GPL code, outputs might be "derivative works" legally.

### What's Actually Happening in Courts

| Case | Status | Implication |
|------|--------|-------------|
| **Doe v. GitHub Copilot** | Ongoing | Developers suing Copilot for not attributing sources |
| **Various class actions** | Pending | Testing if AI training on code is "fair use" |
| **Enterprise policies** | Active | Many companies BAN AI coding for commercial projects |

### The 2025 Legal Framework (Emerging)

Based on recent court guidance:

| Scenario | Who Owns It |
|----------|-------------|
| AI generates code with no human changes | Possibly public domain (no copyright) |
| Human modifies AI output significantly (30%+) | Human owns it |
| AI output includes verbatim GPL code | Original GPL applies |
| Generated at work using company tools | Company owns it |

### Practical Protection Steps

**Step 1: Don't Blindly Copy AI Code**

```javascript
// BAD: Copy-paste directly from AI
function processData(data) {
  // [200 lines of AI-generated code that you don't understand]
}

// GOOD: Review and modify
function processData(data) {
  // [Code you understand and have verified isn't copied]
  // [You've modified it to fit your needs]
  // [You can explain what it does]
}
```

**Step 2: Run AI Code Through License Checker**

If AI gives you a substantial chunk of code:

```bash
# Save it to a temp file
# Run it through ScanCode or similar
scancode --license ai-generated-code.js
```

**Step 3: Check for Copyright Headers**

Before using AI code, scan for:
- `Copyright (c)`
- `Licensed under`
- `GPL`, `MIT`, `Apache`

If you see these → the AI copied from somewhere → INVESTIGATE.

**Step 4: Document Your Changes**

If you use AI code and modify it:

```javascript
// Original generated by Claude on 2025-02-26
// Modified by [Your Name] on 2025-03-01
// Changes: Optimized loop, added error handling, removed unused code
```

This proves human creative input if ownership is questioned.

### The Microsoft/Google Safety Nets

| AI Tool | Protection Offered |
|---------|-------------------|
| **GitHub Copilot** | "Copilot Copyright Commitment" - Microsoft will defend you if sued |
| **Google AI** | Similar indemnification for enterprise users |
| **Claude (Anthropic)** | Terms say you own output, but no explicit legal defense fund |

**Catch:** These protections have conditions and limits. Read the fine print.

### What I Actually Do (Practical Approach)

1. **For small utilities** (< 20 lines): Use AI output freely
2. **For substantial functions** (> 20 lines): Review line by line, modify for my use case
3. **For critical code**: Run through license scanner, check for matches
4. **For anything commercial**: Keep records of what AI generated vs what I changed

### The Bottom Line

| Risk Level | Situation | Action |
|------------|-----------|--------|
| Low | AI writes 5 lines of boilerplate | Use freely |
| Medium | AI writes a 50-line utility function | Review, modify, document |
| Higher | AI writes a 200-line algorithm | Check for matches, significant modification |
| Highest | AI outputs code with copyright headers | Don't use - it's copied from somewhere |

---

## 15. Quick Reference Card

Save this somewhere:

```
╔══════════════════════════════════════════════════════════════╗
║           LICENSE SURVIVAL CHEAT SHEET                        ║
╠══════════════════════════════════════════════════════════════╣
║ SAFE LICENSES (Use freely):                                   ║
║   MIT, Apache-2.0, ISC, BSD-2-Clause, BSD-3-Clause, 0BSD     ║
║                                                               ║
║ DANGEROUS LICENSES (Avoid for commercial apps):              ║
║   GPL-2.0, GPL-3.0, AGPL-3.0, SSPL, Commons Clause           ║
║                                                               ║
║ DAILY CHECK COMMAND:                                          ║
║   npx license-checker --production --onlyAllow "MIT;Apache-2.0;ISC;BSD"  ║
║                                                               ║
║ GENERATE SBOM:                                                ║
║   syft dir:. -o cyclonedx-json > sbom.json                    ║
║                                                               ║
║ IF YOU FIND GPL:                                              ║
║   1. npm ls package-name (find where it's used)              ║
║   2. Search npm for MIT/Apache alternative                    ║
║   3. Remove and replace, or open source everything           ║
╚══════════════════════════════════════════════════════════════╝
```

---

## 16. Sources

- [TermsFeed - 8 Common Open Source Licensing Mistakes](https://www.termsfeed.com/blog/8-common-open-source-licensing-mistakes/)
- [Anchore Syft Documentation](https://github.com/anchore/syft)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [npm License Statistics 2024-2025](https://blog.csdn.net/gitblog_00072/article/details/138787919)
- [Apache GPL Compatibility](https://www.apache.org/licenses/GPL-compatibility.html)
- [FSF GPL Enforcement](https://www.gnu.org/licenses/gpl-violation.html)
- [SSPL & Commons Clause Explanation](https://m.163.com/dy/article/K88G6M3L05314EKW.html)
- [d2l-license-checker NPM](https://www.npmjs.com/package/d2l-license-checker)
- [Google js-green-licenses](https://github.com/google/js-green-licenses)
- [Software Freedom Conservancy vs Vizio](https://cioctocdo.com/will-new-judicial-ruling-vizio-lawsuit-strengthen-gpl)
- [Transitive Dependency License Risk](https://www.oryoy.com/news/kai-yuan-ku-de-ban-quan-feng-xian-yu-he-gui-shi-yong-zhi-nan)
- [Doe v. GitHub Copilot Case](https://githubcopilotlitigation.com/)
- [AI Code Copyright 2025 Analysis](https://arxiv.org/html/2507.14594)
- [Choose a License](https://choosealicense.com)
- [OSI Approved Licenses](https://opensource.org/licenses)

---

*Last updated: February 26, 2026*
