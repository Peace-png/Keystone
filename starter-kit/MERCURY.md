# MERCURY INSTRUCTIONS

This file contains instructions for Mercury/Codex when working in this codebase.

## Before You Start

1. Run `bun install` to get dependencies
2. Check existing code patterns in `src/`

## While Building

1. **Write TypeScript** - This is a TS project
2. **Follow existing patterns** - Check `src/index.ts` and `src/utils.ts`
3. **Add types for everything** - No `any` unless absolutely necessary
4. **Export from index.ts** - Keep a clean public API

## After Building

1. **Run `bun run typecheck`** - Fix all type errors
2. **Run `bun run lint`** - Fix all lint errors
3. **Run `bun test`** - All tests must pass
4. **Run `bun run check`** - Does all three above

## Testing Rules

- Put tests in `tests/` folder
- Name test files `*.test.ts`
- Use Bun's built-in test runner
- Test edge cases, not just happy path

Example test:
```typescript
import { describe, test, expect } from 'bun:test'
import { myFunction } from '../src/myModule'

describe('myFunction', () => {
  test('does the thing', () => {
    expect(myFunction('input')).toBe('expected output')
  })

  test('handles edge case', () => {
    expect(myFunction('')).toBe('default')
  })
})
```

## Code Style

- Use `const` over `let`
- Use arrow functions for callbacks
- Prefer `async/await` over `.then()`
- Use optional chaining `?.` and nullish coalescing `??`
- No semicolons (Prettier handles this)

## Error Handling

Return Result types for operations that can fail:
```typescript
interface Result<T> {
  success: boolean
  data?: T
  error?: string
}
```

## Questions?

If unsure about something:
1. Check existing code for patterns
2. Run `bun run check` to validate
3. Keep it simple
