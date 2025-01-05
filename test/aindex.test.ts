// import { it, expect, describe } from "vitest";

// describe("createVsix", () => {
//   it("should return empty result when no project manifest exists", async () => {
//     const result = await createVsix({ cwd: "/non-existent" });
//     expect(result).toEqual({
//       files: [],
//       errors: [],
//       written: false
//     });
//   });

//   it("should return validation errors when manifest is invalid", async () => {
//     const mockValidationErrors = [
//       { type: "MISSING_PUBLISHER", message: "Missing publisher" }
//     ];
//     vi.mock("vsix-utils", async () => ({
//       readProjectManifest: vi.fn().mockResolvedValue({
//         manifest: { name: "test", version: "1.0.0" }
//       }),
//       validateProjectManifest: vi.fn().mockResolvedValue(mockValidationErrors)
//     }));

//     const result = await createVsix({});
//     expect(result.errors).toEqual(mockValidationErrors);
//     expect(result.written).toBe(false);
//   });

//   it("should return error when package manager cannot be determined", async () => {
//     vi.mock("vsix-utils", async () => ({
//       readProjectManifest: vi.fn().mockResolvedValue({
//         manifest: { name: "test", version: "1.0.0" }
//       }),
//       validateProjectManifest: vi.fn().mockResolvedValue([]),
//       getExtensionPackageManager: vi.fn().mockResolvedValue(null)
//     }));

//     const result = await createVsix({});
//     expect(result.errors).toEqual([{
//       type: "MISSING_PACKAGE_MANAGER",
//       message: "The package manager could not be determined."
//     }]);
//   });

//   it("should create vsix package successfully", async () => {
//     const mockManifest = {
//       name: "test-ext",
//       version: "1.0.0",
//       preview: false
//     };

//     vi.mock("vsix-utils", async () => ({
//       readProjectManifest: vi.fn().mockResolvedValue({ manifest: mockManifest }),
//       validateProjectManifest: vi.fn().mockResolvedValue([]),
//       getExtensionPackageManager: vi.fn().mockResolvedValue("npm"),
//       collect: vi.fn().mockResolvedValue([]),
//       processFiles: vi.fn().mockResolvedValue({ assets: [], icon: null, license: null }),
//       createVsixManifest: vi.fn().mockReturnValue("vsix-manifest"),
//       getContentTypesForFiles: vi.fn().mockReturnValue({ xml: "content-types" }),
//       writeVsix: vi.fn().mockResolvedValue(undefined)
//     }));

//     vi.mock("node:fs", () => ({
//       existsSync: vi.fn().mockReturnValue(false)
//     }));

//     const result = await createVsix({
//       packagePath: "test.vsix"
//     });

//     expect(result).toEqual({
//       files: [
//         {
//           type: "in-memory",
//           path: "extension.vsixmanifest",
//           contents: expect.any(Buffer)
//         },
//         {
//           type: "in-memory",
//           path: "[Content_Types].xml",
//           contents: expect.any(Buffer)
//         }
//       ],
//       manifest: mockManifest,
//       vsixPath: "test.vsix",
//       written: true,
//       errors: []
//     });
//   });
// });
