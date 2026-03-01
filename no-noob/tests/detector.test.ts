import { detectLicenses } from '../src/detector'
import { Dependency } from '../src/types'
import path from 'path'

test('detectLicenses returns UNKNOWN for missing package', async () => {
  const dep: Dependency = { name: 'non-existent-package', version: '1.0.0', source: 'npm' }
  const result = await detectLicenses([dep], path.resolve('C:\\Users\\peace\\Desktop\\Keystone\\starter-kit'))
  expect(result[0].license).toBe('UNKNOWN')
})

test('detectLicenses handles pip dependencies', async () => {
  const dep: Dependency = { name: 'requests', version: '2.28.0', source: 'pip' }
  const result = await detectLicenses([dep], path.resolve('C:\\Users\\peace\\Desktop\\Keystone\\starter-kit'))
  // pip deps return UNKNOWN (not implemented yet)
  expect(result[0].license).toBe('UNKNOWN')
})
