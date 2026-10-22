import { assert } from "chai";
import { readFileSync } from "fs";
import * as path from "path";
import { AndroidPluginBuildService } from "../../lib/services/android-plugin-build-service";

// gradle-api's plugin-build functional tests run this golden file in place of the CLI's
// extraction, so the two must not drift.
describe("include.gradle extraction used by gradle-api's functional tests", () => {
	// Tests run compiled from dist/test, three levels below the repo root.
	const gradleApiDir = path.join(__dirname, "..", "..", "..", "gradle-api");

	it("extracts exactly the golden blocks from the sample plugin's include.gradle", () => {
		const includeGradle = readFileSync(
			path.join(
				gradleApiDir,
				"samples",
				"sample-plugin",
				"platforms",
				"android",
				"include.gradle",
			),
			"utf8",
		);
		const golden = readFileSync(
			path.join(
				gradleApiDir,
				"src",
				"functionalTest",
				"resources",
				"extracted",
				"sample-plugin-include.gradle",
			),
			"utf8",
		);

		const service = Object.create(AndroidPluginBuildService.prototype);
		const blocks: string[] =
			service.getIncludeGradleCompileDependenciesScope(includeGradle);

		assert.equal(blocks.join("\n"), golden);
	});
});
