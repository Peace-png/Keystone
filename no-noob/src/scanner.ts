/// <reference types="node" />
import * as fs from 'fs'
import * as path from 'path'
import { Dependency, PackageJson } from './types'

export async function scan(dir: string): Promise<Dependency[]> {
  const deps: Dependency[] = []

  // package.json
  try {
    const pkgPath = path.join(dir, 'package.json')
    const pkgRaw = await fs.promises.readFile(pkgPath, 'utf8')
    const pkg: PackageJson = JSON.parse(pkgRaw) as PackageJson
    const all: Record<string, string> = {
      ...(pkg.dependencies ?? {}),
      ...(pkg.devDependencies ?? {}),
    }
    for (const name in all) {
      const ver = all[name]
      if (ver) {
        deps.push({ name, version: ver, source: 'npm' })
      }
    }
  } catch (e) {
    // package.json not found or invalid - skip
    console.error('Could not read package.json:', e)
  }

  // requirements.txt
  try {
    const reqPath = path.join(dir, 'requirements.txt')
    const txt = await fs.promises.readFile(reqPath, 'utf8')
    txt.split(/\r?\n/).forEach((line: string) => {
      const cleaned = line.trim()
      if (!cleaned || cleaned.startsWith('#')) return
      const parts = cleaned.split('==')
      const name = parts[0] ?? ''
      const version = parts[1] ?? ''
      if (name) {
        deps.push({ name, version, source: 'pip' })
      }
    })
  } catch (e) {
    // requirements.txt not found - skip
    console.error('Could not read requirements.txt:', e)
  }

  // Cargo.toml parsing omitted for simplicity
  return deps
}
