import { glob } from "tinyglobby";
import type { Manifest } from "./types";
import { VSCE_DEFAULT_IGNORE } from "./constants";
import { readFile } from "node:fs/promises";
import ignore from "ignore";
import path from "node:path";
import { existsSync } from "node:fs";

export interface VsixLocalFile {
	type: "local";
	path: string;
	readonly localPath: string;
}

export interface VsixInMemoryFile {
	type: "in-memory";
	path: string;
	readonly contents: Buffer | string;
}

export type VsixFile = VsixLocalFile | VsixInMemoryFile;

export function isLocalFile(file: VsixFile): file is VsixLocalFile {
	return file.type === "local";
}

export function isInMemoryFile(file: VsixFile): file is VsixInMemoryFile {
	return file.type === "in-memory";
}

export interface CollectOptions {
	/**
	 * The directory where the extension is located.
	 * @default process.cwd()
	 */
	cwd?: string;

	/**
	 * The file to use for ignoring files.
	 */
	ignoreFile?: string;

	/**
	 * The dependencies to include in the package.
	 */
	dependencies?: string[];

	/**
	 * README file path
	 * @default "README.md"
	 */
	readme?: string;
}

export async function collect(manifest: Manifest, options: CollectOptions): Promise<VsixFile[]> {
	const {
		cwd = process.cwd(),
		ignoreFile = ".vscodeignore",
		dependencies = [],
		readme = "README.md",
	} = options;

	// TODO: fix all of this ignore file handling.
	const gitignorePath = path.join(cwd, ".gitignore");
	const vscodeIgnorePath = path.join(cwd, ignoreFile);

	const ig = ignore();

	if (existsSync(gitignorePath)) {
		const ignoreContent = await readFile(gitignorePath, "utf8");
		ig.add(ignoreContent);
	}

	if (existsSync(vscodeIgnorePath)) {
		const vsceIgnoreContent = await readFile(vscodeIgnorePath, "utf8");
		ig.add(vsceIgnoreContent);
	}

	const globbedFiles = await glob("**", {
		cwd,
    followSymbolicLinks: true,
    expandDirectories: true,
		ignore: [...VSCE_DEFAULT_IGNORE, "!package.json", `!${readme}`, "node_modules/**"],
		dot: true,
		onlyFiles: true,
	});

	const filteredFiles = globbedFiles.filter((file) => !ig.ignores(file));

	const files = filteredFiles.map((file) => ({
    type: "local",
		localPath: path.join(cwd, file),
    path: path.join("extension/", file),
	})) satisfies VsixFile[];

	return files
}
