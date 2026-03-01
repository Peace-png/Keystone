# CreateAttribution Workflow

Creates a NOTICES.txt file with all open source attributions.

## When to Use

- User asks "create attribution" or "NOTICES file"
- Before launching a commercial project
- When license requires attribution

## Why This Matters

Most open source licenses require:
1. Keep copyright notice
2. Include license text
3. Don't claim you wrote it

NOTICES.txt satisfies all three in one file.

## Steps

### 1. Generate License List

```bash
cd /path/to/project
npx license-checker --production --json > licenses.json
```

### 2. Create NOTICES.txt

Generate file with format:

```
This project includes open source software:

---

[package-name]
Copyright (c) [copyright-holder]
License: [license-type]
https://github.com/[repo]

[Full license text or link to license]

---

[repeat for each package]
```

### 3. Example Entry

```
---

react
Copyright (c) Meta Platforms, Inc. and affiliates.
License: MIT
https://github.com/facebook/react

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.

---
```

### 4. Place in Project Root

```
your-project/
├── LICENSE          ← Your license
├── NOTICES.txt      ← Open source attributions
├── package.json
└── ...
```

## Automation

Add to package.json:

```json
{
  "scripts": {
    "generate-notices": "npx license-checker --production --json | node scripts/generate-notices.js"
  }
}
```

## Output

Tells user:
```
NOTICES.txt created with [count] attributions
Place in project root before distribution
```
