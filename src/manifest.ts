import { readFile } from "node:fs/promises";
import path from "node:path";
import type { Manifest } from "./types";
import { satisfies, valid } from "semver";
import { VSCE_TRUSTED_SOURCES } from "./constants";

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

export type ManifestValidationResult =
	| { type: "MISSING_FIELD"; field: string; message: string }
	| {
			type: "INVALID_VSCODE_ENGINE_COMPATIBILITY";
			field: "engines.vscode";
			message: "Invalid vscode engine compatibility version";
	  }
	| {
			type: "INVALID_NAME";
			field: "name";
			message: string;
	  }
	| {
			type: "INVALID_VERSION";
			field: "version";
			message: string;
	  }
	| {
			type: "INVALID_PUBLISHER_NAME";
			field: "publisher";
			message: string;
	  }
	| {
			type: "INVALID_PRICING";
			field: "pricing";
			message: string;
	  }
	| {
			type: "INVALID_ICON";
			field: "icon";
			message: string;
	  }
	| {
			type: "INVALID_SPONSOR_URL";
			field: "sponsor.url";
			message: string;
	  }
	| {
			type: "INVALID_EXTENSION_KIND";
			field: "extensionKind";
			message: string;
	  }
	| {
			type: "DEPENDS_ON_VSCODE_IN_DEPENDENCIES";
			field: "dependencies.vscode";
			message: string;
	  }
	| {
			type: "INVALID_BADGE_URL";
			field: "badges";
			message: string;
	  }
	| {
			type: "UNTRUSTED_HOST";
			field: "badges";
			message: string;
	  };

export const ALLOWED_SPONSOR_PROTOCOLS = ["http:", "https:"];
export const VALID_EXTENSION_KINDS = ["ui", "workspace"];
export const EXTENSION_PRICING = ["Free", "Trial"];
export const EXTENSION_NAME_REGEX = /^[a-z0-9][a-z0-9\-]*$/i;
export const VSCODE_ENGINE_COMPATIBILITY_REGEX =
	/^\*$|^(\^|>=)?((\d+)|x)\.((\d+)|x)\.((\d+)|x)(\-.*)?$/;
export const GITHUB_BADGE_URL_REGEX =
	/^https:\/\/github\.com\/[^/]+\/[^/]+\/(actions\/)?workflows\/.*badge\.svg/;

