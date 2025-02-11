import { AndroidDeviceDebugService } from "../../lib/services/android-device-debug-service";
import { Yok } from "../../lib/common/yok";
import * as stubs from "../stubs";
import { assert } from "chai";
import { IStaticConfig } from "../../lib/declarations";
import { IDebugOptions } from "../../lib/definitions/debug";
import { ICleanupService } from "../../lib/definitions/cleanup-service";
import { IErrors, INet } from "../../lib/common/declarations";
import { IInjector } from "../../lib/common/definitions/yok";

const expectedDevToolsCommitSha = "02e6bde1bbe34e43b309d4ef774b1168d25fd024";

class AndroidDeviceDebugServiceInheritor extends AndroidDeviceDebugService {
	constructor(
		protected $devicesService: Mobile.IDevicesService,
		$cleanupService: ICleanupService,
		$errors: IErrors,
		$logger: ILogger,
		$androidProcessService: Mobile.IAndroidProcessService,
		$staticConfig: IStaticConfig,
		$net: INet,
		$deviceLogProvider: Mobile.IDeviceLogProvider
	) {
		super(
			<any>{ deviceInfo: { identifier: "123" } },
			$devicesService,
			$cleanupService,
			$errors,
			$logger,
			$androidProcessService,
			$staticConfig,
			$net,
			$deviceLogProvider
		);
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
	testInjector.register("npm", stubs.NodePackageManagerStub);
	testInjector.register("androidDeviceDiscovery", {});
	testInjector.register("androidProcessService", {});
	testInjector.register("net", {});
	testInjector.register("projectDataService", {});
	testInjector.register("deviceLogProvider", {});
	testInjector.register("cleanupService", {});
	testInjector.register("staticConfig", {});

	return testInjector;
};

interface IChromeUrlTestCase {
	debugOptions: IDebugOptions;
	expectedChromeUrl: string;
	scenarioName: string;
}

describe("androidDeviceDebugService", () => {
	describe("getChromeDebugUrl", () => {
		const expectedPort = 12345;
		const customDevToolsCommit = "customDevToolsCommit";

		const chromUrlTestCases: IChromeUrlTestCase[] = [
			// Default CLI behavior:
			{
				scenarioName: "useBundledDevTools and useHttpUrl are not passed",
				debugOptions: {},
				expectedChromeUrl: `devtools://devtools/bundled/inspector.html?ws=localhost:${expectedPort}`
			},

			// When useBundledDevTools is true
			{
				scenarioName: "useBundledDevTools is true and useHttpUrl is not passed",
				debugOptions: {
					useBundledDevTools: true
				},
				expectedChromeUrl: `devtools://devtools/bundled/inspector.html?ws=localhost:${expectedPort}`
			},
			{
				scenarioName: "useBundledDevTools is true and useHttpUrl is false",
				debugOptions: {
					useBundledDevTools: true,
					useHttpUrl: false
				},
				expectedChromeUrl: `devtools://devtools/bundled/inspector.html?ws=localhost:${expectedPort}`
			},
			{
				scenarioName: "useBundledDevTools is true and useHttpUrl is true",
				debugOptions: {
					useBundledDevTools: true,
					useHttpUrl: true
				},
				expectedChromeUrl: `https://chrome-devtools-frontend.appspot.com/serve_file/@${expectedDevToolsCommitSha}/inspector.html?ws=localhost:${expectedPort}`
			},

			// When useBundledDevTools is false
			{
				scenarioName:
					"useBundledDevTools is false and useHttpUrl is not passed",
				debugOptions: {
					useBundledDevTools: false
				},
				expectedChromeUrl: `devtools://devtools/remote/serve_file/@${expectedDevToolsCommitSha}/inspector.html?ws=localhost:${expectedPort}`
			},
			{
				scenarioName: "useBundledDevTools is false and useHttpUrl is false",
				debugOptions: {
					useBundledDevTools: false,
					useHttpUrl: false
				},
				expectedChromeUrl: `devtools://devtools/remote/serve_file/@${expectedDevToolsCommitSha}/inspector.html?ws=localhost:${expectedPort}`
			},
			{
				scenarioName: "useBundledDevTools is false and useHttpUrl is true",
				debugOptions: {
					useBundledDevTools: false,
					useHttpUrl: true
				},
				expectedChromeUrl: `https://chrome-devtools-frontend.appspot.com/serve_file/@${expectedDevToolsCommitSha}/inspector.html?ws=localhost:${expectedPort}`
			},

			// When useBundledDevTools is not passed
			{
				scenarioName:
					"useBundledDevTools is not passed and useHttpUrl is false",
				debugOptions: {
					useHttpUrl: false
				},
				expectedChromeUrl: `devtools://devtools/bundled/inspector.html?ws=localhost:${expectedPort}`
			},
			{
				scenarioName: "useBundledDevTools is not passed and useHttpUrl is true",
				debugOptions: {
					useHttpUrl: true
				},
				expectedChromeUrl: `https://chrome-devtools-frontend.appspot.com/serve_file/@${expectedDevToolsCommitSha}/inspector.html?ws=localhost:${expectedPort}`
			},

			// devToolsCommit tests
			{
				scenarioName:
					"devToolsCommit defaults to ${expectedDevToolsCommitSha} when useBundledDevTools is set to false",
				debugOptions: {
					useBundledDevTools: false
				},
				expectedChromeUrl: `devtools://devtools/remote/serve_file/@${expectedDevToolsCommitSha}/inspector.html?ws=localhost:${expectedPort}`
			},
			{
				scenarioName:
					"devToolsCommit is disregarded when useBundledDevTools is not passed",
				debugOptions: {},
				expectedChromeUrl: `devtools://devtools/bundled/inspector.html?ws=localhost:${expectedPort}`
			},
			{
				scenarioName:
					"devToolsCommit is set to passed value when useBundledDevTools is set to false",
				debugOptions: {
					useBundledDevTools: false,
					devToolsCommit: customDevToolsCommit
				},
				expectedChromeUrl: `devtools://devtools/remote/serve_file/@${customDevToolsCommit}/inspector.html?ws=localhost:${expectedPort}`
			},
			{
				scenarioName:
					"devToolsCommit is set to passed value when useHttpUrl is set to true",
				debugOptions: {
					useHttpUrl: true,
					devToolsCommit: customDevToolsCommit
				},
				expectedChromeUrl: `https://chrome-devtools-frontend.appspot.com/serve_file/@${customDevToolsCommit}/inspector.html?ws=localhost:${expectedPort}`
			}
		];

		for (const testCase of chromUrlTestCases) {
			it(`returns correct url when ${testCase.scenarioName}`, () => {
				const testInjector = createTestInjector();
				const androidDeviceDebugService =
					testInjector.resolve<AndroidDeviceDebugServiceInheritor>(
						AndroidDeviceDebugServiceInheritor
					);
				const actualChromeUrl = androidDeviceDebugService.getChromeDebugUrl(
					testCase.debugOptions,
					expectedPort
				);
				assert.equal(actualChromeUrl, testCase.expectedChromeUrl);
			});
		}
	});
});
