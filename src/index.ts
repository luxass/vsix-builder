import { collect } from "./collector";
import { readProjectManifest } from "./manifest"
import { getExtensionDependencies } from "./pm";
import type { PackageManager } from "./types";

export interface Options {
  /**
   * The directory where the extension is located.
   * @default process.cwd()
   */
  cwd?: string

	/**
	 * Package Manager
	 * @default "auto"
	 */
	packageManager?: PackageManager

	/**
	 * The destination path for the VSIX package.
	 * @default <name>-<version>.vsix
	 */
	packagePath?: string

  /**
   * The file to use for ignoring files.
   */
	ignoreFile?: string,

	/**
	 * The dependencies to include in the package.
	 * @default []
	 */
	dependencies?: string[]
}

export async function createVsix(options: Options): Promise<void> {
  const cwd = options.cwd ?? process.cwd()
  const { manifest, fileName } = await readProjectManifest(cwd)

	// const { dependencies, pm } = getExtensionDependencies(manifest, options.packageManager)

	const files = await collect(manifest, {
		cwd,
		ignoreFile: options.ignoreFile || '.vscodeignore',
		dependencies: [],
	});

	console.log(files)

}
