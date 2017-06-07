import { EOL } from "os";
import { LiveSyncService } from "./livesync-service";

export class DebugLiveSyncService extends LiveSyncService {

	constructor(protected $platformService: IPlatformService,
		$projectDataService: IProjectDataService,
		protected $devicesService: Mobile.IDevicesService,
		$mobileHelper: Mobile.IMobileHelper,
		$nodeModulesDependenciesBuilder: INodeModulesDependenciesBuilder,
		protected $logger: ILogger,
		$processService: IProcessService,
		$hooksService: IHooksService,
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
			$nodeModulesDependenciesBuilder,
			$logger,
			$processService,
			$hooksService,
			$injector);
	}

	protected async refreshApplication(projectData: IProjectData, liveSyncResultInfo: ILiveSyncResultInfo): Promise<void> {
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

		let debugData = this.$debugDataService.createDebugData(this.$projectData, this.$options);
		const debugService = this.$debugService.getDebugService(liveSyncResultInfo.deviceAppData.device);

		await this.$platformService.trackProjectType(this.$projectData);

		if (this.$options.start) {
			return this.printDebugInformation(await debugService.debug<string[]>(debugData, debugOptions));
		}

		const deviceAppData = liveSyncResultInfo.deviceAppData;
		this.$config.debugLivesync = true;

		await debugService.debugStop();

		let applicationId = deviceAppData.appIdentifier;
		await deviceAppData.device.applicationManager.stopApplication(applicationId, projectData.projectName);

		const buildConfig: IBuildConfig = _.merge({ buildForDevice: !deviceAppData.device.isEmulator }, deployOptions);
		debugData.pathToAppPackage = this.$platformService.lastOutputPath(debugService.platform, buildConfig, projectData);

		this.printDebugInformation(await debugService.debug<string[]>(debugData, debugOptions));
	}

	protected printDebugInformation(information: string[]): void {
		_.each(information, i => {
			this.$logger.info(`To start debugging, open the following URL in Chrome:${EOL}${i}${EOL}`.cyan);
		});
	}
}

$injector.register("debugLiveSyncService", DebugLiveSyncService);
