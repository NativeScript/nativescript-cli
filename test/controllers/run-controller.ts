import { RunController } from "../../lib/controllers/run-controller";
import { InjectorStub, TempServiceStub } from "../stubs";
import { LiveSyncServiceResolver } from "../../lib/resolvers/livesync-service-resolver";
import { MobileHelper } from "../../lib/common/mobile/mobile-helper";
import { assert } from "chai";
import * as _ from "lodash";
import { RunOnDeviceEvents } from "../../lib/constants";
import { PrepareData } from "../../lib/data/prepare-data";
import { PrepareDataService } from "../../lib/services/prepare-data-service";
import { BuildDataService } from "../../lib/services/build-data-service";
import { PrepareController } from "../../lib/controllers/prepare-controller";
import { LiveSyncProcessDataService } from "../../lib/services/livesync-process-data-service";
import { IDictionary } from "../../lib/common/declarations";
import { IInjector } from "../../lib/common/definitions/yok";

let isAttachToHmrStatusCalled = false;
let prepareData: IPrepareData = null;

const appIdentifier = "org.nativescript.myCoolApp";
const projectDir = "/path/to/my/projecDir";
const buildOutputPath = `${projectDir}/platform/ios/build/myproject.app`;

const iOSDevice = <any>{
	deviceInfo: { identifier: "myiOSDevice", platform: "ios" },
};
const iOSDeviceDescriptor = {
	identifier: "myiOSDevice",
	buildAction: async () => buildOutputPath,
	buildData: <any>{},
};
const androidDevice = <any>{
	deviceInfo: { identifier: "myAndroidDevice", platform: "android" },
};
const androidDeviceDescriptor = {
	identifier: "myAndroidDevice",
	buildAction: async () => buildOutputPath,
	buildData: <any>{},
};

const map: IDictionary<{
	device: Mobile.IDevice;
	descriptor: ILiveSyncDeviceDescriptor;
}> = {
	myiOSDevice: {
		device: iOSDevice,
		descriptor: iOSDeviceDescriptor,
	},
	myAndroidDevice: {
		device: androidDevice,
		descriptor: androidDeviceDescriptor,
	},
};

const liveSyncInfo = {
	projectDir,
	release: false,
	useHotModuleReload: false,
	env: {},
};

function getFullSyncResult(): ILiveSyncResultInfo {
	return <any>{
		modifiedFilesData: [],
		isFullSync: true,
		deviceAppData: {
			appIdentifier,
		},
	};
}

