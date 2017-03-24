export class DebugDataService implements IDebugDataService {
	constructor(private $projectData: IProjectData,
		private $devicePlatformsConstants: Mobile.IDevicePlatformsConstants,
		private $platformService: IPlatformService,
		private $platformsData: IPlatformsData) { }

	public createDebugData(debugService: IPlatformDebugService, options: IOptions, buildConfig: IBuildConfig): IDebugData {
		this.$projectData.initializeProjectData(options.path);
		return {
			applicationIdentifier: this.$projectData.projectId,
			projectDir: this.$projectData.projectDir,
			deviceIdentifier: options.device,
			pathToAppPackage: this.getPathToAppPackage(debugService, options, buildConfig),
			projectName: this.$projectData.projectName
		};
	}

	private getPathToAppPackage(debugService: IPlatformDebugService, options: IOptions, buildConfig: IBuildConfig): string {
		if (debugService.platform === this.$devicePlatformsConstants.Android) {
			if (!options.start && !options.emulator) {
				const platformData = this.getPlatformData(debugService);

				return this.$platformService.getLatestApplicationPackageForDevice(platformData, buildConfig).packageName;
			} else {
				return null;
			}
		} else if (debugService.platform === this.$devicePlatformsConstants.iOS) {
			if (options.emulator) {
				const platformData = this.getPlatformData(debugService);

				return this.$platformService.getLatestApplicationPackageForEmulator(platformData, buildConfig).packageName;
			} else {
				return null;
			}
		}
	}

	protected getPlatformData(debugService: IPlatformDebugService): IPlatformData {
		return this.$platformsData.getPlatformData(debugService.platform, this.$projectData);
	}
}

$injector.register("debugDataService", DebugDataService);
