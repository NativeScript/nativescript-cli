import { Yok } from "../../lib/common/yok";
import { BundleValidatorHelper } from "../../lib/helpers/bundle-validator-helper";
import { assert } from "chai";
import { format } from "util";
import { BundleValidatorMessages } from "../../lib/constants";

interface ITestCase {
	name: string;
	isDependency?: boolean;
	currentWebpackVersion?: string;
	minSupportedWebpackVersion?: string;
	expectedError?: string;
}

let error: string = null;

function createTestInjector(options: { dependencies?: IStringDictionary, devDependencies?: IStringDictionary }) {
	const testInjector = new Yok();
	testInjector.register("projectData", {
		initializeProjectData: () => ({}),
		dependencies: options.dependencies,
		devDependencies: options.devDependencies
	});
	testInjector.register("errors", {
		fail: (err: string) => error = err
	});
	testInjector.register("options", ({ bundle: "webpack" }));
	testInjector.register("bundleValidatorHelper", BundleValidatorHelper);

	return testInjector;
}

describe.only("BundleValidatorHelper", () => {
	beforeEach(() => error = null);

	let testCases: ITestCase[] = [
		{
			name: "should throw an error when no webpack plugin is installed",
			expectedError: BundleValidatorMessages.MissingBundlePlugin
		}
	];

	["dependencies", "devDependencies"]
		.forEach(key => {
			const isDependency = key === "dependencies";

			testCases = testCases.concat([
				{
					name: `should not throw an error when webpack is added as ${key}`,
					isDependency,
					currentWebpackVersion: "0.12.0",
					expectedError: null
				},
				{
					name: `should not throw an error when webpack's version is grather than minSupportedVersion in case when webpack is installed as ${key}`,
					isDependency,
					currentWebpackVersion: "0.13.1",
					minSupportedWebpackVersion: "0.13.0",
					expectedError: null
				},
				{
					name: `should not throw an error when webpack's version is equal to minSupportedVersion in case when webpack is installed as ${key}`,
					isDependency,
					currentWebpackVersion: "0.10.0",
					minSupportedWebpackVersion: "0.10.0",
					expectedError: null
				},
				{
					name: `should throw an error when webpack's version is lower than minSupportedVersion in case when webpack is installed as ${key}`,
					isDependency,
					currentWebpackVersion: "0.17.0",
					minSupportedWebpackVersion: "0.18.0",
					expectedError: format(BundleValidatorMessages.NotSupportedVersion, "0.18.0")
				}
			]);
		});

		_.each(testCases, (testCase: any) => {
			const deps = {
				"nativescript-dev-webpack": testCase.currentWebpackVersion
			};

			it(`${testCase.name}`, async () => {
				const injector = createTestInjector({ dependencies: testCase.isDependency ? deps : null, devDependencies: !testCase.isDependency ? deps : null });
				const bundleValidatorHelper = injector.resolve("bundleValidatorHelper");
				bundleValidatorHelper.validate(testCase.minSupportedWebpackVersion);

				assert.deepEqual(error, testCase.expectedError);
			});
		});
});
