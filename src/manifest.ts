import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Manifest } from "./types";
export interface ProjectManifest {
	fileName: string;
	manifest: Manifest;
}

/**
 * Reads the project manifest (package.json) from the specified project directory.
 *
 * @param {string} projectDir - The directory of the project where the package.json is located.
 * @returns {Promise<ProjectManifest>} A promise that resolves to an object containing the file name and the parsed manifest.
 *
 * @example
 * ```typescript
 * const { fileName, manifest } = await readProjectManifest('/path/to/project');
 * console.log(fileName); // Outputs: /path/to/project/package.json
 * console.log(manifest); // Outputs: Parsed content of package.json
 * ```
 */
export async function readProjectManifest(projectDir: string): Promise<ProjectManifest> {
	const manifestPath = path.join(projectDir, "package.json");
	const manifest = JSON.parse(await readFile(manifestPath, "utf-8"));

	return {
		fileName: manifestPath,
		manifest,
	};
}

