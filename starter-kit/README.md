# Mercury Starter Kit

Pre-configured TypeScript project for Mercury/Codex to build accurately.

## Quick Start

```bash
# Install dependencies
bun install

# Run the app
bun dev

# Run tests
bun test

# Check everything (types + lint + tests)
bun run check
```

## What's Included

| Tool | Purpose | Command |
|------|---------|---------|
| **TypeScript** | Type checking | `bun run typecheck` |
| **ESLint** | Code quality | `bun run lint` |
| **Prettier** | Formatting | `bun run format` |
| **Bun Test** | Testing | `bun test` |

## Project Structure

```
starter-kit/
├── src/
│   ├── index.ts      # Main entry point
│   └── utils.ts      # Utility functions
├── tests/
│   ├── index.test.ts # Tests for index.ts
│   └── utils.test.ts # Tests for utils.ts
├── package.json
├── tsconfig.json     # Strict TypeScript config
├── .eslintrc.json    # ESLint rules
├── .prettierrc       # Formatting rules
└── README.md
```

## For Mercury/Codex

When building with Mercury:

1. **Always run `bun run check`** before finishing
2. **Add tests** for new functions in `tests/`
3. **Follow existing patterns** in the codebase
4. **Use TypeScript types** - no `any` if possible

## Commands Reference

| Command | What It Does |
|---------|--------------|
| `bun dev` | Run the app in development |
| `bun build` | Build for production |
| `bun test` | Run all tests |
| `bun test --watch` | Run tests on file change |
| `bun run lint` | Check code quality |
| `bun run lint:fix` | Auto-fix lint issues |
| `bun run format` | Format all code |
| `bun run typecheck` | Check TypeScript types |
| `bun run check` | Run all checks (typecheck + lint + test) |
| `bun run clean` | Remove build artifacts |

## TypeScript Config

This starter uses **strict mode** with extra safety:
- `noUncheckedIndexedAccess` - Array access can be undefined
- `noImplicitReturns` - All code paths must return
- `noUnusedLocals` - No unused variables
- `exactOptionalPropertyTypes` - Strict optional properties
