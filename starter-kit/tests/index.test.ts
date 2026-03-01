import { describe, test, expect } from 'bun:test'
import { greet, add, safeDivide } from '../src/index'

describe('greet', () => {
  test('returns greeting with name', () => {
    expect(greet('World')).toBe('Hello, World!')
  })

  test('handles empty string', () => {
    expect(greet('')).toBe('Hello, !')
  })
})

describe('add', () => {
  test('adds two positive numbers', () => {
    expect(add(2, 3)).toBe(5)
  })

  test('handles negative numbers', () => {
    expect(add(-1, 1)).toBe(0)
  })

  test('handles zero', () => {
    expect(add(0, 0)).toBe(0)
  })
})

describe('safeDivide', () => {
  test('divides two numbers', () => {
    const result = safeDivide(10, 2)
    expect(result.success).toBe(true)
    expect(result.data).toBe(5)
  })

  test('returns error for division by zero', () => {
    const result = safeDivide(10, 0)
    expect(result.success).toBe(false)
    expect(result.error).toBe('Cannot divide by zero')
  })
})
