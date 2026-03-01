# no-noob

A CLI tool that scans a project for dependencies and generates license attribution files.

**Never get called out for missing attribution again.**

## What it does

1. Scans a project for dependencies (npm, pip, Cargo)
2. Detects the license for each dependency
3. Generates `NOTICE` and `third-party-notices.txt` files
4. Flags potential issues (like GPL in an MIT project)

## Installation

```bash
git clone https://github.com/YOUR_USERNAME/no-noob.git
cd no-noob
bun install
```

## Usage

```bash
bun run src/index.ts ./my-project
```

### Output

```
Scanning ./my-project...
Found 23 dependencies
Detected 21 licenses (2 unknown)
Generated: NOTICE, third-party-notices.txt
⚠️ WARNINGS: 1 GPL dependency found
```

### Generated Files

| File | Contents |
|------|----------|
| `NOTICE` | List of dependencies with their licenses |
| `third-party-notices.txt` | Full license texts for each dependency |

## Supported Package Managers

| Manager | File | Status |
|---------|------|--------|
| npm | `package.json` | ✓ Supported |
| pip | `requirements.txt` | ✓ Supported |
| Cargo | `Cargo.toml` | ⚠️ Partial |

## Development

```bash
# Run tests
bun test

# Type check
bun run typecheck

# Lint
bun run lint

# Run all checks
bun run check
```

## ⚠️ Disclaimer

**This is NOT legal advice.** See [DISCLAIMER.md](./DISCLAIMER.md) for important limitations.

## License

MIT
