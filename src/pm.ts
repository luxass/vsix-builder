import type { Manifest, PackageManager } from "./types";

export async function getExtensionDependencies(manifest: Manifest, pm?: PackageManager): Promise<{ dependencies: string[], pm: 'npm' | 'yarn' | 'pnpm' }> {
  return {
    dependencies: [],
    pm: 'npm'
  }
}
