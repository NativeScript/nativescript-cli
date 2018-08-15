import { Yok } from "../../lib/common/yok";
import { assert } from "chai";
import { LiveSyncService, DeprecatedUsbLiveSyncService } from "../../lib/services/livesync/livesync-service";
import { LoggerStub } from "../stubs";

const createTestInjector = (): IInjector => {
	const testInjector = new Yok();

	testInjector.register("platformService", {});
	testInjector.register("projectDataService", {
		getProjectData: (projectDir: string): IProjectData => (<any>{})
	});

	testInjector.register("devicesService", {});
	testInjector.register("mobileHelper", {});
	testInjector.register("devicePlatformsConstants", {});
	testInjector.register("nodeModulesDependenciesBuilder", {});
	testInjector.register("logger", LoggerStub);
	testInjector.register("processService", {});
	testInjector.register("debugService", {});
	testInjector.register("errors", {});
	testInjector.register("debugDataService", {});
	testInjector.register("hooksService", {
		executeAfterHooks: (commandName: string, hookArguments?: IDictionary<any>): Promise<void> => Promise.resolve()
	});

	testInjector.register("pluginsService", {});
	testInjector.register("analyticsService", {});
	testInjector.register("injector", testInjector);
	testInjector.register("usbLiveSyncService", {
		isInitialized: false
	});
	testInjector.register("platformsData", {
		availablePlatforms: {
			Android: "Android",
			iOS: "iOS"
		}
	});

	return testInjector;
};

class LiveSyncServiceInheritor extends LiveSyncService {
	constructor($platformService: IPlatformService,
		$projectDataService: IProjectDataService,
		$devicesService: Mobile.IDevicesService,
		$mobileHelper: Mobile.IMobileHelper,
		$devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		$nodeModulesDependenciesBuilder: INodeModulesDependenciesBuilder,
		$logger: ILogger,
		$processService: IProcessService,
		$hooksService: IHooksService,
		$pluginsService: IPluginsService,
		$debugService: IDebugService,
		$errors: IErrors,
		$debugDataService: IDebugDataService,
		$analyticsService: IAnalyticsService,
		$usbLiveSyncService: DeprecatedUsbLiveSyncService,
		$injector: IInjector,
		$previewAppLiveSyncService: IPreviewAppLiveSyncService,
		$platformsData: IPlatformsData) {

		super(
			$platformService,
			$projectDataService,
			$devicesService,
			$mobileHelper,
			$devicePlatformsConstants,
			$nodeModulesDependenciesBuilder,
			$logger,
			$processService,
			$hooksService,
			$pluginsService,
			$debugService,
			$errors,
			$debugDataService,
			$analyticsService,
			$usbLiveSyncService,
			$previewAppLiveSyncService,
			$injector
		);
	}

	public liveSyncProcessesInfo: IDictionary<ILiveSyncProcessInfo> = {};
}

interface IStopLiveSyncTestCase {
	name: string;
	currentDeviceIdentifiers: string[];
	expectedDeviceIdentifiers: string[];
	deviceIdentifiersToBeStopped?: string[];
}

describe("liveSyncService", () => {
	describe("stopLiveSync", () => {
		const getLiveSyncProcessInfo = (): ILiveSyncProcessInfo => ({
			actionsChain: Promise.resolve(),
			currentSyncAction: Promise.resolve(),
			isStopped: false,
			timer: setTimeout(() => undefined, 1000),
			watcherInfo: {
				watcher: <any>{
					close: (): any => undefined
				},
				patterns: ["pattern"]
			},
			deviceDescriptors: []
		});

		const getDeviceDescriptor = (identifier: string): ILiveSyncDeviceInfo => ({
			identifier,
			outputPath: "",
			skipNativePrepare: false,
			platformSpecificOptions: null,
			buildAction: () => Promise.resolve("")
		});

		const testCases: IStopLiveSyncTestCase[] = [
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
				const liveSyncService = testInjector.resolve<LiveSyncServiceInheritor>(LiveSyncServiceInheritor);
				const projectDir = "projectDir";
				const emittedDeviceIdentifiersForLiveSyncStoppedEvent: string[] = [];
				liveSyncService.on("liveSyncStopped", (data: { projectDir: string, deviceIdentifier: string }) => {
					assert.equal(data.projectDir, projectDir);
					emittedDeviceIdentifiersForLiveSyncStoppedEvent.push(data.deviceIdentifier);
				});

				// Setup liveSyncProcessesInfo for current test
				liveSyncService.liveSyncProcessesInfo[projectDir] = getLiveSyncProcessInfo();
				const deviceDescriptors = testCase.currentDeviceIdentifiers.map(d => getDeviceDescriptor(d));
				liveSyncService.liveSyncProcessesInfo[projectDir].deviceDescriptors.push(...deviceDescriptors);

				await liveSyncService.stopLiveSync(projectDir, testCase.deviceIdentifiersToBeStopped);

				assert.deepEqual(emittedDeviceIdentifiersForLiveSyncStoppedEvent, testCase.expectedDeviceIdentifiers);
			});
		}

		const prepareTestForUsbLiveSyncService = (): any => {
			const testInjector = createTestInjector();
			const liveSyncService = testInjector.resolve<LiveSyncServiceInheritor>(LiveSyncServiceInheritor);
			const projectDir = "projectDir";
			const usbLiveSyncService = testInjector.resolve<DeprecatedUsbLiveSyncService>("usbLiveSyncService");
			usbLiveSyncService.isInitialized = true;

			// Setup liveSyncProcessesInfo for current test
			liveSyncService.liveSyncProcessesInfo[projectDir] = getLiveSyncProcessInfo();
			const deviceDescriptors = ["device1", "device2", "device3"].map(d => getDeviceDescriptor(d));
			liveSyncService.liveSyncProcessesInfo[projectDir].deviceDescriptors.push(...deviceDescriptors);
			return { projectDir, liveSyncService, usbLiveSyncService };
		};

		it("sets usbLiveSyncService.isInitialized to false when LiveSync is stopped for all devices", async () => {
			const { projectDir, liveSyncService, usbLiveSyncService } = prepareTestForUsbLiveSyncService();
			await liveSyncService.stopLiveSync(projectDir, ["device1", "device2", "device3"]);

			assert.isFalse(usbLiveSyncService.isInitialized, "When the LiveSync process is stopped, we must set usbLiveSyncService.isInitialized to false");
		});

		it("does not set usbLiveSyncService.isInitialized to false when LiveSync is stopped for some of devices only", async () => {
			const { projectDir, liveSyncService, usbLiveSyncService } = prepareTestForUsbLiveSyncService();
			await liveSyncService.stopLiveSync(projectDir, ["device1", "device2"]);

			assert.isTrue(usbLiveSyncService.isInitialized, "When the LiveSync process is stopped only for some of the devices, we must not set usbLiveSyncService.isInitialized to false");
		});

	});

});
