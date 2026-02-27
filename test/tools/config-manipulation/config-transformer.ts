import { assert } from "chai";
import { ConfigTransformer } from "../../../lib/tools/config-manipulation/config-transformer";

describe("ConfigTransformer", () => {
	it("updates existing boolean literals", () => {
		const content = `export default {
  id: 'org.nativescript.myapp',
  discardUncaughtJsExceptions: true,
} as any;`;

		const transformer = new ConfigTransformer(content);
		const updated = transformer.setValue("discardUncaughtJsExceptions", false);
		const updatedTransformer = new ConfigTransformer(updated);

		assert.strictEqual(
			updatedTransformer.getValue("discardUncaughtJsExceptions"),
			false,
		);
	});

	it("updates existing ios.SPMPackages array literals", () => {
		const content = `import { NativeScriptConfig } from '@nativescript/core'

export default {
  id: 'org.nativescript.myapp',
  ios: {
    SPMPackages: [
      {
        name: 'RiveRuntime',
        libs: ['RiveRuntime'],
        repositoryURL: 'https://github.com/rive-app/rive-ios.git',
        version: '6.11.0',
      },
    ],
  },
} as NativeScriptConfig`;

		const spmPackages = [
			{
				name: "RiveRuntime",
				libs: ["RiveRuntime"],
				repositoryURL: "https://github.com/rive-app/rive-ios.git",
				version: "6.11.0",
			},
			{
				name: "SharedWidget",
				libs: ["SharedWidget"],
				path: "./Shared_Resources/iOS/SharedWidget",
				targets: ["widget"],
			},
		];

		const transformer = new ConfigTransformer(content);
		const updated = transformer.setValue("ios.SPMPackages", spmPackages);
		const updatedTransformer = new ConfigTransformer(updated);

		assert.deepStrictEqual(
			updatedTransformer.getValue("ios.SPMPackages"),
			spmPackages,
		);
	});
});
