import { it, expect, assert, describe } from "vitest";
import { collect, type VsixFile } from "../src/collector";

import { testdir, fromFileSystem } from "vitest-testdirs";
import { readProjectManifest } from "../src/manifest";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

it("should collect files for a simple extension", async () => {
	const testdirFiles = await fromFileSystem("./tests/fixtures/extensions/simple-extension");
	const path = await testdir(testdirFiles);

	const { manifest } = await readProjectManifest(path);

	const files = await collect(manifest, {
		cwd: path
	});

	assert(manifest.displayName === "Simple Extension", "displayName should be 'Simple Extension'");
	assert(files.length > 0, "files should not be empty");

	expect(files).toMatchObject(expect.arrayContaining([
		{
			type: "local",
			path: "extension/package.json",
			localPath: ".vitest-testdirs/vitest-collector-should-collect-files-for-a-simple-extension/package.json",
		},
		{
			type: "local",
			path: "extension/README.md",
			localPath: '.vitest-testdirs/vitest-collector-should-collect-files-for-a-simple-extension/README.md'
		},
		{
			type: "local",
			path: "extension/LICENSE",
			localPath:
				".vitest-testdirs/vitest-collector-should-collect-files-for-a-simple-extension/LICENSE",
		},
		{
			type: "local",
			path: "extension/out/extension.js.map",
			localPath:
				".vitest-testdirs/vitest-collector-should-collect-files-for-a-simple-extension/out/extension.js.map",
		},
		{
			type: "local",
			path: "extension/out/extension.js",
			localPath:
				".vitest-testdirs/vitest-collector-should-collect-files-for-a-simple-extension/out/extension.js",
		},
	] satisfies VsixFile[]))
});

it("should collect files for a extension with a different README path", async () => {
	const testdirFiles = await fromFileSystem("./tests/fixtures/extensions/simple-extension", {
		extras: {
			"extra-readme.md": "This is an extra README file"
		}
	});

	const path = await testdir(testdirFiles);

	const { manifest } = await readProjectManifest(path);

	const files = await collect(manifest, {
		cwd: path,
		readme: "extra-readme.md"
	});

	const readmeContent = await readFile(join(path, "extra-readme.md"), "utf8");

	assert(manifest.displayName === "Simple Extension", "displayName should be 'Simple Extension'");
	assert(files.length > 0, "files should not be empty");

	expect(files).toMatchObject(expect.arrayContaining([
		{
			type: "local",
			path: "extension/package.json",
			localPath: ".vitest-testdirs/vitest-collector-should-collect-files-for-a-extension-with-a-different-README-path/package.json",
		},
		{
			type: "local",
			path: "extension/README.md",
			localPath: '.vitest-testdirs/vitest-collector-should-collect-files-for-a-extension-with-a-different-README-path/README.md'
		},
		{
			type: "local",
			path: "extension/LICENSE",
			localPath:
				".vitest-testdirs/vitest-collector-should-collect-files-for-a-extension-with-a-different-README-path/LICENSE",
		},
		{
			type: "local",
			path: "extension/out/extension.js.map",
			localPath:
				".vitest-testdirs/vitest-collector-should-collect-files-for-a-extension-with-a-different-README-path/out/extension.js.map",
		},
		{
			type: "local",
			path: "extension/out/extension.js",
			localPath:
				".vitest-testdirs/vitest-collector-should-collect-files-for-a-extension-with-a-different-README-path/out/extension.js",
		},
	] satisfies VsixFile[]))

	expect(readmeContent).toBe("This is an extra README file");
})

it("should collect files for a extension with a different ignore file", async () => {
	const testdirFiles = await fromFileSystem("./tests/fixtures/extensions/simple-extension", {
		extras: {
			".vsixignore": ".vscode/**\n.gitignore\n**/tsconfig.json"
		}
	});

	const path = await testdir(testdirFiles);

	const { manifest } = await readProjectManifest(path);

	const files = await collect(manifest, {
		cwd: path,
		ignoreFile: ".vsixignore"
	});

	assert(manifest.displayName === "Simple Extension", "displayName should be 'Simple Extension'");
	assert(files.length > 0, "files should not be empty");

	expect(files).toMatchObject(expect.arrayContaining([
		{
			type: "local",
			path: "extension/package.json",
			localPath: ".vitest-testdirs/vitest-collector-should-collect-files-for-a-extension-with-a-different-ignore-file/package.json",
		},
		{
			type: "local",
			path: "extension/README.md",
			localPath: '.vitest-testdirs/vitest-collector-should-collect-files-for-a-extension-with-a-different-ignore-file/README.md'
		},
		{
			type: "local",
			path: "extension/LICENSE",
			localPath:
				".vitest-testdirs/vitest-collector-should-collect-files-for-a-extension-with-a-different-ignore-file/LICENSE",
		},
		{
			type: "local",
			path: "extension/out/extension.js.map",
			localPath:
				".vitest-testdirs/vitest-collector-should-collect-files-for-a-extension-with-a-different-ignore-file/out/extension.js.map",
		},
		{
			type: "local",
			path: "extension/out/extension.js",
			localPath:
				".vitest-testdirs/vitest-collector-should-collect-files-for-a-extension-with-a-different-ignore-file/out/extension.js",
		},
		{
			type: 'local',
			localPath: '.vitest-testdirs/vitest-collector-should-collect-files-for-a-extension-with-a-different-ignore-file/src/extension.ts',
			path: 'extension/src/extension.ts'
		}
	] satisfies VsixFile[]))
})
