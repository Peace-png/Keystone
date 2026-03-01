/**
 * Mercury Starter Kit - Main Entry Point
 *
 * This is where your application starts.
 * Mercury: Build your code here, then run `bun dev` to test.
 */

export function greet(name: string): string {
  return `Hello, ${name}!`
}

export function add(a: number, b: number): number {
  return a + b
}

// Example of a more complex function
export interface Result<T> {
  success: boolean
  data?: T
  error?: string
}

export function safeDivide(a: number, b: number): Result<number> {
  if (b === 0) {
    return { success: false, error: 'Cannot divide by zero' }
  }
  return { success: true, data: a / b }
}

// Main execution
if (import.meta.main) {
  console.log(greet('Mercury'))
  console.log('Starter kit ready. Start building!')
}
