export interface Dependency {
  name: string
  version: string
  source: 'npm' | 'pip' | 'cargo'
}

export interface LicensedDependency extends Dependency {
  license: string
  licenseText?: string
}

export interface ScanResult {
  directory: string
  dependencies: LicensedDependency[]
  warnings: string[]
}

export interface PackageJson {
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  license?: string | { type: string }
}
