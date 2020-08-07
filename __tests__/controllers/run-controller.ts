import { RunController } from "../../src/controllers/run-controller";
import { InjectorStub, TempServiceStub } from "../stubs";
import { LiveSyncServiceResolver } from "../../src/resolvers/livesync-service-resolver";
import { MobileHelper } from "../../src/common/mobile/mobile-helper";
import { assert } from "chai";
import { RunOnDeviceEvents } from "../../src/constants";
import { PrepareData } from "../../src/data/prepare-data";
import { PrepareDataService } from "../../src/services/prepare-data-service";
import { BuildDataService } from "../../src/services/build-data-service";
import { PrepareController } from "../../src/controllers/prepare-controller";
import { LiveSyncProcessDataService } from "../../src/services/livesync-process-data-service";

let isAttachToHmrStatusCalled = false;
let prepareData: IPrepareData = null;

const appIdentifier = "org.nativescript.myCoolApp";
const projectDir = "/path/to/my/projecDir";
const buildOutputPath = `${projectDir}/platform/ios/build/myproject.app`;

const iOSDevice = <any>{ deviceInfo: { identifier: "myiOSDevice", platform: "ios" } };
const iOSDeviceDescriptor = { identifier: "myiOSDevice", buildAction: async () => buildOutputPath, buildData: <any>{} };
const androidDevice = <any>{ deviceInfo: { identifier: "myAndroidDevice", platform: "android" } };
const androidDeviceDescriptor = { identifier: "myAndroidDevice", buildAction: async () => buildOutputPath, buildData: <any>{} };

