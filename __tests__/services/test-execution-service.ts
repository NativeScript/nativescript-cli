import { InjectorStub } from "../stubs";
import { TestExecutionService } from "../../lib/services/test-execution-service";
import { assert } from "chai";

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
	deps.forEach(dep => {
		depsObj[dep] = "1.0.0";
	});

	return depsObj;
}

describe("testExecutionService", () => {
	const testCases = [
		{
			name: "should return false when the project has no dependencies and dev dependencies",
			expectedCanStartKarmaServer: false,
			projectData: { dependencies: {}, devDependencies: {} }
		},
		{
			name: "should return false when the project has no karma",
			expectedCanStartKarmaServer: false,
			projectData: { dependencies: getDependenciesObj([unitTestsPluginName]), devDependencies: {} }
		},
		{
			name: "should return false when the project has no unit test runner",
			expectedCanStartKarmaServer: false,
			projectData: { dependencies: getDependenciesObj([karmaPluginName]), devDependencies: {} }
		},
		{
			name: "should return true when the project has the required plugins as  dependencies",
			expectedCanStartKarmaServer: true,
			projectData: { dependencies: getDependenciesObj([karmaPluginName, unitTestsPluginName]), devDependencies: {} }
		},
		{
			name: "should return true when the project has the required plugins as  dev dependencies",
			expectedCanStartKarmaServer: true,
			projectData: { dependencies: {}, devDependencies: getDependenciesObj([karmaPluginName, unitTestsPluginName]) }
		},
		{
			name: "should return true when the project has the required plugins as dev and normal dependencies",
			expectedCanStartKarmaServer: true,
			projectData: { dependencies: getDependenciesObj([karmaPluginName]), devDependencies: getDependenciesObj([unitTestsPluginName]) }
		}
	];

	describe("canStartKarmaServer", () => {
		_.each(testCases, (testCase: any) => {
			it(`${testCase.name}`, async () => {
				const testExecutionService = getTestExecutionService();
				const canStartKarmaServer = await testExecutionService.canStartKarmaServer(testCase.projectData);
				assert.equal(canStartKarmaServer, testCase.expectedCanStartKarmaServer);
			});
		});
	});
});
