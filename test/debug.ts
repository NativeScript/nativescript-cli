import * as stubs from "./stubs";
import * as yok from "../lib/common/yok";
import { DebugAndroidCommand } from "../lib/commands/debug";
import { assert } from "chai";
import { Configuration, StaticConfig } from "../lib/config";
import { Options } from "../lib/options";
import { DevicePlatformsConstants } from "../lib/common/mobile/device-platforms-constants";
import { FileSystem } from "../lib/common/file-system";
import { AndroidProjectService } from "../lib/services/android-project-service";
import { AndroidDebugBridge } from "../lib/common/mobile/android/android-debug-bridge";
import { AndroidDebugBridgeResultHandler } from "../lib/common/mobile/android/android-debug-bridge-result-handler";

function createTestInjector(): IInjector {
	let testInjector: IInjector = new yok.Yok();

	testInjector.register("debug|android", DebugAndroidCommand);
	testInjector.register("config", Configuration);
	testInjector.register("staticConfig", StaticConfig);
	testInjector.register("logger", stubs.LoggerStub);
	testInjector.register("options", Options);
	testInjector.register("devicePlatformsConstants", DevicePlatformsConstants);
	testInjector.register('devicesService', {});
	testInjector.register('childProcess', stubs.ChildProcessStub);
	testInjector.register('androidDebugService', stubs.DebugServiceStub);
	testInjector.register('fs', FileSystem);
	testInjector.register('errors', stubs.ErrorsStub);
	testInjector.register('hostInfo', {});
	testInjector.register("analyticsService", {
		trackException: async (): Promise<void> => undefined,
		checkConsent: async (): Promise<void> => undefined,
		trackFeature: async (): Promise<void> => undefined
	});
	testInjector.register('devicesService', {
		initialize: async () => { /* Intentionally left blank */ },
		detectCurrentlyAttachedDevices: async () => { /* Intentionally left blank */ },
		getDeviceInstances: (): any[] => { return []; },
		execute: async (): Promise<any> => ({})
	});
	testInjector.register("debugLiveSyncService", stubs.LiveSyncServiceStub);
	testInjector.register("androidProjectService", AndroidProjectService);
	testInjector.register("androidToolsInfo", stubs.AndroidToolsInfoStub);
	testInjector.register("hostInfo", {});
	testInjector.register("projectData", { platformsDir: "test", initializeProjectData: () => { /* empty */ } });
	testInjector.register("projectDataService", {});
	testInjector.register("sysInfo", {});
	testInjector.register("mobileHelper", {});
	testInjector.register("pluginVariablesService", {});
	testInjector.register("deviceAppDataFactory", {});
	testInjector.register("projectTemplatesService", {});
	testInjector.register("xmlValidator", {});
	testInjector.register("npm", {});
	testInjector.register("debugDataService", {
		createDebugData: () => ({})
	});
	testInjector.register("androidEmulatorServices", {});
	testInjector.register("adb", AndroidDebugBridge);
	testInjector.register("androidDebugBridgeResultHandler", AndroidDebugBridgeResultHandler);
	testInjector.register("platformService", stubs.PlatformServiceStub);
	testInjector.register("platformsData", {
		availablePlatforms: {
			Android: "Android",
			iOS: "iOS"
		}
	});

	return testInjector;
}

describe("Debugger tests", () => {
	let testInjector: IInjector;

	beforeEach(() => {
		testInjector = createTestInjector();
	});

	it("Ensures that debugLivesync flag is true when executing debug --watch command", async () => {
		let debugCommand: ICommand = testInjector.resolve("debug|android");
		let options: IOptions = testInjector.resolve("options");
		options.watch = true;
		await debugCommand.execute(["android", "--watch"]);
		let config: IConfiguration = testInjector.resolve("config");
		assert.isTrue(config.debugLivesync);
	});

	it("Ensures that beforePrepareAllPlugins will not call gradle when livesyncing", async () => {
		let config: IConfiguration = testInjector.resolve("config");
		config.debugLivesync = true;
		let childProcess: stubs.ChildProcessStub = testInjector.resolve("childProcess");
		let androidProjectService: IPlatformProjectService = testInjector.resolve("androidProjectService");
		let projectData: IProjectData = testInjector.resolve("projectData");
		let spawnFromEventCount = childProcess.spawnFromEventCount;
		await androidProjectService.beforePrepareAllPlugins(projectData);
		assert.isTrue(spawnFromEventCount === 0);
		assert.isTrue(spawnFromEventCount === childProcess.spawnFromEventCount);
	});

	it("Ensures that beforePrepareAllPlugins will call gradle with clean option when *NOT* livesyncing", async () => {
		let config: IConfiguration = testInjector.resolve("config");
		config.debugLivesync = false;
		let childProcess: stubs.ChildProcessStub = testInjector.resolve("childProcess");
		let androidProjectService: IPlatformProjectService = testInjector.resolve("androidProjectService");
		let projectData: IProjectData = testInjector.resolve("projectData");
		let spawnFromEventCount = childProcess.spawnFromEventCount;
		await androidProjectService.beforePrepareAllPlugins(projectData);
		assert.isTrue(childProcess.lastCommand.indexOf("gradle") !== -1);
		assert.isTrue(childProcess.lastCommandArgs[0] === "clean");
		assert.isTrue(spawnFromEventCount === 0);
		assert.isTrue(spawnFromEventCount + 1 === childProcess.spawnFromEventCount);
	});
});
