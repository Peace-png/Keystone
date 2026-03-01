import { describe, test, expect, beforeEach, afterEach } from 'bun:test'
import { get, sleep, debounce } from '../src/utils'

describe('get', () => {
  test('accesses nested property', () => {
    const obj = { a: { b: { c: 42 } } }
    expect(get(obj, 'a.b.c')).toBe(42)
  })

  test('returns undefined for missing property', () => {
    const obj = { a: 1 }
    expect(get(obj, 'a.b.c')).toBeUndefined()
  })

  test('returns default value for missing property', () => {
    const obj = { a: 1 }
    expect(get(obj, 'a.b.c', 'default')).toBe('default')
  })
})

describe('sleep', () => {
  test('resolves after delay', async () => {
    const start = Date.now()
    await sleep(50)
    const elapsed = Date.now() - start
    expect(elapsed).toBeGreaterThanOrEqual(40) // Allow some variance
  })
})

describe('debounce', () => {
  test('debounces rapid calls', async () => {
    let callCount = 0
    const fn = debounce(() => callCount++, 10)

    fn()
    fn()
    fn()

    expect(callCount).toBe(0)

    await sleep(20)

    expect(callCount).toBe(1)
  })
})
