import { IOSDebugService } from "../../lib/services/ios-debug-service";
import { Yok } from "../../lib/common/yok";
import * as stubs from "../stubs";
import { assert } from "chai";

const expectedDevToolsCommitSha = "02e6bde1bbe34e43b309d4ef774b1168d25fd024";

class IOSDebugServiceInheritor extends IOSDebugService {
	constructor(protected $devicesService: Mobile.IDevicesService,
		$platformService: IPlatformService,
		$iOSEmulatorServices: Mobile.IiOSSimulatorService,
		$childProcess: IChildProcess,
		$hostInfo: IHostInfo,
		$logger: ILogger,
		$errors: IErrors,
		$packageInstallationManager: IPackageInstallationManager,
		$iOSSocketRequestExecutor: IiOSSocketRequestExecutor,
		$processService: IProcessService,
		$socketProxyFactory: ISocketProxyFactory,
		$projectDataService: IProjectDataService,
		$deviceLogProvider: Mobile.IDeviceLogProvider) {
		super(<any>{}, $devicesService, $platformService, $iOSEmulatorServices, $childProcess, $hostInfo, $logger, $errors,
			$packageInstallationManager, $iOSSocketRequestExecutor,
			$processService, $socketProxyFactory, $projectDataService, $deviceLogProvider);
	}

	public getChromeDebugUrl(debugOptions: IDebugOptions, port: number): string {
		return super.getChromeDebugUrl(debugOptions, port);
	}
}

const createTestInjector = (): IInjector => {
	const testInjector = new Yok();
	testInjector.register("devicesService", {});
	testInjector.register("platformService", {});
	testInjector.register("iOSEmulatorServices", {});
	testInjector.register("childProcess", {});

	testInjector.register("errors", stubs.ErrorsStub);
	testInjector.register("logger", stubs.LoggerStub);
	testInjector.register("hostInfo", {});
	testInjector.register("packageInstallationManager", {});
	testInjector.register("iOSNotification", {});
	testInjector.register("iOSSocketRequestExecutor", {});
	testInjector.register("processService", {
		attachToProcessExitSignals: (context: any, callback: () => void): void => undefined
	});

	testInjector.register("socketProxyFactory", {
		on: (event: string | symbol, listener: Function): any => undefined
	});

	testInjector.register("net", {
		getAvailablePortInRange: async (startPort: number, endPort?: number): Promise<number> => 41000,
		waitForPortToListen: async (opts: { port: number, timeout: number, interval?: number }): Promise<boolean> => true
	});

	testInjector.register("projectDataService", {});
	testInjector.register("iOSDebuggerPortService", {});
	testInjector.register("deviceLogProvider", {});

	return testInjector;
};

interface IChromeUrlTestCase {
	debugOptions: IDebugOptions;
	expectedChromeUrl: string;
	scenarioName: string;
}

describe("iOSDebugService", () => {
	describe("getChromeDebugUrl", () => {
		const expectedPort = 12345;
		const customDevToolsCommit = "customDevToolsCommit";

		const chromUrlTestCases: IChromeUrlTestCase[] = [
			// Default CLI behavior:
			{
				scenarioName: "useBundledDevTools and useHttpUrl are not passed",
				debugOptions: {},
				expectedChromeUrl: `chrome-devtools://devtools/remote/serve_file/@${expectedDevToolsCommitSha}/inspector.html?experiments=true&ws=localhost:${expectedPort}`,
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
				expectedChromeUrl: `chrome-devtools://devtools/remote/serve_file/@${expectedDevToolsCommitSha}/inspector.html?experiments=true&ws=localhost:${expectedPort}`,
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
				scenarioName: "devToolsCommit defaults to ${expectedDevToolsCommitSha} and is used in result when useBundledDevTools is not passed",
				debugOptions: {},
				expectedChromeUrl: `chrome-devtools://devtools/remote/serve_file/@${expectedDevToolsCommitSha}/inspector.html?experiments=true&ws=localhost:${expectedPort}`,
			},
			{
				scenarioName: "devToolsCommit is set to passed value when useBundledDevTools is not passed",
				debugOptions: {
					devToolsCommit: customDevToolsCommit
				},
				expectedChromeUrl: `chrome-devtools://devtools/remote/serve_file/@${customDevToolsCommit}/inspector.html?experiments=true&ws=localhost:${expectedPort}`,
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
			},
			{
				scenarioName: "devToolsCommit is disregarded when useBundledDevTools is set to true",
				debugOptions: {
					useBundledDevTools: true,
					devToolsCommit: customDevToolsCommit
				},
				expectedChromeUrl: `chrome-devtools://devtools/bundled/inspector.html?experiments=true&ws=localhost:${expectedPort}`,
			}

		];

		for (const testCase of chromUrlTestCases) {
			it(`returns correct url when ${testCase.scenarioName}`, () => {
				const testInjector = createTestInjector();
				const iOSDebugService = testInjector.resolve<IOSDebugServiceInheritor>(IOSDebugServiceInheritor);
				const actualChromeUrl = iOSDebugService.getChromeDebugUrl(testCase.debugOptions, expectedPort);
				assert.equal(actualChromeUrl, testCase.expectedChromeUrl);
			});
		}

	});
});
