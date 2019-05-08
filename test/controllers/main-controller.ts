import { Yok } from "../../lib/common/yok";
import { assert } from "chai";
import { AddPlatformService } from "../../lib/services/platform/add-platform-service";
import { MainController } from "../../lib/controllers/main-controller";
import { RunOnDeviceEvents } from "../../lib/constants";
import { RunOnDevicesEmitter } from "../../lib/run-on-devices-emitter";
import { WorkflowDataService } from "../../lib/services/workflow/workflow-data-service";
import { RunOnDevicesDataService } from "../../lib/services/run-on-devices-data-service";
import { PlatformWatcherService } from "../../lib/services/platform/platform-watcher-service";
import { LiveSyncServiceResolver } from "../../lib/resolvers/livesync-service-resolver";
import { MobileHelper } from "../../lib/common/mobile/mobile-helper";
import { DevicePlatformsConstants } from "../../lib/common/mobile/device-platforms-constants";

const deviceMap: IDictionary<any> = {
	myiOSDevice: {
		deviceInfo: {
			identifier: "myiOSDevice",
			platform: "ios"
		}
	},
	myAndroidDevice: {
		deviceInfo: {
			identifier: "myAndroidDevice",
			platform: "android"
		}
	}
};

function createTestInjector(): IInjector {
	const injector = new Yok();

	injector.register("devicesService", ({
		on: () => ({}),
		getDeviceByIdentifier: (identifier: string) => { return deviceMap[identifier]; },
		getPlatformsFromDeviceDescriptors: (deviceDescriptors: ILiveSyncDeviceInfo[]) => {
			return _(deviceDescriptors)
				.map(device => deviceMap[device.identifier])
				.map(device => device.deviceInfo.platform)
				.uniq()
				.value();
		},
		getDevicesForPlatform: (platform: string) => <any>[]
	}));
	injector.register("devicePlatformsConstants", DevicePlatformsConstants);
	injector.register("errors", ({
		failWithoutHelp: () => ({})
	}));
	injector.register("logger", ({
		trace: () => ({})
	}));
	injector.register("platformsData", ({
		getPlatformData: (platform: string) => ({
			platformNameLowerCase: platform.toLowerCase()
		})
	}));
	injector.register("platformWatcherService", ({
		on: () => ({}),
		emit: () => ({}),
		startWatchers: () => ({}),
		stopWatchers: () => ({})
	}));
	injector.register("mainController", MainController);
	injector.register("pluginsService", {
		ensureAllDependenciesAreInstalled: () => ({})
	});
	injector.register("projectDataService", ({
		getProjectData: () => ({
			projectDir
		})
	}));
	injector.register("addPlatformService", {
		addPlatformIfNeeded: () => ({})
	});
	injector.register("buildArtefactsService", ({}));
	injector.register("buildPlatformService", ({}));
	injector.register("deviceInstallAppService", {});
	injector.register("deviceRefreshAppService", {});
	injector.register("deviceDebugAppService", {});
	injector.register("fs", ({}));
	injector.register("hooksService", {
		executeAfterHooks: () => ({})
	});
	injector.register("hmrStatusService", {});
	injector.register("liveSyncServiceResolver", LiveSyncServiceResolver);
	injector.register("mobileHelper", MobileHelper);
	injector.register("preparePlatformService", {
		preparePlatform: () => ({})
	});
	injector.register("projectChangesService", ({}));
	injector.register("runOnDevicesController", {
		syncInitialDataOnDevices: () => ({})
	});
	injector.register("runOnDevicesDataService", RunOnDevicesDataService);
	injector.register("runOnDevicesEmitter", RunOnDevicesEmitter);
	injector.register("workflowDataService", WorkflowDataService);

	return injector;
}

const projectDir = "path/to/my/projectDir";
const buildOutputPath = `${projectDir}/platform/ios/build/myproject.app`;

const iOSDeviceDescriptor = { identifier: "myiOSDevice", buildAction: async () => buildOutputPath };
const androidDeviceDescriptor = { identifier: "myAndroidDevice", buildAction: async () => buildOutputPath };

const liveSyncInfo = {
	projectDir,
	release: false,
	useHotModuleReload: false,
	env: {}
};

