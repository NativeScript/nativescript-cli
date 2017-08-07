import { EOL } from "os";
import { LiveSyncService } from "./livesync-service";

export class DebugLiveSyncService extends LiveSyncService implements IDebugLiveSyncService {

	constructor(protected $platformService: IPlatformService,
		$projectDataService: IProjectDataService,
		protected $devicesService: Mobile.IDevicesService,
		$mobileHelper: Mobile.IMobileHelper,
		$devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		$nodeModulesDependenciesBuilder: INodeModulesDependenciesBuilder,
		protected $logger: ILogger,
		$processService: IProcessService,
		$hooksService: IHooksService,
		$pluginsService: IPluginsService,
		protected $injector: IInjector,
		private $options: IOptions,
		private $debugDataService: IDebugDataService,
		private $projectData: IProjectData,
		private $debugService: IDebugService,
		private $config: IConfiguration) {

		super($platformService,
			$projectDataService,
			$devicesService,
			$mobileHelper,
			$devicePlatformsConstants,
			$nodeModulesDependenciesBuilder,
			$logger,
			$processService,
			$hooksService,
			$pluginsService,
			$injector);
	}

	protected async refreshApplication(projectData: IProjectData, liveSyncResultInfo: ILiveSyncResultInfo, outputPath?: string): Promise<void> {
		const debugOptions = this.$options;
		const deployOptions: IDeployPlatformOptions = {
			clean: this.$options.clean,
			device: this.$options.device,
			emulator: this.$options.emulator,
			platformTemplate: this.$options.platformTemplate,
			projectDir: this.$options.path,
			release: this.$options.release,
			provision: this.$options.provision,
			teamId: this.$options.teamId
		};

		let debugData = this.$debugDataService.createDebugData(this.$projectData, { device: liveSyncResultInfo.deviceAppData.device.deviceInfo.identifier });
		const debugService = this.$debugService.getDebugService(liveSyncResultInfo.deviceAppData.device);

		await this.$platformService.trackProjectType(this.$projectData);

		if (this.$options.start) {
			return this.printDebugInformation(await debugService.debug(debugData, debugOptions));
		}

		const deviceAppData = liveSyncResultInfo.deviceAppData;
		this.$config.debugLivesync = true;

		await debugService.debugStop();

		let applicationId = deviceAppData.appIdentifier;
		await deviceAppData.device.applicationManager.stopApplication(applicationId, projectData.projectName);

		const buildConfig: IBuildConfig = _.merge({ buildForDevice: !deviceAppData.device.isEmulator }, deployOptions);
		debugData.pathToAppPackage = this.$platformService.lastOutputPath(debugService.platform, buildConfig, projectData, outputPath);

		this.printDebugInformation(await debugService.debug(debugData, debugOptions));
	}

	public printDebugInformation(information: string): void {
		if (!!information) {
			this.$logger.info(`To start debugging, open the following URL in Chrome:${EOL}${information}${EOL}`.cyan);
		}
	}
}

$injector.register("debugLiveSyncService", DebugLiveSyncService);