const map: IDictionary<{ device: Mobile.IDevice, descriptor: ILiveSyncDeviceDescriptor }> = {
	myiOSDevice: {
		device: iOSDevice,
		descriptor: iOSDeviceDescriptor
	},
	myAndroidDevice: {
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
	injector.register("buildController", {
		buildPlatform: async () => {
			return buildOutputPath;
		},
		buildPlatformIfNeeded: async () => ({})
	});
	injector.register("deviceInstallAppService", {
		installOnDeviceIfNeeded: () => ({})
	});
	injector.register("iOSLiveSyncService", {
		fullSync: async () => getFullSyncResult(),
		liveSyncWatchAction: () => ({})
	});
	injector.register("androidLiveSyncService", {
		fullSync: async () => getFullSyncResult(),
		liveSyncWatchAction: () => ({})
	});
	injector.register("hmrStatusService", {
		attachToHmrStatusEvent: () => isAttachToHmrStatusCalled = true
	});
	injector.register("liveSyncServiceResolver", LiveSyncServiceResolver);
	injector.register("mobileHelper", MobileHelper);
	injector.register("prepareController", {
		stopWatchers: () => ({}),
		prepare: async (currentPrepareData: PrepareData) => {
			prepareData = currentPrepareData;
			return { platform: prepareData.platform, hasNativeChanges: false };
		},
		on: () => ({}),
		removeListener: (): void => undefined
	});
	injector.register("prepareNativePlatformService", {});
	injector.register("projectChangesService", {});
	injector.register("runController", RunController);
	injector.register("prepareDataService", PrepareDataService);
	injector.register("buildDataService", BuildDataService);
	injector.register("analyticsService", ({}));
	injector.register("debugController", {});
	injector.register("liveSyncProcessDataService", LiveSyncProcessDataService);
	injector.register("tempService", TempServiceStub);

	const devicesService = injector.resolve("devicesService");
	devicesService.getDevicesForPlatform = () => <any>[{ identifier: "myTestDeviceId1" }];
	devicesService.getPlatformsFromDeviceDescriptors = (devices: ILiveSyncDeviceDescriptor[]) => devices.map(d => map[d.identifier].device.deviceInfo.platform);
	devicesService.on = () => ({});

	return injector;
}

describe("RunController", () => {
	let injector: IInjector = null;
	let runController: RunController = null;

	beforeEach(() => {
		isAttachToHmrStatusCalled = false;
		prepareData = null;

		injector = createTestInjector();
		runController = injector.resolve("runController");
	});

	describe("runOnDevices", () => {
		describe("no watch", () => {
			it("shouldn't start the watcher when skipWatcher flag is provided", async () => {
				mockDevicesService(injector, [iOSDevice]);

				await runController.run({
					liveSyncInfo: { ...liveSyncInfo, skipWatcher: true },
					deviceDescriptors: [iOSDeviceDescriptor]
				});

				assert.isFalse(prepareData.watch);
			});
			it("shouldn't attach to hmr status when skipWatcher flag is provided", async () => {
				mockDevicesService(injector, [iOSDevice]);

				await runController.run({
					liveSyncInfo: { ...liveSyncInfo, skipWatcher: true, useHotModuleReload: true },
					deviceDescriptors: [iOSDeviceDescriptor]
				});

				assert.isFalse(isAttachToHmrStatusCalled);
			});
			it("shouldn't attach to hmr status when useHotModuleReload is false", async () => {
				mockDevicesService(injector, [iOSDevice]);

				await runController.run({
					liveSyncInfo,
					deviceDescriptors: [iOSDeviceDescriptor]
				});

				assert.isFalse(isAttachToHmrStatusCalled);
			});
			it("shouldn't attach to hmr status when no deviceDescriptors are provided", async () => {
				mockDevicesService(injector, [iOSDevice]);

				await runController.run({
					liveSyncInfo,
					deviceDescriptors: []
				});

				assert.isFalse(isAttachToHmrStatusCalled);
			});
		});
		describe("watch", () => {
			const testCases = [
				{
					name: "should prepare only ios platform when only ios devices are connected",
					connectedDevices: [iOSDeviceDescriptor],
					expectedPreparedPlatforms: ["ios"]
				},
				{
					name: "should prepare only android platform when only android devices are connected",
					connectedDevices: [androidDeviceDescriptor],
					expectedPreparedPlatforms: ["android"]
				},
				{
					name: "should prepare both platforms when ios and android devices are connected",
					connectedDevices: [iOSDeviceDescriptor, androidDeviceDescriptor],
					expectedPreparedPlatforms: ["ios", "android"]
				}
			];

			_.each(testCases, testCase => {
				it(testCase.name, async () => {
					mockDevicesService(injector, testCase.connectedDevices.map(d => map[d.identifier].device));

					const preparedPlatforms: string[] = [];
					const prepareController: PrepareController = injector.resolve("prepareController");
					prepareController.prepare = async (currentPrepareData: PrepareData) => {
						preparedPlatforms.push(currentPrepareData.platform);
						return { platform: currentPrepareData.platform, hasNativeChanges: false };
					};

					await runController.run({
						liveSyncInfo,
						deviceDescriptors: testCase.connectedDevices
					});

					assert.deepEqual(preparedPlatforms, testCase.expectedPreparedPlatforms);
				});
			});
		});
	});

	describe("stopRunOnDevices", () => {
		const testCases = [
			{
				name: "stops LiveSync operation for all devices and emits liveSyncStopped for all of them when stopLiveSync is called without deviceIdentifiers",
				currentDeviceIdentifiers: ["device1", "device2", "device3"],
				expectedDeviceIdentifiers: ["device1", "device2", "device3"]
			},
			{
				name: "stops LiveSync operation for all devices and emits liveSyncStopped for all of them when stopLiveSync is called without deviceIdentifiers (when a single device is attached)",
				currentDeviceIdentifiers: ["device1"],
				expectedDeviceIdentifiers: ["device1"]
			},
			{
				name: "stops LiveSync operation for specified devices and emits liveSyncStopped for each of them (when a single device is attached)",
				currentDeviceIdentifiers: ["device1"],
				expectedDeviceIdentifiers: ["device1"],
				deviceIdentifiersToBeStopped: ["device1"]
			},
			{
				name: "stops LiveSync operation for specified devices and emits liveSyncStopped for each of them",
				currentDeviceIdentifiers: ["device1", "device2", "device3"],
				expectedDeviceIdentifiers: ["device1", "device3"],
				deviceIdentifiersToBeStopped: ["device1", "device3"]
			},
			{
				name: "does not raise liveSyncStopped event for device, which is not currently being liveSynced",
				currentDeviceIdentifiers: ["device1", "device2", "device3"],
				expectedDeviceIdentifiers: ["device1"],
				deviceIdentifiersToBeStopped: ["device1", "device4"]
			},
			{
				name: "stops LiveSync operation for all devices when stop method is called with empty array",
				currentDeviceIdentifiers: ["device1", "device2", "device3"],
				expectedDeviceIdentifiers: ["device1", "device2", "device3"],
				deviceIdentifiersToBeStopped: []
			}
		];

		for (const testCase of testCases) {
			it(testCase.name, async () => {
				const liveSyncProcessDataService = injector.resolve("liveSyncProcessDataService");
				(<any>liveSyncProcessDataService).persistData(projectDir, testCase.currentDeviceIdentifiers.map(identifier => (<any>{ identifier })), ["ios"]);

				const emittedDeviceIdentifiersForLiveSyncStoppedEvent: string[] = [];

				runController.on(RunOnDeviceEvents.runOnDeviceStopped, (data: any) => {
					assert.equal(data.projectDir, projectDir);
					emittedDeviceIdentifiersForLiveSyncStoppedEvent.push(data.deviceIdentifier);
				});

				await runController.stop({ projectDir, deviceIdentifiers: testCase.deviceIdentifiersToBeStopped });

				assert.deepEqual(emittedDeviceIdentifiersForLiveSyncStoppedEvent, testCase.expectedDeviceIdentifiers);
			});
		}
	});
});
