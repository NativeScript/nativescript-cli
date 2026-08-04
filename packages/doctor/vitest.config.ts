import { defineConfig } from "vitest/config";

// Unlike the CLI, this package has no injector doing constructor-source
// reflection, so the TypeScript sources run directly with no build step.
export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		include: ["test/**/*.ts"],
		exclude: ["**/node_modules/**", "**/*.d.ts"],
	},
});
