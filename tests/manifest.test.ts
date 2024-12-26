import { describe, expect, it } from "vitest";
import { testdir } from "vitest-testdirs";
import { readProjectManifest, validateProjectManifest } from "../src/manifest";

describe("read project manifest", () => {
	it("should read and parse the project manifest", async () => {
		const path = await testdir({
			"package.json": JSON.stringify({ name: "test-project", version: "1.0.0" }),
		});

		const result = await readProjectManifest(path);

		expect(result).toEqual({
			fileName: `${path}/package.json`,
			manifest: { name: "test-project", version: "1.0.0" },
		});
	});

	it("should throw an error if the manifest file is not a valid JSON", async () => {
		const path = await testdir({
			"package.json": "invalid JSON",
		});

		await expect(readProjectManifest(path)).rejects.toThrow("Unexpected token");
	});

	it("should throw an error if the manifest file cannot be read", async () => {
		const path = await testdir({
			"README.md": "This is not a json file!",
		});

		await expect(readProjectManifest(path)).rejects.toThrow("ENOENT: no such file or directory");
	});
});

describe("validate manifests", () => {
	describe("handle missing fields", () => {
		it("should catch all missing fields", async () => {
			const result = await validateProjectManifest({});

			expect(result).toMatchObject(
				expect.arrayContaining([
					{
						field: "name",
						message: "The `name` field is required.",
						type: "MISSING_FIELD",
					},
					{
						field: "version",
						message: "The `version` field is required.",
						type: "MISSING_FIELD",
					},
					{
						field: "publisher",
						message:
							"The `publisher` field is required. Learn more: https://code.visualstudio.com/api/working-with-extensions/publishing-extension#publishing-extensions",
						type: "MISSING_FIELD",
					},
					{
						field: "engines",
						message: "The `engines` field is required.",
						type: "MISSING_FIELD",
					},
					{
						field: "engines.vscode",
						message: "The `engines.vscode` field is required.",
						type: "MISSING_FIELD",
					},
				]),
			);
		});

		it("should catch missing fields in the engines object", async () => {
			const result = await validateProjectManifest({
				name: "test-project",
				version: "1.0.0",
				publisher: "test",
				engines: {},
			});

			expect(result).toMatchObject(
				expect.arrayContaining([
					{
						field: "engines.vscode",
						message: "The `engines.vscode` field is required.",
						type: "MISSING_FIELD",
					},
				]),
			);
		});

		it("should return none if all required fields are present", async () => {
			const result = await validateProjectManifest({
				name: "test-project",
				version: "1.0.0",
				publisher: "test",
				engines: { vscode: "^1.0.0" },
			});

			expect(result).toEqual(null);
		});
	});

	describe("handle sponsor urls", () => {
		it("should not apply sponsor rules when sponsor isn't defined", async () => {
			const result = await validateProjectManifest({
				name: "test-project",
				version: "1.0.0",
				publisher: "test",
				engines: { vscode: "^1.0.0" },
				sponsor: undefined,
			});

			expect(result).toEqual(null);
		});

		it("handle invalid sponsor urls", async () => {
			const result = await validateProjectManifest({
				name: "test-project",
				version: "1.0.0",
				publisher: "test",
				engines: { vscode: "^1.0.0" },
				sponsor: {
					url: "invalid-url",
				},
			});

			expect(result).toMatchObject([
				{
					field: "sponsor.url",
					message: "The `sponsor.url` field must be a valid URL.",
					type: "INVALID_SPONSOR_URL",
				},
			]);
		});

		it("should return none if the sponsor url is valid", async () => {
			const result = await validateProjectManifest({
				name: "test-project",
				version: "1.0.0",
				publisher: "test",
				engines: { vscode: "^1.0.0" },
				sponsor: {
					url: "https://example.com",
				},
			});

			expect(result).toEqual(null);
		});

		it("should only allow sponsor urls from http or https sources", async () => {
			const result = await validateProjectManifest({
				name: "test-project",
				version: "1.0.0",
				publisher: "test",
				engines: { vscode: "^1.0.0" },
				sponsor: {
					url: "ftp://example.com",
				},
			});

			expect(result).toMatchObject([
				{
					field: "sponsor.url",
					message: "The protocol 'ftp' is not allowed. Use one of: http, https",
					type: "INVALID_SPONSOR_URL",
				},
			]);
		});
	});

	it("disallow `vscode` under `dependencies`", async () => {
		const result = await validateProjectManifest({
			name: "test-project",
			version: "1.0.0",
			publisher: "test",
			engines: { vscode: "^1.0.0" },
			dependencies: { vscode: "^1.0.0" },
		});

		expect(result).toMatchObject([
			{
				type: "DEPENDS_ON_VSCODE_IN_DEPENDENCIES",
				field: "dependencies.vscode",
				message: `You should not depend on 'vscode' in your 'dependencies'. Did you mean to add it to 'devDependencies'?`,
			},
		]);
	});

	describe("handle extension kinds", () => {
		it("should return none if the extension kind is valid", async () => {
			const result = await validateProjectManifest({
				name: "test-project",
				version: "1.0.0",
				publisher: "test",
				engines: { vscode: "^1.0.0" },
				extensionKind: ["ui"],
			});

			expect(result).toEqual(null);
		});

		it("should catch invalid extension kinds", async () => {
			const result = await validateProjectManifest({
				name: "test-project",
				version: "1.0.0",
				publisher: "test",
				engines: { vscode: "^1.0.0" },
				// @ts-expect-error invalid extension is used for testing
				extensionKind: ["browser"],
			});

			expect(result).toMatchObject([
				{
					type: "INVALID_EXTENSION_KIND",
					field: "extensionKind",
					message: "Invalid extension kind 'browser'. Expected one of: ui, workspace",
				},
			]);
		});
	});

	describe("handle badges", () => {
		it("should not apply badge rules when badges aren't defined", async () => {
			const result = await validateProjectManifest({
				name: "test-project",
				version: "1.0.0",
				publisher: "test",
				engines: { vscode: "^1.0.0" },
			});

			expect(result).toEqual(null);
		});

		it("should catch invalid badge urls", async () => {
			const result = await validateProjectManifest({
				name: "test-project",
				version: "1.0.0",
				publisher: "test",
				engines: { vscode: "^1.0.0" },
				badges: [
					{
						url: "invalid-url",
						href: "https://example.com",
						description: "example-badge",
					},
				],
			});

			expect(result).toMatchObject([
				{
					field: "badges",
					message: "The badge URL 'invalid-url' must be a valid URL.",
					type: "INVALID_BADGE_URL",
				},
				{
					field: "badges",
					message: "Badge URL must use the 'https' protocol",
					type: "INVALID_BADGE_URL",
				},
			]);
		});

		it("should disallow svg icons", async () => {
			const result = await validateProjectManifest({
				name: "test-project",
				version: "1.0.0",
				publisher: "test",
				engines: { vscode: "^1.0.0" },
				badges: [
					{
						url: "https://img.shields.io/badge.svg",
						href: "https://img.shields.io",
						description: "example-badge",
					},
				],
			});

			expect(result).toMatchObject([
				{
					field: "badges",
					message: "SVG badges are not supported. Use PNG badges instead",
					type: "INVALID_BADGE_URL",
				},
			]);
		});

		it("should disallow badges from non https sources", async () => {
			const result = await validateProjectManifest({
				name: "test-project",
				version: "1.0.0",
				publisher: "test",
				engines: { vscode: "^1.0.0" },
				badges: [
					{
						url: "http://img.shields.io/badge.png",
						href: "https://img.shields.io",
						description: "example-badge",
					},
				],
			});

			expect(result).toMatchObject([
				{
					field: "badges",
					message: "Badge URL must use the 'https' protocol",
					type: "INVALID_BADGE_URL",
				},
			]);
		});
	});

	describe("handle pricing", () => {
		it("should not apply pricing rules when pricing isn't defined", async () => {
			const result = await validateProjectManifest({
				name: "test-project",
				version: "1.0.0",
				publisher: "test",
				engines: { vscode: "^1.0.0" },
			});

			expect(result).toEqual(null);
		});

		it("should catch invalid pricing", async () => {
			const result = await validateProjectManifest({
				name: "test-project",
				version: "1.0.0",
				publisher: "test",
				engines: { vscode: "^1.0.0" },
				pricing: "Paid",
			});

			expect(result).toMatchObject([
				{
					field: "pricing",
					message: "The `pricing` field must be either 'Free' or 'Paid'.",
					type: "INVALID_PRICING",
				},
			]);
		});

		it("should return none if the pricing is valid", async () => {
			const result = await validateProjectManifest({
				name: "test-project",
				version: "1.0.0",
				publisher: "test",
				engines: { vscode: "^1.0.0" },
				pricing: "Free",
			});

			expect(result).toEqual(null);
		});
	});

	it("handle invalid names", async () => {
		const result = await validateProjectManifest({
			name: "test project",
			version: "1.0.0",
			publisher: "test",
			engines: { vscode: "^1.0.0" },
		});

		expect(result).toMatchObject([
			{
				field: "name",
				message: "The `name` field must not contain spaces.",
				type: "INVALID_NAME",
			},
		]);
	});

	it("handle invalid version", async () => {
		const result = await validateProjectManifest({
			name: "test-project",
			version: "1.0.a",
			publisher: "test",
			engines: { vscode: "^1.0.0" },
		});

		expect(result).toMatchObject([
			{
				field: "version",
				message: "The `version` field must be a valid semver version.",
				type: "INVALID_VERSION",
			},
		]);
	});

	it("handle invalid publisher names", async () => {
		const result = await validateProjectManifest({
			name: "test-project",
			version: "1.0.0",
			publisher: "Test Publisher",
			engines: { vscode: "^1.0.0" },
		});

		expect(result).toMatchObject([
			{
				field: "publisher",
				message:
					"Invalid publisher name 'Test Publisher'. Expected the identifier of a publisher, not its human-friendly name. Learn more: https://code.visualstudio.com/api/working-with-extensions/publishing-extension#publishing-extensions",
				type: "INVALID_PUBLISHER_NAME",
			},
		]);
	});
});