export async function validateProjectManifest(
	manifest: Partial<Manifest>,
): Promise<ManifestValidationResult[] | null> {
	const errors: ManifestValidationResult[] = [];

	if (manifest.name == null) {
		errors.push({
			type: "MISSING_FIELD",
			field: "name",
			message: "The `name` field is required.",
		});
	}

	if (manifest.version == null) {
		errors.push({
			type: "MISSING_FIELD",
			field: "version",
			message: "The `version` field is required.",
		});
	}

	if (manifest.publisher == null) {
		errors.push({
			type: "MISSING_FIELD",
			field: "publisher",
			message:
				"The `publisher` field is required. Learn more: https://code.visualstudio.com/api/working-with-extensions/publishing-extension#publishing-extensions",
		});
	}

	if (manifest.engines == null) {
		errors.push({
			type: "MISSING_FIELD",
			field: "engines",
			message: "The `engines` field is required.",
		});
	}

	if (manifest.engines?.vscode == null) {
		errors.push({
			type: "MISSING_FIELD",
			field: "engines.vscode",
			message: "The `engines.vscode` field is required.",
		});
	}

	const vscodeEngineVersion = manifest.engines?.vscode ?? "";

	if (!VSCODE_ENGINE_COMPATIBILITY_REGEX.test(vscodeEngineVersion)) {
		errors.push({
			type: "INVALID_VSCODE_ENGINE_COMPATIBILITY",
			field: "engines.vscode",
			message: "Invalid vscode engine compatibility version",
		});
	}

	const engines = { ...(manifest.engines || {}), vscode: vscodeEngineVersion };
	const name = manifest.name || "";

	if (!EXTENSION_NAME_REGEX.test(name)) {
		errors.push({
			type: "INVALID_NAME",
			field: "name",
			message: "The `name` field must not contain spaces.",
		});
	}

	const version = manifest.version || "";

	if (valid(version) == null) {
		errors.push({
			type: "INVALID_VERSION",
			field: "version",
			message: "The `version` field must be a valid semver version.",
		});
	}

	const publisher = manifest.publisher || "";

	if (!EXTENSION_NAME_REGEX.test(publisher)) {
		errors.push({
			type: "INVALID_PUBLISHER_NAME",
			field: "publisher",
			message: `Invalid publisher name '${publisher}'. Expected the identifier of a publisher, not its human-friendly name. Learn more: https://code.visualstudio.com/api/working-with-extensions/publishing-extension#publishing-extensions`,
		});
	}

	if (manifest.pricing && !EXTENSION_PRICING.includes(manifest.pricing)) {
		errors.push({
			type: "INVALID_PRICING",
			field: "pricing",
			message: "The `pricing` field must be either 'Free' or 'Paid'.",
		});
	}

	const hasActivationEvents = !!manifest.activationEvents;
	const hasImplicitLanguageActivationEvents = manifest.contributes?.languages;
	const hasOtherImplicitActivationEvents =
		manifest.contributes?.commands ||
		manifest.contributes?.authentication ||
		manifest.contributes?.customEditors ||
		manifest.contributes?.views;
	const hasImplicitActivationEvents =
		hasImplicitLanguageActivationEvents || hasOtherImplicitActivationEvents;

	const hasMain = !!manifest.main;
	const hasBrowser = !!manifest.browser;

	if (
		hasActivationEvents ||
		((vscodeEngineVersion === "*" ||
			satisfies(vscodeEngineVersion, ">=1.74", { includePrerelease: true })) &&
			hasImplicitActivationEvents)
	) {
		if (!hasMain && !hasBrowser && (hasActivationEvents || !hasImplicitLanguageActivationEvents)) {
			errors.push({
				type: "MISSING_FIELD",
				field: "main or browser",
				message:
					"Manifest needs either a 'main' or 'browser' property, given it has a 'activationEvents' property.",
			});
		}
	} else if (hasMain) {
		errors.push({
			type: "MISSING_FIELD",
			field: "activationEvents",
			message: "Manifest needs the 'activationEvents' property, given it has a 'main' property.",
		});
	} else if (hasBrowser) {
		errors.push({
			type: "MISSING_FIELD",
			field: "activationEvents",
			message: "Manifest needs the 'activationEvents' property, given it has a 'browser' property.",
		});
	}

	if (manifest.devDependencies != null && manifest.devDependencies["@types/vscode"] != null) {
		errors.push({
			type: "NOT_IMPLEMENTED",
		});
	}

	if (manifest.icon?.endsWith(".svg")) {
		errors.push({
			type: "INVALID_ICON",
			field: "icon",
			message: "SVG icons are not supported. Use PNG icons instead.",
		});
	}

	if (manifest.badges != null) {
		for (const badge of manifest.badges) {
			const decodedUrl = decodeURI(badge.url);
			let srcURL: URL | null = null;

			try {
				srcURL = new URL(decodedUrl);
			} catch (err) {
				errors.push({
					type: "INVALID_BADGE_URL",
					field: "badges",
					message: `The badge URL '${decodedUrl}' must be a valid URL.`,
				});
			}

			if (!decodedUrl.startsWith("https://")) {
				errors.push({
					type: "INVALID_BADGE_URL",
					field: "badges",
					message: "Badge URL must use the 'https' protocol",
				});
			}

			if (decodedUrl.endsWith(".svg")) {
				errors.push({
					type: "INVALID_BADGE_URL",
					field: "badges",
					message: "SVG badges are not supported. Use PNG badges instead",
				});
			}

			if (
				srcURL &&
				!(
					(srcURL.host != null && VSCE_TRUSTED_SOURCES.includes(srcURL.host.toLowerCase())) ||
					GITHUB_BADGE_URL_REGEX.test(srcURL.href)
				)
			) {
				errors.push({
					type: "UNTRUSTED_HOST",
					field: "badges",
					message: "Badge URL must use a trusted host",
				});
			}
		}
	}

	if (manifest.dependencies != null && manifest.dependencies.vscode != null) {
		errors.push({
			type: "DEPENDS_ON_VSCODE_IN_DEPENDENCIES",
			field: "dependencies.vscode",
			message: `You should not depend on 'vscode' in your 'dependencies'. Did you mean to add it to 'devDependencies'?`,
		});
	}

	if (manifest.extensionKind != null) {
		const extensionKinds = Array.isArray(manifest.extensionKind)
			? manifest.extensionKind
			: [manifest.extensionKind];

		for (const extensionKind of extensionKinds) {
			if (!VALID_EXTENSION_KINDS.includes(extensionKind)) {
				errors.push({
					type: "INVALID_EXTENSION_KIND",
					field: "extensionKind",
					message: `Invalid extension kind '${extensionKind}'. Expected one of: ${VALID_EXTENSION_KINDS.join(", ")}`,
				});
			}
		}
	}

	if (manifest.sponsor != null && manifest.sponsor.url != null) {
		try {
			const sponsorUrl = new URL(manifest.sponsor.url);

			if (!ALLOWED_SPONSOR_PROTOCOLS.includes(sponsorUrl.protocol)) {
				errors.push({
					type: "INVALID_SPONSOR_URL",
					field: "sponsor.url",
					message: `The protocol '${sponsorUrl.protocol.slice(0, sponsorUrl.protocol.lastIndexOf(":"))}' is not allowed. Use one of: ${ALLOWED_SPONSOR_PROTOCOLS.map((protocol) => protocol.slice(0, protocol.lastIndexOf(":"))).join(", ")}`,
				});
			}
		} catch (err) {
			errors.push({
				type: "INVALID_SPONSOR_URL",
				field: "sponsor.url",
				message: "The `sponsor.url` field must be a valid URL.",
			});
		}
	}

	if (errors.length > 0) {
		return errors;
	}

	return null;
}
