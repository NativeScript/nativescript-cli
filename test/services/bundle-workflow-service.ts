import { Yok } from "../../lib/common/yok";
import { BundleWorkflowService } from "../../lib/services/bundle-workflow-service";
import { assert } from "chai";

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
		getDeviceByIdentifier: (identifier: string) => { return deviceMap[identifier]; }
	}));
	injector.register("deviceWorkflowService", ({}));
	injector.register("errors", ({
		failWithoutHelp: () => ({})
	}));
	injector.register("liveSyncService", ({}));
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
		startWatcher: () => ({})
	}));
	injector.register("bundleWorkflowService", BundleWorkflowService);
	injector.register("pluginsService", ({}));
	injector.register("projectDataService", ({
		getProjectData: () => ({
			projectDir
		})
	}));
	injector.register("buildArtefactsService", ({}));
	injector.register("platformBuildService", ({}));
	injector.register("platformAddService", ({}));
	injector.register("platformService", ({}));
	injector.register("projectChangesService", ({}));
	injector.register("fs", ({}));
	injector.register("bundleWorkflowService", BundleWorkflowService);

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
	webpackCompilerConfig: {
		env: {},
	}
};

describe("BundleWorkflowService", () => {
	describe("start", () => {
		describe("when the run on device is called for second time for the same projectDir", () => {
			it("should run only for new devies (for which the initial sync is still not executed)", async () => {
				return;
			});
			it("shouldn't run for old devices (for which initial sync is already executed)", async () => {
				return;
			});
		});
		describe("when platform is still not added", () => {
			it("should add platform before start watchers", async () => {
				const injector = createTestInjector();

				let isAddPlatformIfNeededCalled = false;
				const platformAddService: IPlatformAddService = injector.resolve("platformAddService");
				platformAddService.addPlatformIfNeeded = async () => { isAddPlatformIfNeededCalled = true; };

				let isStartWatcherCalled = false;
				const platformWatcherService: IPlatformWatcherService = injector.resolve("platformWatcherService");
				(<any>platformWatcherService).startWatcher = async () => {
					assert.isTrue(isAddPlatformIfNeededCalled);
					isStartWatcherCalled = true;
					return true;
				};

				const bundleWorkflowService: IBundleWorkflowService = injector.resolve("bundleWorkflowService");
				await bundleWorkflowService.runPlatform(projectDir, [iOSDeviceDescriptor], liveSyncInfo);

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
					const platformAddService: IPlatformAddService = injector.resolve("bundleWorkflowService");
					platformAddService.addPlatformIfNeeded = async (platformData: IPlatformData) => {
						actualAddedPlatforms.push(platformData);
					};

					const bundleWorkflowService: IBundleWorkflowService = injector.resolve("bundleWorkflowService");
					await bundleWorkflowService.runPlatform(projectDir, testCase.connectedDevices, liveSyncInfo);

					assert.deepEqual(actualAddedPlatforms.map(pData => pData.platformNameLowerCase), testCase.expectedAddedPlatforms);
				});
			});
		});
		describe("on initialSyncEventData", () => {
			let injector: IInjector;
			let isBuildPlatformCalled = false;
			beforeEach(() => {
				injector = createTestInjector();

				const platformAddService: IPlatformAddService = injector.resolve("bundleWorkflowService");
				platformAddService.addPlatformIfNeeded = async () => { return; };

				const platformBuildService: IPlatformBuildService = injector.resolve("platformBuildService");
				platformBuildService.buildPlatform = async () => { isBuildPlatformCalled = true; return buildOutputPath; };
			});

			console.log("============== isBuildPlatformCalled ============= ", isBuildPlatformCalled);

			afterEach(() => {
				isBuildPlatformCalled = false;
			});

			// _.each(["ios", "android"], platform => {
			// 	it(`should build for ${platform} platform if there are native changes`, async () => {
			// 		const platformWatcherService: IPlatformWatcherService = injector.resolve("platformWatcherService");
			// 		platformWatcherService.emit(INITIAL_SYNC_EVENT_NAME, { platform, hasNativeChanges: true });

			// 		const bundleWorkflowService: IBundleWorkflowService = injector.resolve("bundleWorkflowService");
			// 		await bundleWorkflowService.start(projectDir, [iOSDeviceDescriptor], liveSyncInfo);

			// 		assert.isTrue(isBuildPlatformCalled);
			// 	});
			// });

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
		describe("on filesChangeEventData", () => {
			// TODO: add test cases heres
		});
		describe("no watch", () => {
			it("shouldn't start the watcher when skipWatcher flag is provided", () => {
				return;
			});
			it("shouldn't start the watcher when no devices to sync", () => {
				return;
			});
		});
	});
});
