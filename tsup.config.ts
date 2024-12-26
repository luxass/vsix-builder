import { defineConfig } from "tsup";

export default defineConfig({
	entry: ["src/**/*.ts"],
	format: ["esm", "cjs"],
	dts: true,
	splitting: true,
	clean: true,
	target: "es2022",
	bundle: true,
	outExtension(ctx) {
		return {
			js: ctx.format === "cjs" ? ".cjs" : ".mjs",
		};
	},
});
