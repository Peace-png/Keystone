/// <reference types="node" />
import * as fs from 'fs'
import * as path from 'path'
import { Dependency, LicensedDependency, PackageJson } from './types'

export async function detectLicenses(
  deps: Dependency[],
  projectRoot: string
): Promise<LicensedDependency[]> {
  const results: LicensedDependency[] = []

  for (const dep of deps) {
    if (dep.source === 'npm') {
      const modulePath = path.join(projectRoot, 'node_modules', dep.name)
      let license = 'UNKNOWN'
      let licenseText: string | undefined

      // Try package.json license field
      try {
        const pkgJsonPath = path.join(modulePath, 'package.json')
        const pkgRaw = await fs.promises.readFile(pkgJsonPath, 'utf8')
        const pkg: PackageJson = JSON.parse(pkgRaw) as PackageJson
        if (pkg.license) {
          license = typeof pkg.license === 'string' ? pkg.license : pkg.license.type
        }
      } catch (e) {
        // Could not read package.json - use UNKNOWN
        console.error(`Could not read package.json for ${dep.name}:`, e)
      }

      // Try LICENSE file
      try {
        const files = await fs.promises.readdir(modulePath)
        const licFile = files.find((f) => /^LICENSE/i.test(f))
        if (licFile) {
          licenseText = await fs.promises.readFile(path.join(modulePath, licFile), 'utf8')
        }
      } catch (e) {
        // No LICENSE file found - skip
        console.error(`No LICENSE file for ${dep.name}:`, e)
      }

      const result: LicensedDependency = { ...dep, license }
      if (licenseText) result.licenseText = licenseText
      results.push(result)
    } else {
      results.push({ ...dep, license: 'UNKNOWN' })
    }
  }

  return results
}
