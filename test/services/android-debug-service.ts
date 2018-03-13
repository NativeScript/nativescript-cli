import { AndroidDebugService } from "../../lib/services/android-debug-service";
import { Yok } from "../../lib/common/yok";
import * as stubs from "../stubs";
import { assert } from "chai";

const expectedDevToolsCommitSha = "02e6bde1bbe34e43b309d4ef774b1168d25fd024";

class AndroidDebugServiceInheritor extends AndroidDebugService {
	constructor(protected $devicesService: Mobile.IDevicesService,
		$errors: IErrors,
		$logger: ILogger,
		$androidDeviceDiscovery: Mobile.IDeviceDiscovery,
		$androidProcessService: Mobile.IAndroidProcessService,
		$net: INet,
		$projectDataService: IProjectDataService) {
		super(<any>{}, $devicesService, $errors, $logger, $androidDeviceDiscovery, $androidProcessService, $net, $projectDataService);
	}

	public getChromeDebugUrl(debugOptions: IDebugOptions, port: number): string {
		return super.getChromeDebugUrl(debugOptions, port);
	}
}

const createTestInjector = (): IInjector => {
	const testInjector = new Yok();
	testInjector.register("devicesService", {});
	testInjector.register("errors", stubs.ErrorsStub);
	testInjector.register("logger", stubs.LoggerStub);
	testInjector.register("androidDeviceDiscovery", {});
	testInjector.register("androidProcessService", {});
	testInjector.register("net", {});
	testInjector.register("projectDataService", {});

	return testInjector;
};

interface IChromeUrlTestCase {
	debugOptions: IDebugOptions;
	expectedChromeUrl: string;
	scenarioName: string;
}

describe("androidDebugService", () => {
	describe("getChromeDebugUrl", () => {
		const expectedPort = 12345;
		const customDevToolsCommit = "customDevToolsCommit";

		const chromUrlTestCases: IChromeUrlTestCase[] = [
			// Default CLI behavior:
			{
				scenarioName: "useBundledDevTools and useHttpUrl are not passed",
				debugOptions: {},
				expectedChromeUrl: `chrome-devtools://devtools/bundled/inspector.html?experiments=true&ws=localhost:${expectedPort}`,
			},

			// When useBundledDevTools is true
			{
				scenarioName: "useBundledDevTools is true and useHttpUrl is not passed",
				debugOptions: {
					useBundledDevTools: true
				},
				expectedChromeUrl: `chrome-devtools://devtools/bundled/inspector.html?experiments=true&ws=localhost:${expectedPort}`,
			},
			{
				scenarioName: "useBundledDevTools is true and useHttpUrl is false",
				debugOptions: {
					useBundledDevTools: true,
					useHttpUrl: false
				},
				expectedChromeUrl: `chrome-devtools://devtools/bundled/inspector.html?experiments=true&ws=localhost:${expectedPort}`,
			},
			{
				scenarioName: "useBundledDevTools is true and useHttpUrl is true",
				debugOptions: {
					useBundledDevTools: true,
					useHttpUrl: true
				},
				expectedChromeUrl: `https://chrome-devtools-frontend.appspot.com/serve_file/@${expectedDevToolsCommitSha}/inspector.html?experiments=true&ws=localhost:${expectedPort}`,
			},

			// When useBundledDevTools is false
			{
				scenarioName: "useBundledDevTools is false and useHttpUrl is not passed",
				debugOptions: {
					useBundledDevTools: false
				},
				expectedChromeUrl: `chrome-devtools://devtools/remote/serve_file/@${expectedDevToolsCommitSha}/inspector.html?experiments=true&ws=localhost:${expectedPort}`,
			},
			{
				scenarioName: "useBundledDevTools is false and useHttpUrl is false",
				debugOptions: {
					useBundledDevTools: false,
					useHttpUrl: false
				},
				expectedChromeUrl: `chrome-devtools://devtools/remote/serve_file/@${expectedDevToolsCommitSha}/inspector.html?experiments=true&ws=localhost:${expectedPort}`,
			},
			{
				scenarioName: "useBundledDevTools is false and useHttpUrl is true",
				debugOptions: {
					useBundledDevTools: false,
					useHttpUrl: true
				},
				expectedChromeUrl: `https://chrome-devtools-frontend.appspot.com/serve_file/@${expectedDevToolsCommitSha}/inspector.html?experiments=true&ws=localhost:${expectedPort}`,
			},

			// When useBundledDevTools is not passed
			{
				scenarioName: "useBundledDevTools is not passed and useHttpUrl is false",
				debugOptions: {
					useHttpUrl: false
				},
				expectedChromeUrl: `chrome-devtools://devtools/bundled/inspector.html?experiments=true&ws=localhost:${expectedPort}`,
			},
			{
				scenarioName: "useBundledDevTools is not passed and useHttpUrl is true",
				debugOptions: {
					useHttpUrl: true
				},
				expectedChromeUrl: `https://chrome-devtools-frontend.appspot.com/serve_file/@${expectedDevToolsCommitSha}/inspector.html?experiments=true&ws=localhost:${expectedPort}`,
			},

			// devToolsCommit tests
			{
				scenarioName: "devToolsCommit defaults to ${expectedDevToolsCommitSha} when useBundledDevTools is set to false",
				debugOptions: {
					useBundledDevTools: false
				},
				expectedChromeUrl: `chrome-devtools://devtools/remote/serve_file/@${expectedDevToolsCommitSha}/inspector.html?experiments=true&ws=localhost:${expectedPort}`,
			},
			{
				scenarioName: "devToolsCommit is disregarded when useBundledDevTools is not passed",
				debugOptions: {},
				expectedChromeUrl: `chrome-devtools://devtools/bundled/inspector.html?experiments=true&ws=localhost:${expectedPort}`,
			},
			{
				scenarioName: "devToolsCommit is set to passed value when useBundledDevTools is set to false",
				debugOptions: {
					useBundledDevTools: false,
					devToolsCommit: customDevToolsCommit
				},
				expectedChromeUrl: `chrome-devtools://devtools/remote/serve_file/@${customDevToolsCommit}/inspector.html?experiments=true&ws=localhost:${expectedPort}`,
			},
			{
				scenarioName: "devToolsCommit is set to passed value when useHttpUrl is set to true",
				debugOptions: {
					useHttpUrl: true,
					devToolsCommit: customDevToolsCommit
				},
				expectedChromeUrl: `https://chrome-devtools-frontend.appspot.com/serve_file/@${customDevToolsCommit}/inspector.html?experiments=true&ws=localhost:${expectedPort}`,
			}
		];

		for (const testCase of chromUrlTestCases) {
			it(`returns correct url when ${testCase.scenarioName}`, () => {
				const testInjector = createTestInjector();
				const androidDebugService = testInjector.resolve<AndroidDebugServiceInheritor>(AndroidDebugServiceInheritor);
				const actualChromeUrl = androidDebugService.getChromeDebugUrl(testCase.debugOptions, expectedPort);
				assert.equal(actualChromeUrl, testCase.expectedChromeUrl);
			});
		}
	});
});
