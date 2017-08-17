import { IOSDebugService } from "../../lib/services/ios-debug-service";
import { Yok } from "../../lib/common/yok";
import * as stubs from "../stubs";
import { assert } from "chai";

class IOSDebugServiceInheritor extends IOSDebugService {
	constructor(protected $devicesService: Mobile.IDevicesService,
		$platformService: IPlatformService,
		$iOSEmulatorServices: Mobile.IEmulatorPlatformServices,
		$childProcess: IChildProcess,
		$logger: ILogger,
		$errors: IErrors,
		$npmInstallationManager: INpmInstallationManager,
		$iOSNotification: IiOSNotification,
		$iOSSocketRequestExecutor: IiOSSocketRequestExecutor,
		$processService: IProcessService,
		$socketProxyFactory: ISocketProxyFactory) {
		super($devicesService, $platformService, $iOSEmulatorServices, $childProcess, $logger, $errors,
			$npmInstallationManager, $iOSNotification, $iOSSocketRequestExecutor, $processService, $socketProxyFactory);
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
	testInjector.register("npmInstallationManager", {});
	testInjector.register("iOSNotification", {});
	testInjector.register("iOSSocketRequestExecutor", {});
	testInjector.register("processService", {
		attachToProcessExitSignals: (context: any, callback: () => void): void => undefined
	});

	testInjector.register("socketProxyFactory", {
		on: (event: string | symbol, listener: Function): any => undefined
	});

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
		const chromUrlTestCases: IChromeUrlTestCase[] = [
			// Default CLI behavior:
			{
				scenarioName: "useBundledDevTools and useHttpUrl are not passed",
				debugOptions: {},
				expectedChromeUrl: `chrome-devtools://devtools/remote/serve_file/@02e6bde1bbe34e43b309d4ef774b1168d25fd024/inspector.html?experiments=true&ws=localhost:${expectedPort}`,
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
				expectedChromeUrl: `https://chrome-devtools-frontend.appspot.com/serve_file/@02e6bde1bbe34e43b309d4ef774b1168d25fd024/inspector.html?experiments=true&ws=localhost:${expectedPort}`,
			},

			// When useBundledDevTools is false
			{
				scenarioName: "useBundledDevTools is false and useHttpUrl is not passed",
				debugOptions: {
					useBundledDevTools: false
				},
				expectedChromeUrl: `chrome-devtools://devtools/remote/serve_file/@02e6bde1bbe34e43b309d4ef774b1168d25fd024/inspector.html?experiments=true&ws=localhost:${expectedPort}`,
			},
			{
				scenarioName: "useBundledDevTools is false and useHttpUrl is false",
				debugOptions: {
					useBundledDevTools: false,
					useHttpUrl: false
				},
				expectedChromeUrl: `chrome-devtools://devtools/remote/serve_file/@02e6bde1bbe34e43b309d4ef774b1168d25fd024/inspector.html?experiments=true&ws=localhost:${expectedPort}`,
			},
			{
				scenarioName: "useBundledDevTools is false and useHttpUrl is true",
				debugOptions: {
					useBundledDevTools: false,
					useHttpUrl: true
				},
				expectedChromeUrl: `https://chrome-devtools-frontend.appspot.com/serve_file/@02e6bde1bbe34e43b309d4ef774b1168d25fd024/inspector.html?experiments=true&ws=localhost:${expectedPort}`,
			},

			// When useBundledDevTools is not passed
			{
				scenarioName: "useBundledDevTools is not passed and useHttpUrl is false",
				debugOptions: {
					useHttpUrl: false
				},
				expectedChromeUrl: `chrome-devtools://devtools/remote/serve_file/@02e6bde1bbe34e43b309d4ef774b1168d25fd024/inspector.html?experiments=true&ws=localhost:${expectedPort}`,
			},
			{
				scenarioName: "useBundledDevTools is not passed and useHttpUrl is true",
				debugOptions: {
					useHttpUrl: true
				},
				expectedChromeUrl: `https://chrome-devtools-frontend.appspot.com/serve_file/@02e6bde1bbe34e43b309d4ef774b1168d25fd024/inspector.html?experiments=true&ws=localhost:${expectedPort}`,
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
