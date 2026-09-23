import { defineConfig } from "vitest/config";

// Tests run against tsc's output in dist/ rather than the TypeScript sources:
// the injector discovers dependencies by regex-parsing constructor source text
// (see annotate() in lib/common/helpers.ts), which only matches tsc's emit.
export default defineConfig({
	test: {
		globals: true,
		environment: "node",
		include: ["dist/test/**/*.js", "dist/lib/common/test/unit-tests/**/*.js"],
		exclude: [
			"**/node_modules/**",
			"dist/test/files/**",
			"dist/test/stubs.js",
			"dist/test/test-bootstrap.js",
			"dist/test/base-service-test.js",
			"dist/lib/common/test/unit-tests/stubs.js",
			"dist/lib/common/test/unit-tests/mocks/**",
			"dist/lib/common/test/with-done.js",
		],
		setupFiles: ["./dist/test/test-bootstrap.js"],
		testTimeout: 150000,
		hookTimeout: 150000,
	},
});
