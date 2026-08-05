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

	const tsConfig = `export default {
  id: 'org.nativescript.myapp',
  appPath: 'src',
  version: 3,
} as any;`;

	const roundTrip = (content: string, path: string, value: any) =>
		new ConfigTransformer(
			new ConfigTransformer(content).setValue(path, value),
		).getValue(path);

	it("reads and updates string literals", () => {
		assert.strictEqual(
			new ConfigTransformer(tsConfig).getValue("id"),
			"org.nativescript.myapp",
		);
		assert.strictEqual(roundTrip(tsConfig, "appPath", "app"), "app");
	});

	it("reads and updates numeric literals", () => {
		assert.strictEqual(new ConfigTransformer(tsConfig).getValue("version"), 3);
		assert.strictEqual(roundTrip(tsConfig, "version", 4), 4);
	});

	it("replaces the initializer when the new value changes type", () => {
		assert.strictEqual(roundTrip(tsConfig, "version", "four"), "four");
		assert.strictEqual(roundTrip(tsConfig, "appPath", 7), 7);
	});

	it("reads and updates CommonJS configs", () => {
		const content = `module.exports = {
  id: 'org.nativescript.myapp',
  appPath: 'src',
};`;

		assert.strictEqual(
			new ConfigTransformer(content).getValue("id"),
			"org.nativescript.myapp",
		);
		assert.strictEqual(roundTrip(content, "appPath", "app"), "app");
	});

	// the object may be wrapped in any combination of assertions and parentheses
	const wrappers: [string, string][] = [
		["no assertion", `{ id: 'org.nativescript.myapp' }`],
		[
			"as NativeScriptConfig",
			`{ id: 'org.nativescript.myapp' } as NativeScriptConfig`,
		],
		["as any", `{ id: 'org.nativescript.myapp' } as any`],
		["as const", `{ id: 'org.nativescript.myapp' } as const`],
		[
			"satisfies",
			`{ id: 'org.nativescript.myapp' } satisfies NativeScriptConfig`,
		],
		["angle-bracket assertion", `<any>{ id: 'org.nativescript.myapp' }`],
		["parenthesized", `({ id: 'org.nativescript.myapp' })`],
		[
			"nested parens and assertion",
			`(({ id: 'org.nativescript.myapp' } as any))`,
		],
	];

	for (const [label, expression] of wrappers) {
		it(`reads and updates a default export wrapped in ${label}`, () => {
			const content = `export default ${expression};`;

			assert.strictEqual(
				new ConfigTransformer(content).getValue("id"),
				"org.nativescript.myapp",
			);
			assert.strictEqual(roundTrip(content, "id", "org.other"), "org.other");
		});
	}

	it("reads and updates a parenthesized CommonJS export", () => {
		const content = `module.exports = ({
  id: 'org.nativescript.myapp',
});`;

		assert.strictEqual(
			new ConfigTransformer(content).getValue("id"),
			"org.nativescript.myapp",
		);
		assert.strictEqual(roundTrip(content, "id", "org.other"), "org.other");
	});

	it("creates intermediate objects for a new dot-notation path", () => {
		assert.strictEqual(
			roundTrip(tsConfig, "android.markingMode", "none"),
			"none",
		);
	});

	it("adds keys that are absent from the config", () => {
		assert.strictEqual(
			roundTrip(tsConfig, "appResourcesPath", "App_Resources"),
			"App_Resources",
		);
		assert.deepStrictEqual(
			roundTrip(tsConfig, "ios", { discardUncaughtJsExceptions: true }),
			{
				discardUncaughtJsExceptions: true,
			},
		);
	});

	it("resolves a value declared as a separate variable", () => {
		const content = `const appId = 'org.nativescript.myapp';

export default {
  id: appId,
} as any;`;

		assert.strictEqual(
			new ConfigTransformer(content).getValue("id"),
			"org.nativescript.myapp",
		);
		// the assignment is indirect, so the update lands on the declaration
		const updated = new ConfigTransformer(content).setValue("id", "org.other");
		assert.include(updated, "const appId = 'org.other'");
		assert.strictEqual(
			new ConfigTransformer(updated).getValue("id"),
			"org.other",
		);
	});

	it("returns undefined for a key that is not present", () => {
		assert.isUndefined(
			new ConfigTransformer(tsConfig).getValue("doesNotExist"),
		);
	});

	it("throws when the default export is not an object", () => {
		assert.throws(
			() => new ConfigTransformer(`export default 42;`).getValue("id"),
			"default export must be an object!",
		);
		assert.throws(
			() => new ConfigTransformer(`module.exports = 42;`).getValue("id"),
			"default export must be an object!",
		);
	});
});
