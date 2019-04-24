import * as stubs from "./stubs";
import * as yok from "../lib/common/yok";
import { DebugAndroidCommand } from "../lib/commands/debug";
import { assert } from "chai";
import { BundleValidatorHelper } from "../lib/helpers/bundle-validator-helper";
import { Configuration, StaticConfig } from "../lib/config";
import { Options } from "../lib/options";
import { DevicePlatformsConstants } from "../lib/common/mobile/device-platforms-constants";
import { FileSystem } from "../lib/common/file-system";
import { AndroidProjectService } from "../lib/services/android-project-service";
import { AndroidDebugBridge } from "../lib/common/mobile/android/android-debug-bridge";
import { AndroidDebugBridgeResultHandler } from "../lib/common/mobile/android/android-debug-bridge-result-handler";
import { SettingsService } from "../lib/common/test/unit-tests/stubs";

function createTestInjector(): IInjector {
	const testInjector: IInjector = new yok.Yok();

	testInjector.register("workflowService", stubs.WorkflowServiceStub);
	testInjector.register("debug|android", DebugAndroidCommand);
	testInjector.register("config", Configuration);
	testInjector.register("staticConfig", StaticConfig);
	testInjector.register("logger", stubs.LoggerStub);
	testInjector.register("options", Options);
	testInjector.register("devicePlatformsConstants", DevicePlatformsConstants);
	testInjector.register('childProcess', stubs.ChildProcessStub);
	testInjector.register('fs', FileSystem);
	testInjector.register('errors', stubs.ErrorsStub);
	testInjector.register('hostInfo', {});
	testInjector.register("androidBundleValidatorHelper", stubs.AndroidBundleValidatorHelper);
	testInjector.register("bundleValidatorHelper", BundleValidatorHelper);
	testInjector.register("analyticsService", {
		trackException: async (): Promise<void> => undefined,
		checkConsent: async (): Promise<void> => undefined,
		trackFeature: async (): Promise<void> => undefined
	});
	testInjector.register('devicesService', {
		initialize: async () => { /* Intentionally left blank */ },
		getDeviceInstances: (): any[] => { return []; },
		execute: async (): Promise<any> => ({})
	});
	testInjector.register("liveSyncService", stubs.LiveSyncServiceStub);
	testInjector.register("androidProjectService", AndroidProjectService);
	testInjector.register("androidToolsInfo", stubs.AndroidToolsInfoStub);
	testInjector.register("hostInfo", {});
	testInjector.register("projectData", { platformsDir: "test", initializeProjectData: () => { /* empty */ } });
	testInjector.register("projectDataService", {});
	testInjector.register("sysInfo", {});
	testInjector.register("mobileHelper", {});
	testInjector.register("pluginVariablesService", {});
	testInjector.register("projectTemplatesService", {});
	testInjector.register("debugService", {});
	testInjector.register("xmlValidator", {});
	testInjector.register("packageManager", {});
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

	testInjector.register("prompter", {});
	testInjector.registerCommand("debug|android", DebugAndroidCommand);
	testInjector.register("liveSyncCommandHelper", {
		executeLiveSyncOperation: async (): Promise<void> => {
			return null;
		}
	});
	testInjector.register("settingsService", SettingsService);
	testInjector.register("androidPluginBuildService", stubs.AndroidPluginBuildServiceStub);
	testInjector.register("platformEnvironmentRequirements", {});
	testInjector.register("androidResourcesMigrationService", stubs.AndroidResourcesMigrationServiceStub);
	testInjector.register("filesHashService", {});

	return testInjector;
}

describe("debug command tests", () => {
	describe("Debugger tests", () => {
		let testInjector: IInjector;

		beforeEach(() => {
			testInjector = createTestInjector();
		});

		it("Ensures that beforePrepareAllPlugins will call gradle with clean option when *NOT* livesyncing", async () => {
			const platformData = testInjector.resolve<IPlatformData>("platformsData");
			platformData.frameworkPackageName = "tns-android";

			// only test that 'clean' is performed on android <=3.2. See https://github.com/NativeScript/nativescript-cli/pull/3032
			const projectDataService: IProjectDataService = testInjector.resolve("projectDataService");
			projectDataService.getNSValue = (projectDir: string, propertyName: string) => {
				return { version: "3.2.0" };
			};

			const childProcess: stubs.ChildProcessStub = testInjector.resolve("childProcess");
			const androidProjectService: IPlatformProjectService = testInjector.resolve("androidProjectService");
			androidProjectService.getPlatformData = (_projectData: IProjectData): IPlatformData => {
				return platformData;
			};
			const projectData: IProjectData = testInjector.resolve("projectData");
			const spawnFromEventCount = childProcess.spawnFromEventCount;
			await androidProjectService.beforePrepareAllPlugins(projectData);
			assert.isTrue(childProcess.lastCommand.indexOf("gradle") !== -1);
			assert.isTrue(childProcess.lastCommandArgs[0] === "clean");
			assert.isTrue(spawnFromEventCount === 0);
			assert.isTrue(spawnFromEventCount + 1 === childProcess.spawnFromEventCount);
		});
	});
});
