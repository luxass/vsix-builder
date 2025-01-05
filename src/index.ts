import { existsSync } from "node:fs";
import {
	type Manifest,
	type ManifestValidation,
	type PackageManagerWithAuto,
	type VsixFile,
	getContentTypesForFiles,
	prepublish,
	processFiles,
	validateProjectManifest,
	writeVsix,
	getManifestTags,
	createVsixManifest,
	readProjectManifest,
	collect,
	getExtensionDependencies,
	getExtensionPackageManager,
	type ExtensionDependency,
} from "vsix-utils";

export type VsixError =
	| ManifestValidation
	| { type: "WRITE_ERROR"; message: string }
	| { type: "MISSING_PACKAGE_MANAGER"; message: string };

export interface Options {
	/**
	 * The directory where the extension is located.
	 * @default process.cwd()
	 */
	cwd?: string;

	/**
	 * Package Manager
	 * @default "auto"
	 */
	packageManager?: PackageManagerWithAuto;

	/**
	 * The destination path for the VSIX package.
	 * @default <name>-<version>.vsix
	 */
	packagePath?: string;

	/**
	 * The file to use for ignoring files.
	 */
	ignoreFile?: string;

	/**
	 * Scan for dependencies in the extension.
	 * @default false
	 */
	scanDependencies?: boolean;

	/**
	 * Whether to write the VSIX package to the file system.
	 * @default true
	 */
	write?: boolean;

	/**
	 * Whether to force writing the VSIX package to the file system.
	 * @default false
	 */
	forceWrite?: boolean;

	/**
	 * Whether the extension is a pre-release version.
	 * @default false
	 */
	preRelease?: boolean;

	/**
	 * README file path
	 * @default "<cwd>/README.md"
	 */
	readme?: string;

	/**
	 * Whether to skip package.json scripts.
	 * @default false
	 */
	skipScripts?: boolean;
}

export interface CreateVsixResult {
	/**
	 * The files that make up the VSIX package.
	 */
	files: VsixFile[];

	/**
	 * The path to the VSIX package.
	 *
	 * @remarks
	 * If the `write` option is set to `false`, this property will be `undefined`.
	 */
	vsixPath?: string;

	/**
	 * Whether the VSIX package was written to the file system.
	 *
	 * @remarks
	 * If the `write` option is set to `false`, this property will be `false`.
	 */
	written?: boolean;

	/**
	 * The manifest of the extension.
	 */
	manifest?: Manifest;

	/**
	 * The validation errors of the extension manifest.
	 */
	errors: VsixError[];
}

/**
 * Creates a VSIX package for a VS Code extension.
 *
 * @param {Options} options - Configuration options for creating the VSIX package
 *
 * @returns {Promise<CreateVsixResult>} The result of creating the VSIX package
 */
export async function createVsix(options: Options): Promise<CreateVsixResult> {
	const cwd = options.cwd ?? process.cwd();
	const pm = options.packageManager ?? "auto";
	const projectManifest = await readProjectManifest(cwd);

	if (projectManifest == null) {
		return {
			files: [],
			errors: [],
			written: false,
		};
	}

	const { manifest } = projectManifest;

	const packagePath = options.packagePath ?? `${manifest.name}-${manifest.version}.vsix`;

	const validationErrors = await validateProjectManifest(manifest);

	if (validationErrors != null && validationErrors.length > 0) {
		return {
			files: [],
			manifest,
			errors: validationErrors,
			written: false,
			vsixPath: undefined,
		};
	}

	const packageManager =
		pm === "auto"
			? await getExtensionPackageManager(cwd)
			: (options.packageManager as Exclude<PackageManagerWithAuto, "auto">);

	if (packageManager == null) {
		return {
			files: [],
			manifest,
			errors: [
				{
					type: "MISSING_PACKAGE_MANAGER",
					message: "The package manager could not be determined.",
				},
			],
			written: false,
			vsixPath: undefined,
		};
	}

	let dependencies: ExtensionDependency[] = [];

	if (options.scanDependencies ?? false) {
		dependencies = await getExtensionDependencies(manifest, {
			cwd,
			packageManager,
		});
	}

	if (options.skipScripts ?? false) {
		await prepublish({
			cwd,
			packageManager,
			manifest,
			preRelease: options.preRelease ?? false,
		});
	}

	const files = await collect(manifest, {
		cwd,
		ignoreFile: options.ignoreFile || ".vscodeignore",
		readme: options.readme ?? "README.md",
		dependencies,
	});

	const { assets, icon, license } = await processFiles({
		files,
		manifest,
		readme: options.readme ?? "README.md",
	});

	const vsixManifest = createVsixManifest(manifest, {
		assets,
		tags: getManifestTags(manifest),
		preRelease: options.preRelease ?? false,
		icon,
		license,
		flags: manifest.preview ? ["Public", "Preview"] : ["Public"],
	});

	const { xml } = getContentTypesForFiles(files);

	files.push({
		type: "in-memory",
		path: "extension.vsixmanifest",
		contents: Buffer.from(vsixManifest, "utf-8"),
	});

	files.push({
		type: "in-memory",
		path: "[Content_Types].xml",
		contents: Buffer.from(xml, "utf-8"),
	});

	let hasWritten = false;

	if (options.write ?? true) {
		try {
			// check if package path exists on the file system
			if (existsSync(packagePath) && !(options.forceWrite ?? false)) {
				return {
					files,
					manifest,
					vsixPath: packagePath,
					written: false,
					errors: [
						{
							type: "WRITE_ERROR",
							message: `The file already exists at ${packagePath}, use the forceWrite option to overwrite it.`,
						},
					],
				};
			}

			await writeVsix({
				files,
				packagePath,
				force: options.forceWrite ?? false,
			});

			hasWritten = true;
		} catch (err) {
			hasWritten = false;
		}
	}

	return {
		files,
		manifest,
		vsixPath: packagePath,
		written: hasWritten,
		errors: [],
	};
}
