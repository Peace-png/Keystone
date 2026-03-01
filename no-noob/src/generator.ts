/// <reference types="node" />
import * as fs from "fs"
import * as path from "path"
import { ScanResult } from "./types"

export async function generate(result: ScanResult, outputDir: string): Promise<void> {
  const noticeLines = result.dependencies.map(d => `${d.name}@${d.version}: ${d.license}`)
  const noticePath = path.join(outputDir, "NOTICE")
  await fs.promises.writeFile(noticePath, noticeLines.join("\n"), "utf8")
  const thirdPath = path.join(outputDir, "third-party-notices.txt")
  const parts = result.dependencies.map(d => {
    const header = `=== ${d.name}@${d.version} (${d.license}) ===\n`
    const body = d.licenseText ?? ""
    return header + body + "\n"
  })
  await fs.promises.writeFile(thirdPath, parts.join("\n"), "utf8")
}
