import { existsSync } from "node:fs";
import {
	createVsixManifest,
	getContentTypesForFiles,
	readProjectManifest,
	validateProjectManifest,
	writeVsix,
	type Manifest,
	type ManifestValidation,
	type PackageManager,
	type VsixFile,
	getManifestTags,
	processFiles
} from "vsix-utils";
import { getExtensionDependencies, collect } from "vsix-utils/files";

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
	packageManager?: PackageManager;

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
	 * The dependencies to include in the package.
	 * @default []
	 */
	dependencies?: string[];

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
	errors: ManifestValidation[];
}

export async function createVsix(options: Options): Promise<CreateVsixResult> {
	const cwd = options.cwd ?? process.cwd();
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

	const { dependencies, packageManager } = await getExtensionDependencies(manifest, {
		cwd,
		packageManager: options.packageManager ?? "auto",
	});

	console.log(dependencies, packageManager);

	const files = await collect(manifest, {
		cwd,
		ignoreFile: options.ignoreFile || ".vscodeignore",
		readme: options.readme ?? "README.md",
		// dependencies: options.dependencies ?? dependencies,
	});

	const { assets, icon, license } = await processFiles(files, manifest);

	const vsixManifest = createVsixManifest(manifest, {
		assets,
		tags: getManifestTags(manifest),
		preRelease: options.preRelease ?? false,
		icon,
		license,
		flags: manifest.preview ? ["Public", "Preview"] : ["Public"],
	});

	const { file } = getContentTypesForFiles(files);

	files.push({
		type: "in-memory",
		path: "extension.vsixmanifest",
		contents: Buffer.from(vsixManifest, "utf-8"),
	});

	files.push({
		type: "in-memory",
		path: "[Content_Types].xml",
		contents: Buffer.from(file, "utf-8"),
	});

	let hasWritten = false;

	if (options.write ?? true) {
		try {
			// check if package path exists on the file system
			if (existsSync(packagePath) && !(options.forceWrite ?? false)) {
				return {
					files,
					manifest,
					vsixPath: options.packagePath,
					written: false,
					// TODO: add error message here
					errors: [],
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
		vsixPath: options.packagePath,
		written: hasWritten,
		errors: [],
	};
}