describe("MainController", () => {
	describe("runOnDevices", () => {
		describe("when runOnDevices() is called for second time for the same projectDir", () => {
			it("should run only for new devies (for which the initial sync is still not executed)", async () => {
				return;
			});
			it("shouldn't run for old devices (for which initial sync is already executed)", async () => {
				return;
			});
		});
		describe("no watch", () => {
			it("shouldn't start the watcher when skipWatcher flag is provided", async () => {
				const injector = createTestInjector();
				let isStartWatchersCalled = false;
				const platformWatcherService = injector.resolve("platformWatcherService");
				platformWatcherService.startWatchers = async () => isStartWatchersCalled = true;

				const mainController: MainController = injector.resolve("mainController");
				await mainController.runOnDevices(projectDir, [iOSDeviceDescriptor], { ...liveSyncInfo, skipWatcher: true });

				assert.isFalse(isStartWatchersCalled);
			});
			it("shouldn't start the watcher when no devices to sync", async () => {
				const injector = createTestInjector();
				let isStartWatchersCalled = false;
				const platformWatcherService = injector.resolve("platformWatcherService");
				platformWatcherService.startWatchers = async () => isStartWatchersCalled = true;

				const mainController: MainController = injector.resolve("mainController");
				await mainController.runOnDevices(projectDir, [], liveSyncInfo );

				assert.isFalse(isStartWatchersCalled);
			});
		});
		describe("when platform is still not added", () => {
			it("should add platform before start watchers", async () => {
				const injector = createTestInjector();

				let isAddPlatformIfNeededCalled = false;
				const addPlatformService: AddPlatformService = injector.resolve("addPlatformService");
				addPlatformService.addPlatformIfNeeded = async () => { isAddPlatformIfNeededCalled = true; };

				let isStartWatcherCalled = false;
				const platformWatcherService: PlatformWatcherService = injector.resolve("platformWatcherService");
				platformWatcherService.startWatchers = async () => {
					assert.isTrue(isAddPlatformIfNeededCalled);
					isStartWatcherCalled = true;
				};

				const mainController: MainController = injector.resolve("mainController");
				await mainController.runOnDevices(projectDir, [iOSDeviceDescriptor], liveSyncInfo);

				assert.isTrue(isStartWatcherCalled);
			});

			const testCases = [
				{
					name: "should add only ios platform when only ios devices are connected",
					connectedDevices: [iOSDeviceDescriptor],
					expectedAddedPlatforms: ["ios"]
				},
				{
					name: "should add only android platform when only android devices are connected",
					connectedDevices: [androidDeviceDescriptor],
					expectedAddedPlatforms: ["android"]
				},
				{
					name: "should add both platforms when ios and android devices are connected",
					connectedDevices: [iOSDeviceDescriptor, androidDeviceDescriptor],
					expectedAddedPlatforms: ["ios", "android"]
				}
			];

			_.each(testCases, testCase => {
				it(testCase.name, async () => {
					const injector = createTestInjector();

					const actualAddedPlatforms: IPlatformData[] = [];
					const addPlatformService: AddPlatformService = injector.resolve("addPlatformService");
					addPlatformService.addPlatformIfNeeded = async (platformData: IPlatformData) => {
						actualAddedPlatforms.push(platformData);
					};

					const mainController: MainController = injector.resolve("mainController");
					await mainController.runOnDevices(projectDir, testCase.connectedDevices, liveSyncInfo);

					assert.deepEqual(actualAddedPlatforms.map(pData => pData.platformNameLowerCase), testCase.expectedAddedPlatforms);
				});
			});
		});
		describe("on initialSyncEvent", () => {
			let injector: IInjector;
			let isBuildPlatformCalled = false;
			beforeEach(() => {
				injector = createTestInjector();

				const addPlatformService = injector.resolve("addPlatformService");
				addPlatformService.addPlatformIfNeeded = async () => { return; };

				const buildPlatformService = injector.resolve("buildPlatformService");
				buildPlatformService.buildPlatform = async () => { isBuildPlatformCalled = true; return buildOutputPath; };

				console.log("========== isBuildPlatformCalled ============= ", isBuildPlatformCalled);
			});

			afterEach(() => {
				isBuildPlatformCalled = false;
			});

			it("shouldn't build for second android device", async () => { // shouldn't build for second iOS device or second iOS simulator
				return;
			});
			it("should build for iOS simulator if it is already built for iOS device", () => {
				return;
			});
			it("should build for iOS device if it is already built for iOS simulator", () => {
				return;
			});
			it("should install the built package when the project should be build", () => {
				return;
			});
			it("should install the latest built package when the project shouldn't be build", () => {
				return;
			});
		});
		describe("on filesChangeEvent", () => {
			// TODO: add test cases here
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
			}
		];

		for (const testCase of testCases) {
			it(testCase.name, async () => {
				const testInjector = createTestInjector();
				const mainController = testInjector.resolve("mainController");

				const runOnDevicesDataService: RunOnDevicesDataService = testInjector.resolve("runOnDevicesDataService");
				runOnDevicesDataService.persistData(projectDir, testCase.currentDeviceIdentifiers.map(identifier => (<any>{ identifier })), ["ios"]);

				const emittedDeviceIdentifiersForLiveSyncStoppedEvent: string[] = [];

				const runOnDevicesEmitter = testInjector.resolve("runOnDevicesEmitter");
				runOnDevicesEmitter.on(RunOnDeviceEvents.runOnDeviceStopped, (data: any) => {
					assert.equal(data.projectDir, projectDir);
					emittedDeviceIdentifiersForLiveSyncStoppedEvent.push(data.deviceIdentifier);
				});

				await mainController.stopRunOnDevices(projectDir, testCase.deviceIdentifiersToBeStopped);

				assert.deepEqual(emittedDeviceIdentifiersForLiveSyncStoppedEvent, testCase.expectedDeviceIdentifiers);
			});
		}
	});
});
