import { InjectorStub } from "../stubs";
import { TestExecutionService } from "../../lib/services/test-execution-service";
import { assert } from "chai";
import * as _ from "lodash";
import { ITestExecutionService } from "../../lib/definitions/project";
import { IDictionary } from "../../lib/common/declarations";

const karmaPluginName = "karma";
const unitTestsPluginName = "@nativescript/unit-test-runner";

function getTestExecutionService(): ITestExecutionService {
	const injector = new InjectorStub();
	injector.register("testExecutionService", TestExecutionService);
	injector.register("runController", {});

	return injector.resolve("testExecutionService");
}

function getDependenciesObj(deps: string[]): IDictionary<string> {
	const depsObj: IDictionary<string> = {};
	deps.forEach((dep) => {
		depsObj[dep] = "1.0.0";
	});

	return depsObj;
}

describe("testExecutionService", () => {
	const testCases = [
		{
			name:
				"should return false when the project has no dependencies and dev dependencies",
			expectedCanStartKarmaServer: false,
			projectData: { dependencies: {}, devDependencies: {} },
		},
		{
			name: "should return false when the project has no karma",
			expectedCanStartKarmaServer: false,
			projectData: {
				dependencies: getDependenciesObj([unitTestsPluginName]),
				devDependencies: {},
			},
		},
		{
			name: "should return false when the project has no unit test runner",
			expectedCanStartKarmaServer: false,
			projectData: {
				dependencies: getDependenciesObj([karmaPluginName]),
				devDependencies: {},
			},
		},
		{
			name:
				"should return true when the project has the required plugins as dependencies",
			expectedCanStartKarmaServer: true,
			projectData: {
				dependencies: getDependenciesObj([
					karmaPluginName,
					unitTestsPluginName,
				]),
				devDependencies: {},
			},
		},
		{
			name:
				"should return true when the project has the required plugins as dev dependencies",
			expectedCanStartKarmaServer: true,
			projectData: {
				dependencies: {},
				devDependencies: getDependenciesObj([
					karmaPluginName,
					unitTestsPluginName,
				]),
			},
		},
		{
			name:
				"should return true when the project has the required plugins as dev and normal dependencies",
			expectedCanStartKarmaServer: true,
			projectData: {
				dependencies: getDependenciesObj([karmaPluginName]),
				devDependencies: getDependenciesObj([unitTestsPluginName]),
			},
		},
	];

	describe("canStartKarmaServer", () => {
		_.each(testCases, (testCase: any) => {
			it(`${testCase.name}`, async () => {
				const testExecutionService = getTestExecutionService();

				// todo: cleanup monkey-patch with a friendlier syntax (util?)
				// MOCK require.resolve
				const Module = require("module");
				const originalResolveFilename = Module._resolveFilename;

				Module._resolveFilename = function (...args: any) {
					if (
						args[0].startsWith(karmaPluginName) &&
						(testCase.projectData.dependencies[karmaPluginName] ||
							testCase.projectData.devDependencies[karmaPluginName])
					) {
						// override with a "random" built-in module to
						// ensure the module can be resolved
						args[0] = "fs";
					}

					return originalResolveFilename.apply(this, args);
				};
				// END MOCK

				const canStartKarmaServer = await testExecutionService.canStartKarmaServer(
					testCase.projectData
				);
				assert.equal(canStartKarmaServer, testCase.expectedCanStartKarmaServer);

				// restore mock
				Module._resolveFilename = originalResolveFilename;
			});
		});
	});
});
