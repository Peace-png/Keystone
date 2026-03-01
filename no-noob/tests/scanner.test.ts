import { scan } from '../src/scanner'
import path from 'path'

test('scan reads package.json dependencies', async () => {
  const fixture = path.resolve('C:\\Users\\peace\\Desktop\\Keystone\\starter-kit')
  const deps = await scan(fixture)
  // starter-kit has typescript as a devDependency
  expect(deps.find(d => d.name === 'typescript')).toBeDefined()
})

test('scan returns empty array for non-existent directory', async () => {
  const deps = await scan('/non/existent/path')
  expect(deps).toEqual([])
})
