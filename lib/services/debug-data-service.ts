export class DebugDataService implements IDebugDataService {
	constructor(private $projectData: IProjectData,
		private $platformService: IPlatformService,
		private $platformsData: IPlatformsData,
		private $mobileHelper: Mobile.IMobileHelper) { }

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
		if (this.$mobileHelper.isAndroidPlatform(debugService.platform)) {
			if (!options.start && !options.emulator) {
				const platformData = this.getPlatformData(debugService);

				return this.$platformService.getLatestApplicationPackageForDevice(platformData, buildConfig).packageName;
			}
		} else if (this.$mobileHelper.isiOSPlatform(debugService.platform)) {
			if (options.emulator) {
				const platformData = this.getPlatformData(debugService);

				return this.$platformService.getLatestApplicationPackageForEmulator(platformData, buildConfig).packageName;
			}
		}

		return null;
	}

	private getPlatformData(debugService: IPlatformDebugService): IPlatformData {
		return this.$platformsData.getPlatformData(debugService.platform, this.$projectData);
	}
}

$injector.register("debugDataService", DebugDataService);
