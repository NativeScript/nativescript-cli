abstract class TestCommandBase {
	public allowedParameters: ICommandParameter[] = [];
	protected abstract platform: string;
	protected abstract $projectData: IProjectData;
	protected abstract $testExecutionService: ITestExecutionService;
	protected abstract $analyticsService: IAnalyticsService;
	protected abstract $options: IOptions;
	protected abstract $platformEnvironmentRequirements: IPlatformEnvironmentRequirements;
	protected abstract $errors: IErrors;
	protected abstract $cleanupService: ICleanupService;
	protected abstract $liveSyncCommandHelper: ILiveSyncCommandHelper;
	protected abstract $devicesService: Mobile.IDevicesService;
	protected abstract $migrateController: IMigrateController;

	async execute(args: string[]): Promise<void> {
		let devices = [];
		if (this.$options.debugBrk) {
			await this.$devicesService.initialize({
				platform: this.platform,
				deviceId: this.$options.device,
				emulator: this.$options.emulator,
				skipInferPlatform: !this.platform,
				sdk: this.$options.sdk
			});

			const selectedDeviceForDebug = await this.$devicesService.pickSingleDevice({
				onlyEmulators: this.$options.emulator,
				onlyDevices: this.$options.forDevice,
				deviceId: this.$options.device
			});
			devices = [selectedDeviceForDebug];
			// const debugData = this.getDebugData(platform, projectData, deployOptions, { device: selectedDeviceForDebug.deviceInfo.identifier });
			// await this.$debugService.debug(debugData, this.$options);
		} else {
			devices = await this.$liveSyncCommandHelper.getDeviceInstances(this.platform);
		}

		if (!this.$options.env) { this.$options.env = {}; }
		this.$options.env.unitTesting = true;

		const liveSyncInfo = this.$liveSyncCommandHelper.getLiveSyncData(this.$projectData.projectDir);

		const deviceDebugMap: IDictionary<boolean> = {};
		devices.forEach(device => deviceDebugMap[device.deviceInfo.identifier] = this.$options.debugBrk);

		const deviceDescriptors = await this.$liveSyncCommandHelper.createDeviceDescriptors(devices, this.platform, <any>{ deviceDebugMap });

		await this.$testExecutionService.startKarmaServer(this.platform, liveSyncInfo, deviceDescriptors);
	}

	async canExecute(args: string[]): Promise<boolean | ICanExecuteCommandOutput> {
		await this.$migrateController.validate({ projectDir: this.$projectData.projectDir, platforms: [this.platform] });

		this.$projectData.initializeProjectData();
		this.$analyticsService.setShouldDispose(this.$options.justlaunch || !this.$options.watch);
		this.$cleanupService.setShouldDispose(this.$options.justlaunch || !this.$options.watch);

		const output = await this.$platformEnvironmentRequirements.checkEnvironmentRequirements({
			platform: this.platform,
			projectDir: this.$projectData.projectDir,
			options: this.$options,
			notConfiguredEnvOptions: {
				hideSyncToPreviewAppOption: true,
				hideCloudBuildOption: true
			}
		});

		const canStartKarmaServer = await this.$testExecutionService.canStartKarmaServer(this.$projectData);
		if (!canStartKarmaServer) {
			this.$errors.fail({
				formatStr: "Error: In order to run unit tests, your project must already be configured by running $ tns test init.",
				suppressCommandHelp: true,
				errorCode: ErrorCodes.TESTS_INIT_REQUIRED
			});
		}

		return output.canExecute && canStartKarmaServer;
	}
}

class TestAndroidCommand extends TestCommandBase implements ICommand {
	protected platform = "android";

	constructor(protected $projectData: IProjectData,
		protected $testExecutionService: ITestExecutionService,
		protected $analyticsService: IAnalyticsService,
		protected $options: IOptions,
		protected $platformEnvironmentRequirements: IPlatformEnvironmentRequirements,
		protected $errors: IErrors,
		protected $cleanupService: ICleanupService,
		protected $liveSyncCommandHelper: ILiveSyncCommandHelper,
		protected $devicesService: Mobile.IDevicesService,
		protected $migrateController: IMigrateController) {
		super();
	}
}

class TestIosCommand extends TestCommandBase implements ICommand {
	protected platform = "iOS";

	constructor(protected $projectData: IProjectData,
		protected $testExecutionService: ITestExecutionService,
		protected $analyticsService: IAnalyticsService,
		protected $options: IOptions,
		protected $platformEnvironmentRequirements: IPlatformEnvironmentRequirements,
		protected $errors: IErrors,
		protected $cleanupService: ICleanupService,
		protected $liveSyncCommandHelper: ILiveSyncCommandHelper,
		protected $devicesService: Mobile.IDevicesService,
		protected $migrateController: IMigrateController) {
		super();
	}

}

$injector.registerCommand("test|android", TestAndroidCommand);
$injector.registerCommand("test|ios", TestIosCommand);
