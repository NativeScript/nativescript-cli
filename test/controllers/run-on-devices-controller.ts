import { RunOnDevicesController } from "../../lib/controllers/run-on-devices-controller";
import { InjectorStub } from "../stubs";
import { LiveSyncServiceResolver } from "../../lib/resolvers/livesync-service-resolver";
import { MobileHelper } from "../../lib/common/mobile/mobile-helper";
import { assert } from "chai";
import { RunOnDevicesDataService } from "../../lib/services/run-on-devices-data-service";
import { RunOnDevicesEmitter } from "../../lib/run-on-devices-emitter";
import { WorkflowDataService } from "../../lib/services/workflow/workflow-data-service";

let isBuildPlatformCalled = false;
const appIdentifier = "org.nativescript.myCoolApp";

function getFullSyncResult(): ILiveSyncResultInfo {
	return <any>{
		modifiedFilesData: [],
		isFullSync: true,
		deviceAppData: {
			appIdentifier
		}
	};
}

function mockDevicesService(injector: IInjector, devices: Mobile.IDevice[]) {
	const devicesService: Mobile.IDevicesService = injector.resolve("devicesService");
	devicesService.execute = async (action: (device: Mobile.IDevice) => Promise<any>, canExecute?: (dev: Mobile.IDevice) => boolean, options?: { allowNoDevices?: boolean }) => {
		for (const d of devices) {
			if (canExecute(<any>d)) {
				await action(<any>d);
			}
		}

		return null;
	};
}

function createTestInjector() {
	const injector = new InjectorStub();

	injector.register("addPlatformService", {});
	injector.register("buildArtefactsService", ({}));
	injector.register("buildPlatformService", {
		buildPlatform: async () => {
			isBuildPlatformCalled = true;
			return buildOutputPath;
		},
		buildPlatformIfNeeded: async () => ({})
	});
	injector.register("deviceInstallAppService", {
		installOnDeviceIfNeeded: () => ({})
	});
	injector.register("deviceRefreshAppService", {
		refreshApplication: () => ({})
	});
	injector.register("deviceDebugAppService", {
		enableDebugging: () => ({})
	});
	injector.register("iOSLiveSyncService", {
		fullSync: async () => getFullSyncResult(),
		liveSyncWatchAction: () => ({})
	});
	injector.register("androidLiveSyncService", {
		fullSync: async () => getFullSyncResult(),
		liveSyncWatchAction: () => ({})
	});
	injector.register("hmrStatusService", {});
	injector.register("liveSyncServiceResolver", LiveSyncServiceResolver);
	injector.register("mobileHelper", MobileHelper);
	injector.register("preparePlatformService", ({}));
	injector.register("projectChangesService", ({}));
	injector.register("runOnDevicesController", RunOnDevicesController);
	injector.register("runOnDevicesDataService", RunOnDevicesDataService);
	injector.register("runOnDevicesEmitter", RunOnDevicesEmitter);
	injector.register("workflowDataService", WorkflowDataService);

	return injector;
}

const projectDir = "path/to/my/projectDir";
const projectData = { projectDir, projectIdentifiers: { ios: appIdentifier, android: appIdentifier }};
const buildOutputPath = `${projectDir}/platform/ios/build/myproject.app`;

const iOSDevice = <any>{ deviceInfo: { identifier: "myiOSDevice", platform: "ios" } };
const iOSDeviceDescriptor = { identifier: "myiOSDevice", buildAction: async () => buildOutputPath };
const androidDevice = <any>{ deviceInfo: { identifier: "myAndroidDevice", platform: "android" } };
const androidDeviceDescriptor = { identifier: "myAndroidDevice", buildAction: async () => buildOutputPath };

const map: IDictionary<{device: Mobile.IDevice, descriptor: ILiveSyncDeviceInfo}> = {
	ios: {
		device: iOSDevice,
		descriptor: iOSDeviceDescriptor
	},
	android: {
		device: androidDevice,
		descriptor: androidDeviceDescriptor
	}
};

const liveSyncInfo = {
	projectDir,
	release: false,
	useHotModuleReload: false,
	env: {}
};

describe("RunOnDevicesController", () => {
	let injector: IInjector = null;
	let runOnDevicesController: RunOnDevicesController = null;
	let runOnDevicesDataService: RunOnDevicesDataService = null;

	beforeEach(() => {
		injector = createTestInjector();
		runOnDevicesController = injector.resolve("runOnDevicesController");
		runOnDevicesDataService = injector.resolve("runOnDevicesDataService");
	});

	describe("syncInitialDataOnDevices", () => {
		afterEach(() => {
			isBuildPlatformCalled = false;
		});

		_.each(["ios", "android"], platform => {
			it(`should build for ${platform} platform when there are native changes`, async () => {
				const initialSyncEventData = { platform, hasNativeChanges: true };
				const deviceDescriptors = [map[platform].descriptor];
				runOnDevicesDataService.persistData(projectDir, deviceDescriptors, [platform]);
				mockDevicesService(injector, [map[platform].device]);

				await runOnDevicesController.syncInitialDataOnDevices(initialSyncEventData, <any>projectData, liveSyncInfo, deviceDescriptors);

				assert.isTrue(isBuildPlatformCalled);
			});
			it(`shouldn't build for ${platform} platform when no native changes`, async () => {
				const initialSyncEventData = { platform, hasNativeChanges: false };
				const deviceDescriptors = [map[platform].descriptor];
				runOnDevicesDataService.persistData(projectDir, deviceDescriptors, [platform]);
				mockDevicesService(injector, [map[platform].device]);

				await runOnDevicesController.syncInitialDataOnDevices(initialSyncEventData, <any>projectData, liveSyncInfo, deviceDescriptors);

				assert.isFalse(isBuildPlatformCalled);
			});
		});
	});
});
