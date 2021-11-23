import { runTestApp } from "@nativescript/unit-test-runner";
// import other polyfills here

runTestApp({
	runTests: () => {
		const tests = require.context("./", true, /\.spec\.ts$/);
		tests.keys().map(tests);
	},
});