function mockDevicesService(injector: IInjector, devices: Mobile.IDevice[]) {
	const devicesService: Mobile.IDevicesService =
		injector.resolve("devicesService");
	devicesService.execute = async (
		action: (device: Mobile.IDevice) => Promise<any>,
		canExecute?: (dev: Mobile.IDevice) => boolean,
		options?: { allowNoDevices?: boolean },
	) => {
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
	injector.register("buildArtifactsService", {});
	injector.register("buildController", {
		buildPlatform: async () => {
			return buildOutputPath;
		},
		buildPlatformIfNeeded: async () => ({}),
	});
	injector.register("deviceInstallAppService", {
		installOnDeviceIfNeeded: () => ({}),
	});
	injector.register("iOSLiveSyncService", {
		fullSync: async () => getFullSyncResult(),
		liveSyncWatchAction: () => ({}),
	});
	injector.register("androidLiveSyncService", {
		fullSync: async () => getFullSyncResult(),
		liveSyncWatchAction: () => ({}),
	});
	injector.register("hmrStatusService", {
		attachToHmrStatusEvent: () => (isAttachToHmrStatusCalled = true),
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
		removeListener: (): void => undefined,
	});
	injector.register("prepareNativePlatformService", {});
	injector.register("projectChangesService", {});
	injector.register("runController", RunController);
	injector.register("prepareDataService", PrepareDataService);
	injector.register("buildDataService", BuildDataService);
	injector.register("analyticsService", {});
	injector.register("debugController", {});
	injector.register("liveSyncProcessDataService", LiveSyncProcessDataService);
	injector.register("tempService", TempServiceStub);
	injector.register("staticConfig", {
		getAdbFilePath: async () => "adb",
	});
	injector.register("viteHmrPortService", {
		getPort: async () => 5173,
	});

	const devicesService = injector.resolve("devicesService");
	devicesService.getDevicesForPlatform = () =>
		<any>[{ identifier: "myTestDeviceId1" }];
	devicesService.getPlatformsFromDeviceDescriptors = (
		devices: ILiveSyncDeviceDescriptor[],
	) => devices.map((d) => map[d.identifier].device.deviceInfo.platform);
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
					deviceDescriptors: [iOSDeviceDescriptor],
				});

				assert.isFalse(prepareData.watch);
			});
			it("shouldn't attach to hmr status when skipWatcher flag is provided", async () => {
				mockDevicesService(injector, [iOSDevice]);

				await runController.run({
					liveSyncInfo: {
						...liveSyncInfo,
						skipWatcher: true,
						useHotModuleReload: true,
					},
					deviceDescriptors: [iOSDeviceDescriptor],
				});

				assert.isFalse(isAttachToHmrStatusCalled);
			});
			it("shouldn't attach to hmr status when useHotModuleReload is false", async () => {
				mockDevicesService(injector, [iOSDevice]);

				await runController.run({
					liveSyncInfo,
					deviceDescriptors: [iOSDeviceDescriptor],
				});

				assert.isFalse(isAttachToHmrStatusCalled);
			});
			it("shouldn't attach to hmr status when no deviceDescriptors are provided", async () => {
				mockDevicesService(injector, [iOSDevice]);

				await runController.run({
					liveSyncInfo,
					deviceDescriptors: [],
				});

				assert.isFalse(isAttachToHmrStatusCalled);
			});
		});
		describe("watch", () => {
			const testCases = [
				{
					name: "should prepare only ios platform when only ios devices are connected",
					connectedDevices: [iOSDeviceDescriptor],
					expectedPreparedPlatforms: ["ios"],
				},
				{
					name: "should prepare only android platform when only android devices are connected",
					connectedDevices: [androidDeviceDescriptor],
					expectedPreparedPlatforms: ["android"],
				},
				{
					name: "should prepare both platforms when ios and android devices are connected",
					connectedDevices: [iOSDeviceDescriptor, androidDeviceDescriptor],
					expectedPreparedPlatforms: ["ios", "android"],
				},
			];

			_.each(testCases, (testCase) => {
				it(testCase.name, async () => {
					mockDevicesService(
						injector,
						testCase.connectedDevices.map((d) => map[d.identifier].device),
					);

					const preparedPlatforms: string[] = [];
					const prepareController: PrepareController =
						injector.resolve("prepareController");
					prepareController.prepare = async (
						currentPrepareData: PrepareData,
					) => {
						preparedPlatforms.push(currentPrepareData.platform);
						return {
							platform: currentPrepareData.platform,
							hasNativeChanges: false,
						};
					};

					await runController.run({
						liveSyncInfo,
						deviceDescriptors: testCase.connectedDevices,
					});

					assert.deepStrictEqual(
						preparedPlatforms,
						testCase.expectedPreparedPlatforms,
					);
				});
			});
		});
	});

	describe("restartApplication", () => {
		let restartedApps: Array<{ device: string; isFullSync: boolean }> = null;
		let infoMessages: string[] = null;

		beforeEach(() => {
			restartedApps = [];
			infoMessages = [];

			const logger = injector.resolve("logger");
			logger.info = (message: string) => infoMessages.push(message);

			for (const service of ["iOSLiveSyncService", "androidLiveSyncService"]) {
				const liveSyncService = injector.resolve(service);
				liveSyncService.getAppData = async (syncInfo: IFullSyncInfo) => ({
					appIdentifier,
					device: syncInfo.device,
					platform: syncInfo.device.deviceInfo.platform,
				});
				liveSyncService.shouldRestart = async () => false;
				liveSyncService.tryRefreshApplication = async () => true;
				liveSyncService.restartApplication = async (
					_projectData: any,
					liveSyncResultInfo: ILiveSyncResultInfo,
				) => {
					restartedApps.push({
						device:
							liveSyncResultInfo.deviceAppData.device.deviceInfo.identifier,
						isFullSync: liveSyncResultInfo.isFullSync,
					});
				};
			}
		});

		function startSession(
			descriptors: ILiveSyncDeviceDescriptor[],
			devices: Mobile.IDevice[],
		): void {
			mockDevicesService(injector, devices);
			injector.resolve("liveSyncProcessDataService").persistData(
				projectDir,
				descriptors,
				devices.map((device) => device.deviceInfo.platform),
				liveSyncInfo,
			);
		}

		it("restarts the app on every device of the session", async () => {
			startSession(
				[iOSDeviceDescriptor, androidDeviceDescriptor],
				[iOSDevice, androidDevice],
			);

			await runController.restartApplication({ projectDir });

			assert.deepStrictEqual(restartedApps, [
				{ device: "myiOSDevice", isFullSync: false },
				{ device: "myAndroidDevice", isFullSync: false },
			]);
		});

		it("restarts the app only on the devices it was asked for", async () => {
			startSession(
				[iOSDeviceDescriptor, androidDeviceDescriptor],
				[iOSDevice, androidDevice],
			);

			await runController.restartApplication({
				projectDir,
				deviceIdentifiers: ["myAndroidDevice"],
			});

			assert.deepStrictEqual(restartedApps, [
				{ device: "myAndroidDevice", isFullSync: false },
			]);
		});

		it("neither prepares nor builds", async () => {
			startSession([iOSDeviceDescriptor], [iOSDevice]);
			prepareData = null;

			await runController.restartApplication({ projectDir });

			assert.isNull(prepareData);
			assert.lengthOf(restartedApps, 1);
		});

		it("re-attaches the debugger of a debug session", async () => {
			const attached: string[] = [];
			injector.resolve(
				"debugController",
			).enableDebuggingCoreWithoutWaitingCurrentAction = async (
				_projectDir: string,
				deviceIdentifier: string,
			) => {
				attached.push(deviceIdentifier);
			};

			startSession(
				[<any>{ ...iOSDeviceDescriptor, debuggingEnabled: true }],
				[iOSDevice],
			);

			await runController.restartApplication({ projectDir });

			assert.deepStrictEqual(attached, ["myiOSDevice"]);
		});

		it("says so rather than restarting when the session has stopped", async () => {
			startSession([iOSDeviceDescriptor], [iOSDevice]);
			await runController.stop({ projectDir });
			infoMessages = [];

			await runController.restartApplication({ projectDir });

			assert.lengthOf(restartedApps, 0);
			assert.deepStrictEqual(infoMessages, [
				"There is no running application to restart. Start a run or debug session first.",
			]);
		});

		it("says so rather than restarting when no device matches", async () => {
			startSession([iOSDeviceDescriptor], [iOSDevice]);
			infoMessages = [];

			await runController.restartApplication({
				projectDir,
				deviceIdentifiers: ["someOtherDevice"],
			});

			assert.lengthOf(restartedApps, 0);
			assert.deepStrictEqual(infoMessages, [
				"There is no device to restart the application on.",
			]);
		});

		it("skips a device stopped while the restart waited its turn", async () => {
			startSession(
				[iOSDeviceDescriptor, androidDeviceDescriptor],
				[iOSDevice, androidDevice],
			);
			const persisted = injector
				.resolve("liveSyncProcessDataService")
				.getPersistedData(projectDir);
			let release: () => void;
			persisted.actionsChain = new Promise<void>((resolve) => {
				release = resolve;
			});

			const restarting = runController.restartApplication({ projectDir });
			await new Promise((resolve) => setImmediate(resolve));
			_.remove(
				persisted.deviceDescriptors,
				(descriptor: ILiveSyncDeviceDescriptor) =>
					descriptor.identifier === "myAndroidDevice",
			);
			release();
			await restarting;

			assert.deepStrictEqual(restartedApps, [
				{ device: "myiOSDevice", isFullSync: false },
			]);
		});
	});

	describe("stopRunOnDevices", () => {
		const testCases = [
			{
				name: "stops LiveSync operation for all devices and emits liveSyncStopped for all of them when stopLiveSync is called without deviceIdentifiers",
				currentDeviceIdentifiers: ["device1", "device2", "device3"],
				expectedDeviceIdentifiers: ["device1", "device2", "device3"],
			},
			{
				name: "stops LiveSync operation for all devices and emits liveSyncStopped for all of them when stopLiveSync is called without deviceIdentifiers (when a single device is attached)",
				currentDeviceIdentifiers: ["device1"],
				expectedDeviceIdentifiers: ["device1"],
			},
			{
				name: "stops LiveSync operation for specified devices and emits liveSyncStopped for each of them (when a single device is attached)",
				currentDeviceIdentifiers: ["device1"],
				expectedDeviceIdentifiers: ["device1"],
				deviceIdentifiersToBeStopped: ["device1"],
			},
			{
				name: "stops LiveSync operation for specified devices and emits liveSyncStopped for each of them",
				currentDeviceIdentifiers: ["device1", "device2", "device3"],
				expectedDeviceIdentifiers: ["device1", "device3"],
				deviceIdentifiersToBeStopped: ["device1", "device3"],
			},
			{
				name: "does not raise liveSyncStopped event for device, which is not currently being liveSynced",
				currentDeviceIdentifiers: ["device1", "device2", "device3"],
				expectedDeviceIdentifiers: ["device1"],
				deviceIdentifiersToBeStopped: ["device1", "device4"],
			},
			{
				name: "stops LiveSync operation for all devices when stop method is called with empty array",
				currentDeviceIdentifiers: ["device1", "device2", "device3"],
				expectedDeviceIdentifiers: ["device1", "device2", "device3"],
				deviceIdentifiersToBeStopped: [],
			},
		];

		for (const testCase of testCases) {
			it(testCase.name, async () => {
				const liveSyncProcessDataService = injector.resolve(
					"liveSyncProcessDataService",
				);
				(<any>liveSyncProcessDataService).persistData(
					projectDir,
					testCase.currentDeviceIdentifiers.map(
						(identifier) => <any>{ identifier },
					),
					["ios"],
				);

				const emittedDeviceIdentifiersForLiveSyncStoppedEvent: string[] = [];

				runController.on(RunOnDeviceEvents.runOnDeviceStopped, (data: any) => {
					assert.equal(data.projectDir, projectDir);
					emittedDeviceIdentifiersForLiveSyncStoppedEvent.push(
						data.deviceIdentifier,
					);
				});

				await runController.stop({
					projectDir,
					deviceIdentifiers: testCase.deviceIdentifiersToBeStopped,
				});

				assert.deepStrictEqual(
					emittedDeviceIdentifiersForLiveSyncStoppedEvent,
					testCase.expectedDeviceIdentifiers,
				);
			});
		}
	});
});
