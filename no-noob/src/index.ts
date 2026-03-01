/// <reference types="node" />
import { scan } from './scanner'
import { detectLicenses } from './detector'
import { generate } from './generator'
import { ScanResult } from './types'
import * as path from 'path'

async function main(): Promise<void> {
  const args = process.argv.slice(2)
  if (args.length < 1) {
    console.error('Usage: bun run src/index.ts <target-dir>')
    process.exit(1)
  }
  const target = path.resolve(args[0] as string)
  try {
    const deps = await scan(target)
    const licensed = await detectLicenses(deps, target)
    const warnings: string[] = []
    licensed.forEach((d) => {
      if (d.license.toUpperCase().includes('GPL')) {
        warnings.push(`GPL license detected in ${d.name}`)
      }
    })
    const result: ScanResult = { directory: target, dependencies: licensed, warnings }
    await generate(result, target)
    console.log('Scan complete.')
    console.log(`Found ${licensed.length} dependencies.`)
    warnings.forEach((w) => console.warn('Warning:', w))
    process.exit(0)
  } catch (e) {
    console.error('Error:', e)
    process.exit(1)
  }
}

if (import.meta.main) {
  void main()
}
